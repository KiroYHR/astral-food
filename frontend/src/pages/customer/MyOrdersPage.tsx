import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  ChefHat,
  Truck,
  CheckCircle2,
  XCircle,
  FileText,
  MapPin,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';
import { orderService } from '../../api/services';
import type { Order, OrderStatus } from '../../types';
import { InvoiceModal } from '../../components/InvoiceModal';

export const MyOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();

    // Lắng nghe sự kiện đồng bộ Stateful thời gian thực khi Chủ quán duyệt đơn
    const handleSync = () => {
      loadOrders();
    };
    window.addEventListener('astralfood_db_updated', handleSync);
    const interval = setInterval(() => {
      loadOrders();
    }, 4000);

    return () => {
      window.removeEventListener('astralfood_db_updated', handleSync);
      clearInterval(interval);
    };
  }, []);

  const loadOrders = async () => {
    try {
      const list = await orderService.getMyOrders();
      setOrders(list);
    } catch (err) {
      console.error('Error loading orders:', err);
    }
  };

  const activeOrders = orders.filter((o) =>
    ['PENDING', 'CONFIRMED', 'PREPARING', 'DELIVERING'].includes(o.status)
  );

  const historyOrders = orders.filter((o) =>
    ['COMPLETED', 'CANCELLED'].includes(o.status)
  );

  const displayedOrders = activeTab === 'active' ? activeOrders : historyOrders;

  const renderStepper = (status: OrderStatus) => {
    const steps: { key: OrderStatus; label: string; icon: any }[] = [
      { key: 'PENDING', label: 'Chờ nhận đơn', icon: Clock },
      { key: 'PREPARING', label: 'Đang nấu', icon: ChefHat },
      { key: 'DELIVERING', label: 'Đang giao', icon: Truck },
      { key: 'COMPLETED', label: 'Đã nhận', icon: CheckCircle2 },
    ];

    if (status === 'CANCELLED') {
      return (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200">
          <XCircle className="w-4 h-4 text-red-600" />
          <span>Đơn hàng này đã bị hủy</span>
        </div>
      );
    }

    const statusOrderMap: Record<OrderStatus, number> = {
      PENDING: 1,
      CONFIRMED: 2,
      PREPARING: 2,
      DELIVERING: 3,
      COMPLETED: 4,
      CANCELLED: 0,
    };

    const currentStepIndex = statusOrderMap[status] || 1;

    return (
      <div className="w-full py-4">
        <div className="flex items-center justify-between relative">
          {/* Connector Line */}
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-gray-200 z-0">
            <div
              className="h-full bg-coral-gradient transition-all duration-500"
              style={{
                width: `${((currentStepIndex - 1) / (steps.length - 1)) * 100}%`,
              }}
            />
          </div>

          {/* Steps */}
          {steps.map((step, idx) => {
            const isCompleted = idx + 1 <= currentStepIndex;
            const isCurrent = idx + 1 === currentStepIndex;
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 ring-4 ring-orange-100'
                      : 'bg-white text-gray-400 border-2 border-gray-200'
                  } ${isCurrent ? 'scale-110' : ''}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-[11px] font-bold mt-2 text-center whitespace-nowrap ${
                    isCompleted ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Đơn Hàng Của Tôi
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Theo dõi tiến trình món ăn đang giao thời gian thực và xem lại lịch sử ẩm thực
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-[#FFFDF9] p-1.5 rounded-2xl border border-gray-200 self-start sm:self-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Đang Xử Lý ({activeOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Lịch Sử Đơn ({historyOrders.length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      {displayedOrders.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-gray-100 space-y-4">
          <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">
            {activeTab === 'active'
              ? 'Hiện không có đơn hàng nào đang xử lý'
              : 'Bạn chưa có đơn hàng nào trong lịch sử'}
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Đặt món ngay để thưởng thức hương vị thơm ngon nóng hổi từ các quán ăn AstralFood!
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-coral-gradient text-white font-bold text-xs shadow-md shadow-orange-500/20"
          >
            <span>Khám phá thực đơn</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xs hover:border-orange-200 transition-colors space-y-5"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-lg border border-orange-200">
                      #{order.id}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-gray-900 mt-1">{order.store_name}</h3>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {/* Xem Hóa Đơn Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedInvoiceOrder(order)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-orange-500" />
                    <span>Xem Hóa Đơn Điện Tử</span>
                  </button>
                </div>
              </div>

              {/* Progress Stepper for Active Orders */}
              {activeTab === 'active' && renderStepper(order.status)}

              {/* Items List */}
              <div className="space-y-2.5 pt-2">
                <span className="text-[11px] font-bold uppercase text-gray-400 block tracking-wider">
                  Món ăn trong đơn:
                </span>
                <div className="divide-y divide-gray-100 text-xs">
                  {order.items?.map((item) => (
                    <div key={item.id} className="py-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.product_image && (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-100"
                          />
                        )}
                        <span className="font-bold text-gray-800 truncate">
                          {item.quantity}x {item.product_name}
                        </span>
                      </div>
                      <span className="font-black text-gray-900 shrink-0">
                        {(item.unit_price * item.quantity).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address & Notes */}
              <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600 bg-[#FFFDF9] p-4 rounded-2xl">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#FF5A1F] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-gray-800 block">Địa chỉ nhận hàng:</span>
                    <span className="leading-tight text-gray-500">{order.delivery_address}</span>
                  </div>
                </div>

                <div className="text-right sm:self-center">
                  <span className="text-gray-400 block text-[11px]">Tổng số tiền đã thanh toán:</span>
                  <span className="text-lg font-black text-[#FF5A1F]">
                    {order.total_amount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice Modal */}
      <InvoiceModal
        order={selectedInvoiceOrder}
        onClose={() => setSelectedInvoiceOrder(null)}
      />
    </div>
  );
};

export default MyOrdersPage;