const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const region = process.env.AWS_REGION || 'ap-southeast-1';
const sesClient = new SESClient({ region });
const senderEmail = process.env.SENDER_EMAIL || 'no-reply@astralfood.vn';

/**
 * Chuẩn hóa object đơn hàng từ mọi dạng payload (TV1 Prisma SQS payload hoặc TV2 direct payload)
 */
function normalizeOrderData(raw) {
  const data = raw.data || raw;
  return {
    id: data.id || data.orderId,
    customer_name: data.customer_name || data.customerName || (data.customer && data.customer.fullName) || 'Khách hàng AstralFood',
    customer_email: data.customer_email || data.customerEmail || (data.customer && data.customer.email) || 'customer@example.com',
    store_name: data.store_name || data.storeName || (data.store && data.store.name) || 'AstralFood Store',
    store_id: data.store_id || data.storeId,
    delivery_address: data.delivery_address || data.deliveryAddress || 'N/A',
    note: data.note || '',
    created_at: data.created_at || data.createdAt || new Date().toISOString(),
    total_amount: Number(data.total_amount !== undefined ? data.total_amount : data.totalAmount) || 0,
    discount_amount: Number(data.discount_amount !== undefined ? data.discount_amount : data.discountAmount) || 0,
    items: (data.items || []).map(item => ({
      product_name: item.product_name || item.productName || (item.product && item.product.name) || `Món ăn #${item.product_id || item.productId}`,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unit_price !== undefined ? item.unit_price : item.unitPrice) || 0,
      subtotal: Number(item.subtotal !== undefined ? item.subtotal : (item.unitPrice || item.unit_price || 0) * (item.quantity || 1))
    }))
  };
}

/**
 * Tạo nội dung HTML Email xác nhận đơn hàng đẹp mắt cho AstralFood
 * @param {Object} orderData 
 * @returns {string}
 */
function createOrderConfirmationHTML(orderData) {
  const itemsList = orderData.items.map(item => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0;">${item.product_name}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; text-align: right;">${item.unit_price.toLocaleString('vi-VN')} đ</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: bold;">${item.subtotal.toLocaleString('vi-VN')} đ</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Xác nhận đơn hàng AstralFood</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FFFDF9; margin: 0; padding: 24px; color: #333333;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #ffeedd; overflow: hidden; box-shadow: 0 4px 12px rgba(255, 90, 31, 0.08);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #FF5A1F 0%, #F59E0B 100%); padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 26px; letter-spacing: 1px;">ASTRALFOOD</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Xác nhận đặt đơn hàng thành công!</p>
        </div>

        <!-- Content -->
        <div style="padding: 24px;">
          <p style="font-size: 15px;">Xin chào <strong>${orderData.customer_name}</strong>,</p>
          <p style="font-size: 14px; color: #555555; line-height: 1.5;">
            Cảm ơn bạn đã đặt món tại <strong>${orderData.store_name}</strong>. Đơn hàng của bạn đã được tiếp nhận và quán đang chuẩn bị món.
          </p>

          <div style="background: #fafafa; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px;">
            <p style="margin: 4px 0;"><strong>Mã đơn hàng:</strong> <span style="color: #FF5A1F; font-weight: bold;">${orderData.id}</span></p>
            <p style="margin: 4px 0;"><strong>Thời gian đặt:</strong> ${orderData.created_at}</p>
            <p style="margin: 4px 0;"><strong>Địa chỉ giao:</strong> ${orderData.delivery_address}</p>
            ${orderData.note ? `<p style="margin: 4px 0;"><strong>Ghi chú:</strong> <em>${orderData.note}</em></p>` : ''}
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
            ${orderData.discount_amount > 0 ? `<p style="margin: 4px 0; color: #10B981;">Giảm giá Voucher: -${orderData.discount_amount.toLocaleString('vi-VN')} đ</p>` : ''}
            <h3 style="margin: 8px 0; color: #FF5A1F; font-size: 18px;">Tổng thanh toán: ${orderData.total_amount.toLocaleString('vi-VN')} đ</h3>
          </div>

          <hr style="border: none; border-top: 1px dashed #e2e8f0; margin: 24px 0;">

          <p style="font-size: 12px; color: #888888; text-align: center; margin: 0;">
            Hóa đơn điện tử PDF đã được hệ thống tự động xuất và lưu trữ trên AWS S3.<br>
            Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ bộ phận hỗ trợ AstralFood.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * AWS Lambda Handler (Trigger từ SQS)
 */
exports.handler = async (event) => {
  console.log('Incoming Notification Lambda Event:', JSON.stringify(event));

  const records = event.Records || [{ body: JSON.stringify(event) }];

  for (const record of records) {
    try {
      const parsedBody = typeof record.body === 'string' ? JSON.parse(record.body) : record;
      const orderData = normalizeOrderData(parsedBody);

      const recipientEmail = orderData.customer_email || 'customer@example.com';
      console.log(`[SES WORKER] Đang chuẩn bị gửi email xác nhận cho đơn ${orderData.id} tới: ${recipientEmail}`);

      const htmlBody = createOrderConfirmationHTML(orderData);

      if (process.env.LOCAL_SIMULATION === 'true' || !process.env.AWS_ACCESS_KEY_ID) {
        console.log(`[LOCAL / FALLBACK] Gửi email mô phỏng thành công tới ${recipientEmail} cho đơn hàng ${orderData.id}`);
      } else {
        const sendEmailParams = {
          Source: senderEmail,
          Destination: {
            ToAddresses: [recipientEmail]
          },
          Message: {
            Subject: {
              Data: `[AstralFood] Xác nhận đơn hàng #${orderData.id} - ${orderData.store_name}`,
              Charset: 'UTF-8'
            },
            Body: {
              Html: {
                Data: htmlBody,
                Charset: 'UTF-8'
              }
            }
          }
        };

        const result = await sesClient.send(new SendEmailCommand(sendEmailParams));
        console.log(`[SES SUCCESS] Message ID: ${result.MessageId}`);
      }
    } catch (err) {
      console.error('[SES WORKER ERROR] Lỗi gửi email qua SES:', err);
    }
  }

  return { statusCode: 200, body: 'Gửi thông báo thành công' };
};

exports.createOrderConfirmationHTML = createOrderConfirmationHTML;
exports.normalizeOrderData = normalizeOrderData;

// Cho phép test chạy local độc lập
if (require.main === module) {
  const sampleEvent = require('../sample-sqs-event.json');
  process.env.LOCAL_SIMULATION = 'true';
  exports.handler(sampleEvent)
    .then(res => console.log('Test notification-sender với sample-sqs-event kết quả:', res));
}

