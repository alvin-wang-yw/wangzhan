import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone, company, country, locale = 'en' } = body;

    // 服务端验证
    const errors: Record<string, string> = {};

    if (!name || name.trim().length === 0) {
      errors.name = locale === 'zh' ? '姓名不能为空' : 'Name is required';
    } else if (name.length > 50) {
      errors.name = locale === 'zh' ? '姓名不能超过50个字符' : 'Name must be less than 50 characters';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      );
    }

    // 更新用户信息
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        country: country?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        country: true,
      },
    });

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
