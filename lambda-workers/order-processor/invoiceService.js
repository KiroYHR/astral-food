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

const STATUS_STYLE = {
  PENDING: { label: 'CHO XAC NHAN', stamp: 'PENDING', bg: '#FEF3C7', fg: '#B45309', border: '#F59E0B' },
  CONFIRMED: { label: 'DA XAC NHAN', stamp: 'CONFIRMED', bg: '#EDE9FE', fg: '#6D28D9', border: '#8B5CF6' },
  PREPARING: { label: 'DANG CHE BIEN', stamp: 'PREPARING', bg: '#FFEDD5', fg: '#C2410C', border: '#FF5A1F' },
  DELIVERING: { label: 'DANG GIAO HANG', stamp: 'DELIVERING', bg: '#DBEAFE', fg: '#1D4ED8', border: '#3B82F6' },
  COMPLETED: { label: 'DA HOAN TAT', stamp: 'PAID / COMPLETED', bg: '#D1FAE5', fg: '#047857', border: '#10B981' },
  CANCELLED: { label: 'DA HUY', stamp: 'CANCELLED', bg: '#FEE2E2', fg: '#B91C1C', border: '#EF4444' },
};

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

function formatVnd(amount) {
  const n = Number(amount) || 0;
  return `${Math.round(n).toLocaleString('en-US').replace(/,/g, '.')} VND`;
}

function formatInvoiceDate(rawDate) {
  if (!rawDate) return '';
  const d = new Date(rawDate);
  if (Number.isNaN(d.getTime())) return toAsciiVietnamese(rawDate);
  // Format theo mui gio Viet Nam (UTC+7)
  const vn = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const pad = (v) => String(v).padStart(2, '0');
  return `${pad(vn.getUTCDate())}/${pad(vn.getUTCMonth() + 1)}/${vn.getUTCFullYear()} ${pad(
    vn.getUTCHours()
  )}:${pad(vn.getUTCMinutes())} (GMT+7)`;
}

/**
 * Vẽ Watermark chéo mờ thương hiệu ASTRALFOOD trên nền mỗi trang hóa đơn.
 */
function drawWatermark(doc, statusCode) {
  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const cx = pageW / 2;
  const cy = pageH / 2 + 65;
  const subText =
    statusCode === 'COMPLETED'
      ? 'OFFICIAL E-INVOICE  -  PAID & VERIFIED'
      : statusCode === 'CANCELLED'
        ? 'CANCELLED ORDER  -  VOID'
        : 'ASTRALFOOD OFFICIAL E-INVOICE';

  doc.save();
  doc.translate(cx, cy);
  doc.rotate(-30);

  // Vòng tròn mảnh trang trí watermark
  doc
    .lineWidth(2)
    .strokeColor('#FF5A1F')
    .strokeOpacity(0.06)
    .circle(0, 0, 168)
    .stroke();
  doc
    .lineWidth(1)
    .strokeColor('#F59E0B')
    .strokeOpacity(0.06)
    .circle(0, 0, 156)
    .stroke();

  // Chữ chính ASTRALFOOD
  doc
    .font('Helvetica-Bold')
    .fontSize(52)
    .fillColor('#FF5A1F')
    .fillOpacity(0.085)
    .text('ASTRALFOOD', -240, -32, { width: 480, align: 'center', lineBreak: false });

  // Dòng phụ watermark
  doc
    .font('Helvetica-Bold')
    .fontSize(12.5)
    .fillColor('#1E293B')
    .fillOpacity(0.095)
    .text(subText, -240, 26, { width: 480, align: 'center', lineBreak: false });

  doc.restore();
  doc.fillOpacity(1).strokeOpacity(1);
}

/**
 * Vẽ biểu tượng ngôi sao Solar Starburst của AstralFood bằng vector.
 */
function drawStarburstLogo(doc, cx, cy, outerR, innerR) {
  doc.save();
  // Nền tròn trắng bo mềm sau logo
  doc.fillColor('#FFFFFF').fillOpacity(0.18).circle(cx, cy, outerR + 6).fill();
  doc.fillColor('#FFFFFF').fillOpacity(1);
  const points = 8;
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) doc.moveTo(x, y);
    else doc.lineTo(x, y);
  }
  doc.closePath().fill('#FFFFFF');
  doc.circle(cx, cy, innerR * 0.52).fill('#FF5A1F');
  doc.restore();
  doc.fillOpacity(1);
}

/**
 * Vẽ bảng tiêu đề cột danh sách món ăn (tái sử dụng khi ngắt trang).
 */
function drawItemsTableHeader(doc, y) {
  const left = 40;
  const width = 515;
  doc.save();
  doc.roundedRect(left, y, width, 26, 5).fill('#1E293B');
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#FFFFFF');
  doc.text('#', left + 8, y + 8, { width: 22, align: 'center', lineBreak: false });
  doc.text('MON AN / SAN PHAM', left + 34, y + 8, { width: 230, lineBreak: false });
  doc.text('SL', left + 270, y + 8, { width: 38, align: 'center', lineBreak: false });
  doc.text('DON GIA', left + 314, y + 8, { width: 92, align: 'right', lineBreak: false });
  doc.text('THANH TIEN', left + 412, y + 8, { width: 95, align: 'right', lineBreak: false });
  doc.restore();
  return y + 28;
}

/**
 * Vẽ con dấu xác nhận điện tử bên trái phần tổng tiền.
 */
function drawDigitalStamp(doc, x, y, statusMeta) {
  doc.save();
  doc.translate(x + 95, y + 36);
  doc.rotate(-6);

  // Khung ngoài & trong của con dấu
  doc
    .roundedRect(-92, -30, 184, 60, 8)
    .lineWidth(2)
    .strokeColor(statusMeta.border)
    .strokeOpacity(0.65)
    .stroke();
  doc
    .roundedRect(-87, -25, 174, 50, 6)
    .lineWidth(0.8)
    .dash(3, { space: 2 })
    .strokeColor(statusMeta.border)
    .strokeOpacity(0.55)
    .stroke()
    .undash();

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(statusMeta.fg)
    .fillOpacity(0.8)
    .text('ASTRALFOOD E-INVOICE', -84, -19, { width: 168, align: 'center', lineBreak: false });

  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor(statusMeta.fg)
    .fillOpacity(0.9)
    .text(statusMeta.stamp, -84, -5, { width: 168, align: 'center', lineBreak: false });

  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor('#475569')
    .fillOpacity(0.85)
    .text('Verified by AWS Serverless', -84, 13, { width: 168, align: 'center', lineBreak: false });

  doc.restore();
  doc.fillOpacity(1).strokeOpacity(1);
}

/**
 * Tạo file PDF hóa đơn AstralFood từ dữ liệu Order đã chuẩn hóa (thiết kế hiện đại + Watermark thương hiệu)
 * @param {Object} orderData
 * @returns {Promise<Buffer>}
 */
function generateInvoicePDFBuffer(orderData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        info: {
          Title: `AstralFood Invoice #${toAsciiVietnamese(orderData.id)}`,
          Author: 'AstralFood AWS Serverless',
          Subject: 'Electronic Food Order Invoice',
        },
      });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const statusKey = String(orderData.status || 'PENDING').toUpperCase();
      const statusMeta = STATUS_STYLE[statusKey] || STATUS_STYLE.PENDING;

      // Tự động vẽ Watermark trên các trang phụ nếu đơn nhiều món
      doc.on('pageAdded', () => {
        drawWatermark(doc, statusKey);
      });

      // 1. HEADER BANNER SOLAR STARBURST (FULL-WIDTH)
      const grad = doc.linearGradient(0, 0, 595, 118);
      grad.stop(0, '#EA4C14').stop(0.6, '#FF5A1F').stop(1, '#F59E0B');
      doc.rect(0, 0, 595.28, 118).fill(grad);

      // Họa tiết tròn mờ trang trí banner
      doc.save();
      doc.fillColor('#FFFFFF').fillOpacity(0.08).circle(525, 22, 68).fill();
      doc.fillColor('#FFFFFF').fillOpacity(0.06).circle(468, 108, 42).fill();
      doc.restore();
      doc.fillOpacity(1);

      // Logo + Tên thương hiệu (trái)
      drawStarburstLogo(doc, 66, 56, 17, 8);
      doc
        .font('Helvetica-Bold')
        .fontSize(24)
        .fillColor('#FFFFFF')
        .text('ASTRALFOOD', 98, 36, { lineBreak: false });
      doc
        .font('Helvetica')
        .fontSize(9.5)
        .fillColor('#FFF7ED')
        .text('Cloud-Native Food Delivery & E-Commerce on AWS', 98, 66, { lineBreak: false });
      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor('#FFEDD5')
        .text('Region: ap-southeast-1 (Singapore)  |  dl2uzojz50nh6.cloudfront.net', 98, 82, {
          lineBreak: false,
        });

      // Tiêu đề hóa đơn + Mã số (phải)
      const shortOrderCode = toAsciiVietnamese(orderData.id).slice(0, 18).toUpperCase();
      doc
        .font('Helvetica-Bold')
        .fontSize(20)
        .fillColor('#FFFFFF')
        .text('HOA DON DIEN TU', 355, 34, { width: 200, align: 'right', lineBreak: false });
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#FEF3C7')
        .text(`SO: INV-${shortOrderCode}`, 355, 62, { width: 200, align: 'right', lineBreak: false });
      doc
        .font('Helvetica')
        .fontSize(8.8)
        .fillColor('#FFFFFF')
        .text(formatInvoiceDate(orderData.created_at), 355, 79, {
          width: 200,
          align: 'right',
          lineBreak: false,
        });

      // 3. HAI KHỐI THÔNG TIN (KHÁCH HÀNG & ĐƠN HÀNG)
      const cardTop = 136;
      const cardGap = 15;
      const leftCardW = 250;
      const rightCardW = 250;
      const leftX = 40;
      const rightX = leftX + leftCardW + cardGap;

      const customerName = toAsciiVietnamese(orderData.customer_name || 'Khach hang');
      const customerEmail = toAsciiVietnamese(orderData.customer_email || '');
      const deliveryAddr = toAsciiVietnamese(orderData.delivery_address || 'Chua cap nhat');
      const storeName = toAsciiVietnamese(orderData.store_name || 'Cua hang AstralFood');
      const orderIdText = toAsciiVietnamese(orderData.id || '');
      const noteText = orderData.note ? toAsciiVietnamese(orderData.note) : '';

      // Tính chiều cao động cho 2 thẻ để luôn cân xứng và không tràn chữ
      doc.font('Helvetica').fontSize(9.2);
      const addrH = doc.heightOfString(deliveryAddr, { width: leftCardW - 24 });
      const noteH = noteText ? doc.heightOfString(`Ghi chu: ${noteText}`, { width: leftCardW - 24 }) + 6 : 0;
      const idH = doc.heightOfString(orderIdText, { width: rightCardW - 24 });
      const storeH = doc.heightOfString(storeName, { width: rightCardW - 24 });
      const cardH = Math.max(114, 62 + addrH + noteH + 14, 78 + idH + storeH + 14);

      // Thẻ trái: Khách hàng & Giao hàng
      doc
        .roundedRect(leftX, cardTop, leftCardW, cardH, 8)
        .fillAndStroke('#F8FAFC', '#E2E8F0');
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor('#FF5A1F')
        .text('THONG TIN KHACH HANG & GIAO HANG', leftX + 12, cardTop + 11, {
          width: leftCardW - 24,
        });
      doc
        .strokeColor('#E2E8F0')
        .lineWidth(0.7)
        .moveTo(leftX + 12, cardTop + 25)
        .lineTo(leftX + leftCardW - 12, cardTop + 25)
        .stroke();

      let ly = cardTop + 32;
      doc
        .font('Helvetica-Bold')
        .fontSize(10.5)
        .fillColor('#0F172A')
        .text(customerName, leftX + 12, ly, { width: leftCardW - 24 });
      ly += 15;
      if (customerEmail) {
        doc
          .font('Helvetica')
          .fontSize(8.8)
          .fillColor('#475569')
          .text(`Email: ${customerEmail}`, leftX + 12, ly, { width: leftCardW - 24 });
        ly += 14;
      }
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#334155')
        .text(`Dia chi: ${deliveryAddr}`, leftX + 12, ly, { width: leftCardW - 24 });
      ly += doc.heightOfString(`Dia chi: ${deliveryAddr}`, { width: leftCardW - 24 }) + 5;
      if (noteText) {
        doc
          .font('Helvetica-Oblique')
          .fontSize(8.5)
          .fillColor('#64748B')
          .text(`Ghi chu: ${noteText}`, leftX + 12, ly, { width: leftCardW - 24 });
      }

      // Thẻ phải: Thông tin đơn hàng & Trạng thái
      doc
        .roundedRect(rightX, cardTop, rightCardW, cardH, 8)
        .fillAndStroke('#F8FAFC', '#E2E8F0');
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor('#FF5A1F')
        .text('CHI TIET DON HANG', rightX + 12, cardTop + 11, {
          width: rightCardW - 24,
        });
      doc
        .strokeColor('#E2E8F0')
        .lineWidth(0.7)
        .moveTo(rightX + 12, cardTop + 25)
        .lineTo(rightX + rightCardW - 12, cardTop + 25)
        .stroke();

      let ry = cardTop + 32;
      doc
        .font('Helvetica-Bold')
        .fontSize(10.5)
        .fillColor('#0F172A')
        .text(storeName, rightX + 12, ry, { width: rightCardW - 24 });
      ry += doc.heightOfString(storeName, { width: rightCardW - 24 }) + 5;

      doc
        .font('Helvetica')
        .fontSize(8.8)
        .fillColor('#475569')
        .text(`Ma don: ${orderIdText}`, rightX + 12, ry, { width: rightCardW - 24 });
      ry += doc.heightOfString(`Ma don: ${orderIdText}`, { width: rightCardW - 24 }) + 8;

      // Nhãn trạng thái bo tròn màu sắc
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor('#475569')
        .text('Trang thai:', rightX + 12, ry + 3, { continued: false, lineBreak: false });
      const pillX = rightX + 66;
      const pillW = 104;
      doc
        .roundedRect(pillX, ry, pillW, 18, 9)
        .fillAndStroke(statusMeta.bg, statusMeta.border);
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(statusMeta.fg)
        .text(statusMeta.label, pillX, ry + 5, { width: pillW, align: 'center', lineBreak: false });

      // 4. BẢNG DANH SÁCH MÓN ĂN
      let currentY = drawItemsTableHeader(doc, cardTop + cardH + 18);
      const items = Array.isArray(orderData.items) ? orderData.items : [];
      let subtotalSum = 0;

      items.forEach((item, idx) => {
        const safeName = toAsciiVietnamese(item.product_name || 'San pham');
        doc.font('Helvetica').fontSize(9.5);
        const nameHeight = doc.heightOfString(safeName, { width: 230 });
        const rowHeight = Math.max(24, nameHeight + 12);

        if (currentY + rowHeight > 700) {
          doc.addPage();
          currentY = drawItemsTableHeader(doc, 46);
        }

        // Nền sọc ngựa vằn nhẹ
        if (idx % 2 === 1) {
          doc.rect(40, currentY, 515, rowHeight).fill('#FFFBF7');
        }

        const textY = currentY + Math.max(6, (rowHeight - nameHeight) / 2);
        const itemSub = Number(item.subtotal) || (Number(item.unit_price) || 0) * (Number(item.quantity) || 1);
        subtotalSum += itemSub;

        doc.font('Helvetica').fontSize(9.5).fillColor('#64748B');
        doc.text(String(idx + 1), 48, textY, { width: 22, align: 'center' });
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#0F172A');
        doc.text(safeName, 74, textY, { width: 230 });
        doc.font('Helvetica').fontSize(9.5).fillColor('#334155');
        doc.text(String(item.quantity), 310, textY, { width: 38, align: 'center' });
        doc.text(formatVnd(item.unit_price), 354, textY, { width: 92, align: 'right' });
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#0F172A');
        doc.text(formatVnd(itemSub), 452, textY, { width: 95, align: 'right' });

        currentY += rowHeight;
        doc
          .strokeColor('#E2E8F0')
          .lineWidth(0.6)
          .moveTo(40, currentY)
          .lineTo(555, currentY)
          .stroke();
      });

      // 5. KHỐI TỔNG TIỀN & CON DẤU XÁC NHẬN ĐIỆN TỬ
      if (currentY > 640) {
        doc.addPage();
        currentY = 60;
      }

      const summaryTop = currentY + 18;
      const discount = Number(orderData.discount_amount) || 0;
      const computedSubtotal = subtotalSum > 0 ? subtotalSum : (Number(orderData.total_amount) || 0) + discount;
      const finalTotal = Number(orderData.total_amount) || Math.max(0, computedSubtotal - discount);

      // Con dấu điện tử bên trái
      drawDigitalStamp(doc, 45, summaryTop + 8, statusMeta);

      // Khối tổng thanh toán bên phải
      const boxX = 310;
      const boxW = 245;
      const boxH = discount > 0 ? 96 : 76;
      doc.roundedRect(boxX, summaryTop, boxW, boxH, 8).fillAndStroke('#FFF7ED', '#FED7AA');

      let sy = summaryTop + 12;
      doc.font('Helvetica').fontSize(9.5).fillColor('#475569');
      doc.text('Tam tinh (Subtotal):', boxX + 12, sy, { width: 120, lineBreak: false });
      doc.font('Helvetica-Bold').fillColor('#1E293B');
      doc.text(formatVnd(computedSubtotal), boxX + 125, sy, { width: 108, align: 'right', lineBreak: false });
      sy += 19;

      if (discount > 0) {
        const voucherTag = orderData.voucher_code
          ? `Voucher (${toAsciiVietnamese(orderData.voucher_code)}):`
          : 'Giam gia Voucher:';
        doc.font('Helvetica').fontSize(9.5).fillColor('#047857');
        doc.text(voucherTag, boxX + 12, sy, { width: 125, lineBreak: false });
        doc.font('Helvetica-Bold').fillColor('#047857');
        doc.text(`-${formatVnd(discount)}`, boxX + 130, sy, { width: 103, align: 'right', lineBreak: false });
        sy += 19;
      }

      doc
        .strokeColor('#FDBA74')
        .lineWidth(1)
        .moveTo(boxX + 12, sy)
        .lineTo(boxX + boxW - 12, sy)
        .stroke();
      sy += 10;

      doc.font('Helvetica-Bold').fontSize(11).fillColor('#0F172A');
      doc.text('TONG CONG:', boxX + 12, sy + 2, { width: 95, lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(13.5).fillColor('#FF5A1F');
      doc.text(formatVnd(finalTotal), boxX + 102, sy, { width: 131, align: 'right', lineBreak: false });

      // 6. FOOTER CUỐI TRANG
      const footerY = Math.max(summaryTop + boxH + 34, 756);
      doc
        .strokeColor('#FF5A1F')
        .lineWidth(1.5)
        .moveTo(40, footerY)
        .lineTo(555, footerY)
        .stroke();

      doc
        .font('Helvetica-Bold')
        .fontSize(9.5)
        .fillColor('#1E293B')
        .text('Cam on quy khach da tin dung dich vu cua AstralFood!', 40, footerY + 10, {
          width: 515,
          align: 'center',
        });
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#64748B')
        .text(
          'Hoa don dien tu duoc phat hanh tu dong boi AWS Lambda Event-Driven Worker (ap-southeast-1) & luu tru an toan tren Amazon S3.',
          40,
          footerY + 24,
          { width: 515, align: 'center' }
        );

      // 7. VẼ WATERMARK PHỦ MỜ LÊN TRANG HIỆN TẠI (KHÔNG BỊ THẺ TỔNG TIỀN CHE KHUẤT)
      drawWatermark(doc, statusKey);

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
  drawWatermark,
};
