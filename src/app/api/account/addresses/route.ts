import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('[ADDRESSES_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      company = '',
      addressLine1,
      addressLine2 = '',
      city,
      state = '',
      postalCode,
      country,
      phone,
      isDefault = false,
    } = body;

    // Validation
    const errors: Record<string, string> = {};
    if (!firstName?.trim()) errors.firstName = 'First name is required';
    if (!lastName?.trim()) errors.lastName = 'Last name is required';
    if (!addressLine1?.trim()) errors.addressLine1 = 'Address is required';
    if (!city?.trim()) errors.city = 'City is required';
    if (!postalCode?.trim()) errors.postalCode = 'Postal code is required';
    if (!country?.trim()) errors.country = 'Country is required';
    if (!phone?.trim()) errors.phone = 'Phone is required';

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const userId = session.user.id;

    // If setting as default, unset others
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    } else {
      // If it's the first address, make it default
      const count = await prisma.address.count({ where: { userId } });
      if (count === 0) {
        // eslint-disable-next-line no-param-reassign
        body.isDefault = true;
      }
    }

    const address = await prisma.address.create({
      data: {
        userId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        company: company.trim() || null,
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || null,
        city: city.trim(),
        state: state.trim() || null,
        postalCode: postalCode.trim(),
        country: country.trim(),
        phone: phone.trim(),
        isDefault: body.isDefault || isDefault,
      },
    });

    return NextResponse.json({ success: true, address });
  } catch (error) {
    console.error('[ADDRESSES_POST]', error);
    return NextResponse.json(
      { error: 'Failed to create address' },
      { status: 500 }
    );
  }
}
