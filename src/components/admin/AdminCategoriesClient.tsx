'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryItemData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  image: string | null;
  isActive: boolean;
  productCount: number;
  createdAt: string;
}

interface AdminCategoriesClientProps {
  initialCategories: CategoryItemData[];
}

export default function AdminCategoriesClient({
  initialCategories,
}: AdminCategoriesClientProps) {
  const router = useRouter();
  const t = useTranslations('admin.categories');
  const [categories, setCategories] = useState<CategoryItemData[]>(initialCategories);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [parentIdForAdd, setParentIdForAdd] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // 构建树形数据
  const buildTree = (parentId: string | null = null): CategoryItemData[] => {
    return categories
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAdd = (parentId: string | null = null) => {
    setParentIdForAdd(parentId);
    setEditingId(null);
    setShowModal(true);
    setError('');
  };

  const handleEdit = (item: CategoryItemData) => {
    setEditingId(item.id);
    setParentIdForAdd(item.parentId);
    setShowModal(true);
    setError('');
  };

  const handleDelete = async (item: CategoryItemData) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      const res = await fetch(`/api/admin/categories/${item.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      // 从本地状态移除
      setCategories((prev) => prev.filter((c) => c.id !== item.id));
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleSubmit = async (formData: Record<string, unknown>) => {
    setIsSaving(true);
    setError('');

    try {
      const url = editingId
        ? `/api/admin/categories/${editingId}`
        : '/api/admin/categories';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          parentId: parentIdForAdd || formData.parentId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      setShowModal(false);
      setEditingId(null);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const editingCategory = editingId
    ? categories.find((c) => c.id === editingId)
    : null;

  // 渲染单条分类
  const renderItem = (item: CategoryItemData, level: number = 0) => {
    const children = buildTree(item.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(item.id);

    return (
      <div key={item.id}>
        <div
          className="flex items-center gap-2 px-4 py-3 border-b hover:bg-muted/30 transition-colors group"
          style={{ paddingLeft: `${level * 24 + 16}px` }}
        >
          {/* 展开/收起 */}
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(item.id)}
              className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground"
            >
              {isExpanded ? (
                <ChevronDownIcon />
              ) : (
                <ChevronRightIcon />
              )}
            </button>
          ) : (
            <span className="w-6" />
          )}

          {/* 图标 */}
          {hasChildren ? (
            isExpanded ? (
              <FolderOpenIcon />
            ) : (
              <Folder className="h-5 w-5 text-amber-500" />
            )
          ) : (
            <PackageIcon />
          )}

          {/* 名称 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn('text-foreground truncate', level === 0 && 'font-medium')}>
                {item.name}
              </span>
              <span className="text-xs text-muted-foreground">/ {item.slug}</span>
              {!item.isActive && (
                <span className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                  {t('inactive')}
                </span>
              )}
            </div>
          </div>

          {/* 排序 */}
          <span className="text-xs text-muted-foreground w-12 text-right">
            #{item.sortOrder}
          </span>

          {/* 产品数量 */}
          <span className="text-xs text-muted-foreground w-20 text-right">
            {item.productCount} {t('products')}
          </span>

          {/* 操作按钮 */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleAdd(item.id)}
              className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
              title={t('addSubCategory')}
            >
              <PlusIconSmall />
            </button>
            <button
              onClick={() => handleEdit(item)}
              className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
              title={t('edit')}
            >
              <EditIcon />
            </button>
            <button
              onClick={() => handleDelete(item)}
              className="p-1.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"
              title={t('delete')}
            >
              <TrashIcon />
            </button>
          </div>
        </div>

        {/* 子分类 */}
        {hasChildren && isExpanded && (
          <div>
            {children.map((child) => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootCategories = buildTree(null);

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <button
          onClick={() => handleAdd(null)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t('addCategory')}
        </button>
      </div>

      {/* 分类树形列表 */}
      <div className="bg-card border rounded-lg">
        {/* 列表头部 */}
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30 text-xs font-medium text-muted-foreground">
          <span className="w-6" />
          <span className="w-6" />
          <span className="flex-1">{t('categoryName')}</span>
          <span className="w-12 text-right">{t('sortOrder')}</span>
          <span className="w-20 text-right">{t('productCount')}</span>
          <span className="w-28" />
        </div>

        {rootCategories.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Folder className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t('noCategories')}</p>
          </div>
        ) : (
          rootCategories.map((item) => renderItem(item))
        )}
      </div>

      {/* 添加/编辑弹窗 */}
      {showModal && (
        <CategoryFormModal
          categories={categories}
          editingCategory={editingCategory}
          parentId={parentIdForAdd}
          error={error}
          isSaving={isSaving}
          onClose={() => {
            setShowModal(false);
            setEditingId(null);
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

// ===== 辅助图标组件 =====
function ChevronRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
function ChevronDownIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function FolderOpenIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
      <path d="M6 14l-1.45-6.52A2 2 0 0 1 6.5 5H10l2 2h8a2 2 0 0 1 2 2v1" />
      <path d="M2 14h20v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5z" />
    </svg>
  );
}
function PackageIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
function PlusIconSmall() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

// ===== 分类表单弹窗 =====
function CategoryFormModal({
  categories,
  editingCategory,
  parentId,
  error,
  isSaving,
  onClose,
  onSubmit,
}: {
  categories: CategoryItemData[];
  editingCategory?: CategoryItemData;
  parentId: string | null;
  error: string;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}) {
  const t = useTranslations('admin.categories');
  const commonT = useTranslations('common');
  const [formData, setFormData] = useState({
    name: editingCategory?.name || '',
    slug: editingCategory?.slug || '',
    description: editingCategory?.description || '',
    parentId: editingCategory?.parentId || parentId || '',
    sortOrder: editingCategory?.sortOrder?.toString() || '0',
    isActive: editingCategory?.isActive ?? true,
  });

  // 构建可选择的父分类列表
  const getAvailableParents = () => {
    if (!editingCategory) return categories;

    const excludedIds = new Set<string>();
    const collectDescendants = (id: string) => {
      excludedIds.add(id);
      categories
        .filter((c) => c.parentId === id)
        .forEach((c) => collectDescendants(c.id));
    };
    collectDescendants(editingCategory.id);

    return categories.filter((c) => !excludedIds.has(c.id));
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const availableParents = getAvailableParents();

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card border rounded-lg w-full max-w-lg shadow-xl max-h-[90vh] overflow-auto">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editingCategory ? t('editCategory') : t('addCategory')}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-muted rounded text-muted-foreground"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t('parentCategory')}
              </label>
              <select
                name="parentId"
                value={formData.parentId}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input"
              >
                <option value="">{t('rootLevel')}</option>
                {availableParents
                  .filter((c) => !editingCategory || c.id !== editingCategory.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t('categoryName')} <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
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
                required
                className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input font-mono"
                placeholder="category-slug"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t('description')}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-input resize-none"
                placeholder={t('descPlaceholder')}
              />
            </div>

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

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 rounded border-input text-primary focus:ring-primary/50"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                {t('isActive')}
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-accent transition-colors"
              >
                {commonT('cancel')}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSaving ? commonT('loading') : commonT('save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
