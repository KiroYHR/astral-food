import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { sendOrderEventToSQS } from '../services/sqsService.js';

export const ordersRouter = Router();

// 1. Khách hàng Đặt đơn hàng mới (Kích hoạt luồng SQS)
ordersRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { customerId, store_id, storeId, delivery_address, deliveryAddress, note, voucher_code, voucherCode, items } = req.body;

    const actualCustomerId = customerId || 'cust-demo-01';
    const actualStoreId = store_id || storeId;
    const actualAddress = delivery_address || deliveryAddress;
    const actualVoucher = voucher_code || voucherCode;

    if (!actualStoreId || !actualAddress || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Thông tin đơn hàng không hợp lệ hoặc thiếu món ăn.' });
    }

    // 1. Tính tổng tiền & kiểm tra món ăn từ DB
    let rawTotal = 0;
    const itemsToCreate = [];

    for (const item of items) {
      const pId = item.product_id || item.productId;
      const product = await prisma.product.findUnique({ where: { id: pId } });
      if (!product) {
        return res.status(404).json({ error: `Không tìm thấy món ăn ID: ${pId}` });
      }

      const itemTotal = Number(product.price) * item.quantity;
      rawTotal += itemTotal;

      itemsToCreate.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
      });
    }

    // Tính giảm giá nếu có voucher (TV3 Điểm 4)
    let discountAmount = 0;
    if (actualVoucher) {
      discountAmount = Math.min(rawTotal * 0.2, 50000); // Giảm tối đa 20% hoặc 50.000đ
    }
    const finalTotal = Math.max(0, rawTotal - discountAmount);

    // 2. Lưu Order vào Database PostgreSQL chuẩn ACID
    const order = await prisma.order.create({
      data: {
        customerId: actualCustomerId,
        storeId: actualStoreId,
        deliveryAddress: actualAddress,
        note,
        voucherCode: actualVoucher,
        discountAmount,
        totalAmount: finalTotal,
        status: 'PENDING',
        items: {
          create: itemsToCreate,
        },
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    // 3. Đẩy Event vào Amazon SQS để Lambda Worker xử lý ngầm (tạo hóa đơn, gửi mail)
    const eventPayload = {
      orderId: order.id,
      customerId: order.customerId,
      storeId: order.storeId,
      totalAmount: Number(order.totalAmount),
      discountAmount: Number(order.discountAmount),
      voucherCode: order.voucherCode,
      deliveryAddress: order.deliveryAddress,
      items: itemsToCreate.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: Number(it.unitPrice),
      })),
      createdAt: order.createdAt,
    };
    await sendOrderEventToSQS(eventPayload);

    // 4. Phản hồi thành công ngay lập tức (< 200ms)
    return res.status(201).json(order);
  } catch (error) {
    console.error('[ORDERS CREATE ERROR]', error);
    return res.status(500).json({ error: 'Không thể khởi tạo đơn hàng.' });
  }
});

// 2. Khách hàng xem lịch sử đơn hàng của mình
ordersRouter.get('/my-orders', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.query;

    if (!customerId || typeof customerId !== 'string') {
      return res.status(400).json({ error: 'customerId là bắt buộc.' });
    }

    const orders = await prisma.order.findMany({
      where: { customerId },
      include: {
        store: { select: { name: true, logoS3Url: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(orders);
  } catch (error) {
    console.error('[MY ORDERS ERROR]', error);
    return res.status(500).json({ error: 'Không thể tải lịch sử đơn hàng.' });
  }
});

// 3. Chủ quán xem danh sách đơn hàng khách đặt vào quán của mình (TV3 Điểm 3)
ordersRouter.get('/stores/:storeId/orders', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const { status } = req.query;

    const where: any = { storeId };
    if (status && typeof status === 'string') {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: { select: { fullName: true, phone: true, email: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(orders);
  } catch (error) {
    console.error('[STORE ORDERS ERROR]', error);
    return res.status(500).json({ error: 'Không thể tải danh sách đơn của cửa hàng.' });
  }
});

// 4. Chủ quán xem thống kê doanh thu (Analytics)
ordersRouter.get('/stores/:storeId/analytics', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;

    const completedOrders = await prisma.order.findMany({
      where: {
        storeId,
        status: 'COMPLETED',
      },
      include: { items: true },
    });

    const totalRevenue = completedOrders.reduce((acc, curr) => acc + Number(curr.totalAmount), 0);
    const totalOrders = completedOrders.length;

    return res.json({
      storeId,
      totalRevenue,
      totalOrders,
      message: 'Thống kê doanh thu thời gian thực từ Amazon RDS',
    });
  } catch (error) {
    console.error('[ANALYTICS ERROR]', error);
    return res.status(500).json({ error: 'Không thể tính toán doanh thu.' });
  }
});

// 5. Cập nhật trạng thái đơn hàng (Chế biến, Giao hàng, Hoàn tất)
ordersRouter.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'DELIVERING', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Trạng thái đơn hàng không hợp lệ.' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
    });

    return res.json(updatedOrder);
  } catch (error) {
    console.error('[ORDER STATUS UPDATE ERROR]', error);
    return res.status(500).json({ error: 'Không thể cập nhật trạng thái đơn hàng.' });
  }
});
