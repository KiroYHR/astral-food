import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import type { Product, Store } from '../types';
import { useCartStore } from '../store/useCartStore';
import toast from 'react-hot-toast';

interface FoodDetailModalProps {
  product: Product | null;
  store: Store | null;
  onClose: () => void;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({ product, store, onClose }) => {
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  if (!product || !store) return null;

  const handleAddToCart = () => {
    // Thêm món vào giỏ với số lượng đã chọn
    for (let i = 0; i < quantity; i++) {
      addItem(product, store.name);
    }
    toast.success(`Đã thêm ${quantity}x "${product.name}" vào giỏ hàng!`, {
      icon: '🛒',
    });
    onClose();
  };

  const totalPrice = product.price * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Modal Image Header */}
        <div className="relative h-60 w-full overflow-hidden bg-gray-100 shrink-0">
          <img
            src={product.image_s3_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Tags */}
          <div className="absolute bottom-3 left-4 flex flex-wrap gap-1.5">
            {product.tags?.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded-md bg-white/90 text-gray-800 text-[10px] font-bold backdrop-blur-xs shadow-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xl font-black text-gray-900 leading-tight">
                {product.name}
              </h3>
              <span className="text-xl font-black text-[#FF5A1F] shrink-0">
                {product.price.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Note Input */}
          <div className="space-y-1.5 pt-2 border-t border-gray-100">
            <label className="block text-xs font-bold text-gray-700">
              Ghi chú cho đầu bếp / quán (tùy chọn):
            </label>
            <input
              type="text"
              placeholder="VD: 50% đường, ít đá, nhiều nước sốt, không hành..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-[#FFFDF9] border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-xs font-bold text-gray-700">Số lượng:</span>
            <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 text-sm font-black text-gray-900">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Action */}
        <div className="p-5 border-t border-gray-100 bg-[#FFFDF9] shrink-0">
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full py-3.5 px-4 rounded-2xl bg-coral-gradient hover:opacity-95 text-white font-black text-sm shadow-lg shadow-orange-500/25 flex items-center justify-between transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Thêm vào giỏ hàng</span>
            </span>
            <span>{totalPrice.toLocaleString('vi-VN')} đ</span>
          </button>
        </div>
      </div>
    </div>
  );
};