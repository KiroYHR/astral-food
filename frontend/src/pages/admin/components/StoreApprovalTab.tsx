import React, { useState } from 'react';
import {
  Store,
  CheckCircle2,
  Lock,
  Eye,
  Plus,
  Search,
  MapPin,
  Clock,
  Star,
  Check,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { Store as StoreType } from '../../../types';
import { adminService } from '../../../api/services';
import QuickStoreModal from './QuickStoreModal';

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
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
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
      toast.error(err.message || 'Lỗi khi cập nhật trạng thái quán');
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
      (s.category_tag && s.category_tag.toLowerCase().includes(query));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header & Nút Tạo Quán Test */}
      <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <Store className="w-6 h-6 text-[#FF5A1F]" />
            Thẩm Định & Phê Duyệt Cửa Hàng Đối Tác
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Kiểm tra hồ sơ an toàn thực phẩm, phê duyệt mở bán trên hệ thống hoặc tạm khóa cửa hàng vi phạm
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsQuickModalOpen(true)}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-rose-500 text-white font-black text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Đăng Ký Thử Quán Mới (Chờ Duyệt)</span>
        </button>
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
            placeholder="Tìm theo tên quán, địa chỉ..."
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
                  <div className="flex items-center gap-3">
                    <img
                      src={store.logo_s3_url}
                      alt={store.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-gray-200 shadow-xs shrink-0"
                    />
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm line-clamp-1">
                        {store.name}
                      </h3>
                      <span className="inline-block text-[10px] font-bold text-[#FF5A1F] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/60 mt-0.5">
                        {store.category_tag || 'Ẩm thực'}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {store.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                        <Clock className="w-3 h-3 text-amber-700" /> Chờ duyệt
                      </span>
                    )}
                  </div>
                </div>

                {/* Mô tả & Thông tin địa chỉ */}
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                  {store.description}
                </p>

                <div className="space-y-1.5 text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{store.address}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3 h-3 fill-amber-500" /> {store.rating || 4.8} / 5.0
                    </span>
                    <span className="text-gray-400">
                      Giao: {store.delivery_time || '20-30 phút'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Phê duyệt / Tạm khóa */}
              <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                {!store.is_active ? (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleToggleApproval(store, true)}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isLoading ? 'Đang duyệt...' : '✅ Phê Duyệt Mở Quán'}</span>
                  </button>
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
                    <Link
                      to={`/stores/${store.id}`}
                      target="_blank"
                      className="py-2 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF5A1F] border border-orange-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem Quán</span>
                    </Link>
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

      {/* Modal Đăng Ký Thử Quán Mới */}
      {isQuickModalOpen && (
        <QuickStoreModal
          onClose={() => setIsQuickModalOpen(false)}
          onSuccess={onRefreshData}
        />
      )}
    </div>
  );
};

export default StoreApprovalTab;