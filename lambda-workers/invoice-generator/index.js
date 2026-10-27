const PDFDocument = require('pdfkit');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const region = process.env.AWS_REGION || 'ap-southeast-1';
const bucketName = process.env.INVOICE_S3_BUCKET || 'astralfood-invoices';
const s3Client = new S3Client({ region });

/**
 * Chuẩn hóa object đơn hàng từ mọi dạng payload (TV1 Prisma SQS payload hoặc TV2 direct payload)
 */
function normalizeOrderData(raw) {
  const data = raw.data || raw;
  return {
    id: data.id || data.orderId,
    customer_name: data.customer_name || data.customerName || (data.customer && data.customer.fullName) || 'Khach hang AstralFood',
    customer_email: data.customer_email || data.customerEmail || (data.customer && data.customer.email) || 'customer@example.com',
    store_name: data.store_name || data.storeName || (data.store && data.store.name) || 'AstralFood Store',
    store_id: data.store_id || data.storeId,
    delivery_address: data.delivery_address || data.deliveryAddress || 'N/A',
    note: data.note || '',
    created_at: data.created_at || data.createdAt || new Date().toISOString(),
    total_amount: Number(data.total_amount !== undefined ? data.total_amount : data.totalAmount) || 0,
    discount_amount: Number(data.discount_amount !== undefined ? data.discount_amount : data.discountAmount) || 0,
    items: (data.items || []).map(item => ({
      product_name: item.product_name || item.productName || (item.product && item.product.name) || `Mon #${item.product_id || item.productId}`,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unit_price !== undefined ? item.unit_price : item.unitPrice) || 0,
      subtotal: Number(item.subtotal !== undefined ? item.subtotal : (item.unitPrice || item.unit_price || 0) * (item.quantity || 1))
    }))
  };
}

/**
 * Tạo file PDF hóa đơn AstralFood từ dữ liệu Order
 * @param {Object} orderData 
 * @returns {Promise<Buffer>}
 */
function generateInvoicePDFBuffer(orderData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header AstralFood
      doc.fillColor('#FF5A1F')
         .fontSize(24)
         .text('ASTRALFOOD', { align: 'center' });
      
      doc.fillColor('#666666')
         .fontSize(11)
         .text('Nen tang Dat do an & Thuong mai Dien tu Da kenh tren AWS', { align: 'center' })
         .moveDown(1.5);

      doc.strokeColor('#EEEEEE').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke().moveDown(1);

      // Thong tin hoa don
      doc.fillColor('#222222').fontSize(16).text('HOA DON THANH TOAN (INVOICE)', { underline: true }).moveDown(0.5);

      doc.fontSize(10).fillColor('#333333');
      doc.text(`Ma don hang (Order ID): ${orderData.id}`);
      doc.text(`Ngay tao (Date): ${orderData.created_at}`);
      doc.text(`Khach hang (Customer): ${orderData.customer_name}`);
      doc.text(`Dia chi giao hang: ${orderData.delivery_address}`);
      doc.text(`Cua hang: ${orderData.store_name}`);
      if (orderData.note) {
        doc.text(`Ghi chu: ${orderData.note}`);
      }
      doc.moveDown(1);

      // Bang san pham
      doc.strokeColor('#FF5A1F').lineWidth(1.5).moveTo(40, doc.y).lineTo(555, doc.y).stroke().moveDown(0.5);
      
      const itemY = doc.y;
      doc.fontSize(11).fillColor('#111111').text('Mon an / San pham', 45, itemY);
      doc.text('SL', 320, itemY);
      doc.text('Don gia (VND)', 380, itemY);
      doc.text('Thanh tien (VND)', 470, itemY);
      doc.moveDown(0.8);

      let currentY = doc.y;
      orderData.items.forEach(item => {
        doc.fontSize(10).fillColor('#444444');
        doc.text(item.product_name, 45, currentY);
        doc.text(String(item.quantity), 325, currentY);
        doc.text(item.unit_price.toLocaleString('vi-VN'), 380, currentY);
        doc.text(item.subtotal.toLocaleString('vi-VN'), 470, currentY);
        currentY += 22;
      });

      doc.y = currentY + 10;
      doc.strokeColor('#EEEEEE').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke().moveDown(1);

      // Tong tien & Giam gia
      if (orderData.discount_amount > 0) {
        doc.fillColor('#10B981').fontSize(10).text(`Giam gia voucher: -${orderData.discount_amount.toLocaleString('vi-VN')} VND`, { align: 'right' });
      }
      doc.fillColor('#FF5A1F').fontSize(14).text(`TONG CONG: ${orderData.total_amount.toLocaleString('vi-VN')} VND`, { align: 'right' });

      // Footer
      doc.moveDown(3);
      doc.fillColor('#888888').fontSize(9).text('Cam on quy khach da tin dung AstralFood!', { align: 'center' });
      doc.text('He thong tu dong phat hanh boi AWS Lambda Event-Driven Worker', { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * AWS Lambda Handler (Trigger tu SQS)
 */
exports.handler = async (event) => {
  console.log('Incoming Lambda Event:', JSON.stringify(event));

  const records = event.Records || [{ body: JSON.stringify(event) }];

  for (const record of records) {
    try {
      const parsedBody = typeof record.body === 'string' ? JSON.parse(record.body) : record;
      const orderData = normalizeOrderData(parsedBody);

      if (!orderData.id) {
        console.warn('Bo qua record khong co Order ID:', record);
        continue;
      }

      console.log(`[INVOICE WORKER] Dang tao hoa don cho don hang: ${orderData.id}`);
      const pdfBuffer = await generateInvoicePDFBuffer(orderData);
      const s3Key = `invoices/${orderData.id}.pdf`;

      if (process.env.LOCAL_SIMULATION === 'true' || !process.env.AWS_ACCESS_KEY_ID) {
        console.log(`[LOCAL / FALLBACK] Da tao thanh cong PDF Buffer (${pdfBuffer.length} bytes). S3 Path: s3://${bucketName}/${s3Key}`);
      } else {
        const uploadParams = {
          Bucket: bucketName,
          Key: s3Key,
          Body: pdfBuffer,
          ContentType: 'application/pdf'
        };

        await s3Client.send(new PutObjectCommand(uploadParams));
        console.log(`[S3 SUCCESS] Da luu hoa don vao s3://${bucketName}/${s3Key}`);
      }
    } catch (recordErr) {
      console.error('[WORKER ERROR] Loi xu ly record:', recordErr);
    }
  }

  return { statusCode: 200, body: 'Xử lý hóa đơn thành công' };
};

exports.generateInvoicePDFBuffer = generateInvoicePDFBuffer;
exports.normalizeOrderData = normalizeOrderData;

