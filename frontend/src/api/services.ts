import apiClient from './client';
import { getMockDb, saveMockDb } from './mockData';
import type {
  User,
  Store,
  Category,
  Product,
  Order,
  OrderStatus,
  StoreAnalytics,
  AuthResponse,
  CreateOrderPayload,
  PresignedUrlResponse,
  AICopilotResponse,
} from '../types';

// Kiểm tra cờ Mock từ biến môi trường (mặc định là true nếu chưa cấu hình)
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

// Helper tạo độ trễ giả lập mạng (200ms) để giao diện có hiệu ứng mượt mà
const mockDelay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

// ==========================================
// 1. AUTH SERVICE (TV1 RESTful Contract)
// ==========================================
export const authService = {
  async login(email: string): Promise<AuthResponse> {
    if (USE_MOCK) {
      await mockDelay();
      const db = getMockDb();
      const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        throw new Error('Email không tồn tại trong hệ thống. Hãy thử tài khoản mẫu.');
      }
      const token = `mock-jwt-token-for-${user.id}-${Date.now()}`;
      localStorage.setItem('astral_token', token);
      localStorage.setItem('astral_user', JSON.stringify(user));
      return {
        access_token: token,
        token_type: 'Bearer',
        user: user,
      };
    }
    const res: any = await apiClient.post('/auth/login', { email });
    if (res.access_token) {
      localStorage.setItem('astral_token', res.access_token);
      localStorage.setItem('astral_user', JSON.stringify(res.user));
    }
    return res;
  },

  async register(payload: {
    email: string;
    full_name: string;
    phone: string;
    role: 'CUSTOMER' | 'MERCHANT';
  }): Promise<AuthResponse> {
    if (USE_MOCK) {
      await mockDelay();
      const db = getMockDb();
      const existing = db.users.find((u) => u.email.toLowerCase() === payload.email.toLowerCase());
      if (existing) {
        throw new Error('Email này đã được đăng ký tài khoản!');
      }
      const newUser: User = {
        id: `user-${Date.now()}`,
        email: payload.email,
        full_name: payload.full_name,
        phone: payload.phone,
        role: payload.role,
        created_at: new Date().toISOString(),
      };
      db.users.push(newUser);
      saveMockDb(db);

      const token = `mock-jwt-token-for-${newUser.id}`;
      localStorage.setItem('astral_token', token);
      localStorage.setItem('astral_user', JSON.stringify(newUser));
      return {
        access_token: token,
        token_type: 'Bearer',
        user: newUser,
      };
    }
    const res: any = await apiClient.post('/auth/register', payload);
    return res;
  },

  async getMe(): Promise<User> {
    if (USE_MOCK) {
      await mockDelay(100);
      const rawUser = localStorage.getItem('astral_user');
      if (rawUser) {
        return JSON.parse(rawUser);
      }
      const db = getMockDb();
      return db.users[0]; // Mặc định là tài khoản customer đầu tiên
    }
    const res: any = await apiClient.get('/users/me');
    return res;
  },

  logout(): void {
    localStorage.removeItem('astral_token');
    localStorage.removeItem('astral_user');
  },
};

// ==========================================
// 2. STORE SERVICE (TV1 RESTful Contract)
// ==========================================
export const storeService = {
  async getStores(params?: { search?: string; category?: string }): Promise<Store[]> {
    if (USE_MOCK) {
      await mockDelay();
      const db = getMockDb();
      let list = db.stores.filter((s) => s.is_active);

      if (params?.category && params.category !== 'Tất cả') {
        list = list.filter((s) => s.category_tag?.toLowerCase().includes(params.category!.toLowerCase()));
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
      }
      return list;
    }
    const res: any = await apiClient.get('/stores', { params });
    return res;
  },

  async getStoreById(id: string): Promise<Store> {
    if (USE_MOCK) {
      await mockDelay();
      const db = getMockDb();
      const store = db.stores.find((s) => s.id === id);
      if (!store) throw new Error('Không tìm thấy thông tin cửa hàng.');
      return store;
    }
    const res: any = await apiClient.get(`/stores/${id}`);
    return res;
  },

  async getMyStore(): Promise<Store> {
    if (USE_MOCK) {
      await mockDelay();
      const db = getMockDb();
      const myStore = db.stores.find((s) => s.owner_id === 'user-merchant-1') || db.stores[0];
      return myStore;
    }
    const res: any = await apiClient.get('/stores/me');
    return res;
  },

  async updateStore(id: string, data: Partial<Store>): Promise<Store> {
    if (USE_MOCK) {
      await mockDelay();
      const db = getMockDb();
      const index = db.stores.findIndex((s) => s.id === id);
      if (index === -1) throw new Error('Cửa hàng không tồn tại');
      db.stores[index] = { ...db.stores[index], ...data };
      saveMockDb(db);
      return db.stores[index];
    }
    const res: any = await apiClient.put(`/stores/${id}`, data);
    return res;
  },

  async getCategories(storeId: string): Promise<Category[]> {
    if (USE_MOCK) {
      await mockDelay(100);
      const db = getMockDb();
      return db.categories.filter((c) => c.store_id === storeId);
    }
    const res: any = await apiClient.get(`/stores/${storeId}/categories`);
    return res;
  },

  async createCategory(storeId: string, name: string): Promise<Category> {
    if (USE_MOCK) {
      await mockDelay();
      const db = getMockDb();
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        store_id: storeId,
        name,
        display_order: db.categories.length + 1,
      };
      db.categories.push(newCat);
      saveMockDb(db);
      return newCat;
    }
    const res: any = await apiClient.post('/categories', { store_id: storeId, name });
    return res;
  },
};

// ==========================================
// 3. PRODUCT SERVICE (TV1 RESTful Contract)
// ==========================================
export const productService = {
  async getProductsByStore(storeId: string): Promise<Product[]> {
    if (USE_MOCK) {
      await mockDelay();
      const db = getMockDb();
      return db.products.filter((p) => p.store_id === storeId);
    }
    const res: any = await apiClient.get(`/stores/${storeId}/products`);
    return res;
  },

  async createProduct(data: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    if (USE_MOCK) {
      await mockDelay();
      const db = getMockDb();
      const newProduct: Product = {
        ...data,
        id: `prod-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      db.products.unshift(newProduct);
      saveMockDb(db);
      return newProduct;
    }
    const res: any = await apiClient.post('/products', data);
    return res;
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    if (USE_MOCK) {
      await mockDelay();
      const db = getMockDb();
      const index = db.products.findIndex((p) => p.id === id);
      if (index === -1) throw new Error('Không tìm thấy món ăn');
      db.products[index] = { ...db.products[index], ...data };
      saveMockDb(db);
      return db.products[index];
    }
    const res: any = await apiClient.patch(`/products/${id}`, data);
    return res;
  },

  async toggleProductAvailability(id: string): Promise<Product> {
    if (USE_MOCK) {
      await mockDelay(100);
      const db = getMockDb();
      const product = db.products.find((p) => p.id === id);
      if (!product) throw new Error('Không tìm thấy món ăn');
      product.is_available = !product.is_available;
      saveMockDb(db);
      return product;
    }
    const res: any = await apiClient.patch(`/products/${id}/availability`);
    return res;
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    if (USE_MOCK) {
      await mockDelay();
      const db = getMockDb();
      db.products = db.products.filter((p) => p.id !== id);
      saveMockDb(db);
      return { success: true };
    }
    const res: any = await apiClient.delete(`/products/${id}`);
    return res;
  },
};

// ==========================================
// 4. AWS S3 MEDIA SERVICE (Presigned URL)
// ==========================================
export const mediaService = {
  async getPresignedUrl(fileName: string, fileType: string): Promise<PresignedUrlResponse> {
    if (USE_MOCK) {
      await mockDelay(150);
      const key = `uploads/${Date.now()}-${fileName}`;
      return {
        upload_url: `https://astralfood-media-mock.s3.ap-southeast-1.amazonaws.com/${key}?mock-presigned=true`,
        file_url: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80`,
        file_key: key,
      };
    }
    const res: any = await apiClient.post('/media/presigned-url', { fileName, fileType });
    return res;
  },

  async uploadFileToS3(file: File): Promise<string> {
    const { upload_url, file_url } = await this.getPresignedUrl(file.name, file.type);
    if (USE_MOCK) {
      await mockDelay(400);
      return URL.createObjectURL(file);
    }
    await apiClient.put(upload_url, file, {
      headers: { 'Content-Type': file.type },
    });
    return file_url;
  },
};

// ==========================================
// 5. AI COPILOT SERVICE (Bedrock / Gemini)
// ==========================================
export const aiCopilotService = {
  async generateDescription(
    dishName: string,
    categoryName: string,
    keywords?: string[]
  ): Promise<AICopilotResponse> {
    if (USE_MOCK) {
      await mockDelay(600);
      const kwString = keywords && keywords.length > 0 ? keywords.join(', ') : 'tươi ngon, đậm vị';
      return {
        generated_description: `${dishName} là sự kết hợp tinh tế giữa nguyên liệu thượng hạng và công thức ướp bí truyền. Món ăn thuộc danh mục ${categoryName}, ghi điểm với hương vị thơm nức, màu sắc vàng óng cuốn hút (${kwString}). Lựa chọn hoàn hảo để kích thích vị giác của mọi thực khách sành ăn!`,
        suggested_tags: [
          dishName.toLowerCase(),
          categoryName.toLowerCase(),
          'món ngon astral',
          'bán chạy',
          'chuẩn vị sài gòn',
        ],
        suggested_price_range: {
          min: 45000,
          max: 85000,
        },
      };
    }
    const res: any = await apiClient.post('/ai/generate-description', {
      dish_name: dishName,
      category_name: categoryName,
      keywords,
    });
    return res;
  },
};

// ==========================================
// 6. ORDER SERVICE (TV2 RESTful Contract)
// ==========================================
export const orderService = {
  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    if (USE_MOCK) {
      await mockDelay(300);
      const db = getMockDb();
      const store = db.stores.find((s) => s.id === payload.store_id);
      const storeName = store ? store.name : 'AstralFood Store';

      let subtotal = 0;
      const orderItems = payload.items.map((item, idx) => {
        const prod = db.products.find((p) => p.id === item.product_id);
        const unitPrice = prod ? prod.price : 50000;
        subtotal += unitPrice * item.quantity;
        return {
          id: `item-${Date.now()}-${idx}`,
          order_id: '',
          product_id: item.product_id,
          product_name: prod ? prod.name : 'Món ngon Astral',
          product_image: prod?.image_s3_url,
          quantity: item.quantity,
          unit_price: unitPrice,
        };
      });

      let discount = 0;
      if (payload.voucher_code) {
        discount = payload.voucher_code.includes('20') ? 20000 : 15000;
      }
      const totalAmount = Math.max(0, subtotal - discount);

      const newOrder: Order = {
        id: `ord-${Date.now().toString().slice(-6)}`,
        customer_id: 'user-customer-1',
        customer_name: 'Nguyễn Văn Khách',
        customer_phone: '0901234567',
        store_id: payload.store_id,
        store_name: storeName,
        total_amount: totalAmount,
        discount_amount: discount,
        voucher_code: payload.voucher_code,
        status: 'PENDING',
        delivery_address: payload.delivery_address,
        note: payload.note || '',
        invoice_s3_url: '',
        created_at: new Date().toISOString(),
        items: orderItems,
      };

      orderItems.forEach((i) => (i.order_id = newOrder.id));
      db.orders.unshift(newOrder);
      saveMockDb(db);
      return newOrder;
    }
    const res: any = await apiClient.post('/orders', payload);
    return res;
  },

  async getMyOrders(): Promise<Order[]> {
    if (USE_MOCK) {
      await mockDelay();
      const db = getMockDb();
      return db.orders;
    }
    const res: any = await apiClient.get('/orders/my-orders');
    return res;
  },

  async getStoreOrders(storeId: string, status?: OrderStatus): Promise<Order[]> {
    if (USE_MOCK) {
      await mockDelay();
      const db = getMockDb();
      let orders = db.orders.filter((o) => o.store_id === storeId);
      if (status) {
        orders = orders.filter((o) => o.status === status);
      }
      return orders;
    }
    const res: any = await apiClient.get(`/stores/${storeId}/orders`, { params: { status } });
    return res;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    if (USE_MOCK) {
      await mockDelay();
      const db = getMockDb();
      const order = db.orders.find((o) => o.id === orderId);
      if (!order) throw new Error('Không tìm thấy đơn hàng');
      order.status = status;
      if (status === 'COMPLETED' && !order.invoice_s3_url) {
        order.invoice_s3_url = `https://astralfood-invoices-s3.s3.ap-southeast-1.amazonaws.com/invoices/INV-${order.id}.pdf`;
      }
      saveMockDb(db);
      return order;
    }
    const res: any = await apiClient.patch(`/orders/${orderId}/status`, { status });
    return res;
  },

  async getStoreAnalytics(storeId: string): Promise<StoreAnalytics> {
    if (USE_MOCK) {
      await mockDelay();
      const db = getMockDb();
      const analytics = db.analytics[storeId] || db.analytics['store-1'];
      return analytics;
    }
    const res: any = await apiClient.get(`/stores/${storeId}/analytics`);
    return res;
  },
};

// ==========================================
// 7. ADMIN SERVICE (TV1 RESTful Contract)
// ==========================================
export const adminService = {
  async getUsers(): Promise<User[]> {
    if (USE_MOCK) {
      await mockDelay();
      const db = getMockDb();
      return db.users;
    }
    const res: any = await apiClient.get('/admin/users');
    return res;
  },

  async getStores(): Promise<Store[]> {
    if (USE_MOCK) {
      await mockDelay();
      const db = getMockDb();
      return db.stores;
    }
    const res: any = await apiClient.get('/admin/stores');
    return res;
  },

  async toggleStoreStatus(storeId: string, isActive: boolean): Promise<Store> {
    if (USE_MOCK) {
      await mockDelay();
      const db = getMockDb();
      const store = db.stores.find((s) => s.id === storeId);
      if (!store) throw new Error('Không tìm thấy cửa hàng');
      store.is_active = isActive;
      saveMockDb(db);
      return store;
    }
    const res: any = await apiClient.patch(`/admin/stores/${storeId}/status`, { is_active: isActive });
    return res;
  },
};

export const api = {
  auth: authService,
  store: storeService,
  product: productService,
  media: mediaService,
  aiCopilot: aiCopilotService,
  order: orderService,
  admin: adminService,
};

export default api;