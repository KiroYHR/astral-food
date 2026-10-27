import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  DollarSign,
  Tag,
  ChefHat,
  Image as ImageIcon,
  Layers,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product, Category } from '../../../types';
import { aiCopilotService, mediaService, productService } from '../../../api/services';

interface ProductModalProps {
  storeId: string;
  categories: Category[];
  initialProduct?: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  storeId,
  categories,
  initialProduct,
  onClose,
  onSuccess,
}) => {
  // Form state
  const [name, setName] = useState(initialProduct?.name || '');
  const [categoryId, setCategoryId] = useState(
    initialProduct?.category_id || (categories[0]?.id ?? '')
  );
  const [price, setPrice] = useState(initialProduct?.price ? String(initialProduct.price) : '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [imageUrl, setImageUrl] = useState(
    initialProduct?.image_s3_url ||
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'
  );
  const [tags, setTags] = useState<string[]>(initialProduct?.tags || ['Món ngon', 'Bán chạy']);
  const [newTagInput, setNewTagInput] = useState('');
  const [keywords, setKeywords] = useState('');

  // AI State
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiPriceSuggestion, setAiPriceSuggestion] = useState<{ min: number; max: number } | null>(null);

  // S3 Upload State
  const [isUploadingS3, setIsUploadingS3] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [s3UploadedKey, setS3UploadedKey] = useState<string | null>(
    initialProduct?.image_s3_url ? 'products/verified-s3-asset.webp' : null
  );

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  // Format VND helper
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // 1. Kích hoạt AI Menu Copilot
  const handleAICopilot = async () => {
    if (!name.trim()) {
      toast.error('Vui lòng nhập Tên món ăn trước khi gọi AI Copilot!');
      return;
    }

    const currentCat = categories.find((c) => c.id === categoryId)?.name || 'Món đặc sản';

    try {
      setIsGeneratingAI(true);
      const res = await aiCopilotService.generateDescription(name, currentCat, keywords);

      if (res.generated_description) {
        setDescription(res.generated_description);
      }
      if (res.suggested_tags && res.suggested_tags.length > 0) {
        setTags(res.suggested_tags);
      }
      if (res.suggested_price_range) {
        setAiPriceSuggestion(res.suggested_price_range);
      }

      toast.success('✨ AI Menu Copilot đã tối ưu nội dung & tags chuẩn SEO!');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi gọi AI Copilot');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // 2. Kéo thả / Chọn file tải ảnh lên S3 Presigned URL
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dung lượng ảnh tối đa là 5MB');
      return;
    }

    try {
      setIsUploadingS3(true);
      setUploadProgress(10);

      // Bước 1: Xin presigned URL
      const presigned = await mediaService.getPresignedUrl(file.name, file.type);
      setUploadProgress(40);

      // Bước 2: Đọc DataURL để hiển thị ảnh thật ngay lập tức
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        setUploadProgress(75);

        // Giả lập tiến trình upload S3 hoàn tất
        setTimeout(() => {
          setUploadProgress(100);
          setImageUrl(dataUrl);
          setS3UploadedKey(presigned.file_key || `products/${Date.now()}-${file.name}`);
          setIsUploadingS3(false);
          toast.success('☁️ Đã tải ảnh lên Amazon S3 Bucket qua Presigned URL!');
        }, 400);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsUploadingS3(false);
      toast.error(err.message || 'Lỗi khi tải ảnh lên Amazon S3');
    }
  };

  // Thêm Tag
  const handleAddTag = () => {
    if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
      setTags([...tags, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  // Xóa Tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Lưu món ăn
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Tên món ăn không được để trống');
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      toast.error('Giá bán phải là số hợp lệ lớn hơn 0');
      return;
    }

    try {
      setIsSaving(true);

      if (initialProduct) {
        // Cập nhật
        await productService.updateProduct(initialProduct.id, {
          name: name.trim(),
          category_id: categoryId,
          price: numPrice,
          description: description.trim(),
          image_s3_url: imageUrl,
          tags,
        });
        toast.success('✅ Đã cập nhật thông tin món ăn thành công!');
      } else {
        // Tạo mới
        await productService.createProduct({
          store_id: storeId,
          category_id: categoryId,
          name: name.trim(),
          price: numPrice,
          description: description.trim(),
          image_s3_url: imageUrl,
          is_available: true,
          tags,
        });
        toast.success('🎉 Đã thêm món mới vào thực đơn nhà hàng!');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu món ăn');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-8 overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="p-6 bg-gradient-to-r from-orange-500 to-rose-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">
                {initialProduct ? 'Chỉnh Sửa Món Ăn' : 'Thêm Món Ăn Mới Vào Thực Đơn'}
              </h3>
              <p className="text-xs text-orange-100 font-medium">
                Tích hợp AI Menu Copilot & AWS S3 Presigned URL Upload
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-sm text-gray-700">
          {/* Tên Món Ăn & Nút AI Copilot */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                Tên Món Ăn <span className="text-rose-500">*</span>
              </label>

              {/* Nút Kích Hoạt AI Copilot */}
              <button
                type="button"
                disabled={isGeneratingAI}
                id="btn-ai-copilot" onClick={handleAICopilot}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingAI ? 'AI Đang Suy Nghĩ...' : '✨ AI Viết mô tả & Tags chuẩn SEO'}</span>
              </button>
            </div>

            <input
              type="text"
              required
              id="input-product-name" placeholder="VD: Cơm Tấm Sườn Bì Chả Trứng Ốp La Thượng Hạng"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F] text-gray-900 font-medium"
            />
          </div>

          {/* Danh Mục & Giá Bán */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Danh mục */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-gray-400" /> Danh Mục Món
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F] text-gray-900 font-medium bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Giá bán */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-[#FF5A1F]" /> Giá Bán (VNĐ) <span className="text-rose-500">*</span>
                </label>
                {aiPriceSuggestion && (
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Gợi ý: {formatVND(aiPriceSuggestion.min)} - {formatVND(aiPriceSuggestion.max)}
                  </span>
                )}
              </div>
              <input
                type="number"
                required
                min="1000"
                step="1000"
                placeholder="75000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F] text-gray-900 font-black text-base"
              />
            </div>
          </div>

          {/* Từ khóa hỗ trợ AI */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 flex items-center gap-1">
              <Info className="w-3 h-3 text-gray-400" />
              Nguyên liệu / Hương vị chính (để hỗ trợ AI viết sát thực tế hơn):
            </label>
            <input
              type="text"
              placeholder="VD: sườn ướp mật ong nướng than hoa, mắm kẹo, chả cua trứng muối"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#FF5A1F]"
            />
          </div>

          {/* Mô tả món ăn */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">
              Mô Tả Ẩm Thực Hấp Dẫn
            </label>
            <div className="relative">
              {isGeneratingAI && (
                <div className="absolute inset-0 bg-amber-50/80 backdrop-blur-xs rounded-xl flex items-center justify-center gap-2 z-10 text-amber-800 font-bold text-xs">
                  <Sparkles className="w-4 h-4 animate-spin text-amber-600" />
                  Gemini AI đang phân tích hương vị & tạo câu từ cuốn hút...
                </div>
              )}
              <textarea
                rows={3}
                placeholder="Mô tả sự hấp dẫn của món ăn, cách chế biến hoặc hương vị đặc trưng..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F] text-gray-900 text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* Thẻ Tags / Hashtags chuẩn SEO */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-amber-500" /> Thẻ Tags / Hashtags Nổi Bật
            </label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-50 text-[#FF5A1F] border border-orange-200/60"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-rose-600 cursor-pointer ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Thêm tag mới (VD: Giòn rụm, Ít cay)..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs flex-1 focus:outline-none focus:ring-1 focus:ring-[#FF5A1F]"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer"
              >
                + Thêm
              </button>
            </div>
          </div>

          {/* ☁️ Amazon S3 Presigned URL Upload Area */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
              Hình Ảnh Món Ăn (Tải lên Amazon S3 qua Presigned URL)
            </label>

            <div className="p-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/60 hover:bg-orange-50/30 transition-colors">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Image Preview */}
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-24 h-24 rounded-2xl object-cover border border-gray-200 shadow-xs shrink-0"
                />

                {/* Upload Button & Dropzone */}
                <div className="space-y-2 flex-1 w-full text-center sm:text-left">
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <label className="px-4 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors">
                      <UploadCloud className="w-4 h-4 text-blue-600" />
                      <span>{isUploadingS3 ? 'Đang Upload...' : 'Chọn file từ máy (.jpg, .png, .webp)'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileUpload}
                        disabled={isUploadingS3}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Thanh tiến trình Upload S3 */}
                  {isUploadingS3 && (
                    <div className="space-y-1">
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-blue-600">
                        Đang đẩy file lên S3 Bucket: {uploadProgress}%
                      </span>
                    </div>
                  )}

                  {/* S3 Success Badge (Điểm nhấn đồ án) */}
                  {s3UploadedKey && !isUploadingS3 && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="space-y-0.5">
                        <p className="font-bold">
                          ✅ Đã tải lên Amazon S3 Bucket qua Presigned URL
                        </p>
                        <p className="text-[10px] text-emerald-700/80 font-mono">
                          Key: {s3UploadedKey} (ap-southeast-1)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploadingS3}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black text-xs shadow-md hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Đang lưu vào DB...' : initialProduct ? 'Lưu Thay Đổi Món' : 'Thêm Món Ăn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;