import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OrderStatus } from '@prisma/client';
import { prisma } from '../prisma.js';
import { config } from '../config/index.js';
import { sendOrderEventToSQS, OrderSQSEventType } from '../services/sqsService.js';
import { getStoreAnalyticsData } from '../services/analyticsService.js';
import { serializeOrder, serializeReview } from '../utils/serializer.js';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.middleware.js';

export const ordersRouter = Router();

const VALID_ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'DELIVERING',
  'COMPLETED',
  'CANCELLED',
];

function getUserIdFromAuthHeader(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { sub?: string };
    return decoded.sub || null;
  } catch {
    return null;
  }
}

function buildInvoiceS3Url(orderId: string): string {
  return `https://${config.aws.s3BucketInvoices}.s3.${config.aws.region}.amazonaws.com/invoices/INV-${orderId}.pdf`;
}

function buildOrderSQSPayload(order: any, eventType: OrderSQSEventType) {
  return {
    eventType,
    id: order.id,
    orderId: order.id,
    status: order.status,
    customerId: order.customerId,
    customerName: order.customer?.fullName || 'Khách hàng AstralFood',
    customerEmail: order.customer?.email || 'customer@example.com',
    customerPhone: order.customer?.phone || '',
    storeId: order.storeId,
    storeName: order.store?.name || 'AstralFood Store',
    totalAmount: Number(order.totalAmount),
    discountAmount: Number(order.discountAmount || 0),
    voucherCode: order.voucherCode || '',
    deliveryAddress: order.deliveryAddress,
    note: order.note || '',
    invoiceS3Url: order.invoiceS3Url || '',
    createdAt:
      order.createdAt instanceof Date
        ? order.createdAt.toISOString()
        : order.createdAt || new Date().toISOString(),
    items: (order.items || []).map((it: any) => ({
      productId: it.productId,
      productName: it.product?.name || `Món #${it.productId}`,
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
      subtotal: Number(it.unitPrice) * it.quantity,
    })),
  };
}

function calculateVoucherDiscount(voucherCode: string | undefined, rawTotal: number): number {
  if (!voucherCode) return 0;
  const code = voucherCode.trim().toUpperCase();
  if (!code) return 0;

  let discount = 10000;
  if (code.includes('20')) {
    discount = 20000;
  } else if (code.includes('FREE')) {
    discount = 15000;
  }

  return Math.min(discount, rawTotal);
}

export async function assertStoreOwnership(
  storeId: string,
  req: AuthRequest,
  res: Response
): Promise<{ id: string; ownerId: string; isActive: boolean } | null> {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true, ownerId: true, isActive: true },
  });

  if (!store) {
    res.status(404).json({ error: 'Không tìm thấy thông tin cửa hàng.' });
    return null;
  }

  if (req.user && req.user.role !== 'ADMIN' && store.ownerId !== req.user.sub) {
    res.status(403).json({
      error: 'Bạn không có quyền thao tác trên cửa hàng của chủ quán khác.',
    });
    return null;
  }

  return store;
}

// Handler dùng chung cho GET /api/v1/stores/:id/orders và GET /api/v1/orders/stores/:storeId/orders
export async function getStoreOrdersHandler(req: Request, res: Response) {
  try {
    const storeId = req.params.storeId || req.params.id;
    const { status } = req.query;

    if (!storeId) {
      return res.status(400).json({ error: 'Thiếu mã cửa hàng (storeId).' });
    }

    const ownedStore = await assertStoreOwnership(storeId, req as AuthRequest, res);
    if (!ownedStore) return;

    const where: { storeId: string; status?: OrderStatus } = { storeId };

    if (status && typeof status === 'string') {
      const normalizedStatus = status.toUpperCase() as OrderStatus;
      if (!VALID_ORDER_STATUSES.includes(normalizedStatus)) {
        return res.status(400).json({ error: `Trạng thái lọc không hợp lệ: ${status}` });
      }
      where.status = normalizedStatus;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: { select: { fullName: true, phone: true, email: true } },
        store: { select: { name: true, logoS3Url: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(orders.map(serializeOrder));
  } catch (error) {
    console.error('[STORE ORDERS ERROR]', error);
    return res.status(500).json({ error: 'Không thể tải danh sách đơn của cửa hàng.' });
  }
}

// Handler dùng chung cho GET /api/v1/stores/:id/analytics và GET /api/v1/orders/stores/:storeId/analytics
export async function getStoreAnalyticsHandler(req: Request, res: Response) {
  try {
    const storeId = req.params.storeId || req.params.id;
    const period = typeof req.query.period === 'string' ? req.query.period : undefined;

    if (!storeId) {
      return res.status(400).json({ error: 'Thiếu mã cửa hàng (storeId).' });
    }

    const ownedStore = await assertStoreOwnership(storeId, req as AuthRequest, res);
    if (!ownedStore) return;

    const analytics = await getStoreAnalyticsData(storeId, period);
    return res.json(analytics);
  } catch (error) {
    console.error('[ANALYTICS ERROR]', error);
    return res.status(500).json({ error: 'Không thể tính toán doanh thu.' });
  }
}

// 1. Quản trị viên lấy toàn bộ danh sách đơn hàng toàn sàn (Admin Phase 4)
ordersRouter.get('/', requireRole('ADMIN'), async (_req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        store: { select: { name: true, logoS3Url: true } },
        customer: { select: { fullName: true, phone: true, email: true } },
        items: { include: { product: true } },
        review: {
          include: {
            customer: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(orders.map(serializeOrder));
  } catch (error) {
    console.error('[GET ALL ORDERS ERROR]', error);
    return res.status(500).json({ error: 'Không thể tải toàn bộ đơn hàng.' });
  }
});

// 2. Khách hàng Đặt đơn hàng mới (Tính giá chuẩn ACID & Kích hoạt luồng SQS)
ordersRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      customerId,
      customer_id,
      store_id,
      storeId,
      delivery_address,
      deliveryAddress,
      note,
      voucher_code,
      voucherCode,
      items,
    } = req.body;

    const tokenUserId = getUserIdFromAuthHeader(req);
    let targetCustomerId = tokenUserId || customerId || customer_id;
    if (!targetCustomerId) {
      const defaultCust = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
      targetCustomerId = defaultCust?.id;
    }

    if (!targetCustomerId) {
      return res.status(400).json({ error: 'Không xác định được tài khoản khách hàng đặt đơn.' });
    }

    const actualStoreId = (store_id || storeId || '').trim();
    const actualAddress = (delivery_address || deliveryAddress || '').trim();
    const actualVoucher = ((voucher_code || voucherCode || '') as string).trim();

    if (!actualStoreId || !actualAddress || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Thông tin đơn hàng không hợp lệ hoặc thiếu món ăn.' });
    }

    for (const item of items) {
      const pId = item.product_id || item.productId;
      const qty = Number(item.quantity);
      if (!pId || !Number.isInteger(qty) || qty <= 0) {
        return res
          .status(400)
          .json({ error: 'Mỗi món ăn phải có mã sản phẩm hợp lệ và số lượng nguyên dương (> 0).' });
      }
    }

    // Thực hiện kiểm tra tồn tại, tính giá và tạo đơn trong 1 Transaction chuẩn ACID
    const txResult = await prisma.$transaction(async (tx) => {
      const store = await tx.store.findUnique({ where: { id: actualStoreId } });
      if (!store) {
        return {
          ok: false as const,
          errorStatus: 404,
          errorMessage: `Không tìm thấy cửa hàng ID: ${actualStoreId}`,
        };
      }

      let rawTotal = 0;
      const itemsToCreate: { productId: string; quantity: number; unitPrice: any }[] = [];

      for (const item of items) {
        const pId = item.product_id || item.productId;
        const qty = Number(item.quantity);
        const product = await tx.product.findUnique({ where: { id: pId } });

        if (!product) {
          return {
            ok: false as const,
            errorStatus: 404,
            errorMessage: `Không tìm thấy món ăn ID: ${pId}`,
          };
        }
        if (product.storeId !== actualStoreId) {
          return {
            ok: false as const,
            errorStatus: 400,
            errorMessage: `Món ăn "${product.name}" không thuộc cửa hàng đang đặt.`,
          };
        }
        if (!product.isAvailable) {
          return {
            ok: false as const,
            errorStatus: 400,
            errorMessage: `Món ăn "${product.name}" hiện đã hết hàng.`,
          };
        }

        rawTotal += Number(product.price) * qty;
        itemsToCreate.push({
          productId: product.id,
          quantity: qty,
          unitPrice: product.price,
        });
      }

      const discountAmount = calculateVoucherDiscount(actualVoucher, rawTotal);
      const finalTotal = Math.max(0, rawTotal - discountAmount);

      const createdOrder = await tx.order.create({
        data: {
          customerId: targetCustomerId,
          storeId: actualStoreId,
          totalAmount: finalTotal,
          voucherCode: actualVoucher || null,
          discountAmount,
          status: 'PENDING',
          deliveryAddress: actualAddress,
          note: typeof note === 'string' ? note.trim() : '',
          items: {
            create: itemsToCreate,
          },
        },
        include: {
          customer: { select: { fullName: true, phone: true, email: true } },
          store: { select: { name: true, logoS3Url: true } },
          items: {
            include: {
              product: { select: { name: true, imageS3Url: true, price: true } },
            },
          },
        },
      });

      return { ok: true as const, order: createdOrder };
    });

    if (!txResult.ok) {
      return res.status(txResult.errorStatus).json({ error: txResult.errorMessage });
    }

    const { order } = txResult;

    // Đẩy sự kiện ORDER_CREATED bất đồng bộ vào AWS SQS (không chặn response)
    const sqsPayload = buildOrderSQSPayload(order, 'ORDER_CREATED');
    sendOrderEventToSQS(sqsPayload, 'ORDER_CREATED').catch((sqsErr) => {
      console.warn('[SQS BACKGROUND WARN]', sqsErr.message);
    });

    return res.status(201).json(serializeOrder(order));
  } catch (error) {
    console.error('[ORDERS CREATE ERROR]', error);
    return res.status(500).json({ error: 'Không thể khởi tạo đơn hàng.' });
  }
});

// 3. Khách hàng xem lịch sử đơn hàng của mình
ordersRouter.get('/my-orders', requireAuth, async (req: Request, res: Response) => {
  try {
    const tokenUserId = getUserIdFromAuthHeader(req);
    const queryCustomerId =
      typeof req.query.customerId === 'string'
        ? req.query.customerId
        : typeof req.query.customer_id === 'string'
          ? req.query.customer_id
          : '';

    let targetCustomerId = tokenUserId || queryCustomerId;

    if (!targetCustomerId) {
      const defaultCust = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
      targetCustomerId = defaultCust?.id || '';
    }

    const orders = await prisma.order.findMany({
      where: targetCustomerId ? { customerId: targetCustomerId } : {},
      include: {
        store: { select: { name: true, logoS3Url: true } },
        customer: { select: { fullName: true, phone: true, email: true } },
        items: { include: { product: true } },
        review: {
          include: {
            customer: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(orders.map(serializeOrder));
  } catch (error) {
    console.error('[MY ORDERS ERROR]', error);
    return res.status(500).json({ error: 'Không thể tải lịch sử đơn hàng.' });
  }
});

// 4. Chủ quán xem danh sách đơn hàng khách đặt vào quán của mình (TV3 Điểm 3)
ordersRouter.get('/stores/:storeId/orders', requireRole('MERCHANT', 'ADMIN'), getStoreOrdersHandler);

// 5. Chủ quán xem thống kê doanh thu (Analytics)
ordersRouter.get('/stores/:storeId/analytics', requireRole('MERCHANT', 'ADMIN'), getStoreAnalyticsHandler);

// 6. Cập nhật trạng thái đơn hàng (Xác nhận, Chế biến, Giao hàng, Hoàn tất, Hủy) -> Bắn SQS thông báo
ordersRouter.patch('/:id/status', requireRole('MERCHANT', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rawStatus = typeof req.body.status === 'string' ? req.body.status.toUpperCase() : '';

    if (!VALID_ORDER_STATUSES.includes(rawStatus as OrderStatus)) {
      return res.status(400).json({ error: `Trạng thái không hợp lệ: ${req.body.status}` });
    }

    const status = rawStatus as OrderStatus;
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { store: { select: { ownerId: true } } },
    });

    if (!existingOrder) {
      return res.status(404).json({ error: `Không tìm thấy đơn hàng ID: ${id}` });
    }

    const authUser = (req as AuthRequest).user;
    if (authUser && authUser.role !== 'ADMIN' && existingOrder.store.ownerId !== authUser.sub) {
      return res.status(403).json({
        error: 'Bạn chỉ có quyền cập nhật đơn hàng thuộc cửa hàng của mình.',
      });
    }

    const nextInvoiceUrl =
      status === 'COMPLETED'
        ? existingOrder.invoiceS3Url || buildInvoiceS3Url(id)
        : existingOrder.invoiceS3Url;

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status,
        ...(nextInvoiceUrl ? { invoiceS3Url: nextInvoiceUrl } : {}),
      },
      include: {
        customer: { select: { fullName: true, phone: true, email: true } },
        store: { select: { name: true, logoS3Url: true } },
        items: { include: { product: true } },
      },
    });

    // Bắn sự kiện ORDER_STATUS_UPDATED vào SQS để Lambda gửi email cập nhật trạng thái / xuất hóa đơn
    const sqsPayload = buildOrderSQSPayload(updated, 'ORDER_STATUS_UPDATED');
    sendOrderEventToSQS(sqsPayload, 'ORDER_STATUS_UPDATED').catch((sqsErr) => {
      console.warn('[SQS STATUS UPDATE WARN]', sqsErr.message);
    });

    return res.json(serializeOrder(updated));
  } catch (error) {
    console.error('[ORDER STATUS UPDATE ERROR]', error);
    return res.status(500).json({ error: 'Không thể cập nhật trạng thái đơn hàng.' });
  }
});

// 7. Khách hàng gửi đánh giá cửa hàng sau khi đơn COMPLETED
ordersRouter.post('/:id/review', requireRole('CUSTOMER'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const customerId = req.user?.sub;
    const ratingVal = Number(req.body.rating);
    const comment = typeof req.body.comment === 'string' ? req.body.comment.trim() : '';

    if (!customerId) {
      return res.status(401).json({ error: 'Yêu cầu đăng nhập để gửi đánh giá.' });
    }

    if (!Number.isInteger(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ error: 'Số sao đánh giá phải là số nguyên từ 1 đến 5.' });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { review: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
    }

    if (order.customerId !== customerId) {
      return res.status(403).json({ error: 'Bạn chỉ có thể đánh giá đơn hàng của chính mình.' });
    }

    if (order.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Chỉ có thể đánh giá quán sau khi đơn hàng đã hoàn tất.' });
    }

    if (order.review) {
      return res.status(409).json({ error: 'Đơn hàng này đã được đánh giá rồi.' });
    }

    const txResult = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          orderId: order.id,
          storeId: order.storeId,
          customerId,
          rating: ratingVal,
          comment,
        },
        include: {
          customer: { select: { fullName: true } },
        },
      });

      const agg = await tx.review.aggregate({
        where: { storeId: order.storeId },
        _avg: { rating: true },
        _count: { id: true },
      });

      const avgRating = Number((agg._avg.rating || 0).toFixed(2));
      await tx.store.update({
        where: { id: order.storeId },
        data: { rating: avgRating },
      });

      return {
        created,
        avgRating,
        reviewCount: agg._count.id,
      };
    });

    return res.status(201).json({
      success: true,
      message: 'Cảm ơn bạn đã đánh giá cửa hàng!',
      review: serializeReview(txResult.created),
      store_rating: txResult.avgRating,
      storeRating: txResult.avgRating,
      review_count: txResult.reviewCount,
      reviewCount: txResult.reviewCount,
    });
  } catch (error) {
    console.error('[ORDER REVIEW ERROR]', error);
    return res.status(500).json({ error: 'Không thể gửi đánh giá lúc này.' });
  }
});
