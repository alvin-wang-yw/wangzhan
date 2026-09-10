import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { mergeLocalCartToDb, calculateCartSummary } from '@/lib/cart';

/**
 * 合并本地购物车到数据库（登录后调用）
 * Body: { items: [{ productId, quantity, unitPrice }] }
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: 'No items to merge', merged: 0 });
    }

    // 过滤有效数据
    const validItems = items.filter(
      (item: any) => item.productId && item.quantity && item.quantity > 0
    );

    if (validItems.length === 0) {
      return NextResponse.json({ message: 'No valid items to merge', merged: 0 });
    }

    const cart = await mergeLocalCartToDb(session.user.id, validItems);
    const summary = calculateCartSummary(cart.items);

    return NextResponse.json({
      items: cart.items,
      summary,
      merged: validItems.length,
      message: 'Cart merged successfully',
    });
  } catch (error) {
    console.error('[CART_MERGE]', error);
    return NextResponse.json(
      { error: 'Failed to merge cart' },
      { status: 500 }
    );
  }
}
