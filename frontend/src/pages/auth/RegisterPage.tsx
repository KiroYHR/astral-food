import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Flame,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  Store,
  Zap,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { authService } from '../../api/services';
import { useAuthStore } from '../../store/useAuthStore';
import type { EmailVerificationInfo } from '../../types';
import toast from 'react-hot-toast';

export const RegisterPage: React.FC = () => {
  const { initAuth } = useAuthStore();
  const navigate = useNavigate();

  const [role, setRole] = useState<'CUSTOMER' | 'MERCHANT'>('CUSTOMER');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [verificationInfo, setVerificationInfo] = useState<EmailVerificationInfo | null>(null);
  const [registeredRole, setRegisteredRole] = useState<'CUSTOMER' | 'MERCHANT'>('CUSTOMER');
  const [isCheckingVerify, setIsCheckingVerify] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const navigateByRole = (userRole: string) => {
    if (userRole === 'ADMIN') navigate('/admin', { replace: true });
    else if (userRole === 'MERCHANT') navigate('/merchant', { replace: true });
    else navigate('/', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      toast.error('Vui lòng điền đầy đủ họ tên, email và số điện thoại!');
      return;
    }
    if (password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.register({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role,
      });
      initAuth();
      const targetRole = (res.user?.role || role) as 'CUSTOMER' | 'MERCHANT';
      toast.success(`Đăng ký tài khoản ${targetRole === 'MERCHANT' ? 'Chủ quán' : 'Khách hàng'} thành công!`, {
        icon: '🎉',
      });

      if (res.email_verification && !res.email_verification.verified) {
        setRegisteredRole(targetRole);
        setVerificationInfo(res.email_verification);
        return;
      }

      navigateByRole(targetRole);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsCheckingVerify(true);
    try {
      const status = await authService.getEmailVerificationStatus();
      setVerificationInfo(status);
      if (status.verified) {
        toast.success('Email đã được xác thực thành công! Đang chuyển trang...', { icon: '✅' });
        navigateByRole(registeredRole);
      } else {
        toast('Chưa thấy xác nhận. Hãy kiểm tra hộp thư (kể cả mục Spam) và bấm link AWS gửi nhé!', {
          icon: '📩',
        });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Không thể kiểm tra trạng thái xác thực.');
    } finally {
      setIsCheckingVerify(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const status = await authService.resendVerificationEmail();
      setVerificationInfo(status);
      if (status.verified) {
        toast.success('Email đã được xác thực sẵn!', { icon: '✅' });
        navigateByRole(registeredRole);
      } else if (status.sent) {
        toast.success('Đã gửi lại email xác thực tới hộp thư của bạn!');
      } else {
        toast.error(status.message || 'Chưa thể gửi lại email xác thực.');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Không thể gửi lại email xác thực.');
    } finally {
      setIsResending(false);
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

      {/* Cột phải: Form Đăng Ký hoặc Card Hướng Dẫn Xác Thực Email AWS SES */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-[#FFFDF9]">
        {verificationInfo !== null ? (
          <div className="max-w-md w-full bg-white rounded-3xl border border-orange-100 shadow-xl shadow-orange-500/5 p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#FF5A1F] shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#FF5A1F]">
                  Bước cuối cùng — Xác thực AWS SES
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Kiểm Tra Hộp Thư Gmail
                </h1>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-orange-200/80 space-y-2.5 text-xs sm:text-sm text-gray-700">
              <p>
                Tài khoản của bạn đã được tạo thành công cho email:{' '}
                <span className="font-bold text-gray-900 break-all">{verificationInfo.email}</span>
              </p>
              <p className="text-gray-600 leading-relaxed">{verificationInfo.message}</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs text-amber-900">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Hướng dẫn bấm xác nhận trong 10 giây:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-amber-900/90 leading-relaxed">
                <li>
                  Mở hộp thư đến của <span className="font-bold">{verificationInfo.email}</span> (kiểm tra thêm mục{' '}
                  <span className="font-bold">Spam / Thư rác / Quảng cáo</span> nếu chưa thấy).
                </li>
                <li>
                  Tìm email có tiêu đề:{' '}
                  <span className="font-bold text-gray-900">
                    Amazon Web Services – Email Address Verification Request
                  </span>
                </li>
                <li>Bấm vào đường link xác thực bên trong email rồi quay lại bấm nút kiểm tra bên dưới.</li>
              </ol>
              <div className="pt-1">
                <a
                  href="https://mail.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF5A1F] hover:underline"
                >
                  <span>Mở Gmail trong tab mới</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleCheckVerification}
                disabled={isCheckingVerify || isResending}
                className="w-full py-3.5 px-4 rounded-xl bg-coral-gradient hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                {isCheckingVerify ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{isCheckingVerify ? 'Đang kiểm tra với AWS SES...' : 'Tôi đã bấm xác nhận — Kiểm tra lại'}</span>
              </button>

              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isCheckingVerify || isResending}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
                <span>{isResending ? 'Đang gửi lại email...' : 'Gửi lại email xác thực'}</span>
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => navigateByRole(registeredRole)}
                  className="text-xs font-semibold text-gray-500 hover:text-[#FF5A1F] hover:underline cursor-pointer"
                >
                  Bỏ qua, vào trang chủ ngay
                </button>
              </div>
            </div>
          </div>
        ) : (
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
                <label className="block text-xs font-bold text-gray-700 mb-2">Bạn muốn tham gia với tư cách:</label>
                <div className="grid grid-cols-2 gap-3">
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
                    minLength={6}
                    placeholder="Tối thiểu 6 ký tự"
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
        )}
      </div>
    </div>
  );
};

export default RegisterPage;