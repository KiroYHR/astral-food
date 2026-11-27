import React, { useState, useEffect, useRef } from 'react';
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
  AlertTriangle,
  X,
  Star,
} from 'lucide-react';
import { orderService } from '../../api/services';
import toast from 'react-hot-toast';
import type { Order, OrderStatus } from '../../types';
import { InvoiceModal } from '../../components/InvoiceModal';

export const MyOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const prevStatusMapRef = useRef<Record<string, OrderStatus> | null>(null);
  const [rejectedAlerts, setRejectedAlerts] = useState<Order[]>([]);

  // Modal đánh giá quán sau khi đơn COMPLETED
  const [reviewingOrder, setReviewingOrder] = useState<Order | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingOrder) return;
    setIsSubmittingReview(true);
    try {
      const res = await orderService.submitOrderReview(
        reviewingOrder.id,
        reviewRating,
        reviewComment.trim()
      );
      toast.success(res.message || 'Cảm ơn bạn đã đánh giá quán!');
      setReviewingOrder(null);
      setReviewRating(5);
      setReviewComment('');
      await loadOrders();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Không thể gửi đánh giá lúc này');
    } finally {
      setIsSubmittingReview(false);
    }
  };

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

      const prevMap = prevStatusMapRef.current;
      if (prevMap) {
        const newlyCancelled: Order[] = [];
        list.forEach((order) => {
          const oldStatus = prevMap[order.id];
          const shortCode = order.id.slice(-6).toUpperCase();
          if (oldStatus && oldStatus !== order.status) {
            if (order.status === 'CANCELLED') {
              newlyCancelled.push(order);
              toast.error(
                `Quán ${order.store_name || ''} đã từ chối/hủy đơn #${shortCode}!`,
                { duration: 7000, icon: '❌' }
              );
            } else if (order.status === 'COMPLETED') {
              toast.success(
                `Đơn #${shortCode} đã hoàn tất! Bạn có thể xem hóa đơn điện tử ngay.`,
                { duration: 5000 }
              );
            } else {
              const statusLabels: Record<OrderStatus, string> = {
                PENDING: 'Chờ xác nhận',
                CONFIRMED: 'Đã xác nhận',
                PREPARING: 'Đang nấu',
                DELIVERING: 'Đang giao',
                COMPLETED: 'Hoàn tất',
                CANCELLED: 'Đã hủy',
              };
              toast.success(
                `Quán đã cập nhật trạng thái đơn #${shortCode} → ${statusLabels[order.status] || order.status}`,
                { duration: 4000 }
              );
            }
          }
        });
        if (newlyCancelled.length > 0) {
          setRejectedAlerts((prev) => [
            ...newlyCancelled.filter((n) => !prev.some((p) => p.id === n.id)),
            ...prev,
          ]);
        }
      }

      const nextMap: Record<string, OrderStatus> = {};
      list.forEach((o) => {
        nextMap[o.id] = o.status;
      });
      prevStatusMapRef.current = nextMap;
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
            Lịch Sử & Đã Hủy ({historyOrders.length})
          </button>
        </div>
      </div>

      {/* Banner cảnh báo khi quán từ chối/hủy đơn */}
      {rejectedAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="font-semibold">
              Quán đã từ chối / hủy <strong>{rejectedAlerts.length}</strong> đơn hàng gần đây của bạn. Bấm vào để xem chi tiết trong mục Lịch Sử & Đã Hủy.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab('history');
                setRejectedAlerts([]);
              }}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer transition-colors"
            >
              Xem đơn đã hủy
            </button>
            <button
              type="button"
              onClick={() => setRejectedAlerts([])}
              className="p-1 rounded-lg text-red-600 hover:bg-red-100 cursor-pointer"
              aria-label="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-gray-900 mt-1">{order.store_name}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  {activeTab === 'history' &&
                    order.status === 'COMPLETED' &&
                    !order.has_reviewed && (
                      <button
                        type="button"
                        onClick={() => {
                          setReviewingOrder(order);
                          setReviewRating(5);
                          setReviewComment('');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span>Đánh giá quán</span>
                      </button>
                    )}

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
              {activeTab === 'history' && order.status === 'CANCELLED' && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                  <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Quán đã từ chối / Đơn hàng đã bị hủy</span>
                </div>
              )}

              {activeTab === 'history' &&
                order.status === 'COMPLETED' &&
                order.has_reviewed &&
                order.review && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50/70 text-amber-900 text-xs border border-amber-200">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                    <span>
                      <strong>Đã đánh giá: {order.review.rating}/5 ⭐</strong>
                      {order.review.comment ? ` — "${order.review.comment}"` : ''}
                    </span>
                  </div>
                )}

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

      {/* Modal Đánh Giá Quán */}
      {reviewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-orange-100">
            <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-rose-500 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-base">Đánh giá quán ăn</h3>
                <p className="text-[11px] text-orange-100 truncate">
                  {reviewingOrder.store_name} • Đơn #{reviewingOrder.id.slice(-6).toUpperCase()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewingOrder(null)}
                className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-6 space-y-5 text-xs">
              <div className="text-center space-y-2">
                <p className="font-bold text-gray-700 text-sm">
                  Bạn hài lòng với món ăn và chất lượng phục vụ chứ?
                </p>
                <div className="flex items-center justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1.5 rounded-xl hover:scale-110 transition-transform cursor-pointer"
                      aria-label={`Chọn ${star} sao`}
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= reviewRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200">
                  {reviewRating === 5
                    ? 'Tuyệt vời (5/5)'
                    : reviewRating === 4
                      ? 'Rất ngon (4/5)'
                      : reviewRating === 3
                        ? 'Bình thường (3/5)'
                        : reviewRating === 2
                          ? 'Chưa hài lòng (2/5)'
                          : 'Rất tệ (1/5)'}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-700 block">
                  Nhận xét của bạn <span className="text-gray-400 font-normal">(tùy chọn)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="VD: Cơm nóng hổi, sườn nướng thơm mềm, đóng gói sạch sẽ..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F] text-xs text-gray-900 resize-none"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingOrder(null)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold cursor-pointer"
                >
                  Để sau
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 hover:opacity-95 text-white font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReview ? 'Đang gửi...' : 'Gửi Đánh Giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;