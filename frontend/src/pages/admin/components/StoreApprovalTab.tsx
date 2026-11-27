import React, { useState } from 'react';
import {
  Store,
  CheckCircle2,
  Lock,
  Search,
  MapPin,
  Clock,
  Check,
  XCircle,
  ClipboardList,
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Utensils,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Store as StoreType } from '../../../types';
import { adminService } from '../../../api/services';
import AdminStoreMenuModal from './AdminStoreMenuModal';

interface StoreApprovalTabProps {
  stores: StoreType[];
  onRefreshData: () => void;
}

export const StoreApprovalTab: React.FC<StoreApprovalTabProps> = ({
  stores,
  onRefreshData,
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'ACTIVE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuModalStoreId, setMenuModalStoreId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Phê duyệt mở quán hoặc Khóa quán
  const handleToggleApproval = async (store: StoreType, newActiveState: boolean) => {
    try {
      setActionLoadingId(store.id);
      await adminService.toggleStoreApproval(store.id, newActiveState);

      if (newActiveState) {
        toast.success(`🎉 Đã phê duyệt mở quán "${store.name}"! Quán đã chính thức mở bán trên trang Khách hàng.`);
      } else {
        toast.success(`🔒 Đã tạm ngưng hoạt động quán "${store.name}".`);
      }

      onRefreshData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Lỗi khi cập nhật trạng thái quán');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Từ chối & xóa yêu cầu mở cửa hàng đang chờ duyệt
  const handleRejectStore = async (store: StoreType) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn TỪ CHỐI và XÓA hồ sơ mở quán "${store.name}" không?`
      )
    ) {
      return;
    }

    try {
      setActionLoadingId(store.id);
      const res = await adminService.rejectStore(store.id);
      toast.success(res.message || `Đã từ chối hồ sơ quán "${store.name}".`);
      onRefreshData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Không thể từ chối cửa hàng');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Đếm số lượng
  const countAll = stores.length;
  const countPending = stores.filter((s) => !s.is_active).length;
  const countActive = stores.filter((s) => s.is_active).length;

  // Lọc dữ liệu
  const filteredStores = stores.filter((s) => {
    const matchesFilter =
      filterStatus === 'ALL'
        ? true
        : filterStatus === 'PENDING'
        ? !s.is_active
        : s.is_active;

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      query === '' ||
      s.name.toLowerCase().includes(query) ||
      s.address.toLowerCase().includes(query) ||
      (s.category_tag && s.category_tag.toLowerCase().includes(query)) ||
      (s.owner?.full_name && s.owner.full_name.toLowerCase().includes(query)) ||
      (s.owner?.email && s.owner.email.toLowerCase().includes(query));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header */}
      <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-xs">
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
          <Store className="w-6 h-6 text-[#FF5A1F]" />
          Thẩm Định & Phê Duyệt Cửa Hàng Đối Tác
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Kiểm tra hồ sơ cửa hàng, phê duyệt hoặc từ chối mở bán và kiểm duyệt thực đơn ngay trong hệ thống Admin
        </p>
      </div>

      {/* 2. Dải Bộ Lọc & Tìm Kiếm */}
      <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'ALL'
                ? 'bg-[#1E293B] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>Tất cả quán</span>
            <span className="px-1.5 py-0.5 rounded-md bg-gray-500/20 text-[10px]">
              {countAll}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('PENDING')}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'PENDING'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Chờ phê duyệt</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                countPending > 0
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-amber-200 text-amber-900'
              }`}
            >
              {countPending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('ACTIVE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
              filterStatus === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đang hoạt động</span>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-200 text-emerald-900 text-[10px]">
              {countActive}
            </span>
          </button>
        </div>

        {/* Ô Tìm kiếm */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên quán, địa chỉ, chủ quán..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]"
          />
        </div>
      </div>

      {/* 3. Bảng / Danh Sách Cửa Hàng */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStores.map((store) => {
          const isLoading = actionLoadingId === store.id;
          const productsCount = store._count?.products ?? store.products_count ?? 0;

          return (
            <div
              key={store.id}
              className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md ${
                !store.is_active ? 'border-amber-300 bg-amber-50/20' : 'border-orange-100'
              }`}
            >
              {/* Top Card: Logo, Tên, Trạng thái */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={store.logo_s3_url}
                      alt={store.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-gray-200 shadow-xs shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm line-clamp-1">
                        {store.name}
                      </h3>
                      <span className="inline-block text-[10px] font-bold text-[#FF5A1F] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/60 mt-0.5 line-clamp-1">
                        {store.category_tag || 'Chưa phân loại'}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {store.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 whitespace-nowrap shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse whitespace-nowrap shrink-0">
                        <Clock className="w-3 h-3 text-amber-700" /> Chờ duyệt
                      </span>
                    )}
                  </div>
                </div>

                {/* Mô tả */}
                {store.description && (
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {store.description}
                  </p>
                )}

                {/* Thông tin kiểm duyệt thực tế */}
                <div className="space-y-1.5 text-xs text-gray-600 pt-2 border-t border-gray-100">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{store.address}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span className="font-semibold text-gray-800 truncate">
                      Chủ quán: {store.owner?.full_name || 'Chủ quán'}
                    </span>
                  </div>

                  {store.owner?.email && (
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                      <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{store.owner.email}</span>
                    </div>
                  )}

                  {store.owner?.phone && (
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{store.owner.phone}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] pt-1 text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      Gửi hồ sơ: {new Date(store.created_at).toLocaleDateString('vi-VN')}
                    </span>
                    {store.is_active && (
                      <span className="flex items-center gap-1 font-bold text-gray-700">
                        <Utensils className="w-3.5 h-3.5 text-[#FF5A1F]" />
                        {productsCount} món
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                {!store.is_active ? (
                  <>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleToggleApproval(store, true)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isLoading ? 'Đang duyệt...' : '✅ Phê Duyệt Mở Quán'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleRejectStore(store)}
                      className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Từ Chối</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleToggleApproval(store, false)}
                      className="flex-1 py-2 px-3 rounded-xl bg-gray-100 hover:bg-rose-50 text-gray-600 hover:text-rose-600 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{isLoading ? 'Đang khóa...' : 'Tạm Khóa'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMenuModalStoreId(store.id)}
                      className="py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>📋 Quản lý thực đơn</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredStores.length === 0 && (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center text-gray-500 space-y-2">
          <Store className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="font-bold text-gray-800">Không tìm thấy cửa hàng nào</p>
          <p className="text-xs text-gray-400">
            Thử chuyển bộ lọc trạng thái hoặc tìm với từ khóa khác.
          </p>
        </div>
      )}

      {/* Modal Quản Lý Thực Đơn Dạng List Ngay Trong Admin */}
      {menuModalStoreId && (
        <AdminStoreMenuModal
          storeId={menuModalStoreId}
          onClose={() => setMenuModalStoreId(null)}
          onMenuChanged={onRefreshData}
        />
      )}
    </div>
  );
};

export default StoreApprovalTab;