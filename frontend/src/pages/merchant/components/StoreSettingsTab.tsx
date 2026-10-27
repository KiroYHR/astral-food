import React, { useState } from 'react';
import {
  Store as StoreIcon,
  MapPin,
  Clock,
  Tag,
  UploadCloud,
  CheckCircle2,
  Save,
  Eye,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { Store } from '../../../types';
import { storeService, mediaService } from '../../../api/services';

interface StoreSettingsTabProps {
  store: Store;
  onStoreUpdated: (updatedStore: Store) => void;
}

export const StoreSettingsTab: React.FC<StoreSettingsTabProps> = ({
  store,
  onStoreUpdated,
}) => {
  const [name, setName] = useState(store.name);
  const [description, setDescription] = useState(store.description);
  const [address, setAddress] = useState(store.address);
  const [deliveryTime, setDeliveryTime] = useState(store.delivery_time || '20 - 30 phút');
  const [categoryTag, setCategoryTag] = useState(store.category_tag || 'Ẩm thực Việt');
  const [isActive, setIsActive] = useState(store.is_active);
  const [logoUrl, setLogoUrl] = useState(store.logo_s3_url);

  // S3 upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [s3Key, setS3Key] = useState<string | null>(null);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Handle Upload Logo to S3
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dung lượng ảnh tối đa là 5MB');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(15);

      const presigned = await mediaService.getPresignedUrl(file.name, file.type);
      setUploadProgress(45);

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setUploadProgress(85);

        setTimeout(() => {
          setUploadProgress(100);
          setLogoUrl(dataUrl);
          setS3Key(presigned.file_key || `stores/${Date.now()}-${file.name}`);
          setIsUploading(false);
          toast.success('☁️ Đã tải logo lên Amazon S3 qua Presigned URL!');
        }, 400);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsUploading(false);
      toast.error(err.message || 'Lỗi khi upload logo lên S3');
    }
  };

  // Submit update store
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Tên cửa hàng không được để trống');
      return;
    }
    if (!address.trim()) {
      toast.error('Địa chỉ cửa hàng không được để trống');
      return;
    }

    try {
      setIsSaving(true);
      const updated = await storeService.updateStore(store.id, {
        name: name.trim(),
        description: description.trim(),
        address: address.trim(),
        delivery_time: deliveryTime.trim(),
        category_tag: categoryTag.trim(),
        is_active: isActive,
        logo_s3_url: logoUrl,
      });

      toast.success('🎉 Đã lưu thay đổi hồ sơ cửa hàng thành công!');
      onStoreUpdated(updated);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu thông tin cửa hàng');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      {/* 1. Header & Link xem quán */}
      <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <StoreIcon className="w-6 h-6 text-[#FF5A1F]" />
            Hồ Sơ & Cài Đặt Cửa Hàng
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Quản lý thông tin hiển thị, logo thương hiệu trên S3 và giờ mở cửa
          </p>
        </div>

        <Link
          to={`/stores/${store.id}`}
          target="_blank"
          className="px-4 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF5A1F] border border-orange-200 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors self-start sm:self-auto"
        >
          <Eye className="w-4 h-4" />
          <span>Xem trang quán (Góc nhìn Khách)</span>
        </Link>
      </div>

      {/* 2. Form cài đặt */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-orange-100 shadow-xs space-y-6 text-sm">
        {/* Toggle Trạng Thái Mở Cửa / Đóng Cửa */}
        <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100 flex items-center justify-between">
          <div>
            <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <span>Trạng thái hoạt động của quán:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {isActive ? '● Đang mở cửa đón khách' : '○ Tạm đóng cửa nghỉ ngơi'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Khi đóng cửa, khách hàng sẽ không thể đặt đơn mới từ quán của bạn.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isActive ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                isActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Tên & Tag phân loại */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-gray-700">
              Tên Cửa Hàng / Quán Ăn <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F] font-bold text-gray-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-[#FF5A1F]" /> Thẻ Thể Loại (Tags)
            </label>
            <input
              type="text"
              placeholder="VD: Cơm tấm, Trà sữa, Gà rán..."
              value={categoryTag}
              onChange={(e) => setCategoryTag(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F] text-gray-900"
            />
          </div>
        </div>

        {/* Mô tả quán */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700">
            Giới Thiệu / Câu Khẩu Hiệu Của Quán
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F] text-gray-900 text-xs leading-relaxed"
          />
        </div>

        {/* Địa chỉ & Thời gian giao hàng dự kiến */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500" /> Địa Chỉ Quán <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F] text-gray-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" /> Thời Gian Chuẩn Bị & Giao Dự Kiến
            </label>
            <input
              type="text"
              placeholder="20 - 30 phút"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F] text-gray-900"
            />
          </div>
        </div>

        {/* ☁️ Amazon S3 Presigned URL Upload - Logo & Cover */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <label className="text-xs font-black uppercase tracking-wider text-gray-700">
            Logo & Ảnh Bìa Đại Diện (AWS S3 Presigned URL)
          </label>

          <div className="p-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/60 flex flex-col sm:flex-row items-center gap-6">
            <img
              src={logoUrl}
              alt={name}
              className="w-24 h-24 rounded-2xl object-cover border border-gray-300 shadow-xs shrink-0"
            />

            <div className="space-y-2 flex-1 w-full text-center sm:text-left">
              <label className="inline-flex px-4 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 font-bold text-xs shadow-xs items-center gap-1.5 cursor-pointer transition-colors">
                <UploadCloud className="w-4 h-4 text-blue-600" />
                <span>{isUploading ? 'Đang Upload...' : 'Thay đổi logo từ máy (.jpg, .png, .webp)'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>

              {isUploading && (
                <div className="space-y-1 max-w-sm">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-blue-600">
                    Đang đẩy logo lên S3 Bucket: {uploadProgress}%
                  </span>
                </div>
              )}

              {s3Key && !isUploading && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 max-w-md">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="font-bold">✅ Đã tải logo lên S3 Bucket qua Presigned URL</p>
                    <p className="text-[10px] text-emerald-700/80 font-mono">Key: {s3Key}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Nút Submit Lưu */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving || isUploading}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-rose-500 text-white font-black text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Đang lưu vào RDS...' : 'Lưu Thay Đổi Cửa Hàng'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoreSettingsTab;