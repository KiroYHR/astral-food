import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { serializeUser, serializeStore } from '../utils/serializer.js';
import { requireRole, AuthRequest } from '../middleware/auth.middleware.js';
import {
  getSesEmailVerificationStatus,
  requestSesEmailVerification,
} from '../services/sesService.js';

export const adminRouter = Router();

// Áp dụng phân quyền ADMIN cho toàn bộ Admin Portal APIs
adminRouter.use(requireRole('ADMIN'));

// 1. Quản lý danh sách người dùng trong hệ thống (TV3 Điểm 5)
adminRouter.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: {
          select: { orders: true, stores: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(users.map(serializeUser));
  } catch (error) {
    console.error('[ADMIN USERS ERROR]', error);
    return res.status(500).json({ error: 'Không thể tải danh sách người dùng.' });
  }
});

// 2. Quản lý danh sách cửa hàng (bao gồm cả chờ duyệt isActive: false) (TV3 Điểm 5)
adminRouter.get('/stores', async (req: Request, res: Response) => {
  try {
    const stores = await prisma.store.findMany({
      include: {
        owner: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        _count: {
          select: { products: true, orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(stores.map(serializeStore));
  } catch (error) {
    console.error('[ADMIN STORES ERROR]', error);
    return res.status(500).json({ error: 'Không thể tải danh sách cửa hàng.' });
  }
});

// 3. Phê duyệt (isActive: true) hoặc Khóa cửa hàng (isActive: false) (TV3 Điểm 5)
adminRouter.patch('/stores/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive, is_active } = req.body;
    const activeVal = isActive !== undefined ? isActive : is_active;

    if (typeof activeVal !== 'boolean') {
      return res.status(400).json({ error: 'Trường isActive (boolean) là bắt buộc.' });
    }

    const updatedStore = await prisma.store.update({
      where: { id },
      data: { isActive: activeVal },
      include: {
        owner: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    return res.json({
      success: true,
      message: activeVal ? 'Đã phê duyệt mở cửa hàng thành công.' : 'Đã tạm dừng/khóa cửa hàng.',
      store: serializeStore(updatedStore),
    });
  } catch (error) {
    console.error('[ADMIN STORE STATUS ERROR]', error);
    return res.status(500).json({ error: 'Không thể cập nhật trạng thái cửa hàng.' });
  }
});

// 4. Từ chối & xóa yêu cầu mở cửa hàng đang chờ duyệt (isActive: false và chưa có đơn)
adminRouter.delete('/stores/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!store) {
      return res.status(404).json({ error: 'Không tìm thấy cửa hàng.' });
    }

    if (store.isActive) {
      return res.status(400).json({
        error:
          'Chỉ có thể từ chối cửa hàng đang chờ phê duyệt. Với quán đang hoạt động, hãy dùng chức năng tạm khóa.',
      });
    }

    if (store._count.orders > 0) {
      return res.status(400).json({
        error: 'Không thể xóa cửa hàng đã phát sinh đơn hàng.',
      });
    }

    await prisma.store.delete({ where: { id } });

    return res.json({
      success: true,
      message: 'Đã từ chối và xóa yêu cầu mở cửa hàng.',
      rejectedStoreId: id,
    });
  } catch (error) {
    console.error('[ADMIN STORE REJECT ERROR]', error);
    return res.status(500).json({ error: 'Không thể từ chối cửa hàng.' });
  }
});

// 5. Xem chi tiết người dùng (kèm tổng chi tiêu COMPLETED, danh sách quán, trạng thái SES)
adminRouter.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        createdAt: true,
        stores: {
          select: {
            id: true,
            ownerId: true,
            name: true,
            description: true,
            categoryTag: true,
            address: true,
            logoS3Url: true,
            rating: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { orders: true, stores: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    const spendAgg = await prisma.order.aggregate({
      where: {
        customerId: id,
        status: 'COMPLETED',
      },
      _sum: {
        totalAmount: true,
      },
    });

    const sesVerification = await getSesEmailVerificationStatus(user.email);
    const totalSpent = Number(spendAgg._sum.totalAmount || 0);

    return res.json({
      ...serializeUser(user),
      stores: user.stores.map(serializeStore),
      totalSpent,
      total_spent: totalSpent,
      sesVerification,
      ses_verification: sesVerification,
    });
  } catch (error) {
    console.error('[ADMIN USER DETAIL ERROR]', error);
    return res.status(500).json({ error: 'Không thể tải chi tiết người dùng.' });
  }
});

// 6. Gửi lại email xác minh AWS SES Sandbox cho người dùng
adminRouter.post('/users/:id/verify-ses', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    const sesVerification = await requestSesEmailVerification(user.email);
    if (sesVerification.status === 'FAILED') {
      return res.status(502).json({
        success: false,
        error: sesVerification.message,
        sesVerification,
      });
    }

    return res.json({
      success: true,
      message: sesVerification.message,
      sesVerification,
      ses_verification: sesVerification,
    });
  } catch (error) {
    console.error('[ADMIN USER VERIFY SES ERROR]', error);
    return res.status(500).json({ error: 'Không thể gửi email xác minh AWS SES.' });
  }
});

// 7. Xóa người dùng test/spam (chặn xóa chính mình, ADMIN, hoặc tài khoản đã có đơn hàng)
adminRouter.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.sub;

    if (actorId && actorId === id) {
      return res.status(400).json({ error: 'Không thể tự xóa tài khoản Admin đang đăng nhập.' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true, stores: true },
        },
        stores: {
          select: {
            id: true,
            name: true,
            _count: {
              select: { orders: true },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    if (user.role === 'ADMIN') {
      return res.status(403).json({ error: 'Không thể xóa tài khoản quản trị viên (ADMIN).' });
    }

    if (user._count.orders > 0) {
      return res.status(400).json({
        error: 'Không thể xóa người dùng đã có lịch sử đặt đơn hàng.',
      });
    }

    const storeWithOrders = user.stores.find((s) => s._count.orders > 0);
    if (storeWithOrders) {
      return res.status(400).json({
        error: `Không thể xóa chủ quán vì cửa hàng "${storeWithOrders.name}" đã phát sinh đơn hàng.`,
      });
    }

    await prisma.user.delete({ where: { id } });

    return res.json({
      success: true,
      message: 'Đã xóa người dùng khỏi hệ thống.',
      deletedUserId: id,
    });
  } catch (error) {
    console.error('[ADMIN USER DELETE ERROR]', error);
    return res.status(500).json({ error: 'Không thể xóa người dùng.' });
  }
});
