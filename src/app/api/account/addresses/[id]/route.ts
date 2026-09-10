import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

interface Params {
  params: { id: string };
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const userId = session.user.id;

    // Verify address belongs to user
    const existing = await prisma.address.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
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

    // If setting as default, unset others
    if (isDefault && !existing.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: {
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
        isDefault,
      },
    });

    return NextResponse.json({ success: true, address });
  } catch (error) {
    console.error('[ADDRESS_PUT]', error);
    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const userId = session.user.id;

    // Verify address belongs to user
    const existing = await prisma.address.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    await prisma.address.delete({ where: { id } });

    // If deleted address was default, set the oldest one as default
    if (existing.isDefault) {
      const nextDefault = await prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      });
      if (nextDefault) {
        await prisma.address.update({
          where: { id: nextDefault.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADDRESS_DELETE]', error);
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    );
  }
}
