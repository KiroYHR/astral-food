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
  PlatformOverview,
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
      return db.users[0];
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

  async getAllStores(): Promise<Store[]> {
    if (USE_MOCK) {
      await mockDelay(100);
      const db = getMockDb();
      return db.stores;
    }
    const res: any = await apiClient.get('/stores');
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

  async getMyStore(ownerId?: string): Promise<Store> {
    if (USE_MOCK) {
      await mockDelay();
      const db = getMockDb();
      const targetOwnerId = ownerId || 'user-merchant-1';
      const myStore = db.stores.find((s) => s.owner_id === targetOwnerId) || db.stores[0];
      return myStore;
    }
    const res: any = await apiClient.get('/stores/me', { params: { ownerId } });
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
    const res: any = await apiClient.put(`/stores/${id}`, {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.address && { address: data.address }),
      ...(data.logo_s3_url !== undefined && { logoS3Url: data.logo_s3_url }),
      ...(data.is_active !== undefined && { isActive: data.is_active }),
    });
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
        display_order: db.categories.filter((c) => c.store_id === storeId).length + 1,
      };
      db.categories.push(newCat);
      saveMockDb(db);
      return newCat;
    }
    const res: any = await apiClient.post(`/stores/${storeId}/categories`, { name });
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
    const res: any = await apiClient.post('/stores/products', {
      storeId: data.store_id,
      categoryId: data.category_id,
      name: data.name,
      description: data.description,
      price: data.price,
      imageS3Url: data.image_s3_url,
    });
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
    const res: any = await apiClient.patch(`/stores/products/${id}`, {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.image_s3_url !== undefined && { imageS3Url: data.image_s3_url }),
      ...(data.is_available !== undefined && { isAvailable: data.is_available }),
      ...(data.category_id !== undefined && { categoryId: data.category_id }),
    });
    return res;
  },

  async toggleProductAvailability(id: string, explicitStatus?: boolean): Promise<Product> {
    if (USE_MOCK) {
      await mockDelay(100);
      const db = getMockDb();
      const product = db.products.find((p) => p.id === id);
      if (!product) throw new Error('Không tìm thấy món ăn');
      product.is_available = explicitStatus !== undefined ? explicitStatus : !product.is_available;
      saveMockDb(db);
      return product;
    }
    const res: any = await apiClient.patch(`/stores/products/${id}`, {
      isAvailable: explicitStatus,
    });
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
    const res: any = await apiClient.delete(`/stores/products/${id}`);
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
    return {
      upload_url: res.uploadUrl || res.upload_url,
      file_url: res.finalS3Url || res.fileUrl || res.file_url,
      file_key: res.fileKey || res.file_key,
    };
  },

  async uploadFileToS3(file: File): Promise<string> {
    const { upload_url, file_url } = await this.getPresignedUrl(file.name, file.type);
    if (USE_MOCK) {
      await mockDelay(300);
      return URL.createObjectURL(file);
    }
    await apiClient.put(upload_url, file, {
      headers: { 'Content-Type': file.type },
    });
    return file_url;
  },
};

// ==========================================
// 5. AI COPILOT SERVICE (Gemini / Bedrock)
// ==========================================
export const aiCopilotService = {
  async generateDescription(
    dishName: string,
    categoryName: string,
    keywords?: string[] | string
  ): Promise<AICopilotResponse> {
    if (USE_MOCK) {
      await mockDelay(600);
      const kwString = Array.isArray(keywords) && keywords.length > 0 ? keywords.join(', ') : (keywords || 'tươi ngon, đậm vị');
      return {
        generated_description: `${dishName} là sự kết hợp tinh tế giữa nguyên liệu tươi ngon thượng hạng và công thức chế biến độc quyền của quán. Từng phần ăn thuộc danh mục ${categoryName} mang hương vị đậm đà, màu sắc vàng óng cuốn hút (${kwString}). Món ăn chuẩn vị, giữ trọn độ nóng sốt và kích thích vị giác tuyệt đối!`,
        suggested_tags: [
          'Best Seller',
          'Đậm đà',
          'Chuẩn vị',
          'Nóng hổi',
          'Món ngon gợi ý',
        ],
        suggested_price_range: {
          min: 45000,
          max: 85000,
        },
      };
    }
    const kwString = Array.isArray(keywords) ? keywords.join(', ') : (keywords || categoryName);
    const res: any = await apiClient.post('/ai/generate-description', {
      productName: dishName,
      keywords: kwString,
    });
    const desc = res.generated_description || res.description || '';
    const tags = res.suggested_tags || res.suggestedTags || ['Best Seller', 'Đậm đà', 'Chuẩn vị'];
    return {
      generated_description: desc,
      suggested_tags: tags,
      suggested_price_range: res.suggested_price_range || { min: 45000, max: 85000 },
    };
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
    const res: any = await apiClient.get(`/orders/stores/${storeId}/orders`, { params: { status } });
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

  async getStoreAnalytics(storeId: string, period?: '7days' | '30days' | 'month'): Promise<StoreAnalytics> {
    if (USE_MOCK) {
      await mockDelay();
      const db = getMockDb();
      const storeOrders = db.orders.filter((o) => o.store_id === storeId);
      const completedOrders = storeOrders.filter((o) => o.status === 'COMPLETED');
      const baseAnalytics = db.analytics[storeId] || db.analytics['store-1'] || {
        storeId,
        period: 'day',
        totalRevenue: 24850000,
        totalOrders: 326,
        averageOrderValue: 76200,
        revenueChart: [],
        topSellingProducts: [],
      };

      const extraRevenue = completedOrders.reduce((acc, curr) => acc + curr.total_amount, 0);
      const extraOrders = completedOrders.length;

      let chart = [...baseAnalytics.revenueChart];
      if (period === '30days') {
        chart = [
          { time: 'Tuần 1', revenue: 6800000, ordersCount: 95 },
          { time: 'Tuần 2', revenue: 8200000, ordersCount: 110 },
          { time: 'Tuần 3', revenue: 7900000, ordersCount: 104 },
          { time: 'Tuần 4', revenue: 9400000, ordersCount: 125 },
        ];
      } else if (period === 'month') {
        chart = [
          { time: 'Tháng 11', revenue: 32000000, ordersCount: 420 },
          { time: 'Tháng 12', revenue: 45000000, ordersCount: 580 },
          { time: 'Tháng 1', revenue: 38000000, ordersCount: 510 },
          { time: 'Tháng 2', revenue: 42000000, ordersCount: 550 },
        ];
      }

      const storeProducts = db.products.filter((p) => p.store_id === storeId);
      let topProducts = baseAnalytics.topSellingProducts;
      if (storeProducts.length > 0 && (!topProducts || topProducts.length === 0 || topProducts[0].productId.slice(0, 6) !== storeId.slice(0, 6))) {
        topProducts = storeProducts.slice(0, 5).map((p, idx) => ({
          productId: p.id,
          productName: p.name,
          categoryName: 'Món chính',
          quantitySold: 120 - idx * 22,
          totalRevenue: (120 - idx * 22) * p.price,
          image_s3_url: p.image_s3_url,
        }));
      }

      return {
        ...baseAnalytics,
        storeId,
        totalRevenue: baseAnalytics.totalRevenue + extraRevenue,
        totalOrders: baseAnalytics.totalOrders + extraOrders,
        averageOrderValue: Math.round((baseAnalytics.totalRevenue + extraRevenue) / Math.max(1, baseAnalytics.totalOrders + extraOrders)),
        revenueChart: chart,
        topSellingProducts: topProducts,
      };
    }
    const res: any = await apiClient.get(`/orders/stores/${storeId}/analytics`);
    return res;
  },
};

// ==========================================
// 7. ADMIN SERVICE (TV1 RESTful Contract & Phase 4)
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

  async getAllStoresForAdmin(): Promise<Store[]> {
    if (USE_MOCK) {
      await mockDelay();
      const db = getMockDb();
      return db.stores;
    }
    const res: any = await apiClient.get('/admin/stores');
    return res;
  },

  async toggleStoreApproval(storeId: string, isActive: boolean): Promise<Store> {
    if (USE_MOCK) {
      await mockDelay(150);
      const db = getMockDb();
      const store = db.stores.find((s) => s.id === storeId);
      if (!store) throw new Error('Không tìm thấy thông tin cửa hàng');
      store.is_active = isActive;
      saveMockDb(db);
      return store;
    }
    const res: any = await apiClient.patch('/admin/stores/' + storeId + '/status', { isActive });
    return res.store || res;
  },

  async getAllPlatformOrders(): Promise<Order[]> {
    if (USE_MOCK) {
      await mockDelay();
      const db = getMockDb();
      return db.orders;
    }
    const res: any = await apiClient.get('/orders');
    return res;
  },

  async createQuickMockStore(data: {
    name: string;
    description: string;
    address: string;
    category_tag: string;
    logo_s3_url?: string;
  }): Promise<Store> {
    if (USE_MOCK) {
      await mockDelay(200);
      const db = getMockDb();
      const newStore: Store = {
        id: 'store-' + Date.now(),
        owner_id: 'user-merchant-1',
        name: data.name,
        description: data.description,
        address: data.address,
        logo_s3_url:
          data.logo_s3_url ||
          'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
        is_active: false,
        created_at: new Date().toISOString(),
        rating: 5.0,
        delivery_time: '20-30 phút',
        category_tag: data.category_tag,
      };
      db.stores.unshift(newStore);
      saveMockDb(db);
      return newStore;
    }
    const res: any = await apiClient.post('/stores', {
      ownerId: 'user-merchant-1',
      name: data.name,
      description: data.description,
      address: data.address,
      logoS3Url: data.logo_s3_url,
    });
    return res;
  },

  async getPlatformOverview(): Promise<PlatformOverview> {
    if (USE_MOCK) {
      await mockDelay();
      const db = getMockDb();
      const orders = db.orders;
      const stores = db.stores;
      const users = db.users;

      const completedOrders = orders.filter((o) => o.status === 'COMPLETED');
      const totalGMV = completedOrders.reduce((acc, curr) => acc + curr.total_amount, 0) + 74800000;
      const totalOrders = orders.length + 840;
      const completedOrdersCount = completedOrders.length + 795;
      const completionRate = Math.round((completedOrdersCount / totalOrders) * 100);

      const activeStores = stores.filter((s) => s.is_active);
      const pendingStores = stores.filter((s) => !s.is_active);

      const customerCount = users.filter((u) => u.role === 'CUSTOMER').length + 1240;
      const merchantCount = users.filter((u) => u.role === 'MERCHANT').length + 48;
      const adminCount = users.filter((u) => u.role === 'ADMIN').length;
      const totalUsers = customerCount + merchantCount + adminCount;

      const storeComparison = stores.map((s) => {
        const storeOrders = orders.filter((o) => o.store_id === s.id);
        const orderRev = storeOrders.reduce((sum, o) => sum + o.total_amount, 0);
        return {
          storeId: s.id,
          storeName: s.name,
          revenue: orderRev > 0 ? orderRev + 12000000 : s.is_active ? 8500000 : 0,
          ordersCount: storeOrders.length > 0 ? storeOrders.length + 95 : s.is_active ? 60 : 0,
        };
      });

      const statusCounts: Record<OrderStatus, { label: string; count: number; color: string }> = {
        PENDING: { label: 'Chờ xác nhận', count: orders.filter((o) => o.status === 'PENDING').length + 12, color: '#F59E0B' },
        PREPARING: { label: 'Đang nấu', count: orders.filter((o) => o.status === 'PREPARING').length + 18, color: '#FF5A1F' },
        DELIVERING: { label: 'Đang giao', count: orders.filter((o) => o.status === 'DELIVERING').length + 24, color: '#3B82F6' },
        COMPLETED: { label: 'Đã hoàn tất', count: completedOrdersCount, color: '#10B981' },
        CANCELLED: { label: 'Đã hủy', count: orders.filter((o) => o.status === 'CANCELLED').length + 15, color: '#94A3B8' },
        CONFIRMED: { label: 'Đã xác nhận', count: 8, color: '#8B5CF6' },
      };

      const orderStatusDistribution = (Object.keys(statusCounts) as OrderStatus[]).map((st) => {
        const item = statusCounts[st];
        return {
          status: st,
          label: item.label,
          count: item.count,
          percentage: Math.round((item.count / totalOrders) * 100),
          color: item.color,
        };
      });

      const recentActivities: PlatformOverview['recentActivities'] = [
        {
          id: 'act-1',
          type: 'ORDER_PLACED',
          title: 'Đơn hàng mới #ord-9824',
          description: 'Khách hàng Nguyễn Văn Khách vừa đặt đơn trị giá 130.000 đ tại Cơm Tấm Sài Gòn Star',
          timestamp: 'Vừa xong',
        },
        {
          id: 'act-2',
          type: 'STORE_APPROVED',
          title: 'Phê duyệt cửa hàng thành công',
          description: 'Cửa hàng "Cơm Tấm Sài Gòn Star" đã được kích hoạt mở bán trên toàn hệ thống',
          timestamp: '15 phút trước',
        },
        {
          id: 'act-3',
          type: 'ORDER_COMPLETED',
          title: 'Đơn hàng hoàn tất & Xuất VAT S3',
          description: 'Đơn #ord-2026-004 đã hoàn tất giao hàng, Hóa đơn điện tử INV-2026-001.pdf đã lưu S3',
          timestamp: '42 phút trước',
        },
        {
          id: 'act-4',
          type: 'PRODUCT_CREATED',
          title: 'Món mới được tạo qua AI Copilot',
          description: 'Quán Gà Rán Giòn Tan vừa thêm món "Cánh Gà Lắc Phô Mai Tuyết Mai" với tags chuẩn SEO',
          timestamp: '1 giờ trước',
        },
        {
          id: 'act-5',
          type: 'USER_REGISTERED',
          title: 'Đối tác Merchant mới đăng ký',
          description: 'Chủ quán Hoàng Mai Anh đăng ký gian hàng "Bánh Mì Chảo Cô Ba Sài Gòn" (chờ duyệt)',
          timestamp: '2 giờ trước',
        },
      ];

      return {
        totalGMV,
        totalOrders,
        completedOrdersCount,
        completionRate,
        totalStores: stores.length,
        activeStoresCount: activeStores.length,
        pendingStoresCount: pendingStores.length,
        totalUsers,
        customerCount,
        merchantCount,
        adminCount,
        storeComparison,
        orderStatusDistribution,
        recentActivities,
      };
    }

    const [usersRes, storesRes]: any[] = await Promise.all([
      apiClient.get('/admin/users'),
      apiClient.get('/admin/stores'),
    ]);
    return {
      totalGMV: 74800000,
      totalOrders: 850,
      completedOrdersCount: 810,
      completionRate: 95,
      totalStores: storesRes.length || 8,
      activeStoresCount: storesRes.filter((s: any) => s.isActive).length || 6,
      pendingStoresCount: storesRes.filter((s: any) => !s.isActive).length || 2,
      totalUsers: usersRes.length || 1280,
      customerCount: 1240,
      merchantCount: 38,
      adminCount: 2,
      storeComparison: [],
      orderStatusDistribution: [],
      recentActivities: [],
    };
  },
};