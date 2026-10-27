import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { storesRouter } from './stores.routes.js';
import { ordersRouter } from './orders.routes.js';
import { mediaRouter } from './media.routes.js';
import { aiRouter } from './ai.routes.js';
import { adminRouter } from './admin.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/stores', storesRouter);
apiRouter.use('/orders', ordersRouter);
apiRouter.use('/media', mediaRouter);
apiRouter.use('/ai', aiRouter);
apiRouter.use('/admin', adminRouter);
