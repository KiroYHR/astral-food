import React from 'react';
import { Flame, Phone, Mail, MapPin, ShieldCheck, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-[#F1EFE9] text-gray-600 mt-20">
      {/* Upper Features Bar */}
      <div className="border-b border-gray-100 py-8 bg-[#FFFDF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF5A1F] flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 fill-[#FF5A1F]" />
            </div>
            <div>
              <h5 className="font-bold text-gray-900">Giao Nhanh 20-30 Phút</h5>
              <p className="text-gray-500">Món ăn luôn nóng hổi, chuẩn vị tận tay</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-gray-900">100% Vệ Sinh An Toàn</h5>
              <p className="text-gray-500">Cửa hàng tuyển chọn kỹ lưỡng</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-gray-900">Hỗ Trợ 24/7</h5>
              <p className="text-gray-500">Hotline tư vấn & xử lý đơn: 1900 8888</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 fill-rose-500" />
            </div>
            <div>
              <h5 className="font-bold text-gray-900">Ưu Đãi Mỗi Ngày</h5>
              <p className="text-gray-500">Mã giảm giá, freeship ngập tràn</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
        {/* Brand Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-coral-gradient flex items-center justify-center text-white shadow-xs">
              <Flame className="w-5 h-5 fill-white" />
            </div>
            <span className="text-xl font-black text-coral-gradient">AstralFood</span>
          </div>
          <p className="text-gray-500 leading-relaxed">
            Nền tảng đặt đồ ăn và ẩm thực trực tuyến đa kênh hàng đầu. Kết nối hàng triệu thực khách với những quán ăn ngon chuẩn vị truyền thống và hiện đại.
          </p>
          <div className="space-y-2 text-gray-500">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span>268 Lý Thường Kiệt, Quận 10, TP. Hồ Chí Minh</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              <span>hotro@astralfood.vn</span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-3 text-[11px]">
            Danh mục khám phá
          </h4>
          <ul className="space-y-2">
            <li><Link to="/" className="hover:text-[#FF5A1F] transition-colors">Cơm Tấm Sài Gòn</Link></li>
            <li><Link to="/" className="hover:text-[#FF5A1F] transition-colors">Trà Sữa & Đồ Uống</Link></li>
            <li><Link to="/" className="hover:text-[#FF5A1F] transition-colors">Phở Bò & Món Nước</Link></li>
            <li><Link to="/" className="hover:text-[#FF5A1F] transition-colors">Gà Rán & Burger</Link></li>
            <li><Link to="/" className="hover:text-[#FF5A1F] transition-colors">Bún Đậu Mắm Tôm</Link></li>
          </ul>
        </div>

        {/* For Partners */}
        <div>
          <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-3 text-[11px]">
            Hợp tác & Đối tác
          </h4>
          <ul className="space-y-2">
            <li><Link to="/register" className="hover:text-[#FF5A1F] transition-colors font-semibold text-orange-600">Đăng ký mở quán trên AstralFood</Link></li>
            <li><Link to="/merchant" className="hover:text-[#FF5A1F] transition-colors">Cổng Quản trị Quán (Merchant Dashboard)</Link></li>
            <li><Link to="/my-orders" className="hover:text-[#FF5A1F] transition-colors">Theo dõi tiến trình đơn hàng</Link></li>
            <li><Link to="/profile" className="hover:text-[#FF5A1F] transition-colors">Thông tin tài khoản khách hàng</Link></li>
          </ul>
        </div>

        {/* Policies & Apps */}
        <div>
          <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-3 text-[11px]">
            Chính sách & Pháp lý
          </h4>
          <ul className="space-y-2 text-gray-500">
            <li><span>Điều khoản dịch vụ AstralFood</span></li>
            <li><span>Chính sách bảo mật thanh toán</span></li>
            <li><span>Quy chuẩn an toàn thực phẩm</span></li>
            <li><span>Hóa đơn điện tử VAT trực tuyến</span></li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="border-t border-gray-100 py-4 bg-gray-50 text-center text-[11px] text-gray-400">
        <p>© 2026 AstralFood Inc. Toàn bộ quyền được bảo lưu. Thiết kế & phát triển bởi Nhóm Dự Án AstralFood.</p>
      </div>
    </footer>
  );
};