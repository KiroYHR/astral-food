/**
 * AstralFood Platform - Database & API Types
 * Khớp 100% với 6 bảng PostgreSQL trong Đề cương và 5 điểm đồng bộ trong docs/xu_t_b_sung_api_db_astralfood.md
 */

// ==========================================
// 1. ENUMS & UNION TYPES
// ==========================================

export type UserRole = 'CUSTOMER' | 'MERCHANT' | 'ADMIN';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'DELIVERING'
  | 'COMPLETED'
  | 'CANCELLED';

// ==========================================
// 2. CORE DATABASE INTERFACES (6 TABLES)
// ==========================================

/**
 * 1. Bảng users - Người dùng hệ thống (Khách hàng, Chủ quán, Quản trị viên)
 */
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: UserRole;
  created_at: string;
}

/**
 * 2. Bảng stores - Cửa hàng / Quán ăn trên nền tảng
 * Đồng bộ Điểm 4 & 5: rating, delivery_time, category_tag, is_active
 */
export interface Store {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  address: string;
  logo_s3_url: string;
  is_active: boolean;
  created_at: string;
  // Các trường bổ sung đồng bộ trải nghiệm người dùng & lọc quán
  rating?: number;
  delivery_time?: string;
  category_tag?: string;
}

/**
 * 3. Bảng categories - Danh mục món ăn của từng cửa hàng
 */
export interface Category {
  id: string;
  store_id: string;
  name: string;
  display_order: number;
}

/**
 * 4. Bảng products - Món ăn trong thực đơn cửa hàng
 * Đồng bộ Điểm 2: is_available (còn hàng/hết hàng), tags (AI SEO tags)
 */
export interface Product {
  id: string;
  store_id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_s3_url: string;
  is_available: boolean;
  created_at: string;
  tags?: string[];
}

/**
 * 5. Bảng orders - Đơn đặt hàng của khách hàng
 * Đồng bộ Điểm 1, 3, 4: items, store_name, discount_amount, voucher_code, customer info
 */
export interface Order {
  id: string;
  customer_id: string;
  store_id: string;
  store_name?: string;
  total_amount: number;
  status: OrderStatus;
  delivery_address: string;
  note: string;
  invoice_s3_url: string;
  created_at: string;
  items?: OrderItem[];
  // Đồng bộ phục vụ thanh toán, điều phối đơn & hóa đơn PDF
  discount_amount?: number;
  voucher_code?: string;
  customer_name?: string;
  customer_phone?: string;
}

/**
 * 6. Bảng order_items - Chi tiết từng món ăn trong đơn hàng
 */
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name?: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
}

// ==========================================
// 3. STORE ANALYTICS (RECHARTS INTEGRATION)
// ==========================================

export interface RevenuePoint {
  time: string; // Ngày (DD/MM), Tuần (Tuần W), hoặc Tháng (Tháng M)
  revenue: number; // Doanh thu (VND)
  ordersCount: number; // Số lượng đơn hàng
}

export interface TopSellingProduct {
  productId: string;
  productName: string;
  categoryName?: string;
  quantitySold: number;
  totalRevenue: number;
  image_s3_url?: string;
}

/**
 * 7. StoreAnalytics - Dữ liệu doanh thu & thống kê bán hàng cho Merchant Dashboard (Recharts)
 */
export interface StoreAnalytics {
  storeId: string;
  period: 'day' | 'week' | 'month';
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueChart: RevenuePoint[];
  topSellingProducts: TopSellingProduct[];
}

// ==========================================
// 4. FRONTEND STATE & API PAYLOAD INTERFACES
// ==========================================

/**
 * Giỏ hàng lưu trữ LocalStorage / Zustand (Điểm 1)
 */
export interface CartItem {
  product: Product;
  quantity: number;
  storeId: string;
  storeName: string;
}

/**
 * Payload gửi lên POST /api/v1/orders (Điểm 1)
 */
export interface CreateOrderPayload {
  store_id: string;
  delivery_address: string;
  note?: string;
  voucher_code?: string;
  items: {
    product_id: string;
    quantity: number;
  }[];
}

/**
 * Payload phản hồi Auth Token
 */
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

/**
 * Phản hồi S3 Presigned URL
 */
export interface PresignedUrlResponse {
  upload_url: string;
  file_url: string;
  file_key: string;
  uploadUrl?: string;
  fileUrl?: string;
  finalS3Url?: string;
  fileKey?: string;
}

/**
 * Phản hồi gợi ý mô tả món ăn từ AI Copilot (Bedrock / Gemini)
 */
export interface AICopilotResponse {
  generated_description: string;
  suggested_tags: string[];
  description?: string;
  suggestedTags?: string[];
  suggested_price_range?: {
    min: number;
    max: number;
  };
}
/**
 * 8. PlatformOverview - Dữ liệu giám sát toàn sàn cho System Admin Portal (Phase 4)
 */
export interface PlatformStoreComparison {
  storeId: string;
  storeName: string;
  revenue: number;
  ordersCount: number;
}

export interface PlatformStatusDistribution {
  status: OrderStatus;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface PlatformActivityLog {
  id: string;
  type: 'ORDER_PLACED' | 'STORE_APPROVED' | 'STORE_LOCKED' | 'PRODUCT_CREATED' | 'ORDER_COMPLETED' | 'USER_REGISTERED';
  title: string;
  description: string;
  timestamp: string;
}

export interface PlatformOverview {
  totalGMV: number;
  totalOrders: number;
  completedOrdersCount: number;
  completionRate: number;
  totalStores: number;
  activeStoresCount: number;
  pendingStoresCount: number;
  totalUsers: number;
  customerCount: number;
  merchantCount: number;
  adminCount: number;
  storeComparison: PlatformStoreComparison[];
  orderStatusDistribution: PlatformStatusDistribution[];
  recentActivities: PlatformActivityLog[];
}