import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';

export const adminRouter = Router();

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
    return res.json(users);
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
    return res.json(stores);
  } catch (error) {
    console.error('[ADMIN STORES ERROR]', error);
    return res.status(500).json({ error: 'Không thể tải danh sách cửa hàng.' });
  }
});

// 3. Phê duyệt (isActive: true) hoặc Khóa cửa hàng (isActive: false) (TV3 Điểm 5)
adminRouter.patch('/stores/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'Trường isActive (boolean) là bắt buộc.' });
    }

    const updatedStore = await prisma.store.update({
      where: { id },
      data: { isActive },
      include: {
        owner: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    return res.json({
      success: true,
      message: isActive ? 'Đã phê duyệt mở cửa hàng thành công.' : 'Đã tạm dừng/khóa cửa hàng.',
      store: updatedStore,
    });
  } catch (error) {
    console.error('[ADMIN STORE STATUS ERROR]', error);
    return res.status(500).json({ error: 'Không thể cập nhật trạng thái cửa hàng.' });
  }
});
