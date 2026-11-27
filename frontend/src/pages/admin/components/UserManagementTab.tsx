import React, { useState } from 'react';
import {
  Users,
  Search,
  Shield,
  ChefHat,
  UserCheck,
  Calendar,
  Phone,
  Mail,
  Eye,
  Trash2,
  X,
  Send,
  Store as StoreIcon,
  ShoppingBag,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { User, UserRole, AdminUserDetail, SesVerificationStatus } from '../../../types';
import { adminService } from '../../../api/services';
import { useAuthStore } from '../../../store/useAuthStore';

interface UserManagementTabProps {
  users: User[];
  onRefreshData: () => void;
}

export const UserManagementTab: React.FC<UserManagementTabProps> = ({
  users,
  onRefreshData,
}) => {
  const { user: currentUser } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<'ALL' | UserRole>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal chi tiết người dùng
  const [detailUser, setDetailUser] = useState<AdminUserDetail | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const [isSendingSes, setIsSendingSes] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Lọc dữ liệu người dùng
  const filteredUsers = users.filter((u) => {
    const matchesRole = selectedRole === 'ALL' || u.role === selectedRole;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      query === '' ||
      u.full_name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.phone.includes(query);

    return matchesRole && matchesSearch;
  });

  const handleOpenDetail = async (userId: string) => {
    setLoadingDetailId(userId);
    try {
      const detail = await adminService.getUserDetail(userId);
      setDetailUser(detail);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Không thể tải chi tiết người dùng');
    } finally {
      setLoadingDetailId(null);
    }
  };

  const handleVerifySes = async () => {
    if (!detailUser) return;
    setIsSendingSes(true);
    try {
      const res = await adminService.verifyUserSesEmail(detailUser.id);
      setDetailUser((prev) =>
        prev
          ? {
              ...prev,
              ses_verification: res.ses_verification,
            }
          : null
      );
      toast.success(res.message || 'Đã gửi email xác minh AWS SES!');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Không thể gửi email xác minh SES');
    } finally {
      setIsSendingSes(false);
    }
  };

  const handleDeleteUser = async (target: User) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn XÓA tài khoản "${target.full_name}" (${target.email}) không?`
      )
    ) {
      return;
    }

    setDeletingUserId(target.id);
    try {
      const res = await adminService.deleteUser(target.id);
      toast.success(res.message || 'Đã xóa người dùng khỏi hệ thống.');
      if (detailUser?.id === target.id) {
        setDetailUser(null);
      }
      onRefreshData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Không thể xóa người dùng');
    } finally {
      setDeletingUserId(null);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200 whitespace-nowrap">
            <Shield className="w-3 h-3 text-purple-600" /> QUẢN TRỊ VIÊN
          </span>
        );
      case 'MERCHANT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-orange-100 text-[#FF5A1F] border border-orange-200 whitespace-nowrap">
            <ChefHat className="w-3 h-3 text-[#FF5A1F]" /> ĐỐI TÁC QUÁN
          </span>
        );
      case 'CUSTOMER':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 whitespace-nowrap">
            <UserCheck className="w-3 h-3 text-blue-600" /> KHÁCH HÀNG
          </span>
        );
    }
  };

  const getAvatarColor = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-600 text-white';
      case 'MERCHANT':
        return 'bg-[#FF5A1F] text-white';
      case 'CUSTOMER':
      default:
        return 'bg-blue-600 text-white';
    }
  };

  const renderSesBadge = (status?: SesVerificationStatus) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã xác minh SES (VERIFIED)
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Đang chờ bấm link email (PENDING)
          </span>
        );
      case 'SIMULATED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> SIMULATED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" /> Chưa xác minh ({status || 'UNVERIFIED'})
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header & Chỉ tiêu tài khoản */}
      <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#FF5A1F]" />
            Quản Lý Danh Sách Người Dùng & Phân Quyền
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Kiểm tra chi tiết hồ sơ, trạng thái xác minh AWS SES Sandbox và quản lý tài khoản trên hệ thống
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-black self-start md:self-auto">
          <Users className="w-4 h-4 text-purple-600" />
          <span>Tổng cộng: {users.length} tài khoản</span>
        </div>
      </div>

      {/* 2. Bộ Lọc Vai Trò & Ô Tìm Kiếm */}
      <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedRole('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedRole === 'ALL'
                ? 'bg-[#1E293B] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tất cả ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('CUSTOMER')}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedRole === 'CUSTOMER'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            Khách hàng ({users.filter((u) => u.role === 'CUSTOMER').length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('MERCHANT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedRole === 'MERCHANT'
                ? 'bg-[#FF5A1F] text-white shadow-xs'
                : 'bg-orange-50 text-[#FF5A1F] hover:bg-orange-100'
            }`}
          >
            Chủ quán ({users.filter((u) => u.role === 'MERCHANT').length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('ADMIN')}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedRole === 'ADMIN'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            Quản trị ({users.filter((u) => u.role === 'ADMIN').length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, email, SĐT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]"
          />
        </div>
      </div>

      {/* 3. Bảng Danh Sách Người Dùng */}
      <div className="bg-white rounded-2xl border border-orange-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Người Dùng</th>
                <th className="py-3.5 px-4">Liên Hệ</th>
                <th className="py-3.5 px-4">Vai Trò & Hoạt Động</th>
                <th className="py-3.5 px-4">Ngày Tham Gia</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredUsers.map((user) => {
                const ordersCount = user.orders_count ?? user._count?.orders ?? 0;
                const storesCount = user.stores_count ?? user._count?.stores ?? 0;
                const canDelete = user.role !== 'ADMIN' && user.id !== currentUser?.id;

                return (
                  <tr key={user.id} className="hover:bg-orange-50/30 transition-colors">
                    {/* Avatar & Name */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${getAvatarColor(
                            user.role
                          )}`}
                        >
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm">
                            {user.full_name}
                          </div>
                          <span className="font-mono text-[10px] text-gray-400">
                            ID: {user.id.slice(-8)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="py-4 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{user.phone || 'Chưa cập nhật'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role & Activity */}
                    <td className="py-4 px-4 space-y-1.5">
                      <div>{getRoleBadge(user.role)}</div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3 text-gray-400" />
                          {ordersCount} đơn
                        </span>
                        {(user.role === 'MERCHANT' || storesCount > 0) && (
                          <span className="inline-flex items-center gap-1 text-[#FF5A1F] font-semibold">
                            <StoreIcon className="w-3 h-3" />
                            {storesCount} quán
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Registered Date */}
                    <td className="py-4 px-4 text-gray-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{new Date(user.created_at).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          disabled={loadingDetailId === user.id}
                          onClick={() => handleOpenDetail(user.id)}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{loadingDetailId === user.id ? 'Đang tải...' : 'Chi tiết'}</span>
                        </button>

                        {canDelete && (
                          <button
                            type="button"
                            disabled={deletingUserId === user.id}
                            onClick={() => handleDeleteUser(user)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                            title="Xóa tài khoản test/spam"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{deletingUserId === user.id ? 'Đang xóa...' : 'Xóa'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="p-12 text-center text-gray-500 space-y-2">
            <Users className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="font-bold text-gray-800">Không tìm thấy người dùng phù hợp</p>
          </div>
        )}
      </div>

      {/* Modal Chi Tiết Người Dùng & AWS SES */}
      {detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-purple-100">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-700 to-indigo-700 text-white flex items-center justify-between gap-4 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base ${getAvatarColor(
                    detailUser.role
                  )} border border-white/25`}
                >
                  {detailUser.full_name ? detailUser.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="font-black text-base">{detailUser.full_name}</h3>
                  <p className="text-[11px] text-purple-100">{detailUser.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailUser(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-[#FFFDF9] border border-orange-100">
                <div>
                  <span className="text-gray-400 block text-[11px]">Vai trò</span>
                  <div className="mt-1">{getRoleBadge(detailUser.role)}</div>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Số điện thoại</span>
                  <span className="font-bold text-gray-900 mt-1 block">
                    {detailUser.phone || 'Chưa cập nhật'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Ngày tạo tài khoản</span>
                  <span className="font-bold text-gray-900 mt-1 block">
                    {new Date(detailUser.created_at).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Tổng đơn & Chi tiêu (COMPLETED)</span>
                  <span className="font-black text-[#FF5A1F] mt-1 block">
                    {detailUser.orders_count ?? detailUser._count?.orders ?? 0} đơn •{' '}
                    {Number(detailUser.total_spent || 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              {/* AWS SES Email Verification */}
              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-black text-gray-900 text-xs uppercase tracking-wider">
                    Trạng thái xác minh AWS SES Sandbox
                  </span>
                  {renderSesBadge(detailUser.ses_verification?.status)}
                </div>

                {detailUser.ses_verification?.message && (
                  <p className="text-gray-600 leading-relaxed">
                    {detailUser.ses_verification.message}
                  </p>
                )}

                {detailUser.ses_verification?.status !== 'VERIFIED' && (
                  <button
                    type="button"
                    disabled={isSendingSes}
                    onClick={handleVerifySes}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {isSendingSes ? 'Đang gửi email SES...' : 'Gửi lại email xác minh SES'}
                    </span>
                  </button>
                )}
              </div>

              {/* Owned Stores for MERCHANT */}
              {detailUser.stores && detailUser.stores.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="font-black text-gray-900 flex items-center gap-1.5">
                    <StoreIcon className="w-4 h-4 text-[#FF5A1F]" />
                    <span>Cửa hàng sở hữu ({detailUser.stores.length})</span>
                  </h4>
                  <div className="space-y-2">
                    {detailUser.stores.map((st) => (
                      <div
                        key={st.id}
                        className="p-3 rounded-xl border border-gray-200 bg-white flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 truncate">{st.name}</div>
                          <div className="text-[11px] text-gray-500 truncate">{st.address}</div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                            st.is_active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {st.is_active ? 'Đang mở bán' : 'Chờ duyệt'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                {detailUser.role !== 'ADMIN' && detailUser.id !== currentUser?.id ? (
                  <button
                    type="button"
                    disabled={deletingUserId === detailUser.id}
                    onClick={() => handleDeleteUser(detailUser)}
                    className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa người dùng</span>
                  </button>
                ) : (
                  <span />
                )}

                <button
                  type="button"
                  onClick={() => setDetailUser(null)}
                  className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementTab;