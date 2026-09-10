import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * 提交询盘
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone = '',
      company = '',
      country = '',
      productId = '',
      subject = '',
      message,
    } = body;

    // 基础验证
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    // 简单邮箱格式校验
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 尝试获取登录用户
    let userId: string | null = null;
    try {
      const session = await auth();
      if (session?.user?.id) {
        userId = session.user.id;
      }
    } catch {
      // 未登录用户忽略
    }

    // 验证产品存在（如果提供了 productId）
    if (productId) {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 400 });
      }
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        company: company.trim() || null,
        country: country.trim() || null,
        productId: productId || null,
        subject: subject.trim() || null,
        message: message.trim(),
        userId: userId || null,
      },
      include: {
        product: productId
          ? { select: { id: true, name: true, sku: true } }
          : false,
      },
    });

    return NextResponse.json(
      {
        inquiry,
        message: 'Inquiry submitted successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[INQUIRY_POST]', error);
    return NextResponse.json(
      { error: 'Failed to submit inquiry' },
      { status: 500 }
    );
  }
}
