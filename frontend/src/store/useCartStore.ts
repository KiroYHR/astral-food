import { create } from 'zustand';
import type { Product, CartItem } from '../types';

const CART_STORAGE_KEY = 'astralfood_cart_v1';

interface CartState {
  items: CartItem[];
  storeId: string | null;
  storeName: string | null;
  voucherCode: string | null;
  discountAmount: number;
  isCartOpen: boolean;

  // Actions
  addItem: (product: Product, storeName: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyVoucher: (code: string) => { success: boolean; message: string };
  removeVoucher: () => void;
  setIsCartOpen: (open: boolean) => void;
  toggleCart: () => void;

  // Helpers
  getItemCount: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
}

const loadSavedCart = (): { items: CartItem[]; storeId: string | null; storeName: string | null } => {
  if (typeof window === 'undefined') return { items: [], storeId: null, storeName: null };
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        items: data.items || [],
        storeId: data.storeId || null,
        storeName: data.storeName || null,
      };
    }
  } catch (err) {
    console.error('Error reading cart from localStorage:', err);
  }
  return { items: [], storeId: null, storeName: null };
};

const saveCart = (items: CartItem[], storeId: string | null, storeName: string | null) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items, storeId, storeName }));
    } catch (err) {
      console.error('Error saving cart to localStorage:', err);
    }
  }
};

const initialCart = loadSavedCart();

export const useCartStore = create<CartState>((set, get) => ({
  items: initialCart.items,
  storeId: initialCart.storeId,
  storeName: initialCart.storeName,
  voucherCode: null,
  discountAmount: 0,
  isCartOpen: false,

  addItem: (product: Product, storeName: string) => {
    const { items, storeId } = get();

    // Nếu giỏ hàng đang chứa món của quán khác, reset giỏ hàng sang quán mới
    let currentItems = items;
    if (storeId && storeId !== product.store_id) {
      currentItems = [];
    }

    const existingIndex = currentItems.findIndex((i) => i.product.id === product.id);
    let updatedItems: CartItem[];

    if (existingIndex > -1) {
      updatedItems = [...currentItems];
      updatedItems[existingIndex].quantity += 1;
    } else {
      updatedItems = [
        ...currentItems,
        {
          product,
          quantity: 1,
          storeId: product.store_id,
          storeName,
        },
      ];
    }

    saveCart(updatedItems, product.store_id, storeName);
    set({
      items: updatedItems,
      storeId: product.store_id,
      storeName,
      isCartOpen: true, // Mở nhanh giỏ hàng để người dùng thấy món vừa thêm
    });
  },

  removeItem: (productId: string) => {
    const { items, storeId, storeName } = get();
    const updated = items.filter((i) => i.product.id !== productId);
    const newStoreId = updated.length === 0 ? null : storeId;
    const newStoreName = updated.length === 0 ? null : storeName;

    saveCart(updated, newStoreId, newStoreName);
    set({
      items: updated,
      storeId: newStoreId,
      storeName: newStoreName,
    });
  },

  updateQuantity: (productId: string, quantity: number) => {
    const { items, storeId, storeName } = get();
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    const updated = items.map((i) =>
      i.product.id === productId ? { ...i, quantity } : i
    );

    saveCart(updated, storeId, storeName);
    set({ items: updated });
  },

  clearCart: () => {
    saveCart([], null, null);
    set({
      items: [],
      storeId: null,
      storeName: null,
      voucherCode: null,
      discountAmount: 0,
    });
  },

  applyVoucher: (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const subtotal = get().getSubtotal();

    if (cleanCode === 'ASTRAL20') {
      if (subtotal < 60000) {
        return {
          success: false,
          message: 'Mã ASTRAL20 chỉ áp dụng cho đơn hàng từ 60.000đ!',
        };
      }
      set({ voucherCode: 'ASTRAL20', discountAmount: 20000 });
      return { success: true, message: 'Áp dụng mã ASTRAL20 thành công: Giảm 20.000đ!' };
    }

    if (cleanCode === 'FREESHIP') {
      set({ voucherCode: 'FREESHIP', discountAmount: 15000 });
      return { success: true, message: 'Áp dụng mã FREESHIP thành công: Giảm 15.000đ phí giao hàng!' };
    }

    return { success: false, message: 'Mã giảm giá không hợp lệ. Hãy thử: ASTRAL20 hoặc FREESHIP' };
  },

  removeVoucher: () => {
    set({ voucherCode: null, discountAmount: 0 });
  },

  setIsCartOpen: (open: boolean) => set({ isCartOpen: open }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

  getItemCount: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const { discountAmount } = get();
    return Math.max(0, subtotal - discountAmount);
  },
}));