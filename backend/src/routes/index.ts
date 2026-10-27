import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { storesRouter } from './stores.routes.js';
import { ordersRouter } from './orders.routes.js';
import { mediaRouter } from './media.routes.js';
import { aiRouter } from './ai.routes.js';
import { adminRouter } from './admin.routes.js';

export const apiRouter = Router();

// 1. Phân hệ Xác thực & Người dùng (Customer, Merchant, Admin)
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', authRouter); // Hỗ trợ GET /api/v1/users/me theo chuẩn TV3

// 2. Phân hệ Cửa hàng & Thực đơn (Stores, Categories, Products)
apiRouter.use('/stores', storesRouter);
apiRouter.use('/categories', storesRouter); // Hỗ trợ POST /api/v1/categories theo chuẩn TV3

// 3. Phân hệ Đơn hàng & Thống kê (Orders, Analytics)
apiRouter.use('/orders', ordersRouter);

// 4. Phân hệ Đám mây AWS Media S3 & AI Copilot
apiRouter.use('/media', mediaRouter);
apiRouter.use('/ai', aiRouter);

// 5. Phân hệ Quản trị viên Hệ thống (System Admin)
apiRouter.use('/admin', adminRouter);
