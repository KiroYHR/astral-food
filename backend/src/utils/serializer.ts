/**
 * AstralFood Serializer Utility
 * Chuẩn hóa hai chiều: vừa hỗ trợ camelCase (chuẩn Backend / Prisma)
 * vừa hỗ trợ snake_case (chuẩn Frontend React của TV3)
 */

export function serializeCategory(cat: any) {
  if (!cat) return null;
  return {
    id: cat.id,
    store_id: cat.storeId || cat.store_id,
    storeId: cat.storeId || cat.store_id,
    name: cat.name,
    display_order: cat.displayOrder !== undefined ? cat.displayOrder : (cat.display_order || 0),
    displayOrder: cat.displayOrder !== undefined ? cat.displayOrder : (cat.display_order || 0),
  };
}

export function serializeProduct(prod: any) {
  if (!prod) return null;
  const priceNum = Number(prod.price) || 0;
  const imgUrl =
    prod.imageS3Url ||
    prod.image_s3_url ||
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80';

  return {
    id: prod.id,
    store_id: prod.storeId || prod.store_id,
    storeId: prod.storeId || prod.store_id,
    category_id: prod.categoryId || prod.category_id,
    categoryId: prod.categoryId || prod.category_id,
    name: prod.name,
    description: prod.description || '',
    price: priceNum,
    image_s3_url: imgUrl,
    imageS3Url: imgUrl,
    is_available: prod.isAvailable !== undefined ? prod.isAvailable : (prod.is_available !== undefined ? prod.is_available : true),
    isAvailable: prod.isAvailable !== undefined ? prod.isAvailable : (prod.is_available !== undefined ? prod.is_available : true),
    created_at: prod.createdAt || prod.created_at || new Date().toISOString(),
    createdAt: prod.createdAt || prod.created_at || new Date().toISOString(),
    tags: prod.tags || ['Best Seller', 'Đậm đà', 'Chuẩn vị'],
  };
}

export function serializeStore(store: any) {
  if (!store) return null;
  const logoUrl =
    store.logoS3Url ||
    store.logo_s3_url ||
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&q=80';

  return {
    id: store.id,
    owner_id: store.ownerId || store.owner_id,
    ownerId: store.ownerId || store.owner_id,
    name: store.name,
    description: store.description || '',
    address: store.address || '',
    logo_s3_url: logoUrl,
    logoS3Url: logoUrl,
    rating: Number(store.rating) || 4.9,
    delivery_time: store.delivery_time || '20-30 phút',
    category_tag: store.category_tag || 'Trà sữa & Cafe, Cơm tấm, Gà rán, Ăn vặt',
    is_active: store.isActive !== undefined ? store.isActive : (store.is_active !== undefined ? store.is_active : true),
    isActive: store.isActive !== undefined ? store.isActive : (store.is_active !== undefined ? store.is_active : true),
    created_at: store.createdAt || store.created_at || new Date().toISOString(),
    createdAt: store.createdAt || store.created_at || new Date().toISOString(),
    categories: Array.isArray(store.categories) ? store.categories.map(serializeCategory) : undefined,
    products: Array.isArray(store.products) ? store.products.map(serializeProduct) : undefined,
  };
}

export function serializeUser(user: any) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    full_name: user.fullName || user.full_name || 'Khách hàng AstralFood',
    fullName: user.fullName || user.full_name || 'Khách hàng AstralFood',
    phone: user.phone || '0901234567',
    role: user.role,
    created_at: user.createdAt || user.created_at || new Date().toISOString(),
    createdAt: user.createdAt || user.created_at || new Date().toISOString(),
  };
}

export function serializeOrder(order: any) {
  if (!order) return null;
  const items = (order.items || []).map((item: any) => ({
    id: item.id,
    order_id: item.orderId || item.order_id,
    orderId: item.orderId || item.order_id,
    product_id: item.productId || item.product_id,
    productId: item.productId || item.product_id,
    product_name: item.product?.name || item.product_name || 'Món ngon Astral',
    product_image: item.product?.imageS3Url || item.product_image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80',
    quantity: Number(item.quantity) || 1,
    unit_price: Number(item.unitPrice || item.unit_price || item.product?.price || 0),
    unitPrice: Number(item.unitPrice || item.unit_price || item.product?.price || 0),
  }));

  const totalNum = Number(order.totalAmount || order.total_amount || 0);
  const discountNum = Number(order.discountAmount || order.discount_amount || 0);

  return {
    id: order.id,
    customer_id: order.customerId || order.customer_id,
    customerId: order.customerId || order.customer_id,
    customer_name: order.customer?.fullName || order.customer_name || 'Nguyễn Văn Khách',
    customer_phone: order.customer?.phone || order.customer_phone || '0901234567',
    store_id: order.storeId || order.store_id,
    storeId: order.storeId || order.store_id,
    store_name: order.store?.name || order.store_name || 'Astral Gourmet Cafe & Bakery',
    total_amount: totalNum,
    totalAmount: totalNum,
    discount_amount: discountNum,
    discountAmount: discountNum,
    voucher_code: order.voucherCode || order.voucher_code || '',
    voucherCode: order.voucherCode || order.voucher_code || '',
    status: order.status || 'PENDING',
    delivery_address: order.deliveryAddress || order.delivery_address || '268 Lý Thường Kiệt, Q10',
    deliveryAddress: order.deliveryAddress || order.delivery_address || '268 Lý Thường Kiệt, Q10',
    note: order.note || '',
    invoice_s3_url: order.invoiceS3Url || order.invoice_s3_url || '',
    created_at: order.createdAt || order.created_at || new Date().toISOString(),
    createdAt: order.createdAt || order.created_at || new Date().toISOString(),
    items,
  };
}
