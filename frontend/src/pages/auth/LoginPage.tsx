import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, Mail, Lock, ArrowRight, UserCheck, ShieldCheck, Zap } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const { login, quickSwitchRole } = useAuthStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Vui lòng nhập địa chỉ email!');
      return;
    }
    setIsLoading(true);
    try {
      await login(email);
      toast.success('Đăng nhập thành công! Chào mừng bạn quay trở lại.', { icon: '🎉' });
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Đăng nhập không thành công.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (role: 'CUSTOMER' | 'MERCHANT' | 'ADMIN', demoEmail: string) => {
    quickSwitchRole(role);
    toast.success(`Đã đăng nhập nhanh với tài khoản: ${demoEmail}`, { icon: '⚡' });
    if (role === 'MERCHANT') navigate('/merchant');
    else if (role === 'ADMIN') navigate('/admin');
    else navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Cột trái: Poster Ẩm thực rực rỡ */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-900">
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop&q=80"
          alt="AstralFood Culinary"
          className="absolute inset-0 w-full h-full object-cover opacity-75 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

        <div className="relative z-10 p-12 flex flex-col justify-between text-white w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-coral-gradient flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
              <Flame className="w-6 h-6 fill-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">AstralFood</span>
          </Link>

          {/* Slogan & Value Props */}
          <div className="space-y-4 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/30 text-orange-300 text-xs font-bold border border-orange-500/40 backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 fill-orange-400" />
              <span>Giao Món Siêu Tốc 20-30 Phút</span>
            </div>
            <h2 className="text-4xl font-black leading-tight tracking-tight">
              Giao Trọn Vị Ngon, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-rose-400">
                Nóng Hổi Tận Tay
              </span>
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed">
              Khám phá thực đơn đa dạng từ hàng nghìn quán ngon tuyển chọn. Đặt món dễ dàng, tích điểm đổi quà và tận hưởng ưu đãi freeship ngập tràn mỗi ngày.
            </p>
          </div>

          {/* Bottom Trust Badge */}
          <div className="flex items-center gap-6 text-xs text-gray-400 pt-6 border-t border-white/10">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% An toàn vệ sinh</span>
            <span className="flex items-center gap-1.5"><UserCheck className="w-4 h-4 text-amber-400" /> Hơn 50.000+ thực khách</span>
          </div>
        </div>
      </div>

      {/* Cột phải: Form Đăng Nhập */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-[#FFFDF9]">
        <div className="max-w-md w-full space-y-8">
          <div>
            <Link to="/" className="lg:hidden flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-xl bg-coral-gradient flex items-center justify-center text-white">
                <Flame className="w-5 h-5 fill-white" />
              </div>
              <span className="text-xl font-black text-coral-gradient">AstralFood</span>
            </Link>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Đăng Nhập Tài Khoản
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1.5">
              Chào mừng bạn trở lại! Nhập thông tin để tiếp tục bữa tiệc món ngon.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#FF5A1F] focus:ring-2 focus:ring-orange-500/10 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#FF5A1F] focus:ring-2 focus:ring-orange-500/10 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-coral-gradient hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              {isLoading ? 'Đang xử lý...' : 'Đăng Nhập Ngay'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Login Buttons */}
          <div className="space-y-3 pt-4 border-t border-gray-200/80">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">
              Hoặc đăng nhập nhanh bằng tài khoản mẫu:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('CUSTOMER', 'customer@astralfood.vn')}
                className="p-2.5 rounded-xl border border-orange-200 bg-orange-50/60 hover:bg-orange-100 text-[#FF5A1F] text-xs font-bold transition-all text-center cursor-pointer"
              >
                Khách Hàng
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('MERCHANT', 'merchant@astralfood.vn')}
                className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100 text-amber-700 text-xs font-bold transition-all text-center cursor-pointer"
              >
                Chủ Quán
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('ADMIN', 'admin@astralfood.vn')}
                className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-all text-center cursor-pointer"
              >
                Admin
              </button>
            </div>
          </div>

          {/* Footer Link */}
          <div className="text-center text-xs text-gray-500">
            Chưa có tài khoản AstralFood?{' '}
            <Link to="/register" className="font-bold text-[#FF5A1F] hover:underline">
              Đăng ký ngay tại đây
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;