import React, { useState } from 'react';
import {
  Utensils,
  Plus,
  Search,
  Edit2,
  Trash2,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product, Category } from '../../../types';
import { storeService, productService } from '../../../api/services';
import ProductModal from './ProductModal';

interface MenuManagerTabProps {
  storeId: string;
  categories: Category[];
  products: Product[];
  onRefreshData: () => void;
}

export const MenuManagerTab: React.FC<MenuManagerTabProps> = ({
  storeId,
  categories,
  products,
  onRefreshData,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Thêm category mới state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);

  // Toggle trạng thái còn hàng / hết hàng
  const handleToggleAvailability = async (productId: string, currentStatus: boolean) => {
    try {
      await productService.toggleProductAvailability(productId);
      toast.success(
        currentStatus
          ? 'Đã chuyển món sang trạng thái: Tạm hết hàng'
          : 'Đã mở bán lại món: Còn hàng'
      );
      onRefreshData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi cập nhật trạng thái món ăn');
    }
  };

  // Xóa món ăn
  const handleDeleteProduct = async (product: Product) => {
    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa món "${product.name}" khỏi thực đơn không? Hành động này không thể hoàn tác.`
      )
    ) {
      try {
        await productService.deleteProduct(product.id);
        toast.success(`Đã xóa món "${product.name}" thành công!`);
        onRefreshData();
      } catch (err: any) {
        toast.error(err.message || 'Lỗi khi xóa món ăn');
      }
    }
  };

  // Thêm danh mục mới
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }

    try {
      setIsSubmittingCat(true);
      await storeService.createCategory(storeId, newCategoryName.trim());
      toast.success(`Đã tạo danh mục "${newCategoryName}" thành công!`);
      setNewCategoryName('');
      setIsAddingCategory(false);
      onRefreshData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tạo danh mục mới');
    } finally {
      setIsSubmittingCat(false);
    }
  };

  // Lọc sản phẩm theo Category & Search
  const filteredProducts = products.filter((p) => {
    const matchesCat =
      selectedCategory === 'ALL' || p.category_id === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header & Nút Thêm Món Mới */}
      <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <Utensils className="w-6 h-6 text-[#FF5A1F]" />
            Quản Lý Thực Đơn & AI Menu Copilot
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Bật/tắt trạng thái món ăn 1 chạm, hỗ trợ tạo nội dung tự động bằng AI và lưu trữ S3
          </p>
        </div>

        {/* Nút "+ Thêm Món Mới" */}
        <button
          type="button"
          id="btn-add-product" onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-rose-500 text-white font-black text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Thêm Món Ăn Mới</span>
        </button>
      </div>

      {/* 2. Dải Danh Mục & Bộ Lọc */}
      <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Categories Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-[#FF5A1F] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tất cả ({products.length})
            </button>
            {categories.map((c) => {
              const countInCat = products.filter((p) => p.category_id === c.id).length;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    selectedCategory === c.id
                      ? 'bg-[#FF5A1F] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {c.name} ({countInCat})
                </button>
              );
            })}

            {/* Nút "+ Thêm danh mục" */}
            {!isAddingCategory ? (
              <button
                type="button"
                onClick={() => setIsAddingCategory(true)}
                className="px-3 py-1.5 rounded-xl border border-dashed border-orange-300 text-[#FF5A1F] hover:bg-orange-50 text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm danh mục
              </button>
            ) : null}
          </div>

          {/* Ô Tìm kiếm món */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm món ăn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]"
            />
          </div>
        </div>

        {/* Form thêm danh mục inline */}
        {isAddingCategory && (
          <form
            onSubmit={handleCreateCategory}
            className="p-3 bg-orange-50/60 rounded-xl border border-orange-200 flex flex-wrap items-center gap-2 animate-in fade-in"
          >
            <span className="text-xs font-bold text-[#FF5A1F] flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Tên danh mục mới:
            </span>
            <input
              type="text"
              required
              placeholder="VD: Tráng Miệng, Thức Uống..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#FF5A1F] flex-1 max-w-xs bg-white"
            />
            <button
              type="submit"
              disabled={isSubmittingCat}
              className="px-3.5 py-1.5 rounded-lg bg-[#FF5A1F] text-white font-bold text-xs hover:opacity-90 cursor-pointer disabled:opacity-50"
            >
              {isSubmittingCat ? 'Đang tạo...' : 'Tạo ngay'}
            </button>
            <button
              type="button"
              onClick={() => setIsAddingCategory(false)}
              className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-300 cursor-pointer"
            >
              Hủy
            </button>
          </form>
        )}
      </div>

      {/* 3. Bảng / Danh Sách Món Ăn */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProducts.map((product) => {
          const categoryName =
            categories.find((c) => c.id === product.category_id)?.name ||
            'Món ăn';

          return (
            <div
              key={product.id}
              className="bg-white rounded-2xl p-5 border border-orange-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                {/* Image & Price Tag */}
                <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-100">
                  <img
                    src={product.image_s3_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Category Pill */}
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                    {categoryName}
                  </span>
                  {/* Price Tag */}
                  <span className="absolute bottom-2.5 right-2.5 px-3 py-1 rounded-xl bg-white/95 backdrop-blur-md text-gray-900 font-black text-xs shadow-md">
                    {formatVND(product.price)}
                  </span>
                </div>

                {/* Name & Description */}
                <div>
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {product.tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-orange-50 text-[#FF5A1F] text-[10px] font-bold border border-orange-100"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Bar & 1-Click Toggle */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                {/* Nút Gạt Còn Hàng / Hết Hàng (1 chạm) */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleAvailability(product.id, product.is_available)
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      product.is_available ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        product.is_available ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span
                    className={`text-xs font-bold ${
                      product.is_available ? 'text-emerald-700' : 'text-gray-400'
                    }`}
                  >
                    {product.is_available ? 'Còn hàng' : 'Tạm hết'}
                  </span>
                </div>

                {/* Sửa & Xóa Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(product);
                      setIsModalOpen(true);
                    }}
                    className="p-2 rounded-xl text-gray-500 hover:text-[#FF5A1F] hover:bg-orange-50 transition-colors cursor-pointer"
                    title="Chỉnh sửa món ăn"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(product)}
                    className="p-2 rounded-xl text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Xóa món ăn"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center text-gray-500 space-y-3">
          <Utensils className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="font-bold text-gray-800">Không tìm thấy món ăn nào</p>
          <p className="text-xs text-gray-400">
            Hãy thử tìm với từ khóa khác hoặc bấm "+ Thêm Món Ăn Mới" để mở rộng thực đơn.
          </p>
        </div>
      )}

      {/* Modal Thêm / Chỉnh Sửa Món Ăn */}
      {isModalOpen && (
        <ProductModal
          storeId={storeId}
          categories={categories}
          initialProduct={editingProduct}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProduct(null);
          }}
          onSuccess={onRefreshData}
        />
      )}
    </div>
  );
};

export default MenuManagerTab;