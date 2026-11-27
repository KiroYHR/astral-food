import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  ShoppingBag,
  Flame,
  Search,
  MapPin,
  User as UserIcon,
  FileText,
  LogOut,
  ChevronDown,
  X,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';

const DEFAULT_ADDRESS_KEY = 'astral_default_address';
const DEFAULT_ADDRESS_FALLBACK = '268 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM';

interface NavbarProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearch, searchQuery }) => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { getItemCount, toggleCart } = useCartStore();
  const itemCount = getItemCount();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [address, setAddress] = useState(() => {
    try {
      return localStorage.getItem(DEFAULT_ADDRESS_KEY) || DEFAULT_ADDRESS_FALLBACK;
    } catch {
      return DEFAULT_ADDRESS_FALLBACK;
    }
  });
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  const externalQuery = searchQuery !== undefined ? searchQuery : searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(externalQuery);
  const [isComposing, setIsComposing] = useState(false);
  const isComposingRef = useRef(false);
  const lastCommittedQueryRef = useRef(externalQuery);

  // Sync external URL / prop resets (e.g. "Khôi phục bộ lọc") without interrupting IME typing
  useEffect(() => {
    if (!isComposingRef.current && externalQuery !== lastCommittedQueryRef.current) {
      lastCommittedQueryRef.current = externalQuery;
      setInputValue(externalQuery);
    }
  }, [externalQuery]);

  const commitSearch = useCallback(
    (value: string) => {
      lastCommittedQueryRef.current = value;
      if (onSearch) {
        onSearch(value);
        return;
      }
      if (location.pathname === '/') {
        setSearchParams(value ? { q: value } : {}, { replace: true });
      } else if (value.trim()) {
        navigate(`/?q=${encodeURIComponent(value)}`);
      }
    },
    [onSearch, location.pathname, setSearchParams, navigate]
  );

  // Debounce router/URL updates so Vietnamese Telex/VNI IME composition is never interrupted
  useEffect(() => {
    if (isComposing || inputValue === lastCommittedQueryRef.current) {
      return;
    }
    const timer = window.setTimeout(() => {
      commitSearch(inputValue);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [inputValue, isComposing, commitSearch]);

  const commitAddress = (next: string) => {
    const cleaned = next.trim() || DEFAULT_ADDRESS_FALLBACK;
    setAddress(cleaned);
    try {
      localStorage.setItem(DEFAULT_ADDRESS_KEY, cleaned);
    } catch {
      // Ignore storage error
    }
    setIsEditingAddress(false);
  };

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
                  onBlur={() => commitAddress(address)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                      commitAddress(address);
                    }
                  }}
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
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onCompositionStart={() => {
                isComposingRef.current = true;
                setIsComposing(true);
              }}
              onCompositionEnd={(e) => {
                isComposingRef.current = false;
                setIsComposing(false);
                setInputValue(e.currentTarget.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  commitSearch(inputValue);
                }
              }}
              className="w-full pl-11 pr-10 py-2.5 text-sm bg-[#FFFDF9] border border-gray-200 rounded-full focus:outline-none focus:border-[#FF5A1F] focus:ring-2 focus:ring-orange-500/10 transition-all placeholder:text-gray-400"
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => {
                  setInputValue('');
                  commitSearch('');
                }}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer transition-colors"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Actions: Cart & User Account */}
        <div className="flex items-center gap-2.5 shrink-0">
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
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
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