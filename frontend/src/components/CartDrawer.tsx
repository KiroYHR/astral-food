import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, Tag, ArrowRight, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { orderService } from '../api/services';
import toast from 'react-hot-toast';

export const CartDrawer: React.FC = () => {
  const {
    items,
    storeName,
    storeId,
    voucherCode,
    discountAmount,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeItem,
    clearCart,
    applyVoucher,
    removeVoucher,
    getSubtotal,
    getTotal,
  } = useCartStore();

  const [voucherInput, setVoucherInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [address, setAddress] = useState('268 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM');
  const [note, setNote] = useState('');

  if (!isCartOpen) return null;

  const subtotal = getSubtotal();
  const total = getTotal();

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherInput.trim()) return;
    const res = applyVoucher(voucherInput);
    if (res.success) {
      toast.success(res.message);
      setVoucherInput('');
    } else {
      toast.error(res.message);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0 || !storeId) return;

    setIsSubmitting(true);
    try {
      const order = await orderService.createOrder({
        store_id: storeId,
        delivery_address: address,
        note: note || 'Giao hàng cẩn thận giúp em',
        voucher_code: voucherCode || undefined,
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
        })),
      });

      clearCart();
      setIsCartOpen(false);
      toast.success(
        `Đặt đơn hàng #${order.id} thành công! Đã gửi thông điệp vào Amazon SQS.`,
        {
          duration: 4000,
          icon: '🚀',
          style: {
            borderRadius: '12px',
            background: '#10B981',
            color: '#FFFFFF',
          },
        }
      );
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra khi tạo đơn hàng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-[#FFFDF9]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#FF5A1F] flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Giỏ hàng của bạn</h2>
                {storeName && (
                  <p className="text-xs text-orange-600 font-medium truncate max-w-[220px]">
                    Quán: {storeName}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
                <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-400 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">Giỏ hàng trống</h3>
                <p className="text-xs text-gray-400 max-w-xs mb-4">
                  Hãy chọn những món ăn ngon lành từ thực đơn các quán ăn để bắt đầu bữa tiệc!
                </p>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-colors cursor-pointer"
                >
                  Khám phá món ngon ngay
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-3 p-3 rounded-2xl border border-gray-100 bg-[#FFFDF9]/60 hover:bg-[#FFFDF9] transition-all"
                >
                  <img
                    src={item.product.image_s3_url}
                    alt={item.product.name}
                    className="w-18 h-18 rounded-xl object-cover shrink-0 border border-gray-100"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-xs font-extrabold text-[#FF5A1F] mt-0.5">
                        {item.product.price.toLocaleString('vi-VN')} đ
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden shadow-xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 text-gray-600 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-gray-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 text-gray-600 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.product.id)}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-md transition-colors cursor-pointer"
                        title="Xóa món"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Section */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-[#FFFDF9] space-y-4">
              {/* Voucher Input */}
              <div>
                <form onSubmit={handleApplyVoucher} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Mã voucher: ASTRAL20, FREESHIP"
                      value={voucherInput}
                      onChange={(e) => setVoucherInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs uppercase bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 font-semibold"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Áp dụng
                  </button>
                </form>

                {voucherCode && (
                  <div className="mt-2 flex items-center justify-between text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200">
                    <span className="flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã áp mã {voucherCode} (-{discountAmount.toLocaleString('vi-VN')} đ)
                    </span>
                    <button
                      type="button"
                      onClick={removeVoucher}
                      className="text-red-500 hover:underline font-medium text-[11px] cursor-pointer"
                    >
                      Bỏ mã
                    </button>
                  </div>
                )}
              </div>

              {/* Delivery Details */}
              <div className="space-y-2 pt-2 border-t border-gray-200/60 text-xs">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Địa chỉ giao hàng:</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Ghi chú cho quán & shipper:</label>
                  <input
                    type="text"
                    placeholder="VD: Không lấy cay, để đồ trước cửa..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-gray-600 pt-2 border-t border-gray-200/60">
                <div className="flex justify-between">
                  <span>Tạm tính ({items.length} món):</span>
                  <span className="font-semibold text-gray-900">
                    {subtotal.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Giảm giá khuyến mãi:</span>
                    <span className="font-semibold">
                      -{discountAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-1.5 border-t border-gray-200">
                  <span>Tổng thanh toán:</span>
                  <span className="text-[#FF5A1F] text-base">
                    {total.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-coral-gradient hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>Đang đẩy đơn vào AWS SQS...</span>
                ) : (
                  <>
                    <span>Đặt Hàng Ngay ({total.toLocaleString('vi-VN')} đ)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};