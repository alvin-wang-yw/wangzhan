import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.siteSetting.findUnique({
      where: { id: 'default' },
    });

    return NextResponse.json({
      defaultShippingFee: settings?.defaultShippingFee
        ? Number(settings.defaultShippingFee)
        : 0,
      freeShippingThreshold: settings?.freeShippingThreshold
        ? Number(settings.freeShippingThreshold)
        : 0,
    });
  } catch (error) {
    console.error('[SHIPPING_SETTINGS_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { defaultShippingFee = 0, freeShippingThreshold = 0 } = body;

    const fee = Number(defaultShippingFee);
    const threshold = Number(freeShippingThreshold);

    if (isNaN(fee) || fee < 0) {
      return NextResponse.json(
        { error: 'Invalid shipping fee' },
        { status: 400 }
      );
    }
    if (isNaN(threshold) || threshold < 0) {
      return NextResponse.json(
        { error: 'Invalid free shipping threshold' },
        { status: 400 }
      );
    }

    const settings = await prisma.siteSetting.upsert({
      where: { id: 'default' },
      update: {
        defaultShippingFee: fee,
        freeShippingThreshold: threshold,
      },
      create: {
        id: 'default',
        siteName: 'Foreign Trade Store',
        defaultShippingFee: fee,
        freeShippingThreshold: threshold,
      },
    });

    return NextResponse.json({
      success: true,
      settings: {
        defaultShippingFee: Number(settings.defaultShippingFee),
        freeShippingThreshold: Number(settings.freeShippingThreshold),
      },
    });
  } catch (error) {
    console.error('[SHIPPING_SETTINGS_PUT]', error);
    return NextResponse.json(
      { error: 'Failed to save shipping settings' },
      { status: 500 }
    );
  }
}
