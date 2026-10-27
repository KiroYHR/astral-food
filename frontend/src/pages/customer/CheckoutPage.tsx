import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Tag,
  CreditCard,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { orderService } from '../../api/services';
import toast from 'react-hot-toast';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, storeId, storeName, voucherCode, discountAmount, applyVoucher, removeVoucher, clearCart, getSubtotal, getTotal } = useCartStore();
  const { user } = useAuthStore();

  const [address, setAddress] = useState('268 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM');
  const [recipientName, setRecipientName] = useState(user?.full_name || 'Nguyễn Văn Khách');
  const [recipientPhone, setRecipientPhone] = useState(user?.phone || '0901234567');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'MOMO' | 'VNPAY' | 'BANK'>('COD');
  const [voucherInput, setVoucherInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = getSubtotal();
  const shippingFee = voucherCode === 'FREESHIP' ? 0 : 15000;
  const total = Math.max(0, getTotal() + (voucherCode === 'FREESHIP' ? 0 : shippingFee));

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center mx-auto mb-2">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">Giỏ hàng của bạn đang trống</h2>
        <p className="text-xs text-gray-500">Chưa có món ăn nào để thanh toán. Hãy chọn món ngon từ thực đơn!</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-coral-gradient text-white font-bold text-xs shadow-md shadow-orange-500/20"
        >
          <ArrowLeft className="w-4 h-4" /> Khám phá món ngon ngay
        </Link>
      </div>
    );
  }

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

  const handleCreateOrder = async () => {
    if (!storeId) return;
    if (!address.trim() || !recipientPhone.trim()) {
      toast.error('Vui lòng điền đầy đủ địa chỉ và số điện thoại nhận hàng!');
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await orderService.createOrder({
        store_id: storeId,
        delivery_address: address,
        note: note ? `${note} (Thanh toán: ${paymentMethod})` : `Thanh toán: ${paymentMethod}`,
        voucher_code: voucherCode || undefined,
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
        })),
      });

      clearCart();
      toast.success(`Đặt hàng thành công! Mã đơn: #${order.id}`, {
        duration: 4000,
        icon: '🚀',
      });
      navigate('/my-orders');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tạo đơn hàng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Xác Nhận & Thanh Toán
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Kiểm tra thông tin giao hàng và chọn phương thức thanh toán an toàn
          </p>
        </div>

        <Link
          to="/"
          className="text-xs font-bold text-gray-600 hover:text-[#FF5A1F] flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại mua tiếp
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột trái: Thông tin giao hàng & Phương thức thanh toán (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin người nhận */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#FF5A1F]" />
              <span>Địa Chỉ Nhận Hàng</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Tên người nhận:</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FFFDF9] border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Số điện thoại liên hệ:</label>
                <input
                  type="tel"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FFFDF9] border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-gray-700 font-bold mb-1">Địa chỉ chi tiết (Số nhà, tên đường, phường/xã, quận):</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FFFDF9] border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 font-medium"
              />
            </div>

            <div className="text-xs">
              <label className="block text-gray-700 font-bold mb-1">Ghi chú cho tài xế giao hàng:</label>
              <input
                type="text"
                placeholder="VD: Gọi trước khi giao 5 phút, để ở sảnh chung cư..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FFFDF9] border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Phương thức thanh toán */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Phương Thức Thanh Toán</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label
                onClick={() => setPaymentMethod('COD')}
                className={`p-4 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                  paymentMethod === 'COD'
                    ? 'border-orange-500 bg-orange-50/50 text-gray-900 shadow-xs'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="text-orange-500 focus:ring-orange-500"
                />
                <div>
                  <span className="font-bold block">Tiền mặt khi nhận hàng (COD)</span>
                  <span className="text-[11px] text-gray-400">Thanh toán trực tiếp cho Shipper</span>
                </div>
              </label>

              <label
                onClick={() => setPaymentMethod('MOMO')}
                className={`p-4 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                  paymentMethod === 'MOMO'
                    ? 'border-pink-500 bg-pink-50/50 text-gray-900 shadow-xs'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'MOMO'}
                  onChange={() => setPaymentMethod('MOMO')}
                  className="text-pink-500 focus:ring-pink-500"
                />
                <div>
                  <span className="font-bold block">Ví MoMo Siêu Tốc</span>
                  <span className="text-[11px] text-gray-400">Quét mã QR thanh toán tức thì</span>
                </div>
              </label>

              <label
                onClick={() => setPaymentMethod('VNPAY')}
                className={`p-4 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                  paymentMethod === 'VNPAY'
                    ? 'border-blue-500 bg-blue-50/50 text-gray-900 shadow-xs'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'VNPAY'}
                  onChange={() => setPaymentMethod('VNPAY')}
                  className="text-blue-500 focus:ring-blue-500"
                />
                <div>
                  <span className="font-bold block">Cổng VNPAY-QR</span>
                  <span className="text-[11px] text-gray-400">Ứng dụng Mobile Banking</span>
                </div>
              </label>

              <label
                onClick={() => setPaymentMethod('BANK')}
                className={`p-4 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                  paymentMethod === 'BANK'
                    ? 'border-purple-500 bg-purple-50/50 text-gray-900 shadow-xs'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'BANK'}
                  onChange={() => setPaymentMethod('BANK')}
                  className="text-purple-500 focus:ring-purple-500"
                />
                <div>
                  <span className="font-bold block">Thẻ ATM / Visa / Mastercard</span>
                  <span className="text-[11px] text-gray-400">Bảo mật chuẩn quốc tế</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Cột phải: Tóm tắt đơn hàng & Tổng thanh toán (1/3) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <span className="text-[11px] text-gray-400 uppercase font-bold tracking-wider">Đơn hàng từ</span>
              <h3 className="font-black text-base text-gray-900">{storeName}</h3>
            </div>

            {/* Danh sách món */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 text-xs">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={item.product.image_s3_url}
                      alt={item.product.name}
                      className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-100"
                    />
                    <div className="truncate">
                      <p className="font-bold text-gray-800 truncate">{item.product.name}</p>
                      <p className="text-[11px] text-gray-400">SL: {item.quantity}x</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-gray-900 shrink-0">
                    {(item.product.price * item.quantity).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              ))}
            </div>

            {/* Voucher Box */}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <form onSubmit={handleApplyVoucher} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Mã giảm giá"
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 text-xs uppercase bg-[#FFFDF9] border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 font-bold"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Áp dụng
                </button>
              </form>

              {voucherCode && (
                <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <span className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mã {voucherCode} (-{discountAmount.toLocaleString('vi-VN')} đ)
                  </span>
                  <button
                    type="button"
                    onClick={removeVoucher}
                    className="text-red-500 hover:underline text-[11px] cursor-pointer"
                  >
                    Xóa
                  </button>
                </div>
              )}
            </div>

            {/* Price Calculations */}
            <div className="pt-3 border-t border-gray-100 space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <span className="font-bold text-gray-900">{subtotal.toLocaleString('vi-VN')} đ</span>
              </div>

              <div className="flex justify-between">
                <span>Phí giao hàng:</span>
                <span className="font-bold text-gray-900">
                  {shippingFee === 0 ? <span className="text-emerald-600">Miễn phí (Freeship)</span> : `${shippingFee.toLocaleString('vi-VN')} đ`}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Giảm giá voucher:</span>
                  <span>-{discountAmount.toLocaleString('vi-VN')} đ</span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm font-black text-gray-900 pt-3 border-t border-gray-100">
                <span>Tổng Thanh Toán:</span>
                <span className="text-lg text-[#FF5A1F]">
                  {total.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleCreateOrder}
              disabled={isSubmitting}
              className="w-full py-4 px-4 rounded-2xl bg-coral-gradient hover:opacity-95 text-white font-black text-sm shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Đang xử lý đơn hàng...</span>
              ) : (
                <>
                  <span>Xác Nhận Đặt Đơn</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Bảo vệ quyền lợi khách hàng 100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;