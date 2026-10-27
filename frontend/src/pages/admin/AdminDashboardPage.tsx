import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Flame,
  TrendingUp,
  Store,
  Users,
  ShoppingBag,
  ExternalLink,
  ChefHat,
  Home,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Store as StoreType, User, Order, PlatformOverview } from '../../types';
import { adminService } from '../../api/services';
import PlatformOverviewTab from './components/PlatformOverviewTab';
import StoreApprovalTab from './components/StoreApprovalTab';
import UserManagementTab from './components/UserManagementTab';
import GlobalOrdersTab from './components/GlobalOrdersTab';

export const AdminDashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  // State
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all platform data
  const loadPlatformData = useCallback(async () => {
    try {
      const [ov, st, us, ord] = await Promise.all([
        adminService.getPlatformOverview(),
        adminService.getAllStoresForAdmin(),
        adminService.getUsers(),
        adminService.getAllPlatformOrders(),
      ]);

      setOverview(ov);
      setStores(st);
      setUsers(us);
      setOrders(ord);
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu Admin Portal:', err);
      toast.error('Không thể tải dữ liệu quản trị toàn sàn');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlatformData();
  }, [loadPlatformData]);

  // Real-time listener for database updates (when order placed, store approved, etc.)
  useEffect(() => {
    const handleSync = () => {
      loadPlatformData();
    };

    window.addEventListener('astralfood_db_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('astralfood_db_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [loadPlatformData]);

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  const pendingStoresCount = stores.filter((s) => !s.is_active).length;

  if (loading && !overview) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-gray-700">
            Đang khởi động System Admin Hub AstralFood...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#1E293B]">
      {/* 1. TOP NAVIGATION / SYSTEM ADMIN HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-purple-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
            {/* Left: Brand Logo & Admin Hub Badge */}
            <div className="flex items-center gap-3">
              <Link to="/admin" className="flex items-center gap-2 group">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
                  <Flame className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-purple-700 via-indigo-600 to-rose-500 bg-clip-text text-transparent">
                    AstralFood
                  </span>
                  <span className="block text-[10px] font-bold text-gray-400 tracking-wider uppercase -mt-1">
                    System Admin
                  </span>
                </div>
              </Link>

              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                🛡️ ADMIN TOÀN SÀN
              </span>
            </div>

            {/* Right: Quick Links to Customer & Merchant */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Badge thông báo quán chờ duyệt */}
              {pendingStoresCount > 0 && (
                <button
                  type="button"
                  onClick={() => handleTabChange('stores')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer animate-pulse transition-all"
                >
                  <span>⏳ {pendingStoresCount} Quán Chờ Duyệt</span>
                </button>
              )}

              {/* Sang Merchant Hub */}
              <Link
                id="btn-goto-merchant"
                to="/merchant"
                className="px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF5A1F] border border-orange-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Chuyển sang Giao diện Chủ quán"
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Merchant Hub</span>
              </Link>

              {/* Về Trang Chủ Khách Hàng */}
              <Link
                id="btn-goto-customer"
                to="/"
                className="px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Về Trang Khách Hàng"
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Trang Khách Hàng</span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </Link>
            </div>
          </div>

          {/* 2. TABS NAVIGATION (4 TAB CHÍNH) */}
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none py-2 border-t border-gray-100">
            {/* Tab 1: 📊 Tổng Quan */}
            <button
              type="button"
              id="admin-tab-overview"
              onClick={() => handleTabChange('overview')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                currentTab === 'overview'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-purple-50/50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>📊 Tổng Quan & Sức Khỏe Toàn Sàn</span>
            </button>

            {/* Tab 2: 🏪 Phê Duyệt Cửa Hàng */}
            <button
              type="button"
              id="admin-tab-stores"
              onClick={() => handleTabChange('stores')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                currentTab === 'stores'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-purple-50/50'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>🏪 Phê Duyệt & Quản Lý Cửa Hàng</span>
              {pendingStoresCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold animate-pulse">
                  {pendingStoresCount}
                </span>
              )}
            </button>

            {/* Tab 3: 👥 Quản Lý Người Dùng */}
            <button
              type="button"
              id="admin-tab-users"
              onClick={() => handleTabChange('users')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                currentTab === 'users'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-purple-50/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>👥 Quản Lý Người Dùng ({users.length})</span>
            </button>

            {/* Tab 4: 📦 Giám Sát Đơn Hàng */}
            <button
              type="button"
              id="admin-tab-orders"
              onClick={() => handleTabChange('orders')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                currentTab === 'orders'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-purple-50/50'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>📦 Giám Sát Đơn Hàng Toàn Sàn ({orders.length})</span>
            </button>
          </nav>
        </div>
      </header>

      {/* 3. NỘI DUNG TỪNG TAB */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'overview' && (
          <PlatformOverviewTab
            overview={overview}
            onNavigateToStores={() => handleTabChange('stores')}
          />
        )}

        {currentTab === 'stores' && (
          <StoreApprovalTab
            stores={stores}
            onRefreshData={loadPlatformData}
          />
        )}

        {currentTab === 'users' && (
          <UserManagementTab
            users={users}
            onRefreshData={loadPlatformData}
          />
        )}

        {currentTab === 'orders' && (
          <GlobalOrdersTab
            orders={orders}
            stores={stores}
          />
        )}
      </main>
    </div>
  );
};

export default AdminDashboardPage;