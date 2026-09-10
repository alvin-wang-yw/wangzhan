'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, X, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryOption {
  id: string;
  name: string;
}

interface TagOption {
  id: string;
  name: string;
  slug: string;
}

interface ImageItem {
  url: string;
  altText: string;
  isMain: boolean;
}

interface ProductFormData {
  // 基本信息（英文）
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDesc: string;
  // 中文
  zhName: string;
  zhSlug: string;
  zhDescription: string;
  zhShortDesc: string;
  // 价格库存
  price: string;
  originalPrice: string;
  costPrice: string;
  stock: string;
  minOrderQty: string;
  weight: string;
  dimensions: string;
  // 属性
  categoryId: string;
  status: string;
  featured: boolean;
  isNew: boolean;
  sortOrder: string;
  // SEO（英文）
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  // SEO（中文）
  zhSeoTitle: string;
  zhSeoDescription: string;
  zhSeoKeywords: string;
  // 图片
  images: ImageItem[];
  // 标签
  tagIds: string[];
}

interface ProductFormProps {
  mode: 'new' | 'edit';
  productId?: string;
  categories: CategoryOption[];
  tags: TagOption[];
  initialData?: Partial<ProductFormData>;
  locale: string;
}

const emptyForm: ProductFormData = {
  name: '',
  slug: '',
  sku: '',
  description: '',
  shortDesc: '',
  zhName: '',
  zhSlug: '',
  zhDescription: '',
  zhShortDesc: '',
  price: '',
  originalPrice: '',
  costPrice: '',
  stock: '0',
  minOrderQty: '1',
  weight: '',
  dimensions: '',
  categoryId: '',
  status: 'DRAFT',
  featured: false,
  isNew: false,
  sortOrder: '0',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  zhSeoTitle: '',
  zhSeoDescription: '',
  zhSeoKeywords: '',
  images: [],
  tagIds: [],
};

export default function ProductForm({
  mode,
  productId,
  categories,
  tags,
  initialData,
  locale,
}: ProductFormProps) {
  const router = useRouter();
  const t = useTranslations('admin.products');
  const commonT = useTranslations('common');
  const [formData, setFormData] = useState<ProductFormData>({
    ...emptyForm,
    ...initialData,
  });
  const [activeTab, setActiveTab] = useState<'basic' | 'images' | 'description' | 'seo'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // 添加图片
  const addImage = () => {
    if (!imageUrlInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        { url: imageUrlInput.trim(), altText: '', isMain: prev.images.length === 0 },
      ],
    }));
    setImageUrlInput('');
  };

  // 删除图片
  const removeImage = (index: number) => {
    setFormData((prev) => {
      const newImages = prev.images.filter((_, i) => i !== index);
      // 如果删除的是主图，第一张变主图
      if (prev.images[index].isMain && newImages.length > 0) {
        newImages[0].isMain = true;
      }
      return { ...prev, images: newImages };
    });
  };

  // 设为主图
  const setMainImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        isMain: i === index,
      })),
    }));
  };

  // 切换标签
  const toggleTag = (tagId: string) => {
    setFormData((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  // 提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    // 基础验证
    if (!formData.name.trim()) {
      setError(t('nameRequired'));
      setIsSaving(false);
      return;
    }
    if (!formData.slug.trim()) {
      setError(t('slugRequired'));
      setIsSaving(false);
      return;
    }
    if (!formData.sku.trim()) {
      setError(t('skuRequired'));
      setIsSaving(false);
      return;
    }
    if (!formData.categoryId) {
      setError(t('categoryRequired'));
      setIsSaving(false);
      return;
    }
    if (!formData.price || isNaN(Number(formData.price))) {
      setError(t('priceRequired'));
      setIsSaving(false);
      return;
    }

    try {
      const url =
        mode === 'edit' && productId
          ? `/api/admin/products/${productId}`
          : '/api/admin/products';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tagIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      // 跳转到列表
      router.push(`/${locale}/admin/products`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { key: 'basic', label: t('tabBasic') },
    { key: 'images', label: t('tabImages') },
    { key: 'description', label: t('tabDescription') },
    { key: 'seo', label: t('tabSeo') },
  ] as const;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
          {error}
        </div>
      )}

      {/* 选项卡 */}
      <div className="border-b">
        <div className="flex gap-6 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-1 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 基本信息 */}
      {activeTab === 'basic' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 左列 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t('englishName')} <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
                placeholder={t('namePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Slug <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input font-mono"
                placeholder="product-slug"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                SKU <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input font-mono"
                placeholder="SKU-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t('category')} <span className="text-destructive">*</span>
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('price')} ($) <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('originalPrice')} ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
                  placeholder={t('originalPricePlaceholder')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('stock')}
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('minOrderQty')}
                </label>
                <input
                  type="number"
                  name="minOrderQty"
                  value={formData.minOrderQty}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('weight')} (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('status')}
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
                >
                  <option value="ACTIVE">{t('statusActive')}</option>
                  <option value="INACTIVE">{t('statusInactive')}</option>
                  <option value="DRAFT">{t('statusDraft')}</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary/50"
                />
                <span className="text-sm font-medium">{t('featured')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isNew"
                  checked={formData.isNew}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary/50"
                />
                <span className="text-sm font-medium">{t('isNew')}</span>
              </label>
            </div>
          </div>

          {/* 右列 - 中文信息 */}
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg border">
              <h3 className="text-sm font-medium mb-3">{t('chineseInfo')}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {t('chineseName')}
                  </label>
                  <input
                    type="text"
                    name="zhName"
                    value={formData.zhName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
                    placeholder={t('chineseNamePlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {t('chineseSlug')}
                  </label>
                  <input
                    type="text"
                    name="zhSlug"
                    value={formData.zhSlug}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input font-mono"
                    placeholder="chan-pin-slug"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t('shortDesc')}
              </label>
              <textarea
                name="shortDesc"
                value={formData.shortDesc}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input resize-none"
                placeholder={t('shortDescPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t('tags')}
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      'px-3 py-1 text-xs rounded-full border transition-colors',
                      formData.tagIds.includes(tag.id)
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'border-input hover:border-muted-foreground text-muted-foreground'
                    )}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('tagsHint')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('sortOrder')}
                </label>
                <input
                  type="number"
                  name="sortOrder"
                  value={formData.sortOrder}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('dimensions')}
                </label>
                <input
                  type="text"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
                  placeholder="L x W x H"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 图片管理 */}
      {activeTab === 'images' && (
        <div className="space-y-4">
          {/* 添加图片 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
              placeholder={t('imageUrlPlaceholder')}
              className="flex-1 px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
            />
            <button
              type="button"
              onClick={addImage}
              className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-accent transition-colors inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('addImage')}
            </button>
          </div>

          <p className="text-xs text-muted-foreground">{t('imageHint')}</p>

          {/* 图片列表 */}
          {formData.images.length === 0 ? (
            <div className="border-2 border-dashed border-input rounded-lg p-12 text-center">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">{t('noImages')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {formData.images.map((img, index) => (
                <div
                  key={index}
                  className={cn(
                    'relative group border rounded-lg overflow-hidden',
                    img.isMain && 'border-primary ring-2 ring-primary/20'
                  )}
                >
                  <div className="aspect-square bg-muted">
                    <img
                      src={img.url}
                      alt={img.altText || `Product image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  {img.isMain && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded">
                      {t('mainImage')}
                    </span>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!img.isMain && (
                      <button
                        type="button"
                        onClick={() => setMainImage(index)}
                        className="p-1.5 bg-background/90 rounded hover:bg-background text-xs"
                        title={t('setAsMain')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="p-1.5 bg-destructive/90 text-destructive-foreground rounded hover:bg-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 描述 */}
      {activeTab === 'description' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t('englishDescription')}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={12}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input font-mono"
              placeholder={t('descriptionPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t('chineseDescription')}
            </label>
            <textarea
              name="zhDescription"
              value={formData.zhDescription}
              onChange={handleChange}
              rows={12}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
              placeholder={t('chineseDescriptionPlaceholder')}
            />
          </div>
        </div>
      )}

      {/* SEO */}
      {activeTab === 'seo' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-3">{t('englishSeo')}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Meta Title
                </label>
                <input
                  type="text"
                  name="seoTitle"
                  value={formData.seoTitle}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
                  placeholder={t('seoTitlePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Meta Description
                </label>
                <textarea
                  name="seoDescription"
                  value={formData.seoDescription}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input resize-none"
                  placeholder={t('seoDescPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Meta Keywords
                </label>
                <input
                  type="text"
                  name="seoKeywords"
                  value={formData.seoKeywords}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
                  placeholder={t('seoKeywordsPlaceholder')}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">{t('chineseSeo')}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Meta Title
                </label>
                <input
                  type="text"
                  name="zhSeoTitle"
                  value={formData.zhSeoTitle}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
                  placeholder={t('seoTitlePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Meta Description
                </label>
                <textarea
                  name="zhSeoDescription"
                  value={formData.zhSeoDescription}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input resize-none"
                  placeholder={t('seoDescPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Meta Keywords
                </label>
                <input
                  type="text"
                  name="zhSeoKeywords"
                  value={formData.zhSeoKeywords}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
                  placeholder={t('seoKeywordsPlaceholder')}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 底部操作栏 */}
      <div className="flex items-center justify-between pt-4 border-t -mx-6 px-6 -mb-6 pb-6 sticky bottom-0 bg-card">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-accent transition-colors"
        >
          {commonT('cancel')}
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => {
              setFormData((prev) => ({ ...prev, status: 'DRAFT' }));
              // 模拟草稿保存，后续可优化
            }}
            className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-accent transition-colors"
          >
            {t('saveDraft')}
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSaving ? commonT('loading') : t('saveProduct')}
          </button>
        </div>
      </div>
    </form>
  );
}
