import React, { useState } from 'react';
import {
  ShoppingBag,
  Store,
  FileText,
  User,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  ChefHat,
  Bike,
} from 'lucide-react';
import type { Order, OrderStatus, Store as StoreType } from '../../../types';
import { InvoiceModal } from '../../../components/InvoiceModal';

interface GlobalOrdersTabProps {
  orders: Order[];
  stores: StoreType[];
}

export const GlobalOrdersTab: React.FC<GlobalOrdersTabProps> = ({ orders, stores }) => {
  const [selectedStoreId, setSelectedStoreId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | OrderStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Lọc dữ liệu
  const filteredOrders = orders.filter((o) => {
    const matchesStore = selectedStoreId === 'ALL' || o.store_id === selectedStoreId;
    const matchesStatus = selectedStatus === 'ALL' || o.status === selectedStatus;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      query === '' ||
      o.id.toLowerCase().includes(query) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(query)) ||
      (o.store_name && o.store_name.toLowerCase().includes(query)) ||
      o.delivery_address.toLowerCase().includes(query);

    return matchesStore && matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" /> Chờ xác nhận
          </span>
        );
      case 'PREPARING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-100 text-[#FF5A1F]">
            <ChefHat className="w-3 h-3" /> Đang nấu
          </span>
        );
      case 'DELIVERING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
            <Bike className="w-3 h-3" /> Đang giao
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Hoàn tất
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
            <XCircle className="w-3 h-3" /> Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header */}
      <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-[#FF5A1F]" />
            Giám Sát & Tra Cứu Đơn Hàng Toàn Sàn
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Tra cứu toàn bộ giao dịch đặt món, tình trạng chuyển phát và hóa đơn điện tử S3
          </p>
        </div>
      </div>

      {/* 2. Dải Bộ Lọc Đa Chiều (Cửa hàng, Trạng thái, Tìm kiếm) */}
      <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Lọc theo Quán */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Store className="w-3.5 h-3.5 text-[#FF5A1F]" /> Cửa Hàng
            </label>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F] bg-white"
            >
              <option value="ALL">Tất cả cửa hàng ({stores.length})</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo Trạng thái */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" /> Trạng Thái Đơn
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F] bg-white"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xác nhận (PENDING)</option>
              <option value="PREPARING">Đang nấu (PREPARING)</option>
              <option value="DELIVERING">Đang giao (DELIVERING)</option>
              <option value="COMPLETED">Đã hoàn tất (COMPLETED)</option>
              <option value="CANCELLED">Đã hủy (CANCELLED)</option>
            </select>
          </div>

          {/* Ô Tìm kiếm */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Tìm Kiếm Nhanh
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Mã đơn, tên khách, địa chỉ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bảng Danh Sách Đơn Hàng */}
      <div className="bg-white rounded-2xl border border-orange-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Mã Đơn / Thời Gian</th>
                <th className="py-3.5 px-4">Khách Hàng</th>
                <th className="py-3.5 px-4">Cửa Hàng Quán</th>
                <th className="py-3.5 px-4">Món Ăn</th>
                <th className="py-3.5 px-4">Tổng Tiền</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-orange-50/30 transition-colors">
                  {/* Mã đơn & Thời gian */}
                  <td className="py-4 px-4 sm:px-6">
                    <div>
                      <span className="font-mono font-bold text-gray-900 text-xs">
                        #{order.id.slice(-6).toUpperCase()}
                      </span>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {new Date(order.created_at).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </td>

                  {/* Khách hàng */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <div>
                        <div className="font-bold text-gray-900">{order.customer_name || 'Khách vãng lai'}</div>
                        <span className="text-[11px] text-gray-400">{order.customer_phone || '0901234567'}</span>
                      </div>
                    </div>
                  </td>

                  {/* Cửa hàng */}
                  <td className="py-4 px-4 font-bold text-gray-800">
                    <span className="line-clamp-1">{order.store_name || 'Cửa hàng Astral'}</span>
                  </td>

                  {/* Món ăn */}
                  <td className="py-4 px-4 text-gray-600">
                    <div className="line-clamp-1">
                      {order.items && order.items.length > 0
                        ? order.items.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')
                        : 'Món ngon Astral'}
                    </div>
                  </td>

                  {/* Tổng tiền */}
                  <td className="py-4 px-4">
                    <span className="font-black text-[#FF5A1F] text-sm">
                      {formatVND(order.total_amount)}
                    </span>
                  </td>

                  {/* Trạng thái */}
                  <td className="py-4 px-4">{getStatusBadge(order.status)}</td>

                  {/* Action */}
                  <td className="py-4 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedInvoiceOrder(order)}
                      className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF5A1F] border border-orange-200 font-bold text-[11px] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Xem Hóa Đơn S3</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="p-12 text-center text-gray-500 space-y-2">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="font-bold text-gray-800">Không tìm thấy đơn hàng nào phù hợp</p>
          </div>
        )}
      </div>

      {/* Modal Hóa Đơn VAT S3 */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
};

export default GlobalOrdersTab;