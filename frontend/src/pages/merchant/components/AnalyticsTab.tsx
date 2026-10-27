import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  Star,
  Award,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import type { Store, Order, StoreAnalytics } from '../../../types';
import { orderService } from '../../../api/services';

interface AnalyticsTabProps {
  store: Store;
  orders: Order[];
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ store, orders }) => {
  const [period, setPeriod] = useState<'7days' | '30days' | 'month'>('7days');
  const [analytics, setAnalytics] = useState<StoreAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    orderService
      .getStoreAnalytics(store.id, period)
      .then((data) => {
        if (isMounted) {
          setAnalytics(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Lỗi khi tải analytics:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [store.id, period, orders]);

  // Đếm đơn cần xử lý ngay (PENDING + PREPARING)
  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING').length;
  const preparingOrdersCount = orders.filter((o) => o.status === 'PREPARING').length;
  const urgentOrdersCount = pendingOrdersCount + preparingOrdersCount;

  // Format tiền tệ VNĐ
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Màu sắc cho Top món bán chạy
  const barColors = ['#FF5A1F', '#FB923C', '#F59E0B', '#10B981', '#6366F1'];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header & Bộ lọc thời gian */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-orange-100 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#FF5A1F]" />
            Báo Cáo Hiệu Quả Kinh Doanh & Doanh Thu
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Dữ liệu tổng hợp thời gian thực từ cơ sở dữ liệu PostgreSQL & Amazon RDS
          </p>
        </div>

        {/* Bộ lọc thời gian */}
        <div className="inline-flex items-center p-1.5 bg-orange-50/60 rounded-xl border border-orange-100 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setPeriod('7days')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              period === '7days'
                ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            7 ngày qua
          </button>
          <button
            type="button"
            onClick={() => setPeriod('30days')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              period === '30days'
                ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            30 ngày qua
          </button>
          <button
            type="button"
            onClick={() => setPeriod('month')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              period === 'month'
                ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Theo tháng
          </button>
        </div>
      </div>

      {/* 2. 4 Thẻ KPI Nổi Bật */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* KPI 1: Tổng doanh thu */}
        <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-100/50 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Tổng Doanh Thu
            </span>
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF5A1F] flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 tracking-tight">
            {analytics ? formatVND(analytics.totalRevenue) : '...'}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+18.4% so với chu kỳ trước</span>
          </div>
        </div>

        {/* KPI 2: Tổng đơn hàng */}
        <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-100/50 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Tổng Số Đơn Hàng
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 tracking-tight">
            {analytics ? `${analytics.totalOrders} đơn` : '...'}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-gray-500">
            <span>TB {analytics ? formatVND(analytics.averageOrderValue) : '0'}/đơn</span>
          </div>
        </div>

        {/* KPI 3: Đơn cần xử lý ngay */}
        <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-100/50 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Đơn Cần Xử Lý Ngay
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-900 tracking-tight">
              {urgentOrdersCount}
            </span>
            <span className="text-xs text-gray-500 font-semibold">
              ({pendingOrdersCount} chờ nhận, {preparingOrdersCount} đang nấu)
            </span>
          </div>
          {urgentOrdersCount > 0 ? (
            <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-rose-600 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Cần xác nhận & giao hàng gấp!</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-600">
              <span>Đã xử lý xong toàn bộ đơn mới</span>
            </div>
          )}
        </div>

        {/* KPI 4: Điểm đánh giá trung bình */}
        <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-100/50 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Đánh Giá Trung Bình
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-500 flex items-center justify-center">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-1.5">
            <span>{store.rating || 4.8}</span>
            <span className="text-sm text-gray-400 font-normal">/ 5.0</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-gray-500">
            <span>Dựa trên 256 lượt đánh giá 5 sao</span>
          </div>
        </div>
      </div>

      {/* 3. Biểu đồ 1: AreaChart Recharts - Xu hướng Doanh Thu */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-orange-100 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5A1F]" />
              Xu Hướng Doanh Thu & Lượng Đơn Đặt Hàng
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Phân tích biến động doanh thu theo chu kỳ thời gian (Cam San Hô #FF5A1F Solar Starburst)
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-gray-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#FF5A1F]" />
              <span>Doanh thu (VNĐ)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span>Số lượng đơn</span>
            </div>
          </div>
        </div>

        {/* Khung Biểu Đồ Recharts */}
        <div className="w-full h-80">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : analytics && analytics.revenueChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart
                data={analytics.revenueChart}
                margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="coralRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF5A1F" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#FF5A1F" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(1)}Tr`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-gray-900/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-xl border border-gray-800 text-xs space-y-1">
                          <p className="font-bold text-orange-400 border-b border-gray-700 pb-1">
                            {label}
                          </p>
                          <p className="flex justify-between gap-4 text-gray-300">
                            <span>Doanh thu:</span>
                            <span className="font-bold text-white">
                              {formatVND(data.revenue)}
                            </span>
                          </p>
                          <p className="flex justify-between gap-4 text-gray-300">
                            <span>Số lượng đơn:</span>
                            <span className="font-bold text-amber-300">
                              {data.ordersCount} đơn
                            </span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#FF5A1F"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#coralRevGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
              Chưa có dữ liệu thống kê cho khoảng thời gian này.
            </div>
          )}
        </div>
      </div>

      {/* 4. Biểu đồ 2 & Danh sách Top Món Bán Chạy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột Trái: BarChart Thống kê Doanh số Top món (5 cột) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-orange-100 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 mb-1">
              <Award className="w-5 h-5 text-amber-500" />
              Doanh Số Top Món Bán Chạy
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Số lượng phần ăn đã bán ra theo từng món
            </p>
          </div>

          <div className="w-full min-h-[260px]">
            {analytics && analytics.topSellingProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={analytics.topSellingProducts}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis
                    type="category"
                    dataKey="productName"
                    tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                    width={110}
                    tickFormatter={(val) =>
                      val.length > 14 ? `${val.substring(0, 14)}...` : val
                    }
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-gray-900 text-white p-2.5 rounded-lg shadow-lg text-xs space-y-1">
                            <p className="font-bold text-amber-400">{item.productName}</p>
                            <p>Đã bán: <span className="font-bold">{item.quantitySold} phần</span></p>
                            <p>Doanh thu: <span className="font-bold text-orange-400">{formatVND(item.totalRevenue)}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="quantitySold" radius={[0, 8, 8, 0]}>
                    {analytics.topSellingProducts.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={barColors[index % barColors.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                Chưa có dữ liệu món bán chạy
              </div>
            )}
          </div>
        </div>

        {/* Cột Phải: Danh sách chi tiết Top 5 món ăn (7 cột) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-orange-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#FF5A1F]" />
                Bảng Xếp Hạng 5 Món Hút Khách Nhất
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Các món mang lại doanh thu cao nhất cho quán
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {analytics && analytics.topSellingProducts.length > 0 ? (
              analytics.topSellingProducts.map((prod, idx) => (
                <div
                  key={prod.productId}
                  className="flex items-center justify-between p-3 rounded-xl bg-orange-50/40 hover:bg-orange-50/80 transition-colors border border-orange-100/60"
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Badge */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                        idx === 0
                          ? 'bg-amber-400 text-white shadow-xs'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-800'
                          : idx === 2
                          ? 'bg-amber-700/60 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      #{idx + 1}
                    </div>

                    {/* Thumbnail */}
                    <img
                      src={prod.image_s3_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'}
                      alt={prod.productName}
                      className="w-12 h-12 rounded-xl object-cover border border-gray-200"
                    />

                    {/* Info */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 line-clamp-1">
                        {prod.productName}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Đã bán: <span className="font-bold text-gray-800">{prod.quantitySold} suất</span>
                      </p>
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="text-right">
                    <div className="text-sm font-black text-[#FF5A1F]">
                      {formatVND(prod.totalRevenue)}
                    </div>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">
                      Doanh thu mang về
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                Chưa có dữ liệu món bán chạy
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;