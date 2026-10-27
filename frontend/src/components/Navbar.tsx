import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Flame, Search, MapPin, User as UserIcon, FileText, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';

interface NavbarProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearch, searchQuery }) => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { getItemCount, toggleCart } = useCartStore();
  const itemCount = getItemCount();
  const navigate = useNavigate();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [address, setAddress] = useState('268 Lý Thường Kiệt, Phường 14, Quận 10');
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F1EFE9] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo & Slogan */}
        <div className="flex items-center gap-6 shrink-0">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-11 h-11 rounded-2xl bg-coral-gradient flex items-center justify-center text-white shadow-md shadow-orange-500/25 group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6 fill-white" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-coral-gradient block leading-none">
                AstralFood
              </span>
              <span className="text-[11px] text-gray-400 font-semibold tracking-wider uppercase mt-1 block">
                Món Ngon Giao Siêu Tốc
              </span>
            </div>
          </Link>

          {/* Delivery Location Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFFDF9] border border-orange-200/80 text-xs text-gray-700">
            <MapPin className="w-4 h-4 text-[#FF5A1F] shrink-0" />
            <div className="text-left">
              <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">
                Giao đến
              </span>
              {isEditingAddress ? (
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onBlur={() => setIsEditingAddress(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingAddress(false)}
                  autoFocus
                  className="w-56 text-xs font-bold text-gray-900 border-b border-orange-500 focus:outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingAddress(true)}
                  className="font-bold text-gray-800 hover:text-[#FF5A1F] transition-colors truncate max-w-[200px] text-left block cursor-pointer"
                  title="Bấm để đổi địa chỉ nhận hàng"
                >
                  {address}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-lg hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Bạn muốn ăn gì hôm nay? (Cơm tấm, trà sữa, phở bò...)"
              value={searchQuery || ''}
              onChange={(e) => onSearch && onSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 text-sm bg-[#FFFDF9] border border-gray-200 rounded-full focus:outline-none focus:border-[#FF5A1F] focus:ring-2 focus:ring-orange-500/10 transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Right Actions: Cart & User Account */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Cart Button */}
          <button
            onClick={toggleCart}
            type="button"
            className="relative p-2.5 rounded-full bg-white hover:bg-orange-50 border border-orange-200 text-[#FF5A1F] transition-all hover:scale-105 shadow-xs cursor-pointer flex items-center gap-2 px-3"
            title="Xem giỏ hàng"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#FF5A1F] text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-bounce">
                  {itemCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline text-xs font-bold text-gray-800">
              Giỏ hàng
            </span>
          </button>

          {/* User Account Menu */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-full bg-[#FFFDF9] hover:bg-orange-50 border border-gray-200 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-coral-gradient text-white flex items-center justify-center font-black text-xs shadow-xs">
                  {user.full_name ? user.full_name.charAt(0) : 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-gray-900 leading-tight">
                    {user.full_name}
                  </p>
                  <p className="text-[10px] text-gray-400 leading-none">
                    {user.phone || user.email}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-900">{user.full_name}</p>
                    <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                  </div>

                  <Link
                    to="/my-orders"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-orange-50 hover:text-[#FF5A1F] transition-colors"
                  >
                    <FileText className="w-4 h-4 text-orange-500" />
                    <span>Đơn hàng của tôi</span>
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-orange-50 hover:text-[#FF5A1F] transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-amber-500" />
                    <span>Hồ sơ tài khoản</span>
                  </Link>

                  <div className="border-t border-gray-100 my-1"></div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-[#FF5A1F] hover:bg-orange-50 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-coral-gradient text-white shadow-xs hover:opacity-95 transition-opacity"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};