'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

interface CategoryOption {
  id: string;
  name: string;
}

interface BlogFormData {
  // 英文
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  // 中文
  zhTitle: string;
  zhSlug: string;
  zhContent: string;
  zhExcerpt: string;
  // 通用
  coverImage: string;
  categoryId: string;
  author: string;
  isPublished: boolean;
  // SEO 英文
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  // SEO 中文
  zhSeoTitle: string;
  zhSeoDescription: string;
  zhSeoKeywords: string;
  // 标签
  tagIds: string[];
}

interface BlogFormProps {
  mode: 'new' | 'edit';
  postId?: string;
  categories: CategoryOption[];
  initialData?: Partial<BlogFormData>;
  locale: string;
}

const emptyForm: BlogFormData = {
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  zhTitle: '',
  zhSlug: '',
  zhContent: '',
  zhExcerpt: '',
  coverImage: '',
  categoryId: '',
  author: '',
  isPublished: true,
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  zhSeoTitle: '',
  zhSeoDescription: '',
  zhSeoKeywords: '',
  tagIds: [],
};

export default function BlogForm({
  mode,
  postId,
  categories,
  initialData,
  locale,
}: BlogFormProps) {
  const router = useRouter();
  const t = useTranslations('admin.blog');
  const commonT = useTranslations('common');

  const [form, setForm] = useState<BlogFormData>({
    ...emptyForm,
    ...initialData,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // 自动生成 slug
  const autoGenerateSlug = () => {
    const slug = form.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setForm((prev) => ({ ...prev, slug }));
  };

  const handleSubmit = async (e: React.FormEvent, publish = true) => {
    e.preventDefault();
    setError('');

    // 验证
    if (!form.title.trim()) {
      setError(t('titleRequired'));
      return;
    }
    if (!form.slug.trim()) {
      setError(t('slugRequired'));
      return;
    }
    if (!form.content.trim()) {
      setError(t('contentRequired'));
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...form,
        isPublished: publish,
      };

      const url = mode === 'new' ? '/api/admin/blog' : `/api/admin/blog/${postId}`;
      const method = mode === 'new' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save');
      }

      // 跳转到列表页
      router.push(`/${locale}/admin/blog`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-muted rounded-md transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {mode === 'new' ? t('addPost') : t('editPost')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('addPostSubtitle')}</p>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => handleSubmit(e, true)}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* 主内容区 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 英文信息 */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">{t('englishInfo')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('englishTitle')} <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder={t('titlePlaceholder')}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('englishSlug')} <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    placeholder="post-slug"
                    className="flex-1 px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input font-mono"
                  />
                  <button
                    type="button"
                    onClick={autoGenerateSlug}
                    className="px-3 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
                  >
                    Auto
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('englishExcerpt')}
                </label>
                <textarea
                  name="excerpt"
                  value={form.excerpt}
                  onChange={handleChange}
                  rows={3}
                  placeholder={t('excerptPlaceholder')}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input resize-y"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('englishContent')} <span className="text-destructive">*</span>
                </label>
                <textarea
                  name="content"
                  value={form.content}
                  onChange={handleChange}
                  rows={15}
                  placeholder={t('contentPlaceholder')}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input resize-y font-mono"
                />
              </div>
            </div>
          </div>

          {/* 中文信息 */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">{t('chineseInfo')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('chineseTitle')}
                </label>
                <input
                  type="text"
                  name="zhTitle"
                  value={form.zhTitle}
                  onChange={handleChange}
                  placeholder={t('chineseTitlePlaceholder')}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('chineseSlug')}
                </label>
                <input
                  type="text"
                  name="zhSlug"
                  value={form.zhSlug}
                  onChange={handleChange}
                  placeholder="中文-slug"
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('chineseExcerpt')}
                </label>
                <textarea
                  name="zhExcerpt"
                  value={form.zhExcerpt}
                  onChange={handleChange}
                  rows={3}
                  placeholder={t('chineseExcerptPlaceholder')}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input resize-y"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('chineseContent')}
                </label>
                <textarea
                  name="zhContent"
                  value={form.zhContent}
                  onChange={handleChange}
                  rows={12}
                  placeholder={t('chineseContentPlaceholder')}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input resize-y font-mono"
                />
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">{t('seoSettings')}</h2>
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">{t('englishSeo')}</h3>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('seoTitle')}</label>
                <input
                  type="text"
                  name="seoTitle"
                  value={form.seoTitle}
                  onChange={handleChange}
                  placeholder={t('seoTitlePlaceholder')}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('seoDescription')}</label>
                <textarea
                  name="seoDescription"
                  value={form.seoDescription}
                  onChange={handleChange}
                  rows={2}
                  placeholder={t('seoDescPlaceholder')}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input resize-y"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('seoKeywords')}</label>
                <input
                  type="text"
                  name="seoKeywords"
                  value={form.seoKeywords}
                  onChange={handleChange}
                  placeholder={t('seoKeywordsPlaceholder')}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">{t('chineseSeo')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t('seoTitle')}</label>
                    <input
                      type="text"
                      name="zhSeoTitle"
                      value={form.zhSeoTitle}
                      onChange={handleChange}
                      placeholder={t('seoTitlePlaceholder')}
                      className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t('seoDescription')}</label>
                    <textarea
                      name="zhSeoDescription"
                      value={form.zhSeoDescription}
                      onChange={handleChange}
                      rows={2}
                      placeholder={t('seoDescPlaceholder')}
                      className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input resize-y"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t('seoKeywords')}</label>
                    <input
                      type="text"
                      name="zhSeoKeywords"
                      value={form.zhSeoKeywords}
                      onChange={handleChange}
                      placeholder={t('seoKeywordsPlaceholder')}
                      className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 侧边栏 */}
        <div className="space-y-6">
          {/* 发布设置 */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">{t('publishSettings')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">{t('status')}</label>
                <select
                  name="isPublished"
                  value={form.isPublished ? 'true' : 'false'}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, isPublished: e.target.value === 'true' }))
                  }
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
                >
                  <option value="true">{t('statusPublished')}</option>
                  <option value="false">{t('statusDraft')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">{t('category')}</label>
                <select
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
                >
                  <option value="">{t('selectCategory')}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">{t('author')}</label>
                <input
                  type="text"
                  name="author"
                  value={form.author}
                  onChange={handleChange}
                  placeholder={t('authorPlaceholder')}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
                />
              </div>
            </div>
          </div>

          {/* 封面图 */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">{t('coverImage')}</h2>
            <div className="space-y-3">
              <input
                type="text"
                name="coverImage"
                value={form.coverImage}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
              />
              {form.coverImage && (
                <div className="aspect-video bg-muted rounded-md overflow-hidden">
                  <img
                    src={form.coverImage}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="bg-card border rounded-lg p-6">
            <div className="space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t('publishPost')}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e as any, false)}
                disabled={isSubmitting}
                className="w-full py-2.5 border rounded-md font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('saveDraft')}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
