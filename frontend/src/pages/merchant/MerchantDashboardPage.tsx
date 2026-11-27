import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
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
  MapPin,
  FileText,
  PlusCircle,
  LogOut,
  Clock,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Store, Category, Product, Order } from '../../types';
import { storeService, productService, orderService } from '../../api/services';
import { useAuthStore } from '../../store/useAuthStore';
import { AnalyticsTab } from './components/AnalyticsTab';
import { OrderBoardTab } from './components/OrderBoardTab';
import { MenuManagerTab } from './components/MenuManagerTab';
import { StoreSettingsTab } from './components/StoreSettingsTab';

export const MerchantDashboardPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'analytics';

  // State
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const selectedStoreIdRef = useRef<string | null>(null);
  const knownPendingIdsRef = useRef<Set<string> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);

  // Onboarding Form State (khi chủ quán mới chưa có cửa hàng)
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [newStoreDesc, setNewStoreDesc] = useState('');
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);

  // Load all data for the active store (multi-tenant filtered by owner)
  const loadData = useCallback(
    async (storeId?: string) => {
      try {
        const stores = await storeService.getMyStores(user?.role === 'ADMIN');
        setAllStores(stores);

        let targetStore: Store | null = null;
        if (stores.length > 0) {
          const activeId = storeId || selectedStoreIdRef.current;
          if (activeId) {
            targetStore = stores.find((s) => s.id === activeId) || stores[0];
          } else {
            targetStore = stores[0];
          }
        }

        selectedStoreIdRef.current = targetStore?.id || null;
        setSelectedStore(targetStore);

        if (targetStore) {
          const [cats, prods, ords] = await Promise.all([
            storeService.getCategories(targetStore.id),
            productService.getProductsByStore(targetStore.id),
            orderService.getStoreOrders(targetStore.id),
          ]);

          setCategories(cats);
          setProducts(prods);
          setOrders(ords);
        } else {
          setCategories([]);
          setProducts([]);
          setOrders([]);
        }
      } catch (err: any) {
        console.error('Lỗi khi tải dữ liệu quán:', err);
        toast.error(err?.response?.data?.error || 'Không thể tải thông tin cửa hàng');
      } finally {
        setLoading(false);
      }
    },
    [user?.role]
  );

  // Initial load & reload if user changes
  useEffect(() => {
    setLoading(true);
    selectedStoreIdRef.current = null;
    loadData();
  }, [user?.id, loadData]);

  // Real-time listener for database changes (from customer placing order, etc.)
  useEffect(() => {
    const handleDbUpdate = () => {
      if (selectedStoreIdRef.current) {
        loadData(selectedStoreIdRef.current);
      }
    };

    window.addEventListener('astralfood_db_updated', handleDbUpdate);
    window.addEventListener('storage', handleDbUpdate);

    return () => {
      window.removeEventListener('astralfood_db_updated', handleDbUpdate);
      window.removeEventListener('storage', handleDbUpdate);
    };
  }, [loadData]);

  // Polling 5s nhận đơn hàng mới realtime từ khách hàng (không cần F5)
  useEffect(() => {
    if (!selectedStore?.id || !selectedStore.is_active) return;

    knownPendingIdsRef.current = null;

    const pollStoreOrders = async () => {
      try {
        const latestOrders = await orderService.getStoreOrders(selectedStore.id);
        setOrders(latestOrders);

        const currentPending = latestOrders.filter((o) => o.status === 'PENDING');
        if (knownPendingIdsRef.current === null) {
          knownPendingIdsRef.current = new Set(currentPending.map((o) => o.id));
          return;
        }

        const newlyArrived = currentPending.filter(
          (o) => !knownPendingIdsRef.current!.has(o.id)
        );
        if (newlyArrived.length > 0) {
          newlyArrived.forEach((o) => knownPendingIdsRef.current!.add(o.id));
          toast.success(
            `🔔 Có ${newlyArrived.length} đơn hàng mới vừa đặt tại ${selectedStore.name}!`,
            { duration: 6000 }
          );
        }
      } catch {
        // Bỏ qua âm thầm khi polling nền
      }
    };

    const timer = window.setInterval(pollStoreOrders, 5000);
    return () => window.clearInterval(timer);
  }, [selectedStore?.id, selectedStore?.is_active, selectedStore?.name]);

  // Polling 5s kiểm tra trạng thái Admin phê duyệt khi quán đang ở trạng thái chờ duyệt
  useEffect(() => {
    if (!selectedStore || selectedStore.is_active || user?.role === 'ADMIN') return;

    const pollApproval = async () => {
      try {
        const stores = await storeService.getMyStores(false);
        const current = stores.find((s) => s.id === selectedStore.id);
        if (current && current.is_active) {
          toast.success(
            `🎉 Chúc mừng! Quán "${current.name}" đã được Admin phê duyệt mở bán!`,
            { duration: 6000 }
          );
          await loadData(current.id);
          setSearchParams({ tab: 'menu' });
        }
      } catch {
        // Bỏ qua âm thầm khi polling nền
      }
    };

    const timer = window.setInterval(pollApproval, 5000);
    return () => window.clearInterval(timer);
  }, [selectedStore?.id, selectedStore?.is_active, user?.role, loadData, setSearchParams]);

  // Tab switch
  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  // Switch store
  const handleSwitchStore = (store: Store) => {
    selectedStoreIdRef.current = store.id;
    setSelectedStore(store);
    setIsStoreDropdownOpen(false);
    loadData(store.id);
    toast.success(`Đã chuyển sang quản lý: ${store.name}`);
  };

  // Manual check approval status for pending store
  const handleCheckApprovalStatus = async () => {
    if (!selectedStore) return;
    setIsCheckingApproval(true);
    try {
      const stores = await storeService.getMyStores(user?.role === 'ADMIN');
      const current = stores.find((s) => s.id === selectedStore.id);
      if (current && current.is_active) {
        toast.success(
          `🎉 Chúc mừng! Quán "${current.name}" đã được Admin phê duyệt mở bán!`,
          { duration: 6000 }
        );
        await loadData(current.id);
        setSearchParams({ tab: 'menu' });
      } else {
        await loadData(selectedStore.id);
        toast('⏳ Hồ sơ quán vẫn đang chờ Quản trị viên phê duyệt...', { duration: 3000 });
      }
    } catch {
      toast.error('Không thể kiểm tra trạng thái duyệt lúc này');
    } finally {
      setIsCheckingApproval(false);
    }
  };

  // Create first store for new MERCHANT
  const handleCreateFirstStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim() || !newStoreAddress.trim()) {
      toast.error('Vui lòng nhập Tên cửa hàng và Địa chỉ!');
      return;
    }
    setIsCreatingStore(true);
    try {
      const created = await storeService.createStore({
        name: newStoreName.trim(),
        address: newStoreAddress.trim(),
        description: newStoreDesc.trim(),
      });
      setNewStoreName('');
      setNewStoreAddress('');
      setNewStoreDesc('');
      selectedStoreIdRef.current = created.id;
      if (!created.is_active) {
        toast.success(
          `📩 Đã gửi hồ sơ mở quán "${created.name}"! Vui lòng chờ Quản trị viên (Admin) phê duyệt để bắt đầu thêm món.`,
          { duration: 6000 }
        );
        await loadData(created.id);
      } else {
        toast.success(`Đã mở cửa hàng "${created.name}" thành công!`, { icon: '🎉' });
        await loadData(created.id);
        setSearchParams({ tab: 'menu' });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Không thể tạo cửa hàng.');
    } finally {
      setIsCreatingStore(false);
    }
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
      toast.error(err?.response?.data?.error || err.message || 'Lỗi khi cập nhật trạng thái quán');
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

            {/* Center: Active Store Pill / Multi-branch Switcher */}
            {selectedStore &&
              (allStores.length > 1 ? (
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
                            selectedStore.is_active ? 'text-emerald-600' : 'text-amber-600'
                          }
                        >
                          {selectedStore.is_active
                            ? 'Đang mở cửa'
                            : user?.role === 'ADMIN'
                              ? 'Chờ duyệt / Tạm đóng'
                              : 'Chờ Admin duyệt'}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-[#FF5A1F] transition-transform ml-1" />
                  </button>

                  {isStoreDropdownOpen && (
                    <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                        Chọn Quán Ăn Để Quản Lý
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
              ) : (
                <div className="flex items-center gap-3 p-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-orange-50/70 border border-orange-200/80">
                  <img
                    src={selectedStore.logo_s3_url}
                    alt={selectedStore.name}
                    className="w-8 h-8 rounded-xl object-cover border border-orange-200"
                  />
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-black text-gray-900 line-clamp-1">
                      {selectedStore.name}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-semibold">
                      <span className="flex items-center text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-amber-500" /> {selectedStore.rating || 4.8}
                      </span>
                      <span>•</span>
                      <span
                        className={
                          selectedStore.is_active ? 'text-emerald-600' : 'text-amber-600'
                        }
                      >
                        {selectedStore.is_active
                          ? 'Đang mở cửa'
                          : user?.role === 'ADMIN'
                            ? 'Chờ duyệt / Tạm đóng'
                            : 'Chờ Admin duyệt'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

            {/* Right: Trạng Thái Mở Cửa & Xem Trang Quán */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Trạng thái mở quán / Chờ Admin duyệt */}
              {selectedStore && !selectedStore.is_active && user?.role !== 'ADMIN' ? (
                <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>⏳ Chờ Admin duyệt</span>
                </span>
              ) : selectedStore && user?.role === 'ADMIN' ? (
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
              ) : selectedStore && selectedStore.is_active ? (
                <span
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                  title="Cửa hàng đang hoạt động công khai trên sàn"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Đang mở cửa</span>
                </span>
              ) : null}

              {/* Nút Xem trang quán dưới góc nhìn Khách hàng */}
              {selectedStore && (selectedStore.is_active || user?.role === 'ADMIN') && (
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

              {/* Link chuyển nhanh sang trang Đặt đồ ăn Khách hàng */}
              <Link
                to="/"
                className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs flex items-center gap-1.5 transition-colors"
                title="Chuyển sang giao diện Khách hàng để đặt món"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">🛒 Đặt đồ ăn (Khách)</span>
              </Link>

              {/* Đăng xuất */}
              <button
                type="button"
                onClick={() => {
                  logout();
                  toast.success('Đã đăng xuất tài khoản');
                  navigate('/login', { replace: true });
                }}
                className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Đăng xuất tài khoản"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Đăng xuất</span>
              </button>
            </div>
          </div>

          {/* 2. TABS NAVIGATION BAR (4 TAB CHÍNH) */}
          {selectedStore && (selectedStore.is_active || user?.role === 'ADMIN') && (
            <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none py-2 border-t border-gray-100">
              <button
                type="button"
                id="tab-analytics"
                onClick={() => handleTabChange('analytics')}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                  currentTab === 'analytics'
                    ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-orange-50/50'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>📊 Tổng Quan & Doanh Thu</span>
              </button>

              <button
                type="button"
                id="tab-orders"
                onClick={() => handleTabChange('orders')}
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

              <button
                type="button"
                id="tab-menu"
                onClick={() => handleTabChange('menu')}
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

              <button
                type="button"
                id="tab-settings"
                onClick={() => handleTabChange('settings')}
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
          )}
        </div>
      </header>

      {/* 3. NỘI DUNG TỪNG TAB HOẶC MÀN HÌNH TẠO CỬA HÀNG ĐẦU TIÊN */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!loading && !selectedStore ? (
          <div className="max-w-xl mx-auto bg-white rounded-3xl border border-orange-100 shadow-xl shadow-orange-500/5 p-6 sm:p-10 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
                <StoreIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#FF5A1F]">
                  Thiết lập cửa hàng đối tác
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-0.5">
                  Chào mừng Đối tác AstralFood! Hãy thiết lập cửa hàng đầu tiên của bạn
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-relaxed">
                  Điền thông tin cơ bản bên dưới để gửi hồ sơ đăng ký quán. Sau khi Quản trị viên (Admin) phê duyệt, bạn có thể thêm món ăn, tải ảnh S3 và bắt đầu nhận đơn ngay lập tức.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateFirstStore} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Tên cửa hàng <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <StoreIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Bún Bò Huế Cô Ba"
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#FFFDF9] border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#FF5A1F] focus:ring-2 focus:ring-orange-500/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Địa chỉ quán <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 123 Nguyễn Tri Phương, Q10, TP.HCM"
                    value={newStoreAddress}
                    onChange={(e) => setNewStoreAddress(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#FFFDF9] border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#FF5A1F] focus:ring-2 focus:ring-orange-500/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Mô tả ngắn <span className="text-gray-400 font-normal">(tùy chọn)</span>
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <textarea
                    rows={3}
                    placeholder="Ví dụ: Đặc sản bún bò chuẩn vị Huế, nước dùng ninh xương 12 tiếng..."
                    value={newStoreDesc}
                    onChange={(e) => setNewStoreDesc(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FFFDF9] border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#FF5A1F] focus:ring-2 focus:ring-orange-500/10 resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreatingStore}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isCreatingStore ? 'Đang khởi tạo cửa hàng...' : 'Mở Cửa Hàng Ngay'}</span>
              </button>
            </form>
          </div>
        ) : selectedStore && !selectedStore.is_active && user?.role !== 'ADMIN' ? (
          <div className="max-w-xl mx-auto bg-white rounded-3xl border border-amber-200 shadow-xl shadow-amber-500/5 p-6 sm:p-10 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold uppercase tracking-wider">
                  ⏳ Đang chờ Quản trị viên phê duyệt
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-2">
                  Hồ Sơ Cửa Hàng Đang Được Thẩm Định
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1.5 leading-relaxed">
                  Cửa hàng <span className="font-bold text-gray-900">{selectedStore.name}</span> đã được gửi lên hệ thống. Sau khi Quản trị viên (Admin) phê duyệt, bạn sẽ được mở khóa quyền thêm món ăn, hình ảnh S3 và nhận đơn hàng.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-orange-100 space-y-2 text-xs sm:text-sm text-gray-700">
              <p><span className="font-bold text-gray-900">Tên quán:</span> {selectedStore.name}</p>
              <p><span className="font-bold text-gray-900">Địa chỉ:</span> {selectedStore.address}</p>
              {selectedStore.description && (
                <p><span className="font-bold text-gray-900">Mô tả:</span> {selectedStore.description}</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleCheckApprovalStatus}
                disabled={isCheckingApproval}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${isCheckingApproval ? 'animate-spin' : ''}`} />
                <span>{isCheckingApproval ? 'Đang kiểm tra...' : 'Kiểm tra trạng thái duyệt'}</span>
              </button>
              <Link
                to="/"
                className="py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs sm:text-sm text-center"
              >
                Trong lúc chờ, dạo xem món ăn
              </Link>
            </div>
          </div>
        ) : (
          selectedStore && (
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
          )
        )}
      </main>
    </div>
  );
};

export default MerchantDashboardPage;