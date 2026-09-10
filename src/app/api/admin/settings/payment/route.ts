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

    const defaultPayment = {
      stripe: {
        enabled: false,
        publishableKey: '',
        secretKey: '',
        webhookSecret: '',
      },
      paypal: {
        enabled: false,
        email: '',
        clientId: '',
        clientSecret: '',
      },
      bankTransfer: {
        enabled: false,
        bankName: '',
        accountName: '',
        accountNumber: '',
        swiftCode: '',
      },
    };

    if (!settings || !settings.paymentSettings) {
      return NextResponse.json(defaultPayment);
    }

    let paymentSettings = defaultPayment;
    try {
      const parsed = JSON.parse(settings.paymentSettings);
      // merge to keep defaults
      paymentSettings = {
        stripe: { ...defaultPayment.stripe, ...(parsed.stripe || {}) },
        paypal: { ...defaultPayment.paypal, ...(parsed.paypal || {}) },
        bankTransfer: { ...defaultPayment.bankTransfer, ...(parsed.bankTransfer || {}) },
      };
    } catch (e) {
      console.error('Parse paymentSettings error:', e);
    }

    return NextResponse.json(paymentSettings);
  } catch (error) {
    console.error('[PAYMENT_SETTINGS_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment settings' },
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
    const { stripe, paypal, bankTransfer } = body;

    const paymentSettings = {
      stripe: stripe || { enabled: false },
      paypal: paypal || { enabled: false },
      bankTransfer: bankTransfer || { enabled: false },
    };

    const settings = await prisma.siteSetting.upsert({
      where: { id: 'default' },
      update: {
        paymentSettings: JSON.stringify(paymentSettings),
      },
      create: {
        id: 'default',
        siteName: 'Foreign Trade Store',
        paymentSettings: JSON.stringify(paymentSettings),
      },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('[PAYMENT_SETTINGS_PUT]', error);
    return NextResponse.json(
      { error: 'Failed to save payment settings' },
      { status: 500 }
    );
  }
}
