const { normalizeOrderData } = require('./normalizeOrder');
const {
  processInvoice,
  generateInvoicePDFBuffer,
  toAsciiVietnamese,
} = require('./invoiceService');
const {
  processNotification,
  createOrderConfirmationHTML,
  escapeHtml,
  isNonRetryableSesError,
} = require('./notificationService');

/**
 * Xử lý 1 bản ghi đơn hàng bằng cách chạy song song Invoice (PDF -> S3) và Notification (Email -> SES)
 * qua Promise.allSettled để cả 2 tác vụ đều thực thi trên cùng 1 message từ Amazon SQS.
 */
async function processOrderRecord(orderData, deps = {}) {
  const runInvoice = deps.processInvoice || processInvoice;
  const runNotification = deps.processNotification || processNotification;

  const [invoiceResult, notificationResult] = await Promise.allSettled([
    runInvoice(orderData),
    runNotification(orderData),
  ]);

  const errors = [];

  if (invoiceResult.status === 'rejected') {
    console.error(`[ORDER ${orderData.id}] Lỗi Invoice S3:`, invoiceResult.reason);
    errors.push({ task: 'invoice', reason: invoiceResult.reason });
  }

  if (notificationResult.status === 'rejected') {
    if (isNonRetryableSesError(notificationResult.reason)) {
      console.warn(
        `[ORDER ${orderData.id}] Bỏ qua lỗi SES không thể retry (MessageRejected) để tránh vòng lặp SQS:`,
        notificationResult.reason?.message || notificationResult.reason
      );
    } else {
      console.error(`[ORDER ${orderData.id}] Lỗi Notification SES:`, notificationResult.reason);
      errors.push({ task: 'notification', reason: notificationResult.reason });
    }
  }

  return {
    orderId: orderData.id,
    invoice: invoiceResult,
    notification: notificationResult,
    hasFailure: errors.length > 0,
    errors,
  };
}

/**
 * Unified AWS Lambda Handler (1 SQS Queue: astralfood-orders-queue -> 1 Lambda: astralfood-order-processor)
 * Hỗ trợ chuẩn AWS SQS ReportBatchItemFailures.
 */
exports.handler = async (event, _context, deps = {}) => {
  console.log('[ORDER-PROCESSOR] Incoming SQS Event:', JSON.stringify(event));

  const records = Array.isArray(event?.Records)
    ? event.Records
    : [{ body: JSON.stringify(event || {}) }];

  const batchItemFailures = [];
  const results = [];

  for (const record of records) {
    try {
      const parsedBody =
        typeof record.body === 'string' ? JSON.parse(record.body) : record.body || record;
      const orderData = normalizeOrderData(parsedBody);

      if (!orderData.id) {
        console.warn('[ORDER-PROCESSOR] Bỏ qua record không có Order ID:', record);
        continue;
      }

      const outcome = await processOrderRecord(orderData, deps);
      results.push(outcome);

      if (outcome.hasFailure && record.messageId) {
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    } catch (recordErr) {
      console.error('[ORDER-PROCESSOR] Lỗi parse/xử lý SQS record:', recordErr);
      if (record.messageId) {
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    }
  }

  return {
    statusCode: 200,
    batchItemFailures,
    processedCount: results.length,
  };
};

exports.processOrderRecord = processOrderRecord;
exports.normalizeOrderData = normalizeOrderData;
exports.processInvoice = processInvoice;
exports.generateInvoicePDFBuffer = generateInvoicePDFBuffer;
exports.toAsciiVietnamese = toAsciiVietnamese;
exports.processNotification = processNotification;
exports.createOrderConfirmationHTML = createOrderConfirmationHTML;
exports.escapeHtml = escapeHtml;
exports.isNonRetryableSesError = isNonRetryableSesError;
