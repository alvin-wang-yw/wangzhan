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

    if (!settings) {
      return NextResponse.json({
        siteName: '',
        siteDescription: '',
        siteKeywords: '',
        logoUrl: '',
        faviconUrl: '',
        contactEmail: '',
        contactPhone: '',
        contactAddress: '',
        socialLinks: {
          facebook: '',
          instagram: '',
          twitter: '',
          linkedin: '',
          youtube: '',
        },
      });
    }

    let socialLinks = {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
      youtube: '',
    };
    try {
      if (settings.socialLinks) {
        socialLinks = { ...socialLinks, ...JSON.parse(settings.socialLinks) };
      }
    } catch (e) {
      console.error('Parse socialLinks error:', e);
    }

    return NextResponse.json({
      siteName: settings.siteName,
      siteDescription: settings.siteDescription || '',
      siteKeywords: settings.siteKeywords || '',
      logoUrl: settings.logoUrl || '',
      faviconUrl: settings.faviconUrl || '',
      contactEmail: settings.contactEmail || '',
      contactPhone: settings.contactPhone || '',
      contactAddress: settings.contactAddress || '',
      socialLinks,
    });
  } catch (error) {
    console.error('[SITE_SETTINGS_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
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
    const {
      siteName,
      siteDescription = '',
      siteKeywords = '',
      logoUrl = '',
      faviconUrl = '',
      contactEmail = '',
      contactPhone = '',
      contactAddress = '',
      socialLinks = {},
    } = body;

    if (!siteName?.trim()) {
      return NextResponse.json(
        { error: 'Site name is required' },
        { status: 400 }
      );
    }

    const settings = await prisma.siteSetting.upsert({
      where: { id: 'default' },
      update: {
        siteName: siteName.trim(),
        siteDescription: siteDescription.trim() || null,
        siteKeywords: siteKeywords.trim() || null,
        logoUrl: logoUrl.trim() || null,
        faviconUrl: faviconUrl.trim() || null,
        contactEmail: contactEmail.trim() || null,
        contactPhone: contactPhone.trim() || null,
        contactAddress: contactAddress.trim() || null,
        socialLinks: JSON.stringify(socialLinks),
      },
      create: {
        id: 'default',
        siteName: siteName.trim(),
        siteDescription: siteDescription.trim() || null,
        siteKeywords: siteKeywords.trim() || null,
        logoUrl: logoUrl.trim() || null,
        faviconUrl: faviconUrl.trim() || null,
        contactEmail: contactEmail.trim() || null,
        contactPhone: contactPhone.trim() || null,
        contactAddress: contactAddress.trim() || null,
        socialLinks: JSON.stringify(socialLinks),
      },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('[SITE_SETTINGS_PUT]', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
