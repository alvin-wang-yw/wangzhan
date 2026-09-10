import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getOrCreateCart } from '@/lib/cart';
import { generateOrderNo } from '@/lib/utils';


/**
 * 创建订单
 * Body: {
 *   shipping: { firstName, lastName, email, phone, company, addressLine1, addressLine2, city, state, postalCode, country },
 *   paymentMethod: 'stripe' | 'paypal' | 'bank_transfer',
 *   customerNote?: string,
 *   // 未登录用户通过 localItems 传递购物车数据
 *   localItems?: [{ productId, quantity, unitPrice }]
 * }
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const { shipping, paymentMethod, customerNote, localItems } = body;

    // 验证收货信息
    if (!shipping) {
      return NextResponse.json(
        { error: 'Shipping information is required' },
        { status: 400 }
      );
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
    } = shipping;

    if (!firstName || !lastName || !email || !phone || !addressLine1 || !city || !postalCode || !country) {
      return NextResponse.json(
        { error: 'Please fill in all required shipping fields' },
        { status: 400 }
      );
    }

    // 获取购物车数据
    let cartItems: {
      productId: string;
      productName: string;
      productSku: string;
      productImage: string | null;
      unitPrice: number;
      quantity: number;
      subtotal: number;
    }[] = [];

    let userId: string | undefined = undefined;

    if (session?.user) {
      // 登录用户：从数据库取购物车
      userId = session.user.id;
      const cart = await getOrCreateCart(userId);

      if (cart.items.length === 0) {
        return NextResponse.json(
          { error: 'Your cart is empty' },
          { status: 400 }
        );
      }

      // 验证库存并构建订单商品
      for (const item of cart.items) {
        const product = item.product;

        if (product.stock < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for ${product.name}` },
            { status: 400 }
          );
        }

        const mainImage = product.images.find((img) => img.isMain) || product.images[0];

        cartItems.push({
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          productImage: mainImage?.url || null,
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity,
          subtotal: Number(item.unitPrice) * item.quantity,
        });
      }
    } else if (localItems && Array.isArray(localItems) && localItems.length > 0) {
      // 未登录用户：使用前端传递的 localItems
      for (const item of localItems) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: {
            images: {
              where: { isMain: true },
              take: 1,
            },
          },
        });

        if (!product) continue;

        if (product.stock < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for ${product.name}` },
            { status: 400 }
          );
        }

        const mainImage = product.images[0];

        cartItems.push({
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          productImage: mainImage?.url || null,
          unitPrice: Number(product.price),
          quantity: item.quantity,
          subtotal: Number(product.price) * item.quantity,
        });
      }
    } else {
      return NextResponse.json(
        { error: 'Your cart is empty' },
        { status: 400 }
      );
    }

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Your cart is empty' },
        { status: 400 }
      );
    }

    // 计算金额
    const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    const shippingFee = subtotal >= 99 ? 0 : 9.99;
    const discountAmount = 0;
    const taxAmount = 0;
    const total = subtotal + shippingFee - discountAmount + taxAmount;

    // 生成订单号
    const orderNo = generateOrderNo();

    // 构建完整地址字符串
    const fullAddress = [
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
    ]
      .filter(Boolean)
      .join(', ');

    // 使用事务创建订单 + 扣减库存 + 清空购物车
    const order = await prisma.$transaction(async (tx) => {
      // 1. 创建订单
      const createdOrder = await tx.order.create({
        data: {
          orderNo,
          userId,
          subtotal,
          shippingFee,
          taxAmount,
          discountAmount,
          total,
          status: 'PENDING' ,
          paymentMethod,
          shippingName: `${firstName} ${lastName}`,
          shippingPhone: phone,
          shippingEmail: email,
          shippingCompany: company || null,
          shippingAddress: fullAddress,
          shippingCity: city,
          shippingState: state || null,
          shippingPostal: postalCode,
          shippingCountry: country,
          customerNote: customerNote || null,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              productSku: item.productSku,
              productImage: item.productImage,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // 2. 扣减库存
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // 3. 登录用户清空购物车
      if (userId) {
        await tx.cartItem.deleteMany({
          where: { cart: { userId } },
        });
      }

      return createdOrder;
    });

    return NextResponse.json(
      {
        orderId: order.id,
        orderNo: order.orderNo,
        total: order.total.toString(),
        message: 'Order created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[ORDERS_POST]', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

/**
 * 获取当前用户订单列表
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 10;
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    const total = await prisma.order.count({ where });

    const orders = await prisma.order.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          take: 2,
          select: {
            id: true,
            productName: true,
            productImage: true,
            quantity: true,
            unitPrice: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
    });

    return NextResponse.json({
      orders,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('[ORDERS_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
