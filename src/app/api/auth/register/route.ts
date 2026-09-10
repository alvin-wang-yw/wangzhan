import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import type { PrismaClient } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, confirmPassword, locale = 'en' } = body;

    // 服务端验证
    const errors: Record<string, string> = {};

    // 姓名验证
    if (!name || name.trim().length === 0) {
      errors.name = locale === 'zh' ? '姓名不能为空' : 'Name is required';
    } else if (name.length > 50) {
      errors.name = locale === 'zh' ? '姓名不能超过50个字符' : 'Name must be less than 50 characters';
    }

    // 邮箱验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || email.trim().length === 0) {
      errors.email = locale === 'zh' ? '邮箱不能为空' : 'Email is required';
    } else if (!emailRegex.test(email)) {
      errors.email = locale === 'zh' ? '请输入有效的邮箱地址' : 'Please enter a valid email address';
    }

    // 密码验证
    if (!password) {
      errors.password = locale === 'zh' ? '密码不能为空' : 'Password is required';
    } else if (password.length < 6) {
      errors.password = locale === 'zh' ? '密码至少需要6个字符' : 'Password must be at least 6 characters';
    }

    // 确认密码验证
    if (!confirmPassword) {
      errors.confirmPassword = locale === 'zh' ? '请确认密码' : 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = locale === 'zh' ? '两次密码不一致' : 'Passwords do not match';
    }

    // 如果有验证错误，返回错误
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      );
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          errors: {
            email: locale === 'zh' ? '该邮箱已被注册' : 'This email is already registered',
          },
        },
        { status: 400 }
      );
    }

    // 哈希密码
    const hashedPassword = await hash(password, 12);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name.trim(),
        password: hashedPassword,
        role: "USER",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      user,
      message: locale === 'zh' ? '注册成功' : 'Registration successful',
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
