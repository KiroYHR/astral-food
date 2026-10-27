import React, { useState } from 'react';
import { X, Store, MapPin, Tag, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../../api/services';

interface QuickStoreModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const QuickStoreModal: React.FC<QuickStoreModalProps> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [categoryTag, setCategoryTag] = useState('Ẩm thực Việt');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Vui lòng nhập tên cửa hàng');
      return;
    }
    if (!address.trim()) {
      toast.error('Vui lòng nhập địa chỉ quán');
      return;
    }

    try {
      setIsSubmitting(true);
      await adminService.createQuickMockStore({
        name: name.trim(),
        description: description.trim() || 'Hương vị thơm ngon hảo hạng, nguyên liệu sạch sẽ vệ sinh.',
        address: address.trim(),
        category_tag: categoryTag.trim(),
        logo_s3_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
      });

      toast.success(`🎉 Đã đăng ký quán "${name}" thành công ở trạng thái Chờ duyệt!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tạo cửa hàng mới');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-orange-500 to-rose-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">Đăng Ký Thử Quán Mới (Chờ Duyệt)</h3>
              <p className="text-[11px] text-orange-100">
                Tạo nhanh đối tác quán mới để thẩm định quy trình phê duyệt
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-gray-700 uppercase tracking-wider">
              Tên Cửa Hàng / Quán Ăn <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Cơm Gà Xối Mỡ Nha Trang"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F] text-gray-900 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-gray-700 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-[#FF5A1F]" /> Thể loại
              </label>
              <input
                type="text"
                placeholder="VD: Cơm gà, Ăn vặt..."
                value={categoryTag}
                onChange={(e) => setCategoryTag(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F] text-gray-900"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-gray-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" /> Quận / Khu vực
              </label>
              <input
                type="text"
                required
                placeholder="VD: 15 Lê Văn Sỹ, Q.3, TP.HCM"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F] text-gray-900"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-gray-700">Mô tả ngắn</label>
            <textarea
              rows={2}
              placeholder="Gà ta thả vườn xối mỡ da giòn rụm, cơm chiên hoàng kim..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F] text-gray-900"
            />
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black shadow-xs hover:opacity-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang tạo...' : 'Tạo Quán Chờ Duyệt'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickStoreModal;