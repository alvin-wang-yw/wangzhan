import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { compare, hash } from 'bcryptjs';

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword, locale = 'en' } = body;

    const errors: Record<string, string> = {};

    if (!currentPassword) {
      errors.currentPassword =
        locale === 'zh' ? '请输入当前密码' : 'Current password is required';
    }
    if (!newPassword) {
      errors.newPassword =
        locale === 'zh' ? '请输入新密码' : 'New password is required';
    } else if (newPassword.length < 6) {
      errors.newPassword =
        locale === 'zh' ? '密码至少6个字符' : 'Password must be at least 6 characters';
    }
    if (!confirmPassword) {
      errors.confirmPassword =
        locale === 'zh' ? '请确认新密码' : 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword =
        locale === 'zh' ? '两次密码不一致' : 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // For users without password (social login), allow setting one
    if (user.password) {
      const isValid = await compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json(
          {
            success: false,
            errors: {
              currentPassword:
                locale === 'zh'
                  ? '当前密码不正确'
                  : 'Current password is incorrect',
            },
          },
          { status: 400 }
        );
      }
    }

    // Hash and update
    const hashedPassword = await hash(newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PASSWORD_PUT]', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
