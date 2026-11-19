const PDFDocument = require('pdfkit');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const region = process.env.AWS_REGION || 'ap-southeast-1';
const bucketName =
  process.env.INVOICE_S3_BUCKET || process.env.S3_BUCKET_INVOICES || 'astralfood-invoices';
const s3Client = new S3Client({ region });

/**
 * Chuyển chuỗi tiếng Việt có dấu sang ASCII sạch để font mặc định Helvetica của PDFKit không bị lỗi ký tự.
 */
function toAsciiVietnamese(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
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
        `Mon #${item.product_id || item.productId || 'N/A'}`,
      quantity: qty,
      unit_price: unitPrice,
      subtotal,
    };
  });

  return {
    event_type: data.eventType || data.event_type || raw.eventType || 'ORDER_CREATED',
    id: data.id || data.orderId,
    status: data.status || 'PENDING',
    customer_name:
      data.customer_name ||
      data.customerName ||
      (data.customer && data.customer.fullName) ||
      'Khach hang AstralFood',
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
    created_at: data.created_at || data.createdAt || new Date().toISOString(),
    total_amount:
      Number(data.total_amount !== undefined ? data.total_amount : data.totalAmount) || 0,
    discount_amount:
      Number(data.discount_amount !== undefined ? data.discount_amount : data.discountAmount) || 0,
    items,
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
      doc.on('error', reject);

      // Header AstralFood
      doc.fillColor('#FF5A1F').fontSize(24).text('ASTRALFOOD', { align: 'center' });

      doc
        .fillColor('#666666')
        .fontSize(11)
        .text('Nen tang Dat do an & Thuong mai Dien tu Da kenh tren AWS', { align: 'center' })
        .moveDown(1.2);

      doc
        .strokeColor('#EEEEEE')
        .lineWidth(1)
        .moveTo(40, doc.y)
        .lineTo(555, doc.y)
        .stroke()
        .moveDown(1);

      // Thong tin hoa don
      doc
        .fillColor('#222222')
        .fontSize(16)
        .text('HOA DON THANH TOAN (INVOICE)', { underline: true })
        .moveDown(0.5);

      doc.fontSize(10).fillColor('#333333');
      doc.text(`Ma don hang (Order ID): ${toAsciiVietnamese(orderData.id)}`);
      doc.text(`Trang thai (Status): ${toAsciiVietnamese(orderData.status)}`);
      doc.text(`Ngay tao (Date): ${toAsciiVietnamese(orderData.created_at)}`);
      doc.text(`Khach hang (Customer): ${toAsciiVietnamese(orderData.customer_name)}`);
      doc.text(`Dia chi giao hang: ${toAsciiVietnamese(orderData.delivery_address)}`);
      doc.text(`Cua hang: ${toAsciiVietnamese(orderData.store_name)}`);
      if (orderData.note) {
        doc.text(`Ghi chu: ${toAsciiVietnamese(orderData.note)}`);
      }
      doc.moveDown(1);

      // Bang san pham
      doc
        .strokeColor('#FF5A1F')
        .lineWidth(1.5)
        .moveTo(40, doc.y)
        .lineTo(555, doc.y)
        .stroke()
        .moveDown(0.5);

      const itemY = doc.y;
      doc.fontSize(11).fillColor('#111111').text('Mon an / San pham', 45, itemY, { width: 265 });
      doc.text('SL', 320, itemY, { width: 45, align: 'center' });
      doc.text('Don gia (VND)', 375, itemY, { width: 85, align: 'right' });
      doc.text('Thanh tien (VND)', 465, itemY, { width: 90, align: 'right' });
      doc.moveDown(0.8);

      let currentY = doc.y;
      orderData.items.forEach((item) => {
        if (currentY > 730) {
          doc.addPage();
          currentY = 50;
        }

        const safeName = toAsciiVietnamese(item.product_name);
        const nameHeight = doc.fontSize(10).heightOfString(safeName, { width: 265 });
        const rowHeight = Math.max(20, nameHeight + 6);

        doc.fontSize(10).fillColor('#444444');
        doc.text(safeName, 45, currentY, { width: 265 });
        doc.text(String(item.quantity), 320, currentY, { width: 45, align: 'center' });
        doc.text(item.unit_price.toLocaleString('vi-VN'), 375, currentY, {
          width: 85,
          align: 'right',
        });
        doc.text(item.subtotal.toLocaleString('vi-VN'), 465, currentY, {
          width: 90,
          align: 'right',
        });

        currentY += rowHeight;
      });

      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      doc.y = currentY + 10;
      doc
        .strokeColor('#EEEEEE')
        .lineWidth(1)
        .moveTo(40, doc.y)
        .lineTo(555, doc.y)
        .stroke()
        .moveDown(1);

      // Tong tien & Giam gia
      if (orderData.discount_amount > 0) {
        const voucherLabel = orderData.voucher_code
          ? `Giam gia voucher (${toAsciiVietnamese(orderData.voucher_code)})`
          : 'Giam gia voucher';
        doc
          .fillColor('#10B981')
          .fontSize(10)
          .text(`${voucherLabel}: -${orderData.discount_amount.toLocaleString('vi-VN')} VND`, 40, doc.y, {
            width: 515,
            align: 'right',
          });
      }

      doc
        .fillColor('#FF5A1F')
        .fontSize(14)
        .text(`TONG CONG: ${orderData.total_amount.toLocaleString('vi-VN')} VND`, 40, doc.y + 4, {
          width: 515,
          align: 'right',
        });

      // Footer
      doc.moveDown(3);
      doc
        .fillColor('#888888')
        .fontSize(9)
        .text('Cam on quy khach da tin dung AstralFood!', 40, doc.y, {
          width: 515,
          align: 'center',
        });
      doc.text('He thong tu dong phat hanh boi AWS Lambda Event-Driven Worker', 40, doc.y + 2, {
        width: 515,
        align: 'center',
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
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
  console.log('Incoming Invoice Lambda Event:', JSON.stringify(event));

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
        console.warn('[INVOICE WORKER] Bo qua record khong co Order ID:', record);
        continue;
      }

      // Chỉ xuất hóa đơn khi tạo đơn mới hoặc khi đơn chuyển sang trạng thái COMPLETED
      if (orderData.event_type === 'ORDER_STATUS_UPDATED' && orderData.status !== 'COMPLETED') {
        console.log(
          `[INVOICE WORKER] Bo qua tao PDF cho su kien ${orderData.event_type} (${orderData.status}) cua don ${orderData.id}`
        );
        continue;
      }

      console.log(`[INVOICE WORKER] Dang tao hoa don cho don hang: ${orderData.id}`);
      const pdfBuffer = await generateInvoicePDFBuffer(orderData);
      const s3Key = `invoices/INV-${orderData.id}.pdf`;

      if (shouldRunLocalSimulation()) {
        console.log(
          `[LOCAL / FALLBACK] Da tao thanh cong PDF Buffer (${pdfBuffer.length} bytes). S3 Path: s3://${bucketName}/${s3Key}`
        );
      } else {
        const uploadParams = {
          Bucket: bucketName,
          Key: s3Key,
          Body: pdfBuffer,
          ContentType: 'application/pdf',
        };

        await s3Client.send(new PutObjectCommand(uploadParams));
        console.log(`[S3 SUCCESS] Da luu hoa don vao s3://${bucketName}/${s3Key}`);
      }
    } catch (recordErr) {
      console.error('[INVOICE WORKER ERROR] Loi xu ly record:', recordErr);
      if (record.messageId) {
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    }
  }

  return {
    statusCode: 200,
    body: 'Xử lý hóa đơn hoàn tất',
    batchItemFailures,
  };
};

exports.generateInvoicePDFBuffer = generateInvoicePDFBuffer;
exports.normalizeOrderData = normalizeOrderData;
exports.toAsciiVietnamese = toAsciiVietnamese;
