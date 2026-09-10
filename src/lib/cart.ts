import { prisma } from '@/lib/prisma';
import { calculateCartTotal, calculateCartItemCount } from '@/lib/utils';
import type { Cart, CartItem, Product } from '@prisma/client';

export interface CartItemWithProduct extends CartItem {
  product: Product & {
    images: { url: string; altText: string | null; isMain: boolean }[];
  };
}

export interface CartWithItems extends Cart {
  items: CartItemWithProduct[];
}

/**
 * 获取用户购物车（数据库）
 */
export async function getCartByUserId(userId: string): Promise<CartWithItems | null> {
  const cart = await prisma.cart.findFirst({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                where: { isMain: true },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return cart as CartWithItems | null;
}

/**
 * 获取或创建用户购物车
 */
export async function getOrCreateCart(userId: string): Promise<CartWithItems> {
  let cart = await getCartByUserId(userId);

  if (!cart) {
    cart = (await prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isMain: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    })) as CartWithItems;
  }

  return cart;
}

/**
 * 添加商品到购物车（数据库）
 */
export async function addToCart(
  userId: string,
  productId: string,
  quantity: number
): Promise<CartWithItems> {
  const cart = await getOrCreateCart(userId);

  // 查找产品
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  // 检查库存
  if (product.stock < quantity) {
    throw new Error('Insufficient stock');
  }

  // 查找是否已存在该商品
  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
  });

  if (existingItem) {
    // 已存在，更新数量
    const newQuantity = existingItem.quantity + quantity;
    if (product.stock < newQuantity) {
      throw new Error('Insufficient stock');
    }
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: newQuantity,
        unitPrice: product.price, // 更新为当前价格
      },
    });
  } else {
    // 不存在，创建新条目
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
        unitPrice: product.price,
      },
    });
  }

  // 返回更新后的购物车
  return (await getCartByUserId(userId)) as CartWithItems;
}

/**
 * 更新购物车商品数量
 */
export async function updateCartItemQuantity(
  userId: string,
  itemId: string,
  quantity: number
): Promise<CartWithItems> {
  const cart = await getOrCreateCart(userId);

  // 查找商品
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { product: true },
  });

  if (!item || item.cartId !== cart.id) {
    throw new Error('Cart item not found');
  }

  // 检查库存
  if (item.product.stock < quantity) {
    throw new Error('Insufficient stock');
  }

  if (quantity <= 0) {
    // 数量为0时删除
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  return (await getCartByUserId(userId)) as CartWithItems;
}

/**
 * 从购物车删除商品
 */
export async function removeFromCart(
  userId: string,
  itemId: string
): Promise<CartWithItems> {
  const cart = await getOrCreateCart(userId);

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
  });

  if (!item || item.cartId !== cart.id) {
    throw new Error('Cart item not found');
  }

  await prisma.cartItem.delete({ where: { id: itemId } });

  return (await getCartByUserId(userId)) as CartWithItems;
}

/**
 * 清空购物车
 */
export async function clearCart(userId: string): Promise<void> {
  const cart = await getCartByUserId(userId);
  if (cart) {
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }
}

/**
 * 合并本地购物车到数据库（登录时调用）
 */
export async function mergeLocalCartToDb(
  userId: string,
  localItems: { productId: string; quantity: number; unitPrice: number }[]
): Promise<CartWithItems> {
  const cart = await getOrCreateCart(userId);

  for (const localItem of localItems) {
    const product = await prisma.product.findUnique({
      where: { id: localItem.productId },
    });

    if (!product || product.stock <= 0) continue;

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: localItem.productId,
        },
      },
    });

    if (existingItem) {
      const newQty = Math.min(
        existingItem.quantity + localItem.quantity,
        product.stock
      );
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQty,
          unitPrice: product.price,
        },
      });
    } else {
      const qty = Math.min(localItem.quantity, product.stock);
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: localItem.productId,
          quantity: qty,
          unitPrice: product.price,
        },
      });
    }
  }

  return (await getCartByUserId(userId)) as CartWithItems;
}

/**
 * 计算购物车金额明细
 */
export function calculateCartSummary(items: CartItemWithProduct[]) {
  const itemCount = calculateCartItemCount(items);
  const subtotal = calculateCartTotal(items);
  // 默认运费：满99免邮，否则9.99
  const shippingFee = subtotal >= 99 ? 0 : 9.99;
  const total = subtotal + shippingFee;

  return {
    itemCount,
    subtotal: subtotal.toFixed(2),
    shippingFee: shippingFee.toFixed(2),
    total: total.toFixed(2),
    isFreeShipping: shippingFee === 0,
  };
}
