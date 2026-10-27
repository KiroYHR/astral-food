import React from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Store,
  Users,
  Server,
  Database,
  Cloud,
  Layers,
  Cpu,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import type { PlatformOverview } from '../../../types';

interface PlatformOverviewTabProps {
  overview: PlatformOverview | null;
  onNavigateToStores: () => void;
}

export const PlatformOverviewTab: React.FC<PlatformOverviewTabProps> = ({
  overview,
  onNavigateToStores,
}) => {
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const barColors = ['#FF5A1F', '#FB923C', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#64748B'];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Banner & Thông Báo Quán Chờ Duyệt */}
      <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#FF5A1F]" />
            Tổng Quan Nền Tảng & Giám Sát Toàn Sàn
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Theo dõi tổng lượng giao dịch GMV, đối tác nhà hàng, người dùng và sức khỏe dịch vụ AWS
          </p>
        </div>

        {overview && overview.pendingStoresCount > 0 && (
          <div className="flex items-center gap-3 p-2.5 px-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 animate-bounce" />
            <div className="text-xs">
              <span className="font-bold">Có {overview.pendingStoresCount} cửa hàng mới đang chờ duyệt!</span>
            </div>
            <button
              type="button"
              onClick={onNavigateToStores}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
            >
              Xem ngay
            </button>
          </div>
        )}
      </div>

      {/* 2. 4 Thẻ KPI Toàn Sàn */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1: Tổng GMV toàn sàn */}
        <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-100/50 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Tổng GMV Toàn Sàn
            </span>
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF5A1F] flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 tracking-tight">
            {overview ? formatVND(overview.totalGMV) : '...'}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+24.6% so với tháng trước</span>
          </div>
        </div>

        {/* KPI 2: Tổng đơn hàng & tỷ lệ hoàn tất */}
        <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100/50 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Tổng Đơn Hàng
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 tracking-tight">
            {overview ? `${overview.totalOrders} đơn` : '...'}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-600">
            <span>Tỷ lệ hoàn tất: {overview ? `${overview.completionRate}%` : '95%'}</span>
          </div>
        </div>

        {/* KPI 3: Cửa hàng đối tác */}
        <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-100/50 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Cửa Hàng Đối Tác
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900 tracking-tight">
              {overview ? overview.totalStores : '0'}
            </span>
            <span className="text-xs text-gray-500 font-bold">
              ({overview?.activeStoresCount} hoạt động)
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-amber-600">
            <span>{overview?.pendingStoresCount} quán đang chờ duyệt</span>
          </div>
        </div>

        {/* KPI 4: Người dùng hệ thống */}
        <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-100/50 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Tổng Người Dùng
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 tracking-tight">
            {overview ? `${overview.totalUsers.toLocaleString()} Users` : '...'}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-gray-500">
            <span>{overview?.customerCount} Khách • {overview?.merchantCount} Quán</span>
          </div>
        </div>
      </div>

      {/* 3. Biểu đồ Doanh Thu Từng Cửa Hàng & Phân Bổ Trạng Thái Đơn */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột Trái: BarChart Doanh Thu Giữa Các Cửa Hàng (8 cột) */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl border border-orange-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5A1F]" />
                So Sánh Doanh Số Giữa Các Cửa Hàng Đối Tác
              </h3>
              <span className="text-xs font-bold text-gray-400 uppercase">Đơn vị: Triệu VNĐ</span>
            </div>
            <p className="text-xs text-gray-500 mb-6">
              Xếp hạng doanh thu đóng góp trên toàn hệ thống AstralFood
            </p>
          </div>

          <div className="w-full min-h-[300px]">
            {overview && overview.storeComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={overview.storeComparison}
                  margin={{ top: 10, right: 10, left: 0, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="storeName"
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    tickFormatter={(val) => `${(val / 1000000).toFixed(0)}Tr`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-gray-900 text-white p-3 rounded-xl shadow-xl border border-gray-800 text-xs space-y-1">
                            <p className="font-bold text-orange-400">{item.storeName}</p>
                            <p>Doanh thu: <span className="font-bold text-white">{formatVND(item.revenue)}</span></p>
                            <p>Tổng đơn: <span className="font-bold text-amber-300">{item.ordersCount} đơn</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                    {overview.storeComparison.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                Đang tải dữ liệu biểu đồ đối tác...
              </div>
            )}
          </div>
        </div>

        {/* Cột Phải: Phân Bổ Trạng Thái Đơn Hàng (4 cột) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-orange-100 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-gray-900 mb-1 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              Trạng Thái Đơn Hàng
            </h3>
            <p className="text-xs text-gray-500 mb-6">Phân bổ luồng xử lý trên toàn sàn</p>
          </div>

          <div className="space-y-4">
            {overview &&
              overview.orderStatusDistribution.map((item) => (
                <div key={item.status} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-gray-700">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.label}
                    </span>
                    <span className="text-gray-900">
                      {item.count} đơn ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(4, item.percentage)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <span className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4" /> 95% đơn hàng được giao thành công
            </span>
          </div>
        </div>
      </div>

      {/* 4. Giám Sát Sức Khỏe Dịch Vụ AWS & Hoạt Động Gần Đây */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột Trái: Trạng Thái Dịch Vụ Cloud (7 cột) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-orange-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
                <Server className="w-5 h-5 text-emerald-600" />
                Giám Sát Sức Khỏe Hạ Tầng AWS Cloud
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Khu vực: <span className="font-mono font-bold text-gray-700">ap-southeast-1 (Singapore)</span>
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              100% HEALTHY
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Dịch vụ 1: Core API Node.js */}
            <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Core RESTful API</h4>
                  <span className="text-[10px] text-gray-400">Node.js Express / Port 5000</span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-600">● 99.98%</span>
            </div>

            {/* Dịch vụ 2: RDS PostgreSQL */}
            <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Amazon RDS (PostgreSQL)</h4>
                  <span className="text-[10px] text-gray-400">db.t4g.micro (Multi-AZ)</span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-600">● Healthy</span>
            </div>

            {/* Dịch vụ 3: S3 Media & Invoices */}
            <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-100 text-[#FF5A1F] flex items-center justify-center font-bold">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Amazon S3 Storage</h4>
                  <span className="text-[10px] text-gray-400">Media & Presigned URLs</span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-600">● Active</span>
            </div>

            {/* Dịch vụ 4: SQS Message Queue */}
            <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Amazon SQS Queue</h4>
                  <span className="text-[10px] text-gray-400">Order Events / 0 Delays</span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-600">● 0 Lag</span>
            </div>

            {/* Dịch vụ 5: Lambda Workers */}
            <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 sm:col-span-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">AWS Lambda Workers</h4>
                  <span className="text-[10px] text-gray-400">Serverless PDF Invoices & Email Notification Workers</span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-600">● Auto-Scale Ready</span>
            </div>
          </div>
        </div>

        {/* Cột Phải: Nhật Ký Hoạt Động Gần Đây (5 cột) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-orange-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              Nhật Ký Sự Kiện Gần Đây
            </h3>
            <span className="text-xs text-gray-400">Thời gian thực</span>
          </div>

          <div className="space-y-3.5">
            {overview &&
              overview.recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-gray-50/70 border border-gray-100/80 space-y-1 hover:bg-orange-50/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">{act.title}</span>
                    <span className="text-[10px] font-semibold text-gray-400">{act.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">{act.description}</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformOverviewTab;