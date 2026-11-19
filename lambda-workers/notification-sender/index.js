const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const region = process.env.AWS_REGION || 'ap-southeast-1';
const sesClient = new SESClient({ region });
const senderEmail = process.env.SENDER_EMAIL || 'no-reply@astralfood.vn';

const STATUS_META = {
  PENDING: {
    label: 'Chờ quán xác nhận',
    subjectPrefix: 'Xác nhận đặt đơn hàng',
    headline: 'Xác nhận đặt đơn hàng thành công!',
    description: 'Đơn hàng của bạn đã được tiếp nhận và đang chờ cửa hàng xác nhận.',
    badgeColor: '#F59E0B',
  },
  CONFIRMED: {
    label: 'Quán đã xác nhận',
    subjectPrefix: 'Quán đã xác nhận đơn hàng',
    headline: 'Cửa hàng đã xác nhận đơn hàng của bạn!',
    description: 'Cửa hàng đã xác nhận đơn và sẽ sớm bắt đầu chế biến món ăn.',
    badgeColor: '#8B5CF6',
  },
  PREPARING: {
    label: 'Đang chế biến',
    subjectPrefix: 'Đơn hàng đang được chế biến',
    headline: 'Quán đang chuẩn bị món cho bạn!',
    description: 'Đầu bếp đang chế biến món ăn nóng hổi theo yêu cầu của bạn.',
    badgeColor: '#FF5A1F',
  },
  DELIVERING: {
    label: 'Đang giao hàng',
    subjectPrefix: 'Đơn hàng đang trên đường giao',
    headline: 'Tài xế đang giao món tới bạn!',
    description: 'Đơn hàng của bạn đã rời quán và đang trên đường giao đến địa chỉ nhận hàng.',
    badgeColor: '#3B82F6',
  },
  COMPLETED: {
    label: 'Đã hoàn tất',
    subjectPrefix: 'Đơn hàng đã hoàn tất & Hóa đơn điện tử',
    headline: 'Đơn hàng đã giao thành công!',
    description: 'Cảm ơn bạn đã tin dùng AstralFood. Chúc bạn ngon miệng!',
    badgeColor: '#10B981',
  },
  CANCELLED: {
    label: 'Đã hủy',
    subjectPrefix: 'Thông báo hủy đơn hàng',
    headline: 'Đơn hàng của bạn đã bị hủy',
    description: 'Rất tiếc đơn hàng này đã bị hủy. Vui lòng liên hệ hỗ trợ nếu bạn cần giúp đỡ.',
    badgeColor: '#EF4444',
  },
};

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Chuẩn hóa object đơn hàng từ mọi dạng payload (Backend TypeScript SQS payload hoặc test event)
 */
function normalizeOrderData(raw) {
  const data = raw.data || raw;
  const items = (data.items || []).map((item) => {
    const qty = Number(item.quantity) || 1;
    const unitPrice = Number(item.unit_price !== undefined ? item.unit_price : item.unitPrice) || 0;
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

  return {
    event_type: data.eventType || data.event_type || raw.eventType || 'ORDER_CREATED',
    id: data.id || data.orderId,
    status: String(data.status || 'PENDING').toUpperCase(),
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
    invoice_s3_url: data.invoice_s3_url || data.invoiceS3Url || '',
    created_at: data.created_at || data.createdAt || new Date().toISOString(),
    total_amount:
      Number(data.total_amount !== undefined ? data.total_amount : data.totalAmount) || 0,
    discount_amount:
      Number(data.discount_amount !== undefined ? data.discount_amount : data.discountAmount) || 0,
    items,
  };
}

function getStatusMeta(orderData) {
  if (orderData.event_type === 'ORDER_CREATED') {
    return STATUS_META.PENDING;
  }
  return STATUS_META[orderData.status] || STATUS_META.PENDING;
}

/**
 * Tạo nội dung HTML Email thông báo đơn hàng cho AstralFood (hỗ trợ cả ORDER_CREATED & ORDER_STATUS_UPDATED)
 * @param {Object} orderData
 * @returns {string}
 */
function createOrderConfirmationHTML(orderData) {
  const statusMeta = getStatusMeta(orderData);
  const itemsList = orderData.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0;">${escapeHtml(item.product_name)}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; text-align: right;">${item.unit_price.toLocaleString('vi-VN')} đ</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: bold;">${item.subtotal.toLocaleString('vi-VN')} đ</td>
    </tr>
  `
    )
    .join('');

  const invoiceSection = orderData.invoice_s3_url
    ? `<p style="text-align: center; margin: 16px 0 0 0;">
        <a href="${escapeHtml(orderData.invoice_s3_url)}" style="display: inline-block; background-color: #FF5A1F; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; font-size: 13px;">
          Tải hóa đơn PDF (AWS S3)
        </a>
      </p>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${escapeHtml(statusMeta.subjectPrefix)} - AstralFood</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FFFDF9; margin: 0; padding: 24px; color: #333333;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #ffeedd; overflow: hidden; box-shadow: 0 4px 12px rgba(255, 90, 31, 0.08);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #FF5A1F 0%, #F59E0B 100%); padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 26px; letter-spacing: 1px;">ASTRALFOOD</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.95;">${escapeHtml(statusMeta.headline)}</p>
        </div>

        <!-- Content -->
        <div style="padding: 24px;">
          <p style="font-size: 15px;">Xin chào <strong>${escapeHtml(orderData.customer_name)}</strong>,</p>
          <p style="font-size: 14px; color: #555555; line-height: 1.5;">
            Cảm ơn bạn đã đặt món tại <strong>${escapeHtml(orderData.store_name)}</strong>. ${escapeHtml(statusMeta.description)}
          </p>

          <div style="background: #fafafa; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px;">
            <p style="margin: 4px 0;"><strong>Mã đơn hàng:</strong> <span style="color: #FF5A1F; font-weight: bold;">${escapeHtml(orderData.id)}</span></p>
            <p style="margin: 4px 0;"><strong>Trạng thái:</strong> <span style="display: inline-block; padding: 2px 8px; border-radius: 999px; background-color: ${statusMeta.badgeColor}; color: #ffffff; font-weight: bold; font-size: 12px;">${escapeHtml(statusMeta.label)}</span></p>
            <p style="margin: 4px 0;"><strong>Thời gian đặt:</strong> ${escapeHtml(orderData.created_at)}</p>
            <p style="margin: 4px 0;"><strong>Địa chỉ giao:</strong> ${escapeHtml(orderData.delivery_address)}</p>
            ${orderData.note ? `<p style="margin: 4px 0;"><strong>Ghi chú:</strong> <em>${escapeHtml(orderData.note)}</em></p>` : ''}
          </div>

          <!-- Chi tiết món ăn -->
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px;">
            <thead>
              <tr style="background-color: #fff3ec; color: #FF5A1F;">
                <th style="padding: 10px 12px; text-align: left;">Món ăn</th>
                <th style="padding: 10px 12px; text-align: center;">SL</th>
                <th style="padding: 10px 12px; text-align: right;">Đơn giá</th>
                <th style="padding: 10px 12px; text-align: right;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>

          <!-- Tổng kết thanh toán -->
          <div style="text-align: right; margin-top: 20px; font-size: 14px;">
            ${
              orderData.discount_amount > 0
                ? `<p style="margin: 4px 0; color: #10B981;">Giảm giá Voucher${orderData.voucher_code ? ` (${escapeHtml(orderData.voucher_code)})` : ''}: -${orderData.discount_amount.toLocaleString('vi-VN')} đ</p>`
                : ''
            }
            <h3 style="margin: 8px 0; color: #FF5A1F; font-size: 18px;">Tổng thanh toán: ${orderData.total_amount.toLocaleString('vi-VN')} đ</h3>
          </div>

          ${invoiceSection}

          <hr style="border: none; border-top: 1px dashed #e2e8f0; margin: 24px 0;">

          <p style="font-size: 12px; color: #888888; text-align: center; margin: 0;">
            Hóa đơn điện tử PDF được hệ thống tự động xuất và lưu trữ trên AWS S3.<br>
            Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ bộ phận hỗ trợ AstralFood.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function shouldRunLocalSimulation() {
  if (process.env.LOCAL_SIMULATION === 'true') return true;
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) return false;
  return !process.env.AWS_ACCESS_KEY_ID;
}

/**
 * AWS Lambda Handler (Trigger từ Amazon SQS - hỗ trợ ReportBatchItemFailures)
 */
exports.handler = async (event) => {
  console.log('Incoming Notification Lambda Event:', JSON.stringify(event));

  const records = Array.isArray(event?.Records)
    ? event.Records
    : [{ body: JSON.stringify(event || {}) }];

  const batchItemFailures = [];

  for (const record of records) {
    try {
      const parsedBody =
        typeof record.body === 'string' ? JSON.parse(record.body) : record.body || record;
      const orderData = normalizeOrderData(parsedBody);

      if (!orderData.id) {
        console.warn('[SES WORKER] Bỏ qua record không có Order ID:', record);
        continue;
      }

      const statusMeta = getStatusMeta(orderData);
      const recipientEmail = orderData.customer_email || 'customer@example.com';
      console.log(
        `[SES WORKER] Đang gửi email (${orderData.event_type}/${orderData.status}) cho đơn ${orderData.id} tới: ${recipientEmail}`
      );

      const htmlBody = createOrderConfirmationHTML(orderData);

      if (shouldRunLocalSimulation()) {
        console.log(
          `[LOCAL / FALLBACK] Gửi email mô phỏng thành công tới ${recipientEmail} cho đơn hàng ${orderData.id} (${statusMeta.label})`
        );
      } else {
        const sendEmailParams = {
          Source: senderEmail,
          Destination: {
            ToAddresses: [recipientEmail],
          },
          Message: {
            Subject: {
              Data: `[AstralFood] ${statusMeta.subjectPrefix} #${orderData.id} - ${orderData.store_name}`,
              Charset: 'UTF-8',
            },
            Body: {
              Html: {
                Data: htmlBody,
                Charset: 'UTF-8',
              },
            },
          },
        };

        const result = await sesClient.send(new SendEmailCommand(sendEmailParams));
        console.log(`[SES SUCCESS] Message ID: ${result.MessageId}`);
      }
    } catch (err) {
      console.error('[SES WORKER ERROR] Lỗi gửi email qua SES:', err);
      if (record.messageId) {
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    }
  }

  return {
    statusCode: 200,
    body: 'Gửi thông báo hoàn tất',
    batchItemFailures,
  };
};

exports.createOrderConfirmationHTML = createOrderConfirmationHTML;
exports.normalizeOrderData = normalizeOrderData;
exports.escapeHtml = escapeHtml;
