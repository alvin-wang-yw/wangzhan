import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getOrCreateCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  calculateCartSummary,
} from '@/lib/cart';

/**
 * 获取购物车
 * 登录用户从数据库获取，未登录返回空（前端用 localStorage）
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ items: [], summary: null });
    }

    const cart = await getOrCreateCart(session.user.id);
    const summary = calculateCartSummary(cart.items);

    return NextResponse.json({
      items: cart.items,
      summary,
    });
  } catch (error) {
    console.error('[CART_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

/**
 * 添加商品到购物车
 * Body: { productId, quantity }
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Please login to use cart API' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const qty = parseInt(quantity, 10) || 1;
    if (qty <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    const cart = await addToCart(session.user.id, productId, qty);
    const summary = calculateCartSummary(cart.items);

    return NextResponse.json({
      items: cart.items,
      summary,
      message: 'Added to cart',
    });
  } catch (error) {
    console.error('[CART_POST]', error);
    const message =
      error instanceof Error ? error.message : 'Failed to add to cart';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * 更新购物车商品数量
 * Body: { itemId, quantity }
 */
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Please login to use cart API' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { itemId, quantity } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty)) {
      return NextResponse.json(
        { error: 'Invalid quantity' },
        { status: 400 }
      );
    }

    const cart = await updateCartItemQuantity(session.user.id, itemId, qty);
    const summary = calculateCartSummary(cart.items);

    return NextResponse.json({
      items: cart.items,
      summary,
    });
  } catch (error) {
    console.error('[CART_PUT]', error);
    const message =
      error instanceof Error ? error.message : 'Failed to update cart';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * 删除购物车商品 / 清空购物车
 * 传 itemId 删除单个，不传清空全部
 */
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Please login to use cart API' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const clearAll = searchParams.get('clear') === 'true';

    if (clearAll) {
      await clearCart(session.user.id);
      return NextResponse.json({
        items: [],
        summary: { itemCount: 0, subtotal: '0.00', shippingFee: '0.00', total: '0.00', isFreeShipping: true },
        message: 'Cart cleared',
      });
    }

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    const cart = await removeFromCart(session.user.id, itemId);
    const summary = calculateCartSummary(cart.items);

    return NextResponse.json({
      items: cart.items,
      summary,
      message: 'Item removed',
    });
  } catch (error) {
    console.error('[CART_DELETE]', error);
    const message =
      error instanceof Error ? error.message : 'Failed to remove item';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
