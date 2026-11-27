/**
 * Chuẩn hóa dữ liệu đơn hàng từ payload Amazon SQS (hỗ trợ cả camelCase và snake_case)
 */
function normalizeOrderData(raw) {
  const data = raw?.data || raw || {};
  const items = (data.items || []).map((item) => {
    const qty = Number(item.quantity) || 1;
    const unitPrice =
      Number(item.unit_price !== undefined ? item.unit_price : item.unitPrice) || 0;
    const subtotal =
      item.subtotal !== undefined ? Number(item.subtotal) || 0 : unitPrice * qty;

    return {
      product_name:
        item.product_name ||
        item.productName ||
        (item.product && item.product.name) ||
        `Món ăn #${item.product_id || item.productId || 'N/A'}`,
      quantity: qty,
      unit_price: unitPrice,
      subtotal,
    };
  });

  const orderId = data.id || data.orderId;
  const region = process.env.AWS_REGION || 'ap-southeast-1';
  const bucketName =
    process.env.INVOICE_S3_BUCKET || process.env.S3_BUCKET_INVOICES || 'astralfood-invoices';
  const status = String(data.status || 'PENDING').toUpperCase();

  let invoiceS3Url = data.invoice_s3_url || data.invoiceS3Url || '';
  if (!invoiceS3Url && orderId && status === 'COMPLETED') {
    invoiceS3Url = `https://${bucketName}.s3.${region}.amazonaws.com/invoices/INV-${orderId}.pdf`;
  }

  return {
    event_type: data.eventType || data.event_type || raw?.eventType || 'ORDER_CREATED',
    id: orderId,
    status,
    customer_name:
      data.customer_name ||
      data.customerName ||
      (data.customer && data.customer.fullName) ||
      'Khách hàng AstralFood',
    customer_email:
      data.customer_email ||
      data.customerEmail ||
      (data.customer && data.customer.email) ||
      'customer@example.com',
    store_name:
      data.store_name ||
      data.storeName ||
      (data.store && data.store.name) ||
      'AstralFood Store',
    store_id: data.store_id || data.storeId,
    delivery_address: data.delivery_address || data.deliveryAddress || 'N/A',
    note: data.note || '',
    voucher_code: data.voucher_code || data.voucherCode || '',
    invoice_s3_url: invoiceS3Url,
    created_at: data.created_at || data.createdAt || new Date().toISOString(),
    total_amount:
      Number(data.total_amount !== undefined ? data.total_amount : data.totalAmount) || 0,
    discount_amount:
      Number(data.discount_amount !== undefined ? data.discount_amount : data.discountAmount) || 0,
    items,
  };
}

/**
 * Xác định chế độ mô phỏng cục bộ vs chạy thật trên AWS Lambda (IAM Execution Role)
 */
function shouldRunLocalSimulation() {
  if (process.env.LOCAL_SIMULATION === 'true') return true;
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) return false;
  return !process.env.AWS_ACCESS_KEY_ID;
}

module.exports = {
  normalizeOrderData,
  shouldRunLocalSimulation,
};
