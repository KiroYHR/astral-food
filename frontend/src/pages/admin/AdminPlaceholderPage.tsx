import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Store, ArrowLeft } from 'lucide-react';

export const AdminPlaceholderPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-8 text-center">
      <div className="w-20 h-20 rounded-3xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-purple-500/20">
        <Shield className="w-10 h-10" />
      </div>

      <div className="space-y-2 max-w-xl mx-auto">
        <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold uppercase tracking-wider">
          Giai đoạn phát triển: Phase 4
        </span>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Cổng Quản Trị Hệ Thống (System Admin)
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
          Phân hệ dành cho Quản trị viên quản lý danh sách người dùng và kiểm duyệt đối tác mở quán trên toàn hệ thống AstralFood.
        </p>
      </div>

      {/* Feature Preview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto text-left text-xs">
        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-purple-600 font-bold">
            <Store className="w-4 h-4" />
            <span>Phê Duyệt Mở Quán Ăn</span>
          </div>
          <p className="text-gray-500">Kiểm tra thông tin an toàn vệ sinh và kích hoạt trạng thái (is_active: true).</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-blue-600 font-bold">
            <Users className="w-4 h-4" />
            <span>Quản Lý Người Dùng Toàn Sàn</span>
          </div>
          <p className="text-gray-500">Tra cứu danh sách tài khoản Khách hàng và Chủ quán trên cơ sở dữ liệu RDS.</p>
        </div>
      </div>

      <div className="pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-coral-gradient text-white font-bold text-xs shadow-md shadow-orange-500/20"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Cổng Khách Hàng (Customer Portal)</span>
        </Link>
      </div>
    </div>
  );
};

export default AdminPlaceholderPage;