import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Mail, RefreshCw, CheckCircle2, X } from 'lucide-react';
import { authService } from '../api/services';
import { useAuthStore } from '../store/useAuthStore';
import type { EmailVerificationInfo } from '../types';
import toast from 'react-hot-toast';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const SesVerificationBanner: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [info, setInfo] = useState<EmailVerificationInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const notifiedVerifiedRef = useRef(false);
  const skipBannerForUser =
    !user ||
    user.role === 'ADMIN' ||
    Boolean(user.email && user.email.toLowerCase().endsWith('@astralfood.com'));

  const showVerifiedSuccessToast = useCallback((res: EmailVerificationInfo) => {
    if (notifiedVerifiedRef.current) return;
    notifiedVerifiedRef.current = true;
    const hasWelcome = res.welcome_email_sent || res.welcomeEmailSent;
    toast.success(
      hasWelcome
        ? 'Email đã xác thực thành công! Đã gửi email chào mừng vào Gmail của bạn.'
        : 'Email đã xác thực thành công! Bạn đã có thể nhận hóa đơn qua Gmail.',
      { icon: '✅', duration: 4000 }
    );
  }, []);

  useEffect(() => {
    let active = true;
    if (USE_MOCK || !isAuthenticated || skipBannerForUser) {
      setInfo(null);
      return;
    }

    notifiedVerifiedRef.current = false;
    setDismissed(false);
    authService
      .getEmailVerificationStatus()
      .then((res) => {
        if (active) setInfo(res);
      })
      .catch(() => {
        // Bỏ qua âm thầm nếu token hết hạn hoặc mạng chập chờn
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, user?.id]);

  const shouldAutoCheck = Boolean(
    !USE_MOCK && isAuthenticated && !skipBannerForUser && !dismissed && info && !info.verified
  );

  useEffect(() => {
    if (!shouldAutoCheck) return;

    const onReturnToTab = () => {
      if (document.visibilityState !== 'visible') return;
      authService
        .getEmailVerificationStatus(true)
        .then((res) => {
          setInfo(res);
          if (res.verified) {
            showVerifiedSuccessToast(res);
          }
        })
        .catch(() => {
          // Bỏ qua âm thầm khi kiểm tra lúc quay lại tab
        });
    };

    window.addEventListener('focus', onReturnToTab);
    document.addEventListener('visibilitychange', onReturnToTab);

    return () => {
      window.removeEventListener('focus', onReturnToTab);
      document.removeEventListener('visibilitychange', onReturnToTab);
    };
  }, [shouldAutoCheck, showVerifiedSuccessToast]);

  if (USE_MOCK || !isAuthenticated || skipBannerForUser || dismissed || !info || info.verified) {
    return null;
  }

  const handleResend = async () => {
    setIsResending(true);
    try {
      const res = await authService.resendVerificationEmail();
      setInfo(res);
      if (res.verified) {
        showVerifiedSuccessToast(res);
      } else if (res.sent) {
        toast.success('Đã gửi lại email xác thực AWS SES! Hãy kiểm tra Gmail (cả mục Spam).');
      } else {
        toast.error(res.message || 'Chưa thể gửi lại email xác thực.');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Không thể gửi lại email xác thực.');
    } finally {
      setIsResending(false);
    }
  };

  const handleCheck = async () => {
    setIsChecking(true);
    try {
      const res = await authService.getEmailVerificationStatus(true);
      setInfo(res);
      if (res.verified) {
        showVerifiedSuccessToast(res);
      } else {
        toast('Chưa thấy xác nhận. Hãy mở mail từ Amazon Web Services và bấm link xác nhận nhé!', {
          icon: '📩',
        });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Không thể kiểm tra trạng thái xác thực.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
          <Mail className="w-4 h-4 text-[#FF5A1F] shrink-0" />
          <p className="leading-snug">
            Email <span className="font-bold">{info.email || user.email}</span> chưa xác thực với{' '}
            <span className="font-bold">AWS SES</span> nên chưa thể nhận hóa đơn qua Gmail. Vui lòng mở mail từ{' '}
            <span className="font-semibold">Amazon Web Services</span> (kể cả mục Spam) để bấm xác nhận.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || isChecking}
            className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
            <span>{isResending ? 'Đang gửi...' : 'Gửi lại email'}</span>
          </button>

          <button
            type="button"
            onClick={handleCheck}
            disabled={isChecking || isResending}
            className="px-2.5 py-1 rounded-lg bg-[#FF5A1F] hover:opacity-95 text-white font-bold flex items-center gap-1 transition-opacity cursor-pointer disabled:opacity-60"
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>{isChecking ? 'Đang kiểm...' : 'Kiểm tra lại'}</span>
          </button>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg text-amber-700 hover:bg-amber-200/60 transition-colors cursor-pointer"
            title="Ẩn thông báo này"
            aria-label="Ẩn thông báo xác thực email"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};