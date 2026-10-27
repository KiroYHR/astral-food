import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, Mail, Lock, User, Phone, ArrowRight, ShieldCheck, UserCheck, Zap, Store } from 'lucide-react';
import { authService } from '../../api/services';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

export const RegisterPage: React.FC = () => {
  const { initAuth } = useAuthStore();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'MERCHANT'>('CUSTOMER');
  const [password, setPassword] = useState('123456');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      toast.error('Vui lòng điền đầy đủ họ tên, email và số điện thoại!');
      return;
    }

    setIsLoading(true);
    try {
      await authService.register({
        full_name: fullName,
        email,
        phone,
        role,
      });
      initAuth();
      toast.success(`Đăng ký tài khoản ${role === 'CUSTOMER' ? 'Khách hàng' : 'Chủ quán'} thành công!`, {
        icon: '🎉',
      });
      if (role === 'MERCHANT') navigate('/merchant');
      else navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Cột trái: Poster Ẩm thực */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-900">
        <img
          src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80"
          alt="AstralFood Join Us"
          className="absolute inset-0 w-full h-full object-cover opacity-75 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

        <div className="relative z-10 p-12 flex flex-col justify-between text-white w-full">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-coral-gradient flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
              <Flame className="w-6 h-6 fill-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">AstralFood</span>
          </Link>

          <div className="space-y-4 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/30 text-orange-300 text-xs font-bold border border-orange-500/40 backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 fill-orange-400" />
              <span>Gia Nhập Cộng Đồng Ẩm Thực Số 1</span>
            </div>
            <h2 className="text-4xl font-black leading-tight tracking-tight">
              Mở Khóa Thế Giới <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-rose-400">
                Ẩm Thực Tuyệt Đỉnh
              </span>
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed">
              Dù bạn là thực khách tìm kiếm bữa ăn thơm ngon hay chủ quán muốn đưa thương hiệu tiếp cận hàng triệu khách hàng, AstralFood luôn đồng hành cùng bạn.
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs text-gray-400 pt-6 border-t border-white/10">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Miễn phí đăng ký</span>
            <span className="flex items-center gap-1.5"><UserCheck className="w-4 h-4 text-amber-400" /> Nhận ngay voucher 20k</span>
          </div>
        </div>
      </div>

      {/* Cột phải: Form Đăng Ký */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-[#FFFDF9]">
        <div className="max-w-md w-full space-y-6">
          <div>
            <Link to="/" className="lg:hidden flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-xl bg-coral-gradient flex items-center justify-center text-white">
                <Flame className="w-5 h-5 fill-white" />
              </div>
              <span className="text-xl font-black text-coral-gradient">AstralFood</span>
            </Link>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Đăng Ký Tài Khoản
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Điền thông tin bên dưới để tạo tài khoản mới nhanh chóng.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Chọn vai trò */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Bạn tham gia với tư cách:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('CUSTOMER')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    role === 'CUSTOMER'
                      ? 'bg-orange-50 border-orange-500 text-[#FF5A1F] shadow-xs'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Khách Hàng</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('MERCHANT')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    role === 'MERCHANT'
                      ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-xs'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>Chủ Quán Ăn</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Họ và tên</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Địa chỉ Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Số điện thoại</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="0901234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-coral-gradient hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              {isLoading ? 'Đang tạo tài khoản...' : 'Hoàn Tất Đăng Ký'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center text-xs text-gray-500">
            Đã có tài khoản AstralFood?{' '}
            <Link to="/login" className="font-bold text-[#FF5A1F] hover:underline">
              Đăng nhập tại đây
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;