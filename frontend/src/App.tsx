import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import {
  Star,
  Clock,
  MapPin,
  Sparkles,
  Plus,
  FileText,
  CheckCircle2,
  PackageCheck,
  Truck,
  ChefHat,
  ShoppingBag,
  ExternalLink,
  Layers,
  Server,
  Database,
  Store as StoreIcon,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

import { Navbar, RoleSwitcher, CartDrawer } from './components';
import { useAuthStore } from './store/useAuthStore';
import { useCartStore } from './store/useCartStore';
import { storeService, productService, orderService } from './api/services';
import type { Store, Product, Order } from './types';

export const App: React.FC = () => {
  const { initAuth } = useAuthStore();
  const { addItem, toggleCart } = useCartStore();

  const [stores, setStores] = useState<Store[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'stores' | 'orders' | 'palette'>('stores');

  const loadData = async () => {
    try {
      const [storeList, orderList] = await Promise.all([
        storeService.getStores(),
        orderService.getMyOrders(),
      ]);
      setStores(storeList);
      setOrders(orderList);
      if (storeList.length > 0 && !selectedStore) {
        setSelectedStore(storeList[0]);
        const prods = await productService.getProductsByStore(storeList[0].id);
        setStoreProducts(prods);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  useEffect(() => {
    initAuth();
    loadData();

    const handleDbUpdate = () => {
      loadData();
    };
    window.addEventListener('astralfood_db_updated', handleDbUpdate);
    return () => {
      window.removeEventListener('astralfood_db_updated', handleDbUpdate);
    };
  }, []);

  const handleSelectStore = async (store: Store) => {
    setSelectedStore(store);
    try {
      const prods = await productService.getProductsByStore(store.id);
      setStoreProducts(prods);
    } catch (err) {
      console.error('Error loading store products:', err);
    }
  };

  const handleAddToCart = (product: Product, storeName: string) => {
    addItem(product, storeName);
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`, {
      icon: '🛒',
      duration: 2000,
    });
  };

  const handleUpdateOrderStatus = async (orderId: string, nextStatus: any) => {
    try {
      await orderService.updateOrderStatus(orderId, nextStatus);
      toast.success(`Đã cập nhật trạng thái đơn sang: ${nextStatus}!`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi đổi trạng thái');
    }
  };

  const categories = [
    'Tất cả',
    'Cơm tấm',
    'Trà sữa',
    'Gà rán',
    'Phở & Món nước',
    'Burger & Fast Food',
    'Bún đậu mắm tôm',
  ];

  const filteredStores = stores.filter((s) => {
    const matchesCategory =
      selectedCategory === 'Tất cả' ||
      s.category_tag?.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'Chờ Quán Nhận',
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: <Clock className="w-3.5 h-3.5" />,
        };
      case 'PREPARING':
        return {
          label: 'Đang Chuẩn Bị',
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <ChefHat className="w-3.5 h-3.5" />,
        };
      case 'DELIVERING':
        return {
          label: 'Đang Giao Hàng',
          bg: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: <Truck className="w-3.5 h-3.5" />,
        };
      case 'COMPLETED':
        return {
          label: 'Đã Hoàn Tất',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        };
      default:
        return {
          label: status,
          bg: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <PackageCheck className="w-3.5 h-3.5" />,
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#1E293B] flex flex-col font-sans selection:bg-[#FF5A1F] selection:text-white">
      <Toaster position="top-right" />

      {/* Global Navbar */}
      <Navbar onSearch={(q) => setSearchQuery(q)} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-10">
        {/* ==========================================
            HERO SECTION: SOLAR STARBURST SHOWCASE
           ========================================== */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/15 border border-orange-200/60 p-6 sm:p-10 shadow-lg shadow-orange-500/5">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-orange-400/15 blur-3xl pointer-events-none"></div>
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-rose-400/15 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-orange-200 text-[#FF5A1F] text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 fill-[#FF5A1F]" />
              <span>Phase 1 Architecture Complete: Hybrid API & Design System</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
              Đặt Món Tinh Hoa, <br />
              <span className="text-coral-gradient">Vận Hành Trên Đám Mây AWS</span>
            </h1>

            <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl">
              Nền tảng thương mại điện tử ẩm thực đa kênh chuẩn Cloud-Native Microservices (Region: <strong className="text-gray-900 font-semibold">ap-southeast-1 Singapore</strong>). Tự động hoá với AWS S3 Presigned URL, Amazon SQS Event-Driven và AI Copilot sinh mô tả món ăn.
            </p>

            {/* Quick Action Badges */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('stores')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'stores'
                    ? 'bg-coral-gradient text-white shadow-md shadow-orange-500/20'
                    : 'bg-white hover:bg-orange-50 text-gray-700 border border-gray-200'
                }`}
              >
                <StoreIcon className="w-4 h-4" /> Khám phá Quán ăn & Món ({stores.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-coral-gradient text-white shadow-md shadow-orange-500/20'
                    : 'bg-white hover:bg-orange-50 text-gray-700 border border-gray-200'
                }`}
              >
                <FileText className="w-4 h-4" /> Xem 4 Đơn Hàng Mẫu & Hóa Đơn PDF
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('palette')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'palette'
                    ? 'bg-coral-gradient text-white shadow-md shadow-orange-500/20'
                    : 'bg-white hover:bg-orange-50 text-gray-700 border border-gray-200'
                }`}
              >
                <Layers className="w-4 h-4" /> Bảng Màu "Solar Starburst"
              </button>
            </div>
          </div>

          {/* System Specs Floating Card */}
          <div className="mt-8 pt-6 border-t border-orange-200/50 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center gap-2.5 bg-white/70 p-2.5 rounded-xl border border-orange-100">
              <Server className="w-4 h-4 text-orange-500 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 font-medium">Vite + React 19</p>
                <p className="font-bold text-gray-800">TypeScript 6.0</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-white/70 p-2.5 rounded-xl border border-orange-100">
              <Database className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 font-medium">PostgreSQL Contract</p>
                <p className="font-bold text-gray-800">Stateful Mock DB</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-white/70 p-2.5 rounded-xl border border-orange-100">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 font-medium">Amazon Bedrock</p>
                <p className="font-bold text-gray-800">AI Copilot Ready</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-white/70 p-2.5 rounded-xl border border-orange-100">
              <ShoppingBag className="w-4 h-4 text-rose-500 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 font-medium">State Management</p>
                <p className="font-bold text-gray-800">Zustand + Storage</p>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            TAB 1: STORES & DISHES BROWSER
           ========================================== */}
        {activeTab === 'stores' && (
          <div className="space-y-6">
            {/* Category Filter Badges */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'bg-white hover:bg-orange-50 text-gray-600 border border-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Stores Grid (6 Quán) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Cửa Hàng Nổi Bật ({filteredStores.length})
                  </h2>
                  <p className="text-xs text-gray-500">
                    Quán ngon chuẩn vị được kiểm định chất lượng trên nền tảng AstralFood
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStores.map((store) => {
                  const isSelected = selectedStore?.id === store.id;
                  return (
                    <div
                      key={store.id}
                      onClick={() => handleSelectStore(store)}
                      className={`group card-astral overflow-hidden cursor-pointer flex flex-col justify-between ${
                        isSelected ? 'ring-2 ring-[#FF5A1F]' : ''
                      }`}
                    >
                      <div>
                        {/* Store Image */}
                        <div className="relative h-44 overflow-hidden bg-gray-100">
                          <img
                            src={store.logo_s3_url}
                            alt={store.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-bold text-gray-800 flex items-center gap-1 shadow-xs">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{store.rating || 4.8}</span>
                          </div>

                          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-semibold text-gray-700 flex items-center gap-1 shadow-xs">
                            <Clock className="w-3.5 h-3.5 text-gray-500" />
                            <span>{store.delivery_time || '20-30 phút'}</span>
                          </div>

                          <div className="absolute bottom-3 left-3">
                            <span className="px-2.5 py-1 rounded-lg bg-orange-600/90 text-white text-[10px] font-bold backdrop-blur-xs">
                              {store.category_tag}
                            </span>
                          </div>
                        </div>

                        {/* Store Info */}
                        <div className="p-4 space-y-2">
                          <h3 className="font-extrabold text-base text-gray-900 group-hover:text-[#FF5A1F] transition-colors line-clamp-1">
                            {store.name}
                          </h3>
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {store.description}
                          </p>

                          <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                            <span className="truncate">{store.address}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Button */}
                      <div className="p-4 pt-0">
                        <button
                          type="button"
                          className="w-full py-2.5 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF5A1F] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>Xem Thực Đơn</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Store Menu Section (Thực đơn của quán được chọn) */}
            {selectedStore && (
              <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-white border border-[#F1EFE9] shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedStore.logo_s3_url}
                      alt={selectedStore.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-orange-100 shadow-xs"
                    />
                    <div>
                      <span className="text-[11px] font-bold text-[#FF5A1F] uppercase tracking-wider">
                        Thực đơn quán
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-gray-900">
                        {selectedStore.name}
                      </h3>
                      <p className="text-xs text-gray-500">{selectedStore.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleCart}
                      className="px-4 py-2.5 rounded-xl bg-coral-gradient text-white text-xs font-bold shadow-md shadow-orange-500/20 hover:opacity-95 transition-opacity flex items-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" /> Mở Giỏ Hàng
                    </button>
                  </div>
                </div>

                {/* Dishes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {storeProducts.map((product) => (
                    <div
                      key={product.id}
                      className="p-3.5 rounded-2xl border border-gray-100 bg-[#FFFDF9]/60 hover:bg-[#FFFDF9] hover:border-orange-200 transition-all flex gap-3.5 group"
                    >
                      <img
                        src={product.image_s3_url}
                        alt={product.name}
                        className="w-24 h-24 rounded-xl object-cover shrink-0 border border-gray-100 group-hover:scale-102 transition-transform"
                      />

                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <h4 className="font-bold text-xs text-gray-900 truncate">
                            {product.name}
                          </h4>
                          <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-tight">
                            {product.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100/80">
                          <span className="font-black text-sm text-[#FF5A1F]">
                            {product.price.toLocaleString('vi-VN')} đ
                          </span>

                          <button
                            type="button"
                            onClick={() => handleAddToCart(product, selectedStore.name)}
                            className="p-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-transform active:scale-95 shadow-xs cursor-pointer"
                            title="Thêm vào giỏ"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            TAB 2: SAMPLE ORDERS & S3 INVOICES
           ========================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Lịch Sử & Tiến Trình Đơn Hàng Mẫu ({orders.length})
                </h2>
                <p className="text-xs text-gray-500">
                  Dữ liệu đồng bộ Stateful giữa Khách hàng và Chủ quán (Có thể cập nhật trạng thái trực tiếp)
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadData()}
                className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-white text-xs font-semibold text-gray-700 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Làm mới
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {orders.map((order) => {
                const statusInfo = getStatusBadge(order.status);
                return (
                  <div
                    key={order.id}
                    className="p-5 rounded-2xl bg-white border border-[#F1EFE9] shadow-xs space-y-4 hover:border-orange-200 transition-colors"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div>
                        <span className="text-[11px] font-mono text-gray-400 font-bold">
                          ĐƠN HÀNG #{order.id}
                        </span>
                        <h4 className="font-extrabold text-sm text-gray-900 mt-0.5">
                          {order.store_name}
                        </h4>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.bg}`}
                      >
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Order Details */}
                    <div className="space-y-2 text-xs text-gray-600">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{order.delivery_address}</span>
                      </div>
                      {order.note && (
                        <p className="text-[11px] bg-[#FFFDF9] p-2 rounded-lg text-gray-500 border border-gray-100">
                          <strong>Ghi chú:</strong> {order.note}
                        </p>
                      )}
                    </div>

                    {/* Order Items */}
                    <div className="space-y-1.5 pt-2 border-t border-gray-100">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex justify-between text-xs">
                          <span className="text-gray-700">
                            {item.quantity}x {item.product_name}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {(item.unit_price * item.quantity).toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Footer Info & Actions */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-gray-400">Tổng thanh toán</p>
                        <p className="font-black text-base text-[#FF5A1F]">
                          {order.total_amount.toLocaleString('vi-VN')} đ
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {order.invoice_s3_url ? (
                          <a
                            href={order.invoice_s3_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold border border-emerald-200 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" /> Hóa đơn PDF S3
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">
                            Chờ xuất hóa đơn
                          </span>
                        )}

                        {/* Interactive Status Transition Demo */}
                        {order.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, 'PREPARING')}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs cursor-pointer"
                          >
                            Nhận Đơn
                          </button>
                        )}
                        {order.status === 'PREPARING' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, 'DELIVERING')}
                            className="px-2.5 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs cursor-pointer"
                          >
                            Giao Hàng
                          </button>
                        )}
                        {order.status === 'DELIVERING' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, 'COMPLETED')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs cursor-pointer"
                          >
                            Hoàn Tất
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 3: SOLAR STARBURST DESIGN TOKENS
           ========================================== */}
        {activeTab === 'palette' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#F1EFE9] space-y-6 shadow-xs">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Bảng Màu Thương Hiệu "Solar Starburst"
              </h2>
              <p className="text-xs text-gray-500">
                Hệ thống màu sắc tươi sáng, kích thích vị giác được tối ưu hóa cho nền tảng AstralFood
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Color 1: Astral Coral */}
              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-orange-200/80 space-y-3">
                <div className="h-20 rounded-xl bg-[#FF5A1F] flex items-center justify-center text-white font-mono font-bold shadow-md shadow-orange-500/20">
                  #FF5A1F
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900">Astral Coral</h4>
                  <p className="text-xs text-gray-500">Màu chủ đạo — Cam san hô rực rỡ, năng động và kích thích thèm ăn.</p>
                </div>
              </div>

              {/* Color 2: Starlight Gold */}
              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-amber-200/80 space-y-3">
                <div className="h-20 rounded-xl bg-[#F59E0B] flex items-center justify-center text-white font-mono font-bold shadow-md shadow-amber-500/20">
                  #F59E0B
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900">Starlight Gold</h4>
                  <p className="text-xs text-gray-500">Màu nhấn — Vàng nắng hoàng kim cho đánh giá sao ⭐ và AI Copilot.</p>
                </div>
              </div>

              {/* Color 3: Fresh Mint */}
              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-emerald-200/80 space-y-3">
                <div className="h-20 rounded-xl bg-[#10B981] flex items-center justify-center text-white font-mono font-bold shadow-md shadow-emerald-500/20">
                  #10B981
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900">Fresh Mint</h4>
                  <p className="text-xs text-gray-500">Màu trạng thái — Xanh lá tươi mát cho Còn hàng và Đơn hoàn tất.</p>
                </div>
              </div>

              {/* Color 4: Astral Background */}
              <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-gray-300 space-y-3">
                <div className="h-20 rounded-xl bg-[#FFFDF9] border border-gray-200 flex items-center justify-center text-gray-700 font-mono font-bold">
                  #FFFDF9
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900">Astral Cream Warmth</h4>
                  <p className="text-xs text-gray-500">Màu nền chính — Trắng kem ấm áp, dịu mắt, tôn vinh hình ảnh món ăn.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Demo Role Switcher (Góc dưới bên trái) */}
      <RoleSwitcher />

      {/* Slide-out Shopping Cart Drawer */}
      <CartDrawer />

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-[#F1EFE9] py-8 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-bold text-gray-800">
            AstralFood Platform — Nền tảng Đặt đồ ăn & Thương mại Điện tử Đa kênh trên AWS
          </p>
          <p>
            Phân hệ Frontend (Thành viên 3) • React 19 + Vite + Tailwind CSS + Zustand • Region: ap-southeast-1
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;