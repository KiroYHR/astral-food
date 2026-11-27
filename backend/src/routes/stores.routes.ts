import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { serializeStore, serializeCategory, serializeProduct } from '../utils/serializer.js';
import {
  getStoreOrdersHandler,
  getStoreAnalyticsHandler,
  assertStoreOwnership,
} from './orders.routes.js';
import { requireRole, AuthRequest } from '../middleware/auth.middleware.js';

export const storesRouter = Router();

function assertStoreApprovedForMenu(
  store: { isActive: boolean },
  req: AuthRequest,
  res: Response
): boolean {
  if (req.user?.role === 'ADMIN' || store.isActive) {
    return true;
  }

  res.status(403).json({
    error:
      'Cửa hàng của bạn đang chờ Quản trị viên (Admin) phê duyệt. Bạn chỉ có thể thêm hoặc chỉnh sửa thực đơn sau khi được duyệt.',
  });
  return false;
}

// 1. Lấy danh sách cửa hàng cho Khách hàng (hỗ trợ search)
storesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const where: any = { isActive: true };

    if (search && typeof search === 'string') {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const stores = await prisma.store.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return res.json(stores.map(serializeStore));
  } catch (error) {
    console.error('[STORES LIST ERROR]', error);
    return res.status(500).json({ error: 'Không thể tải danh sách cửa hàng.' });
  }
});

// 2. Lấy danh sách cửa hàng thuộc quyền sở hữu của Merchant đang đăng nhập (hoặc tất cả nếu Admin ?all=true)
storesRouter.get('/mine', requireRole('MERCHANT', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const authUser = req.user;
    if (!authUser?.sub) {
      return res.status(401).json({ error: 'Yêu cầu đăng nhập.' });
    }

    const showAllForAdmin = authUser.role === 'ADMIN' && req.query.all === 'true';
    const stores = await prisma.store.findMany({
      where: showAllForAdmin ? {} : { ownerId: authUser.sub },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(stores.map(serializeStore));
  } catch (error) {
    console.error('[STORES MINE ERROR]', error);
    return res.status(500).json({ error: 'Không thể tải danh sách cửa hàng của bạn.' });
  }
});

// 2b. Lấy cửa hàng đầu tiên thuộc sở hữu của Merchant hiện tại
storesRouter.get('/me', requireRole('MERCHANT', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const authUser = req.user;
    const targetOwnerId =
      authUser?.role === 'ADMIN' && typeof req.query.ownerId === 'string'
        ? req.query.ownerId
        : authUser?.sub;

    if (!targetOwnerId) {
      return res.status(401).json({ error: 'Yêu cầu đăng nhập.' });
    }

    const store = await prisma.store.findFirst({
      where: { ownerId: targetOwnerId },
      include: {
        categories: { orderBy: { displayOrder: 'asc' } },
        products: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!store) {
      return res.status(404).json({ error: 'Bạn chưa tạo cửa hàng nào.' });
    }

    return res.json(serializeStore(store));
  } catch (error) {
    console.error('[STORE ME ERROR]', error);
    return res.status(500).json({ error: 'Lỗi khi lấy thông tin cửa hàng.' });
  }
});

// 3. Lấy thông tin chi tiết một cửa hàng theo ID (TV3 Store Detail)
storesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        categories: { orderBy: { displayOrder: 'asc' } },
        products: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!store) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin cửa hàng.' });
    }

    return res.json(serializeStore(store));
  } catch (error) {
    console.error('[STORE DETAIL ERROR]', error);
    return res.status(500).json({ error: 'Lỗi khi lấy chi tiết cửa hàng.' });
  }
});

// 4. Tạo cửa hàng mới (Mặc định isActive=false chờ Admin duyệt, tạo sẵn danh mục mặc định "Món Chính")
storesRouter.post('/', requireRole('MERCHANT', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const {
      ownerId,
      owner_id,
      name,
      description,
      address,
      logoS3Url,
      logo_s3_url,
      isActive,
      is_active,
    } = req.body;
    const authUser = req.user;

    let targetOwnerId =
      authUser?.role === 'ADMIN' && (ownerId || owner_id)
        ? String(ownerId || owner_id)
        : authUser?.sub;

    if (!targetOwnerId && process.env.ALLOW_DEV_MOCK_AUTH === 'true') {
      const merchant = await prisma.user.findFirst({ where: { role: 'MERCHANT' } });
      targetOwnerId = merchant?.id;
    }

    if (!targetOwnerId) {
      return res.status(401).json({ error: 'Yêu cầu đăng nhập để tạo cửa hàng.' });
    }

    if (!name || !address) {
      return res.status(400).json({ error: 'name và address là bắt buộc.' });
    }

    const initialIsActive =
      authUser?.role === 'ADMIN'
        ? isActive !== undefined
          ? Boolean(isActive)
          : is_active !== undefined
            ? Boolean(is_active)
            : false
        : false;

    const store = await prisma.store.create({
      data: {
        ownerId: targetOwnerId,
        name: String(name).trim(),
        description: description ? String(description).trim() : '',
        address: String(address).trim(),
        logoS3Url:
          logoS3Url ||
          logo_s3_url ||
          'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&q=80',
        isActive: initialIsActive,
        categories: {
          create: {
            name: 'Món Chính',
            displayOrder: 1,
          },
        },
      },
      include: {
        categories: { orderBy: { displayOrder: 'asc' } },
        products: true,
      },
    });

    return res.status(201).json(serializeStore(store));
  } catch (error) {
    console.error('[STORES CREATE ERROR]', error);
    return res.status(500).json({ error: 'Không thể tạo cửa hàng mới.' });
  }
});

// 5. Cập nhật thông tin cửa hàng (TV3 Điểm 2)
storesRouter.put('/:id', requireRole('MERCHANT', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ownedStore = await assertStoreOwnership(id, req, res);
    if (!ownedStore) return;

    const { name, description, address, logoS3Url, logo_s3_url, isActive, is_active } = req.body;
    const requestedActive =
      isActive !== undefined
        ? Boolean(isActive)
        : is_active !== undefined
          ? Boolean(is_active)
          : undefined;

    if (req.user?.role !== 'ADMIN' && !ownedStore.isActive && requestedActive === true) {
      return res.status(403).json({
        error:
          'Cửa hàng đang chờ Admin phê duyệt hoặc đang bị tạm khóa. Chỉ Admin mới có thể phê duyệt mở bán.',
      });
    }

    const updated = await prisma.store.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(address && { address }),
        ...((logoS3Url || logo_s3_url) && { logoS3Url: logoS3Url || logo_s3_url }),
        ...(requestedActive !== undefined && { isActive: requestedActive }),
      },
    });

    return res.json(serializeStore(updated));
  } catch (error) {
    console.error('[STORE UPDATE ERROR]', error);
    return res.status(500).json({ error: 'Không thể cập nhật cửa hàng.' });
  }
});

// 6. Lấy danh sách danh mục của cửa hàng
storesRouter.get('/:id/categories', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const categories = await prisma.category.findMany({
      where: { storeId: id },
      orderBy: { displayOrder: 'asc' },
    });
    return res.json(categories.map(serializeCategory));
  } catch (error) {
    console.error('[CATEGORIES LIST ERROR]', error);
    return res.status(500).json({ error: 'Không thể lấy danh mục món ăn.' });
  }
});

// 7. Tạo danh mục món ăn mới (TV3 Điểm 2)
storesRouter.post('/:id/categories', requireRole('MERCHANT', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ownedStore = await assertStoreOwnership(id, req, res);
    if (!ownedStore) return;
    if (!assertStoreApprovedForMenu(ownedStore, req, res)) return;

    const { name, displayOrder, display_order } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tên danh mục là bắt buộc.' });
    }

    const category = await prisma.category.create({
      data: {
        storeId: id,
        name,
        displayOrder: displayOrder !== undefined ? displayOrder : (display_order || 0),
      },
    });

    return res.status(201).json(serializeCategory(category));
  } catch (error) {
    console.error('[CATEGORY CREATE ERROR]', error);
    return res.status(500).json({ error: 'Không thể tạo danh mục mới.' });
  }
});

// 8. Lấy danh sách món ăn của cửa hàng
storesRouter.get('/:id/products', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const products = await prisma.product.findMany({
      where: { storeId: id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(products.map(serializeProduct));
  } catch (error) {
    console.error('[STORE PRODUCTS ERROR]', error);
    return res.status(500).json({ error: 'Không thể tải thực đơn món ăn.' });
  }
});

// 9. Thêm món ăn mới vào thực đơn
storesRouter.post('/products', requireRole('MERCHANT', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { storeId, store_id, categoryId, category_id, name, description, price, imageS3Url, image_s3_url } = req.body;

    const actualStoreId = storeId || store_id;
    const actualCategoryId = categoryId || category_id;

    if (!actualStoreId || !name || price === undefined) {
      return res.status(400).json({ error: 'storeId, name và price là bắt buộc.' });
    }

    const ownedStore = await assertStoreOwnership(actualStoreId, req, res);
    if (!ownedStore) return;
    if (!assertStoreApprovedForMenu(ownedStore, req, res)) return;

    let resolvedCategoryId = actualCategoryId;
    if (!resolvedCategoryId) {
      const firstCat = await prisma.category.findFirst({
        where: { storeId: actualStoreId },
        orderBy: { displayOrder: 'asc' },
      });
      if (firstCat) {
        resolvedCategoryId = firstCat.id;
      } else {
        const createdCat = await prisma.category.create({
          data: { storeId: actualStoreId, name: 'Món Chính', displayOrder: 1 },
        });
        resolvedCategoryId = createdCat.id;
      }
    }

    const product = await prisma.product.create({
      data: {
        storeId: actualStoreId,
        categoryId: resolvedCategoryId,
        name,
        description: description || '',
        price,
        imageS3Url: imageS3Url || image_s3_url || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80',
      },
    });

    return res.status(201).json(serializeProduct(product));
  } catch (error) {
    console.error('[PRODUCTS CREATE ERROR]', error);
    return res.status(500).json({ error: 'Không thể tạo món ăn mới.' });
  }
});

// 10. Cập nhật món ăn hoặc bật/tắt Còn hàng/Hết hàng (TV3 Điểm 2)
storesRouter.patch('/products/:productId', requireRole('MERCHANT', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, storeId: true },
    });
    if (!existingProduct) {
      return res.status(404).json({ error: 'Không tìm thấy món ăn.' });
    }

    const ownedStore = await assertStoreOwnership(existingProduct.storeId, req, res);
    if (!ownedStore) return;
    if (!assertStoreApprovedForMenu(ownedStore, req, res)) return;

    const { name, description, price, imageS3Url, image_s3_url, isAvailable, is_available, categoryId, category_id } = req.body;

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...((imageS3Url || image_s3_url) && { imageS3Url: imageS3Url || image_s3_url }),
        ...(isAvailable !== undefined ? { isAvailable } : (is_available !== undefined ? { isAvailable: is_available } : {})),
        ...((categoryId || category_id) && { categoryId: categoryId || category_id }),
      },
    });

    return res.json(serializeProduct(updated));
  } catch (error) {
    console.error('[PRODUCT UPDATE ERROR]', error);
    return res.status(500).json({ error: 'Không thể cập nhật món ăn.' });
  }
});

// 11. Xóa món ăn khỏi thực đơn
storesRouter.delete('/products/:productId', requireRole('MERCHANT', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, storeId: true },
    });
    if (!existingProduct) {
      return res.status(404).json({ error: 'Không tìm thấy món ăn.' });
    }

    const ownedStore = await assertStoreOwnership(existingProduct.storeId, req, res);
    if (!ownedStore) return;
    if (!assertStoreApprovedForMenu(ownedStore, req, res)) return;

    await prisma.product.delete({
      where: { id: productId },
    });
    return res.json({ success: true, message: 'Đã xóa món ăn thành công.' });
  } catch (error) {
    console.error('[PRODUCT DELETE ERROR]', error);
    return res.status(500).json({ error: 'Không thể xóa món ăn.' });
  }
});

// 12. Danh sách đơn hàng của cửa hàng (TV2 - Đồng bộ API Contract Điểm 3: GET /api/v1/stores/:id/orders)
storesRouter.get('/:id/orders', requireRole('MERCHANT', 'ADMIN'), getStoreOrdersHandler);

// 13. Thống kê Analytics cho cửa hàng (TV2 - Đồng bộ Recharts của TV3: GET /api/v1/stores/:id/analytics)
storesRouter.get('/:id/analytics', requireRole('MERCHANT', 'ADMIN'), getStoreAnalyticsHandler);

// Hỗ trợ cả POST /api/v1/categories trực tiếp theo API Contract của TV3
storesRouter.post('/categories', requireRole('MERCHANT', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { storeId, store_id, name, displayOrder, display_order } = req.body;
    const actualStoreId = storeId || store_id;

    if (!actualStoreId || !name) {
      return res.status(400).json({ error: 'storeId và name là bắt buộc.' });
    }

    const ownedStore = await assertStoreOwnership(actualStoreId, req, res);
    if (!ownedStore) return;
    if (!assertStoreApprovedForMenu(ownedStore, req, res)) return;

    const category = await prisma.category.create({
      data: {
        storeId: actualStoreId,
        name,
        displayOrder: displayOrder !== undefined ? displayOrder : (display_order || 0),
      },
    });

    return res.status(201).json(serializeCategory(category));
  } catch (error) {
    console.error('[CATEGORY CREATE ERROR]', error);
    return res.status(500).json({ error: 'Không thể tạo danh mục mới.' });
  }
});
