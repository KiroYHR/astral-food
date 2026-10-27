import React from 'react';
import { Link } from 'react-router-dom';
import { Store, Sparkles, Image, BarChart3, Clock, ArrowLeft } from 'lucide-react';

export const MerchantPlaceholderPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-8 text-center">
      <div className="w-20 h-20 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
        <Store className="w-10 h-10" />
      </div>

      <div className="space-y-2 max-w-xl mx-auto">
        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
          Giai đoạn phát triển: Phase 3
        </span>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Cổng Quản Trị Cửa Hàng (Merchant Dashboard)
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
          Phân hệ dành riêng cho Chủ quán quản lý thực đơn, duyệt đơn hàng và phân tích doanh thu sẽ được tích hợp hoàn chỉnh tại <strong>Phase 3</strong>.
        </p>
      </div>

      {/* Feature Preview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left text-xs">
        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-amber-600 font-bold">
            <Sparkles className="w-4 h-4" />
            <span>AI Menu Copilot (Bedrock/Gemini)</span>
          </div>
          <p className="text-gray-500">Tự động sinh mô tả món ăn thơm ngon và bộ từ khóa SEO bằng trí tuệ nhân tạo.</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-orange-600 font-bold">
            <Image className="w-4 h-4" />
            <span>AWS S3 Presigned URL</span>
          </div>
          <p className="text-gray-500">Tải ảnh món ăn trực tiếp lên đám mây Amazon S3 với tốc độ cao và bảo mật.</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-blue-600 font-bold">
            <Clock className="w-4 h-4" />
            <span>Điều Phối Đơn Hàng Kanban</span>
          </div>
          <p className="text-gray-500">Chủ quán duyệt đơn và đổi trạng thái (Chờ nhận ➔ Đang nấu ➔ Giao hàng).</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-600 font-bold">
            <BarChart3 className="w-4 h-4" />
            <span>Báo Cáo Doanh Thu Recharts</span>
          </div>
          <p className="text-gray-500">Thống kê biểu đồ doanh thu 7 ngày và danh sách top món ăn bán chạy nhất.</p>
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

export default MerchantPlaceholderPage;