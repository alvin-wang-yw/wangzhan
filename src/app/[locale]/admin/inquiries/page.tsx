import { getTranslations, setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import AdminInquiriesClient from '@/components/admin/AdminInquiriesClient';

interface Props {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function AdminInquiriesPage({
  params: { locale },
  searchParams,
}: Props) {
  setRequestLocale(locale);

  // 解析查询参数
  const page = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.pageSize) || 10;
  const keyword = (searchParams.keyword as string) || '';
  const isRead = (searchParams.isRead as string) || '';

  const skip = (page - 1) * pageSize;

  // 构建查询条件
  const where: Record<string, unknown> = {};

  if (keyword.trim()) {
    where.OR = [
      { name: { contains: keyword } },
      { email: { contains: keyword } },
      { subject: { contains: keyword } },
    ];
  }

  if (isRead !== '') {
    where.isRead = isRead === 'true';
  }

  // 查总数和询盘
  const [total, inquiries] = await Promise.all([
    prisma.inquiry.count({ where }),
    prisma.inquiry.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
    }),
  ]);

  const formattedInquiries = inquiries.map((i) => ({
    id: i.id,
    name: i.name,
    email: i.email,
    country: i.country || '-',
    subject: i.subject || '-',
    productName: i.product?.name || '-',
    productId: i.productId,
    isRead: i.isRead,
    isReplied: i.isReplied,
    createdAt: i.createdAt.toISOString(),
  }));

  return (
    <AdminInquiriesClient
      initialInquiries={formattedInquiries}
      initialTotal={total}
      initialPage={page}
      initialPageSize={pageSize}
      initialKeyword={keyword}
      initialIsRead={isRead}
    />
  );
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'admin.inquiries' });
  return { title: t('title') };
}
