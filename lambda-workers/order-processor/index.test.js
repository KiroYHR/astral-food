const test = require('node:test');
const assert = require('node:assert/strict');
const worker = require('./index');

const sampleOrder = {
  eventType: 'ORDER_CREATED',
  id: 'ord-unified-001',
  orderId: 'ord-unified-001',
  status: 'PENDING',
  customerName: 'Nguyễn Văn Đức <script>alert(1)</script>',
  customerEmail: 'vuhuyduc1234dn@gmail.com',
  storeName: 'Cơm Tấm Sài Gòn Star',
  deliveryAddress: '268 Lý Thường Kiệt, Quận 10, TP.HCM',
  note: 'Ít cay & nhiều đồ chua',
  voucherCode: 'ASTRAL20',
  discountAmount: 20000,
  totalAmount: 125000,
  createdAt: '2026-11-25T03:00:00.000Z',
  items: [
    {
      productId: 'prod-1',
      productName: 'Cơm Tấm Sườn Bì Chả Trứng Ốp La',
      quantity: 2,
      unitPrice: 55000,
      subtotal: 110000,
    },
    {
      productId: 'prod-2',
      productName: 'Trà Tắc Mật Ong',
      quantity: 1,
      unitPrice: 35000,
      subtotal: 35000,
    },
  ],
};

test('ORDER_CREATED chạy song song Invoice (PDF) & Notification (SES) thành công', async () => {
  process.env.LOCAL_SIMULATION = 'true';
  process.env.INVOICE_S3_BUCKET = 'astralfood-invoices-722769295479';

  const normalized = worker.normalizeOrderData(sampleOrder);
  const outcome = await worker.processOrderRecord(normalized);

  assert.equal(outcome.hasFailure, false);
  assert.equal(outcome.invoice.status, 'fulfilled');
  assert.equal(outcome.notification.status, 'fulfilled');
  assert.equal(outcome.invoice.value.skipped, false);
  assert.equal(outcome.invoice.value.s3Key, 'invoices/INV-ord-unified-001.pdf');
  assert.ok(outcome.invoice.value.pdfBytes > 1000);
  assert.equal(outcome.notification.value.recipientEmail, 'vuhuyduc1234dn@gmail.com');

  const pdfBuf = await worker.generateInvoicePDFBuffer(normalized);
  assert.equal(pdfBuf.subarray(0, 5).toString('utf8'), '%PDF-');
  assert.equal(worker.toAsciiVietnamese('Nguyễn Văn Đức - Đắk Lắk'), 'Nguyen Van Duc - Dak Lak');
});

test('ORDER_STATUS_UPDATED (PREPARING) bỏ qua vẽ lại PDF nhưng vẫn gửi Email', async () => {
  process.env.LOCAL_SIMULATION = 'true';
  const normalized = worker.normalizeOrderData({
    ...sampleOrder,
    eventType: 'ORDER_STATUS_UPDATED',
    status: 'PREPARING',
  });

  const outcome = await worker.processOrderRecord(normalized);
  assert.equal(outcome.hasFailure, false);
  assert.equal(outcome.invoice.status, 'fulfilled');
  assert.equal(outcome.invoice.value.skipped, true);
  assert.equal(outcome.notification.status, 'fulfilled');
  assert.equal(outcome.notification.value.statusLabel, 'Đang chế biến');
});

test('ORDER_STATUS_UPDATED (COMPLETED) vừa tạo PDF vừa gửi Email kèm link tải PDF và chống XSS', async () => {
  process.env.LOCAL_SIMULATION = 'true';
  process.env.INVOICE_S3_BUCKET = 'astralfood-invoices-722769295479';

  const normalized = worker.normalizeOrderData({
    ...sampleOrder,
    eventType: 'ORDER_STATUS_UPDATED',
    status: 'COMPLETED',
  });

  const html = worker.createOrderConfirmationHTML(normalized);
  assert.ok(!html.includes('<script>'), 'XSS must be escaped');
  assert.ok(html.includes('astralfood-invoices-722769295479'));
  assert.ok(html.includes('INV-ord-unified-001.pdf'));
  assert.ok(html.includes('Đã hoàn tất'));

  const outcome = await worker.processOrderRecord(normalized);
  assert.equal(outcome.hasFailure, false);
  assert.equal(outcome.invoice.value.skipped, false);
});

test('Promise.allSettled độc lập: nếu SES lỗi, Invoice PDF vẫn chạy xong và SQS nhận batchItemFailures', async () => {
  process.env.LOCAL_SIMULATION = 'true';
  let invoiceRan = false;

  const res = await worker.handler(
    {
      Records: [
        { messageId: 'msg-ok', body: JSON.stringify(sampleOrder) },
        { messageId: 'msg-bad-json', body: '{invalid-json' },
      ],
    },
    {},
    {
      processInvoice: async (order) => {
        invoiceRan = true;
        return { skipped: false, s3Key: `invoices/INV-${order.id}.pdf` };
      },
      processNotification: async () => {
        throw new Error('SES temporary failure');
      },
    }
  );

  assert.equal(invoiceRan, true);
  assert.deepEqual(res.batchItemFailures, [
    { itemIdentifier: 'msg-ok' },
    { itemIdentifier: 'msg-bad-json' },
  ]);
});

test('SES Sandbox MessageRejected (email chưa verify) không đưa vào batchItemFailures để tránh vòng lặp retry SQS', async () => {
  process.env.LOCAL_SIMULATION = 'true';
  let invoiceRan = false;

  const sesErr = new Error('Email address is not verified. The following identities failed the check in region AP-SOUTHEAST-1: customer@gmail.com');
  sesErr.name = 'MessageRejected';

  assert.equal(worker.isNonRetryableSesError(sesErr), true);
  assert.equal(worker.isNonRetryableSesError(new Error('SES ThrottlingException')), false);

  const res = await worker.handler(
    {
      Records: [
        { messageId: 'msg-unverified-email', body: JSON.stringify({ ...sampleOrder, customerEmail: 'customer@gmail.com' }) },
      ],
    },
    {},
    {
      processInvoice: async (order) => {
        invoiceRan = true;
        return { skipped: false, s3Key: `invoices/INV-${order.id}.pdf` };
      },
      processNotification: async () => {
        throw sesErr;
      },
    }
  );

  assert.equal(invoiceRan, true);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.batchItemFailures, []);
});
