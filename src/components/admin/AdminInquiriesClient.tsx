'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Search,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  CheckCircle,
  X,
  Mail,
  Phone,
  MapPin,
  Building2,
  Globe,
  User,
  Calendar,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface InquiryItem {
  id: string;
  name: string;
  email: string;
  country: string;
  subject: string;
  productName: string;
  productId: string | null;
  isRead: boolean;
  isReplied: boolean;
  createdAt: string;
}

interface InquiryDetail extends InquiryItem {
  phone: string;
  company: string;
  message: string;
  userId: string | null;
}

interface AdminInquiriesClientProps {
  initialInquiries: InquiryItem[];
  initialTotal: number;
  initialPage: number;
  initialPageSize: number;
  initialKeyword: string;
  initialIsRead: string;
}

export default function AdminInquiriesClient({
  initialInquiries,
  initialTotal,
  initialPage,
  initialPageSize,
  initialKeyword,
  initialIsRead,
}: AdminInquiriesClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('admin.inquiries');
  const commonT = useTranslations('common');

  const [inquiries, setInquiries] = useState<InquiryItem[]>(initialInquiries);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [pageSize] = useState(initialPageSize);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [isRead, setIsRead] = useState(initialIsRead);
  const [isLoading, setIsLoading] = useState(false);

  // 详情弹窗
  const [showDetail, setShowDetail] = useState(false);
  const [detailData, setDetailData] = useState<InquiryDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const totalPages = Math.ceil(total / pageSize);

  // 创建带参数的 URL
  const createUrl = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams?.toString() || '');
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      const query = params.toString();
      return query ? `${pathname}?${query}` : pathname;
    },
    [pathname, searchParams]
  );

  // 搜索提交
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const url = createUrl({ keyword, isRead, page: '1' });
    router.push(url);
  };

  // 翻页
  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const url = createUrl({ page: newPage.toString() });
    router.push(url);
  };

  // 查看详情
  const handleView = async (id: string) => {
    setShowDetail(true);
    setDetailLoading(true);
    setDetailData(null);

    try {
      const res = await fetch(`/api/admin/inquiries/${id}`);
      const data = await res.json();
      if (res.ok && data.inquiry) {
        const inquiry = data.inquiry;
        setDetailData({
          id: inquiry.id,
          name: inquiry.name,
          email: inquiry.email,
          phone: inquiry.phone || '-',
          company: inquiry.company || '-',
          country: inquiry.country || '-',
          subject: inquiry.subject || '-',
          productName: inquiry.product?.name || '-',
          productId: inquiry.productId,
          message: inquiry.message,
          isRead: inquiry.isRead,
          isReplied: inquiry.isReplied,
          userId: inquiry.userId,
          createdAt: inquiry.createdAt,
        });

        // 标记为已读
        if (!inquiry.isRead) {
          await fetch(`/api/admin/inquiries/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isRead: true }),
          });
          // 本地更新
          setInquiries((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, isRead: true } : item
            )
          );
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  // 标记已读/未读
  const handleToggleRead = async (id: string, currentRead: boolean) => {
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: !currentRead }),
      });
      if (res.ok) {
        setInquiries((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, isRead: !currentRead } : item
          )
        );
        if (detailData?.id === id) {
          setDetailData({ ...detailData, isRead: !currentRead });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 删除询盘
  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');

      setInquiries((prev) => prev.filter((i) => i.id !== id));
      setTotal((prev) => prev - 1);
      setShowDetail(false);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('subtitle')} ({total})
        </p>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-card border rounded-lg p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          {/* 关键词搜索 */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {t('search')}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-9 pr-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
              />
            </div>
          </div>

          {/* 状态筛选 */}
          <div className="w-36">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {t('status')}
            </label>
            <select
              value={isRead}
              onChange={(e) => setIsRead(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
            >
              <option value="">{t('allStatus')}</option>
              <option value="false">{t('statusUnread')}</option>
              <option value="true">{t('statusRead')}</option>
            </select>
          </div>

          {/* 搜索按钮 */}
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {commonT('search')}
          </button>
        </form>
      </div>

      {/* 询盘表格 */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30 border-b text-xs font-medium text-muted-foreground">
                <th className="text-left px-4 py-3">{t('name')}</th>
                <th className="text-left px-4 py-3">{t('email')}</th>
                <th className="text-left px-4 py-3 w-24">{t('country')}</th>
                <th className="text-left px-4 py-3">{t('subject')}</th>
                <th className="text-left px-4 py-3 w-32">{t('product')}</th>
                <th className="text-center px-4 py-3 w-24">{t('status')}</th>
                <th className="text-left px-4 py-3 w-36">{t('submitTime')}</th>
                <th className="text-center px-4 py-3 w-28">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">{t('noInquiries')}</p>
                  </td>
                </tr>
              ) : (
                inquiries.map((inquiry) => (
                  <tr
                    key={inquiry.id}
                    className={`border-b hover:bg-muted/20 transition-colors ${
                      !inquiry.isRead ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {!inquiry.isRead && (
                          <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2 align-middle" />
                        )}
                        {inquiry.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {inquiry.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {inquiry.country}
                    </td>
                    <td className="px-4 py-3 text-sm truncate max-w-[200px]">
                      {inquiry.subject}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground truncate max-w-[150px]">
                      {inquiry.productName}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                          inquiry.isRead
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {inquiry.isRead ? t('statusRead') : t('statusUnread')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDateTime(inquiry.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleView(inquiry.id)}
                          className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                          title={commonT('viewMore')}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleRead(inquiry.id, inquiry.isRead)}
                          className="p-1.5 hover:bg-green-50 rounded text-muted-foreground hover:text-green-600 transition-colors"
                          title={inquiry.isRead ? t('markUnread') : t('markRead')}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(inquiry.id)}
                          disabled={isLoading}
                          className="p-1.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                          title={commonT('delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-muted-foreground">
              {commonT('page', { current: page, total: totalPages })}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="p-2 hover:bg-muted rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (page > 3) {
                    pageNum = page - 2 + i;
                  }
                  if (page > totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  }
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="p-2 hover:bg-muted rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* 弹窗头部 */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t('detailTitle')}</h2>
              <button
                onClick={() => setShowDetail(false)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="flex-1 overflow-y-auto p-6">
              {detailLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  {commonT('loading')}
                </div>
              ) : detailData ? (
                <div className="space-y-6">
                  {/* 基本信息 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('name')}</p>
                        <p className="font-medium">{detailData.name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('email')}</p>
                        <p className="font-mono text-sm">{detailData.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('phone')}</p>
                        <p>{detailData.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('country')}</p>
                        <p>{detailData.country}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('company')}</p>
                        <p>{detailData.company}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('submitTime')}</p>
                        <p className="text-sm">{formatDateTime(detailData.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* 产品关联 */}
                  {detailData.productId && (
                    <div className="p-3 bg-primary/5 rounded-md border border-primary/20">
                      <p className="text-xs text-muted-foreground mb-1">{t('product')}</p>
                      <p className="font-medium">{detailData.productName}</p>
                    </div>
                  )}

                  {/* 主题 */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t('subject')}</p>
                    <p className="font-medium">{detailData.subject}</p>
                  </div>

                  {/* 留言内容 */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">{t('message')}</p>
                    <div className="p-4 bg-muted/30 rounded-md whitespace-pre-wrap text-sm leading-relaxed">
                      {detailData.message}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* 弹窗底部 */}
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    detailData?.isRead
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {detailData?.isRead ? t('statusRead') : t('statusUnread')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => detailData && handleToggleRead(detailData.id, detailData.isRead)}
                  className="px-3 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors"
                >
                  {detailData?.isRead ? t('markUnread') : t('markRead')}
                </button>
                <button
                  onClick={() => detailData && handleDelete(detailData.id)}
                  className="px-3 py-1.5 text-sm text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10 transition-colors"
                >
                  {commonT('delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
