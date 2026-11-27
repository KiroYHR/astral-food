import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Search,
  Utensils,
  Eye,
  EyeOff,
  Trash2,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Store, Category, Product } from '../../../types';
import { adminService } from '../../../api/services';

interface AdminStoreMenuModalProps {
  storeId: string;
  onClose: () => void;
  onMenuChanged?: () => void;
}

export const AdminStoreMenuModal: React.FC<AdminStoreMenuModalProps> = ({
  storeId,
  onClose,
  onMenuChanged,
}) => {
  const [store, setStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [busyProductId, setBusyProductId] = useState<string | null>(null);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getStoreMenuForAdmin(storeId);
      setStore(data.store);
      setCategories(data.categories || []);
      setProducts(data.products || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Không thể tải thực đơn cửa hàng');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const handleToggleAvailability = async (product: Product) => {
    const nextState = !product.is_available;
    setBusyProductId(product.id);
    try {
      const updated = await adminService.toggleProductAvailabilityByAdmin(
        storeId,
        product.id,
        nextState
      );
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, ...updated, is_available: nextState } : p))
      );
      toast.success(
        nextState
          ? `Đã mở bán lại món "${product.name}"`
          : `Đã tạm ẩn món "${product.name}" khỏi thực đơn`
      );
      onMenuChanged?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Không thể cập nhật trạng thái món');
    } finally {
      setBusyProductId(null);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn gỡ món "${product.name}" khỏi thực đơn của quán không?`
      )
    ) {
      return;
    }

    setBusyProductId(product.id);
    try {
      await adminService.deleteProductByAdmin(storeId, product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast.success(`Đã gỡ món "${product.name}" khỏi thực đơn.`);
      onMenuChanged?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Không thể xóa món ăn này');
    } finally {
      setBusyProductId(null);
    }
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCatId === 'all' || p.category_id === selectedCatId;
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const knownCatIds = new Set(categories.map((c) => c.id));
  const uncategorizedProducts = filteredProducts.filter((p) => !knownCatIds.has(p.category_id));
  const showGroupedByCat = selectedCatId === 'all' && !q;

  const renderRows = (list: Product[]) =>
    list.map((product) => {
      const isBusy = busyProductId === product.id;
      const catName =
        product.category_name ||
        categories.find((c) => c.id === product.category_id)?.name ||
        'Khác';

      return (
        <tr key={product.id} className="hover:bg-orange-50/30 transition-colors">
          <td className="py-3 px-4">
            <div className="flex items-center gap-3">
              <img
                src={product.image_s3_url}
                alt={product.name}
                className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0"
              />
              <div className="min-w-0">
                <div className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-1">
                  {product.name}
                </div>
                <div className="text-[11px] text-gray-500 line-clamp-1 max-w-xs">
                  {product.description || 'Không có mô tả'}
                </div>
              </div>
            </div>
          </td>
          <td className="py-3 px-4">
            <span className="inline-flex px-2.5 py-1 rounded-lg bg-orange-50 text-[#FF5A1F] text-[11px] font-bold border border-orange-100 whitespace-nowrap">
              {catName}
            </span>
          </td>
          <td className="py-3 px-4 font-black text-gray-900 whitespace-nowrap">
            {Number(product.price).toLocaleString('vi-VN')} đ
          </td>
          <td className="py-3 px-4">
            {product.is_available ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 whitespace-nowrap">
                ● Đang bán
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-200 text-gray-600 whitespace-nowrap">
                ○ Tạm ẩn
              </span>
            )}
          </td>
          <td className="py-3 px-4 text-right">
            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleToggleAvailability(product)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50 ${
                  product.is_available
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}
              >
                {product.is_available ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Tạm ẩn</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Mở bán lại</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleDeleteProduct(product)}
                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                title="Xóa món ăn vi phạm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa</span>
              </button>
            </div>
          </td>
        </tr>
      );
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-purple-100">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {store?.logo_s3_url ? (
              <img
                src={store.logo_s3_url}
                alt={store.name}
                className="w-11 h-11 rounded-2xl object-cover border border-white/25 shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                <Utensils className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-black text-base sm:text-lg truncate">
                Kiểm Duyệt Thực Đơn: {store?.name || 'Đang tải...'}
              </h3>
              <p className="text-[11px] text-purple-100 truncate">
                {categories.length} danh mục • {products.length} món ăn
                {store?.owner?.full_name ? ` • Chủ quán: ${store.owner.full_name}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors shrink-0"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 sm:px-6 border-b border-gray-100 bg-[#FFFDF9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
            <button
              type="button"
              onClick={() => setSelectedCatId('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-all ${
                selectedCatId === 'all'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-purple-50'
              }`}
            >
              Tất cả ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.category_id === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-all ${
                    selectedCatId === cat.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-purple-50'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm tên món ăn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            />
          </div>
        </div>

        {/* Body Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-gray-500">Đang tải danh sách thực đơn...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center space-y-2 text-gray-500">
              <Utensils className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="font-bold text-sm text-gray-800">Không có món ăn nào phù hợp</p>
              <p className="text-xs text-gray-400">
                Quán chưa đăng món nào hoặc không khớp bộ lọc tìm kiếm.
              </p>
            </div>
          ) : showGroupedByCat ? (
            <div className="space-y-6">
              {categories.map((cat) => {
                const groupItems = products.filter((p) => p.category_id === cat.id);
                if (groupItems.length === 0) return null;
                return (
                  <div
                    key={cat.id}
                    className="rounded-2xl border border-gray-200 overflow-hidden bg-white"
                  >
                    <div className="px-4 py-2.5 bg-purple-50/70 border-b border-purple-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-purple-600" />
                        <span className="font-black text-xs sm:text-sm text-gray-900">
                          {cat.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-purple-700">
                        {groupItems.length} món
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-2.5 px-4">Món ăn</th>
                            <th className="py-2.5 px-4">Danh mục</th>
                            <th className="py-2.5 px-4">Giá bán</th>
                            <th className="py-2.5 px-4">Trạng thái</th>
                            <th className="py-2.5 px-4 text-right">Thao tác kiểm duyệt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">{renderRows(groupItems)}</tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

              {uncategorizedProducts.length > 0 && (
                <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
                  <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <span className="font-black text-xs sm:text-sm text-gray-800">Khác</span>
                    <span className="text-[11px] font-bold text-gray-500">
                      {uncategorizedProducts.length} món
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <tbody className="divide-y divide-gray-100">
                        {renderRows(uncategorizedProducts)}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Món ăn</th>
                      <th className="py-3 px-4">Danh mục</th>
                      <th className="py-3 px-4">Giá bán</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Thao tác kiểm duyệt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">{renderRows(filteredProducts)}</tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminStoreMenuModal;