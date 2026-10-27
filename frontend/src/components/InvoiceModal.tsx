import React from 'react';
import { X, Printer, ExternalLink, CheckCircle2, ShieldCheck, Flame } from 'lucide-react';
import type { Order } from '../types';

interface InvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.created_at).toLocaleString('vi-VN');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-200 flex flex-col max-h-[95vh]">
        {/* Modal Action Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Hóa Đơn Điện Tử VAT Hợp Lệ
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 px-3 rounded-lg bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" /> In hóa đơn
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 font-sans text-xs text-gray-700">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-gray-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-coral-gradient flex items-center justify-center text-white">
                  <Flame className="w-5 h-5 fill-white" />
                </div>
                <span className="text-xl font-black text-coral-gradient">AstralFood</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">CÔNG TY CỔ PHẦN ẨM THỰC ĐÁM MÂY ASTRALFOOD</p>
              <p className="text-[11px] text-gray-400">268 Lý Thường Kiệt, Q.10, TP. Hồ Chí Minh</p>
            </div>

            <div className="text-right">
              <span className="text-lg font-black text-gray-900 block">HÓA ĐƠN ĐIỆN TỬ</span>
              <p className="font-mono text-xs text-orange-600 font-bold mt-0.5">#{order.id}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Ngày: {formattedDate}</p>
            </div>
          </div>

          {/* Customer & Order Metadata */}
          <div className="grid grid-cols-2 gap-4 bg-[#FFFDF9] p-4 rounded-2xl border border-gray-100">
            <div>
              <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
                Khách hàng nhận
              </span>
              <p className="font-bold text-gray-900 mt-0.5">{order.customer_name || 'Khách hàng AstralFood'}</p>
              <p className="text-gray-600 mt-0.5">{order.customer_phone || '0901234567'}</p>
              <p className="text-gray-500 mt-0.5 leading-tight">{order.delivery_address}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
                Cửa hàng phục vụ
              </span>
              <p className="font-bold text-gray-900 mt-0.5">{order.store_name}</p>
              <p className="text-gray-500 mt-0.5">Trạng thái: <strong className="text-emerald-600 font-bold">{order.status}</strong></p>
              {order.note && <p className="text-gray-500 mt-0.5 italic">"Ghi chú: {order.note}"</p>}
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[11px] font-bold text-gray-600 border-b border-gray-200">
                  <th className="p-3">Món Ăn</th>
                  <th className="p-3 text-center">SL</th>
                  <th className="p-3 text-right">Đơn Giá</th>
                  <th className="p-3 text-right">Thành Tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items?.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="p-3 font-semibold text-gray-800">{item.product_name}</td>
                    <td className="p-3 text-center text-gray-600 font-bold">{item.quantity}</td>
                    <td className="p-3 text-right text-gray-600">
                      {item.unit_price.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="p-3 text-right font-bold text-gray-900">
                      {(item.unit_price * item.quantity).toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Calculation */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-right">
              {order.discount_amount && order.discount_amount > 0 ? (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Giảm giá ({order.voucher_code}):</span>
                  <span>-{order.discount_amount.toLocaleString('vi-VN')} đ</span>
                </div>
              ) : null}

              <div className="flex justify-between items-center text-sm font-black text-gray-900 pt-2 border-t border-gray-200">
                <span>Tổng Thanh Toán:</span>
                <span className="text-lg text-[#FF5A1F]">
                  {order.total_amount.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <p className="text-[10px] text-gray-400 italic">Đã bao gồm thuế GTGT (VAT)</p>
            </div>
          </div>

          {/* Paid Stamp & Security Watermark */}
          <div className="flex items-center justify-between pt-4 border-t border-dashed border-gray-200">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ĐÃ THANH TOÁN HOÀN TẤT</span>
            </div>

            {order.invoice_s3_url && (
              <a
                href={order.invoice_s3_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline"
              >
                <span>Mở bản PDF trên Amazon S3</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};