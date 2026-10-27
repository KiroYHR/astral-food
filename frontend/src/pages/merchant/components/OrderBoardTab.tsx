import React, { useState } from 'react';
import {
  Clock,
  ChefHat,
  Bike,
  CheckCircle2,
  XCircle,
  FileText,
  MapPin,
  Phone,
  User,
  ShoppingBag,
  AlertCircle,
  Columns,
  List,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Order, OrderStatus } from '../../../types';
import { orderService } from '../../../api/services';
import { InvoiceModal } from '../../../components/InvoiceModal';

interface OrderBoardTabProps {
  storeId: string;
  orders: Order[];
  onOrderUpdated: () => void;
}

export const OrderBoardTab: React.FC<OrderBoardTabProps> = ({
  storeId: _storeId,
  orders,
  onOrderUpdated,
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Cập nhật trạng thái đơn hàng
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setUpdatingOrderId(orderId);
      await orderService.updateOrderStatus(orderId, newStatus);

      let successMsg = 'Đã cập nhật trạng thái đơn!';
      if (newStatus === 'PREPARING') successMsg = '✅ Đã tiếp nhận đơn hàng! Bếp đang chuẩn bị món ăn.';
      if (newStatus === 'DELIVERING') successMsg = '🛵 Đã bàn giao đơn hàng cho Shipper vận chuyển!';
      if (newStatus === 'COMPLETED') successMsg = '🎉 Hoàn tất đơn hàng! Hóa đơn điện tử VAT đã xuất tự động.';
      if (newStatus === 'CANCELLED') successMsg = '❌ Đã hủy đơn hàng thành công.';

      toast.success(successMsg);
      onOrderUpdated();
    } catch (err: any) {
      toast.error(err.message || 'Không thể cập nhật trạng thái đơn hàng');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Đếm số lượng theo trạng thái
  const counts = {
    ALL: orders.length,
    PENDING: orders.filter((o) => o.status === 'PENDING').length,
    PREPARING: orders.filter((o) => o.status === 'PREPARING').length,
    DELIVERING: orders.filter((o) => o.status === 'DELIVERING').length,
    COMPLETED: orders.filter((o) => o.status === 'COMPLETED').length,
    CANCELLED: orders.filter((o) => o.status === 'CANCELLED').length,
  };

  // Lọc danh sách theo filter
  const filteredOrders =
    activeFilter === 'ALL'
      ? orders
      : orders.filter((o) => o.status === activeFilter);

  // Render 1 Order Card
  const renderOrderCard = (order: Order) => {
    const isUpdating = updatingOrderId === order.id;

    return (
      <div
        key={order.id}
        className="bg-white rounded-2xl p-5 border border-orange-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
      >
        {/* Header Card */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-sm text-gray-900">
                  #{order.id.slice(-6).toUpperCase()}
                </span>
                {order.status === 'PENDING' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 animate-pulse">
                    Mới đặt
                  </span>
                )}
              </div>
              <span className="text-[11px] text-gray-400">
                {new Date(order.created_at).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                -{' '}
                {new Date(order.created_at).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                })}
              </span>
            </div>

            {/* Trạng thái hiện tại */}
            <div>
              {order.status === 'PENDING' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  <Clock className="w-3.5 h-3.5" /> Chờ xác nhận
                </span>
              )}
              {order.status === 'PREPARING' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-[#FF5A1F]">
                  <ChefHat className="w-3.5 h-3.5" /> Đang chế biến
                </span>
              )}
              {order.status === 'DELIVERING' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                  <Bike className="w-3.5 h-3.5" /> Đang giao hàng
                </span>
              )}
              {order.status === 'COMPLETED' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn tất
                </span>
              )}
              {order.status === 'CANCELLED' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                  <XCircle className="w-3.5 h-3.5" /> Đã hủy
                </span>
              )}
            </div>
          </div>

          {/* Thông tin khách hàng */}
          <div className="py-3 text-xs space-y-1.5 text-gray-600 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="font-bold text-gray-900">
                {order.customer_name || 'Khách vãng lai'}
              </span>
              {order.customer_phone && (
                <span className="text-gray-400 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {order.customer_phone}
                </span>
              )}
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
              <span className="line-clamp-2 text-gray-700">
                {order.delivery_address}
              </span>
            </div>
            {order.note && (
              <div className="mt-2 p-2 bg-amber-50/80 rounded-lg text-amber-900 border border-amber-200/60 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span className="italic font-medium">Lưu ý: {order.note}</span>
              </div>
            )}
          </div>

          {/* Danh sách món ăn trong đơn */}
          <div className="py-3 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <ShoppingBag className="w-3 h-3" /> Món Ăn ({order.items?.length || 0})
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {order.items?.map((it, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-gray-50/70"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#FF5A1F] w-4 text-center">
                      {it.quantity}x
                    </span>
                    <span className="font-medium text-gray-800 line-clamp-1">
                      {it.product_name}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-600">
                    {formatVND(it.unit_price * it.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Tổng tiền & giảm giá */}
            <div className="pt-2 flex items-baseline justify-between text-xs">
              <span className="text-gray-500 font-medium">Tổng hóa đơn:</span>
              <div className="text-right">
                <span className="text-base font-black text-[#FF5A1F]">
                  {formatVND(order.total_amount)}
                </span>
                {order.discount_amount ? (
                  <div className="text-[10px] text-emerald-600 font-semibold">
                    Đã áp mã voucher: -{formatVND(order.discount_amount)}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Nút Hành Động Theo Trạng Thái */}
        <div className="pt-2 border-t border-gray-100">
          {order.status === 'PENDING' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-bold text-xs shadow-xs hover:opacity-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                Nhận & Nấu Món
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                className="py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-rose-50 text-gray-600 hover:text-rose-600 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Từ Chối Đơn
              </button>
            </div>
          )}

          {order.status === 'PREPARING' && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleUpdateStatus(order.id, 'DELIVERING')}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Bike className="w-4 h-4" />
              Giao Cho Shipper
            </button>
          )}

          {order.status === 'DELIVERING' && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Hoàn Tất Đơn Hàng
            </button>
          )}

          {order.status === 'COMPLETED' && (
            <button
              type="button"
              onClick={() => setSelectedInvoiceOrder(order)}
              className="w-full py-2.5 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF5A1F] font-bold text-xs border border-orange-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Xem Hóa Đơn VAT S3
            </button>
          )}

          {order.status === 'CANCELLED' && (
            <div className="text-center py-1.5 text-xs text-gray-400 italic">
              Đơn hàng này đã bị hủy
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header & Điều Khiển View */}
      <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-[#FF5A1F]" />
            Bảng Điều Phối Đơn Hàng Trực Tuyến
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Đồng bộ thời gian thực với ứng dụng Khách hàng qua WebSocket & SQS Queue
          </p>
        </div>

        {/* View mode toggle (Kanban vs List) */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="inline-flex p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Columns className="w-4 h-4" /> Bảng Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" /> Dạng Danh Sách
            </button>
          </div>
        </div>
      </div>

      {/* 2. Status Filter Tabs with Live Counters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveFilter('ALL')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
            activeFilter === 'ALL'
              ? 'bg-[#1E293B] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <span>Tất cả</span>
          <span className="px-1.5 py-0.5 rounded-md bg-gray-500/20 text-[10px]">
            {counts.ALL}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('PENDING')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
            activeFilter === 'PENDING'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Chờ xác nhận</span>
          <span
            className={`px-1.5 py-0.5 rounded-md text-[10px] ${
              counts.PENDING > 0
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {counts.PENDING}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('PREPARING')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
            activeFilter === 'PREPARING'
              ? 'bg-[#FF5A1F] text-white shadow-xs'
              : 'bg-white text-[#FF5A1F] hover:bg-orange-50 border border-orange-200'
          }`}
        >
          <ChefHat className="w-3.5 h-3.5" />
          <span>Đang chế biến</span>
          <span className="px-1.5 py-0.5 rounded-md bg-orange-100 text-[#FF5A1F] text-[10px]">
            {counts.PREPARING}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('DELIVERING')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
            activeFilter === 'DELIVERING'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
          }`}
        >
          <Bike className="w-3.5 h-3.5" />
          <span>Đang giao hàng</span>
          <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px]">
            {counts.DELIVERING}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('COMPLETED')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
            activeFilter === 'COMPLETED'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Đã hoàn tất</span>
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px]">
            {counts.COMPLETED}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('CANCELLED')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
            activeFilter === 'CANCELLED'
              ? 'bg-gray-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Đã hủy</span>
          <span className="px-1.5 py-0.5 rounded-md bg-gray-200 text-gray-700 text-[10px]">
            {counts.CANCELLED}
          </span>
        </button>
      </div>

      {/* 3. Render Orders: Kanban Mode vs List Mode */}
      {viewMode === 'kanban' && activeFilter === 'ALL' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
          {/* Cột 1: PENDING */}
          <div className="bg-amber-50/40 rounded-2xl p-4 border border-amber-200/60 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200">
              <span className="font-black text-xs uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                Chờ Xác Nhận
              </span>
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {counts.PENDING}
              </span>
            </div>
            <div className="space-y-4">
              {orders.filter((o) => o.status === 'PENDING').length > 0 ? (
                orders
                  .filter((o) => o.status === 'PENDING')
                  .map(renderOrderCard)
              ) : (
                <div className="text-center py-8 text-xs text-amber-800/60 italic">
                  Không có đơn chờ xác nhận
                </div>
              )}
            </div>
          </div>

          {/* Cột 2: PREPARING */}
          <div className="bg-orange-50/40 rounded-2xl p-4 border border-orange-200/60 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-orange-200">
              <span className="font-black text-xs uppercase tracking-wider text-orange-950 flex items-center gap-1.5">
                <ChefHat className="w-4 h-4 text-[#FF5A1F]" />
                Đang Chế Biến
              </span>
              <span className="w-5 h-5 rounded-full bg-[#FF5A1F] text-white text-[10px] font-bold flex items-center justify-center">
                {counts.PREPARING}
              </span>
            </div>
            <div className="space-y-4">
              {orders.filter((o) => o.status === 'PREPARING').length > 0 ? (
                orders
                  .filter((o) => o.status === 'PREPARING')
                  .map(renderOrderCard)
              ) : (
                <div className="text-center py-8 text-xs text-orange-800/60 italic">
                  Bếp đang rảnh rỗi
                </div>
              )}
            </div>
          </div>

          {/* Cột 3: DELIVERING */}
          <div className="bg-blue-50/40 rounded-2xl p-4 border border-blue-200/60 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-blue-200">
              <span className="font-black text-xs uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                <Bike className="w-4 h-4 text-blue-600" />
                Đang Giao Hàng
              </span>
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                {counts.DELIVERING}
              </span>
            </div>
            <div className="space-y-4">
              {orders.filter((o) => o.status === 'DELIVERING').length > 0 ? (
                orders
                  .filter((o) => o.status === 'DELIVERING')
                  .map(renderOrderCard)
              ) : (
                <div className="text-center py-8 text-xs text-blue-800/60 italic">
                  Không có đơn đang giao
                </div>
              )}
            </div>
          </div>

          {/* Cột 4: COMPLETED */}
          <div className="bg-emerald-50/40 rounded-2xl p-4 border border-emerald-200/60 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
              <span className="font-black text-xs uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Đã Hoàn Tất
              </span>
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                {counts.COMPLETED}
              </span>
            </div>
            <div className="space-y-4">
              {orders.filter((o) => o.status === 'COMPLETED').length > 0 ? (
                orders
                  .filter((o) => o.status === 'COMPLETED')
                  .slice(0, 5)
                  .map(renderOrderCard)
              ) : (
                <div className="text-center py-8 text-xs text-emerald-800/60 italic">
                  Chưa có đơn hoàn tất
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* List Mode hoặc khi đang chọn 1 Tab cụ thể */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.length > 0 ? (
            filteredOrders.map(renderOrderCard)
          ) : (
            <div className="col-span-full bg-white p-12 rounded-2xl border border-gray-200 text-center text-gray-500">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-bold text-gray-700">
                Không tìm thấy đơn hàng nào ở trạng thái này
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Các đơn mới sẽ tự động cập nhật ngay lập tức khi khách hàng đặt món.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. Modal Hóa Đơn Điện Tử VAT */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
};

export default OrderBoardTab;