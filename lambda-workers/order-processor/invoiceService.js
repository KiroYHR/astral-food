const PDFDocument = require('pdfkit');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { shouldRunLocalSimulation } = require('./normalizeOrder');

function getConfig() {
  const region = process.env.AWS_REGION || 'ap-southeast-1';
  const bucketName =
    process.env.INVOICE_S3_BUCKET || process.env.S3_BUCKET_INVOICES || 'astralfood-invoices';
  return { region, bucketName };
}

let cachedS3Client = null;
function getS3Client(region) {
  if (!cachedS3Client) {
    cachedS3Client = new S3Client({ region });
  }
  return cachedS3Client;
}

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
 * Tạo file PDF hóa đơn AstralFood từ dữ liệu Order đã chuẩn hóa
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
          .text(
            `${voucherLabel}: -${orderData.discount_amount.toLocaleString('vi-VN')} VND`,
            40,
            doc.y,
            {
              width: 515,
              align: 'right',
            }
          );
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

/**
 * Xử lý tạo hóa đơn PDF và tải lên Amazon S3 (chỉ tạo khi ORDER_CREATED hoặc COMPLETED)
 */
async function processInvoice(orderData) {
  if (orderData.event_type === 'ORDER_STATUS_UPDATED' && orderData.status !== 'COMPLETED') {
    console.log(
      `[INVOICE] Bỏ qua tạo PDF cho sự kiện ${orderData.event_type} (${orderData.status}) của đơn ${orderData.id}`
    );
    return { skipped: true, reason: `Status ${orderData.status} does not require PDF regeneration` };
  }

  const { region, bucketName } = getConfig();
  const s3Key = `invoices/INV-${orderData.id}.pdf`;
  const invoiceUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;

  console.log(`[INVOICE] Đang tạo hóa đơn PDF cho đơn hàng: ${orderData.id}`);
  const pdfBuffer = await generateInvoicePDFBuffer(orderData);

  if (shouldRunLocalSimulation()) {
    console.log(
      `[INVOICE][LOCAL] Tạo thành công PDF (${pdfBuffer.length} bytes) -> s3://${bucketName}/${s3Key}`
    );
    return {
      skipped: false,
      simulated: true,
      bucketName,
      s3Key,
      invoiceUrl,
      pdfBytes: pdfBuffer.length,
    };
  }

  const client = getS3Client(region);
  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
    })
  );

  console.log(`[INVOICE][S3 SUCCESS] Đã lưu hóa đơn tại s3://${bucketName}/${s3Key}`);
  return {
    skipped: false,
    simulated: false,
    bucketName,
    s3Key,
    invoiceUrl,
    pdfBytes: pdfBuffer.length,
  };
}

module.exports = {
  processInvoice,
  generateInvoicePDFBuffer,
  toAsciiVietnamese,
};
