import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Shield, Save } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

export const ProfilePage: React.FC = () => {
  const { user, initAuth } = useAuthStore();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [defaultAddress, setDefaultAddress] = useState('268 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setPhone(user.phone);
    }
  }, [user]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const updatedUser = {
      ...user,
      full_name: fullName,
      phone: phone,
    };

    localStorage.setItem('astral_user', JSON.stringify(updatedUser));
    initAuth();
    toast.success('Đã cập nhật thông tin tài khoản thành công!', { icon: '✅' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Hồ Sơ Cá Nhân
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Quản lý thông tin tài khoản, số điện thoại và sổ địa chỉ nhận hàng
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* User Card */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-coral-gradient text-white flex items-center justify-center font-black text-2xl mx-auto shadow-lg shadow-orange-500/20">
            {fullName ? fullName.charAt(0) : 'U'}
          </div>

          <div>
            <h3 className="font-black text-lg text-gray-900">{fullName}</h3>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-[#FF5A1F] text-xs font-bold border border-orange-200">
            <Shield className="w-3.5 h-3.5" />
            <span>Vai trò: {user?.role || 'CUSTOMER'}</span>
          </div>
        </div>

        {/* Edit Form */}
        <div className="md:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs space-y-6">
          <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
            <User className="w-4 h-4 text-[#FF5A1F]" />
            <span>Thông Tin Chi Tiết</span>
          </h3>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block text-gray-700 font-bold mb-1.5">Họ và tên:</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FFFDF9] border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1.5">Email (không thể thay đổi):</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-9 pr-3.5 py-2.5 bg-gray-100 text-gray-500 border border-gray-200 rounded-xl font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1.5">Số điện thoại liên lạc:</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#FFFDF9] border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-1.5">Địa chỉ nhận hàng mặc định:</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={defaultAddress}
                  onChange={(e) => setDefaultAddress(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#FFFDF9] border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-3 bg-coral-gradient hover:opacity-95 text-white font-bold rounded-xl shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer transition-opacity"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Thay Đổi</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;