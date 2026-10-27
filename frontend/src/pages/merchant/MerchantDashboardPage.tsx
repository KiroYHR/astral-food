import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Flame,
  TrendingUp,
  ChefHat,
  Utensils,
  Store as StoreIcon,
  Star,
  ExternalLink,
  ChevronDown,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Store, Category, Product, Order } from '../../types';
import { storeService, productService, orderService } from '../../api/services';
import { AnalyticsTab } from './components/AnalyticsTab';
import { OrderBoardTab } from './components/OrderBoardTab';
import { MenuManagerTab } from './components/MenuManagerTab';
import { StoreSettingsTab } from './components/StoreSettingsTab';

export const MerchantDashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'analytics';

  // State
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);

  // Load all data for the active store
  const loadData = useCallback(async (storeId?: string) => {
    try {
      const stores = await storeService.getAllStores();
      setAllStores(stores);

      // Determine active store
      let targetStore = selectedStore;
      if (storeId) {
        targetStore = stores.find((s) => s.id === storeId) || stores[0];
      } else if (!targetStore && stores.length > 0) {
        // Default to first merchant store or store-1
        targetStore = stores.find((s) => s.owner_id === 'user-merchant-1') || stores[0];
      }
      setSelectedStore(targetStore || null);

      if (targetStore) {
        const [cats, prods, ords] = await Promise.all([
          storeService.getCategories(targetStore.id),
          productService.getProductsByStore(targetStore.id),
          orderService.getStoreOrders(targetStore.id),
        ]);

        setCategories(cats);
        setProducts(prods);
        setOrders(ords);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu quán:', err);
      toast.error('Không thể tải thông tin cửa hàng');
    } finally {
      setLoading(false);
    }
  }, [selectedStore]);

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Real-time listener for database changes (from customer placing order, etc.)
  useEffect(() => {
    const handleDbUpdate = () => {
      if (selectedStore) {
        loadData(selectedStore.id);
      }
    };

    window.addEventListener('astralfood_db_updated', handleDbUpdate);
    window.addEventListener('storage', handleDbUpdate);

    return () => {
      window.removeEventListener('astralfood_db_updated', handleDbUpdate);
      window.removeEventListener('storage', handleDbUpdate);
    };
  }, [selectedStore, loadData]);

  // Tab switch
  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  // Switch store
  const handleSwitchStore = (store: Store) => {
    setSelectedStore(store);
    setIsStoreDropdownOpen(false);
    loadData(store.id);
    toast.success(`Đã chuyển sang quản lý: ${store.name}`);
  };

  // Toggle store active status directly from topbar
  const handleToggleStoreActive = async () => {
    if (!selectedStore) return;
    try {
      const updated = await storeService.updateStore(selectedStore.id, {
        is_active: !selectedStore.is_active,
      });
      setSelectedStore(updated);
      toast.success(
        updated.is_active
          ? 'Quán đã mở cửa đón khách đặt hàng!'
          : 'Quán đã tạm đóng cửa nghỉ ngơi'
      );
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi cập nhật trạng thái quán');
    }
  };

  // Pending orders counter for badge
  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING').length;

  if (loading && !selectedStore) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#FF5A1F] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-gray-600">
            Đang tải dữ liệu Phân hệ Chủ quán AstralFood...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#1E293B]">
      {/* 1. TOP NAVIGATION / MERCHANT HUB HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
            {/* Left: Brand Logo & Merchant Hub Badge */}
            <div className="flex items-center gap-3">
              <Link to="/merchant" className="flex items-center gap-2 group">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 via-orange-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                  <Flame className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-orange-600 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                    AstralFood
                  </span>
                  <span className="block text-[10px] font-bold text-gray-400 tracking-wider uppercase -mt-1">
                    Merchant Hub
                  </span>
                </div>
              </Link>

              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-orange-100 to-amber-100 text-[#FF5A1F] border border-orange-200">
                ⭐ CHỦ QUÁN
              </span>
            </div>

            {/* Center: Store Selector Dropdown */}
            {selectedStore && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                  className="flex items-center gap-3 p-1.5 sm:px-3 sm:py-2 rounded-2xl bg-orange-50/70 hover:bg-orange-100/70 border border-orange-200/80 transition-all cursor-pointer group"
                >
                  <img
                    src={selectedStore.logo_s3_url}
                    alt={selectedStore.name}
                    className="w-8 h-8 rounded-xl object-cover border border-orange-200"
                  />
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-black text-gray-900 group-hover:text-[#FF5A1F] transition-colors line-clamp-1">
                      {selectedStore.name}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-semibold">
                      <span className="flex items-center text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-amber-500" /> {selectedStore.rating || 4.8}
                      </span>
                      <span>•</span>
                      <span
                        className={
                          selectedStore.is_active ? 'text-emerald-600' : 'text-gray-400'
                        }
                      >
                        {selectedStore.is_active ? 'Đang mở cửa' : 'Tạm đóng'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-[#FF5A1F] transition-transform ml-1" />
                </button>

                {/* Dropdown Menu để đổi quán test */}
                {isStoreDropdownOpen && (
                  <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      Chọn Quán Ăn Trong Hệ Thống Để Quản Lý
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                      {allStores.map((store) => (
                        <button
                          key={store.id}
                          type="button"
                          onClick={() => handleSwitchStore(store)}
                          className={`w-full p-2.5 px-3 flex items-center justify-between text-left hover:bg-orange-50/80 transition-colors cursor-pointer ${
                            store.id === selectedStore.id ? 'bg-orange-50 font-bold' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={store.logo_s3_url}
                              alt={store.name}
                              className="w-7 h-7 rounded-lg object-cover border border-gray-200"
                            />
                            <div>
                              <div className="text-xs text-gray-900 line-clamp-1">
                                {store.name}
                              </div>
                              <span className="text-[10px] text-gray-400">
                                {store.category_tag || 'Ẩm thực'}
                              </span>
                            </div>
                          </div>
                          {store.id === selectedStore.id && (
                            <CheckCircle2 className="w-4 h-4 text-[#FF5A1F]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Right: Trạng Thái Mở Cửa & Xem Trang Quán */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Nút bật/tắt mở quán */}
              {selectedStore && (
                <button
                  type="button"
                  onClick={handleToggleStoreActive}
                  className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedStore.is_active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                  }`}
                  title="Nhấn để đổi trạng thái Đang mở cửa / Tạm đóng cửa"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedStore.is_active ? 'bg-emerald-500' : 'bg-gray-400'
                    }`}
                  />
                  <span>{selectedStore.is_active ? 'Đang mở cửa' : 'Tạm đóng cửa'}</span>
                </button>
              )}

              {/* Nút Xem trang quán dưới góc nhìn Khách hàng */}
              {selectedStore && (
                <Link
                  to={`/stores/${selectedStore.id}`}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-bold text-xs shadow-xs hover:opacity-95 flex items-center gap-1.5 cursor-pointer transition-all"
                  title="Xem trang thực đơn của quán dưới góc nhìn khách hàng"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Xem trang quán (Khách hàng)</span>
                  <span className="sm:hidden">Xem quán</span>
                </Link>
              )}

              {/* Link quay lại trang chủ khách hàng */}
              <Link
                to="/"
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
                title="Về Trang Chủ Khách Hàng"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* 2. TABS NAVIGATION BAR (4 TAB CHÍNH) */}
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none py-2 border-t border-gray-100">
            {/* Tab 1: 📊 Tổng Quan & Doanh Thu */}
            <button
              type="button"
              id="tab-analytics" onClick={() => handleTabChange('analytics')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                currentTab === 'analytics'
                  ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-orange-50/50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>📊 Tổng Quan & Doanh Thu</span>
            </button>

            {/* Tab 2: 📦 Điều Phối Đơn Hàng */}
            <button
              type="button"
              id="tab-orders" onClick={() => handleTabChange('orders')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                currentTab === 'orders'
                  ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-orange-50/50'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>📦 Điều Phối Đơn Hàng</span>
              {pendingOrdersCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            {/* Tab 3: 🍽️ Quản Lý Thực Đơn */}
            <button
              type="button"
              id="tab-menu" onClick={() => handleTabChange('menu')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                currentTab === 'menu'
                  ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-orange-50/50'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>🍽️ Quản Lý Thực Đơn (AI Copilot)</span>
              <span className="px-1.5 py-0.5 rounded-md bg-orange-100 text-[#FF5A1F] text-[10px] font-bold">
                {products.length}
              </span>
            </button>

            {/* Tab 4: 🏪 Hồ Sơ Cửa Hàng */}
            <button
              type="button"
              id="tab-settings" onClick={() => handleTabChange('settings')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                currentTab === 'settings'
                  ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-orange-50/50'
              }`}
            >
              <StoreIcon className="w-4 h-4" />
              <span>🏪 Hồ Sơ Cửa Hàng</span>
            </button>
          </nav>
        </div>
      </header>

      {/* 3. NỘI DUNG TỪNG TAB */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedStore && (
          <>
            {currentTab === 'analytics' && (
              <AnalyticsTab store={selectedStore} orders={orders} />
            )}

            {currentTab === 'orders' && (
              <OrderBoardTab
                storeId={selectedStore.id}
                orders={orders}
                onOrderUpdated={() => loadData(selectedStore.id)}
              />
            )}

            {currentTab === 'menu' && (
              <MenuManagerTab
                storeId={selectedStore.id}
                categories={categories}
                products={products}
                onRefreshData={() => loadData(selectedStore.id)}
              />
            )}

            {currentTab === 'settings' && (
              <StoreSettingsTab
                store={selectedStore}
                onStoreUpdated={(updated) => {
                  setSelectedStore(updated);
                  loadData(updated.id);
                }}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default MerchantDashboardPage;