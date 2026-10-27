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
  UserPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { User, UserRole } from '../../../types';

interface UserManagementTabProps {
  users: User[];
  onRefreshData: () => void;
}

export const UserManagementTab: React.FC<UserManagementTabProps> = ({ users }) => {
  const [selectedRole, setSelectedRole] = useState<'ALL' | UserRole>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

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

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">
            <Shield className="w-3 h-3 text-purple-600" /> QUẢN TRỊ VIÊN
          </span>
        );
      case 'MERCHANT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-orange-100 text-[#FF5A1F] border border-orange-200">
            <ChefHat className="w-3 h-3 text-[#FF5A1F]" /> ĐỐI TÁC QUÁN
          </span>
        );
      case 'CUSTOMER':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header & Nút Thêm User */}
      <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#FF5A1F]" />
            Quản Lý Danh Sách Người Dùng & Phân Quyền
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Quản lý tài khoản khách hàng, chủ nhà hàng và phân quyền quản trị viên hệ thống
          </p>
        </div>

        <button
          type="button"
          onClick={() => toast('Tính năng thêm tài khoản mới qua form đăng ký /register', { icon: 'ℹ️' })}
          className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Thêm Người Dùng Mới</span>
        </button>
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
                <th className="py-3.5 px-4">Vai Trò (Role)</th>
                <th className="py-3.5 px-4">Ngày Tham Gia</th>
                <th className="py-3.5 px-4 text-right">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredUsers.map((user) => (
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
                          ID: {user.id}
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

                  {/* Role Badge */}
                  <td className="py-4 px-4">{getRoleBadge(user.role)}</td>

                  {/* Registered Date */}
                  <td className="py-4 px-4 text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{new Date(user.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      ● Hoạt động
                    </span>
                  </td>
                </tr>
              ))}
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
    </div>
  );
};

export default UserManagementTab;