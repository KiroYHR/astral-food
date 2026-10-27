import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';

export const storesRouter = Router();

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
    return res.json(stores);
  } catch (error) {
    console.error('[STORES LIST ERROR]', error);
    return res.status(500).json({ error: 'Không thể tải danh sách cửa hàng.' });
  }
});

// 2. Lấy thông tin cửa hàng của Merchant hiện tại (TV3 Điểm 2)
storesRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.query;
    if (!ownerId || typeof ownerId !== 'string') {
      return res.status(400).json({ error: 'ownerId là bắt buộc.' });
    }

    const store = await prisma.store.findFirst({
      where: { ownerId },
      include: {
        categories: { orderBy: { displayOrder: 'asc' } },
        products: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!store) {
      return res.status(404).json({ error: 'Chưa tìm thấy cửa hàng của bạn.' });
    }

    return res.json(store);
  } catch (error) {
    console.error('[STORE ME ERROR]', error);
    return res.status(500).json({ error: 'Lỗi khi lấy thông tin cửa hàng.' });
  }
});

// 3. Tạo cửa hàng mới
storesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { ownerId, name, description, address, logoS3Url } = req.body;

    if (!ownerId || !name || !address) {
      return res.status(400).json({ error: 'ownerId, name, và address là bắt buộc.' });
    }

    const store = await prisma.store.create({
      data: {
        ownerId,
        name,
        description,
        address,
        logoS3Url,
      },
    });

    return res.status(201).json(store);
  } catch (error) {
    console.error('[STORES CREATE ERROR]', error);
    return res.status(500).json({ error: 'Không thể tạo cửa hàng mới.' });
  }
});

// 4. Cập nhật thông tin cửa hàng (TV3 Điểm 2)
storesRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, address, logoS3Url, isActive } = req.body;

    const updated = await prisma.store.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(address && { address }),
        ...(logoS3Url !== undefined && { logoS3Url }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error('[STORE UPDATE ERROR]', error);
    return res.status(500).json({ error: 'Không thể cập nhật cửa hàng.' });
  }
});

// 5. Lấy danh sách danh mục của cửa hàng
storesRouter.get('/:id/categories', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const categories = await prisma.category.findMany({
      where: { storeId: id },
      orderBy: { displayOrder: 'asc' },
    });
    return res.json(categories);
  } catch (error) {
    console.error('[CATEGORIES LIST ERROR]', error);
    return res.status(500).json({ error: 'Không thể lấy danh mục món ăn.' });
  }
});

// 6. Tạo danh mục món ăn mới (TV3 Điểm 2)
storesRouter.post('/:id/categories', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, displayOrder } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tên danh mục là bắt buộc.' });
    }

    const category = await prisma.category.create({
      data: {
        storeId: id,
        name,
        displayOrder: displayOrder || 0,
      },
    });

    return res.status(201).json(category);
  } catch (error) {
    console.error('[CATEGORY CREATE ERROR]', error);
    return res.status(500).json({ error: 'Không thể tạo danh mục mới.' });
  }
});

// 7. Lấy danh sách món ăn của cửa hàng
storesRouter.get('/:id/products', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const products = await prisma.product.findMany({
      where: { storeId: id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(products);
  } catch (error) {
    console.error('[STORE PRODUCTS ERROR]', error);
    return res.status(500).json({ error: 'Không thể tải thực đơn món ăn.' });
  }
});

// 8. Thêm món ăn mới vào thực đơn
storesRouter.post('/products', async (req: Request, res: Response) => {
  try {
    const { storeId, categoryId, name, description, price, imageS3Url } = req.body;

    if (!storeId || !name || price === undefined) {
      return res.status(400).json({ error: 'storeId, name và price là bắt buộc.' });
    }

    const product = await prisma.product.create({
      data: {
        storeId,
        categoryId,
        name,
        description,
        price,
        imageS3Url,
      },
    });

    return res.status(201).json(product);
  } catch (error) {
    console.error('[PRODUCTS CREATE ERROR]', error);
    return res.status(500).json({ error: 'Không thể tạo món ăn mới.' });
  }
});

// 9. Cập nhật món ăn hoặc bật/tắt Còn hàng/Hết hàng (TV3 Điểm 2)
storesRouter.patch('/products/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { name, description, price, imageS3Url, isAvailable, categoryId } = req.body;

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(imageS3Url !== undefined && { imageS3Url }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(categoryId !== undefined && { categoryId }),
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error('[PRODUCT UPDATE ERROR]', error);
    return res.status(500).json({ error: 'Không thể cập nhật món ăn.' });
  }
});

// 10. Xóa món ăn khỏi thực đơn (TV3 Điểm 2)
storesRouter.delete('/products/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    await prisma.product.delete({
      where: { id: productId },
    });
    return res.json({ success: true, message: 'Đã xóa món ăn thành công.' });
  } catch (error) {
    console.error('[PRODUCT DELETE ERROR]', error);
    return res.status(500).json({ error: 'Không thể xóa món ăn.' });
  }
});

// Hỗ trợ cả POST /api/v1/categories trực tiếp theo API Contract của TV3
storesRouter.post('/categories', async (req: Request, res: Response) => {
  try {
    const { storeId, name, displayOrder } = req.body;
    if (!storeId || !name) {
      return res.status(400).json({ error: 'storeId và name là bắt buộc.' });
    }

    const category = await prisma.category.create({
      data: {
        storeId,
        name,
        displayOrder: displayOrder || 0,
      },
    });

    return res.status(201).json(category);
  } catch (error) {
    console.error('[CATEGORY CREATE ERROR]', error);
    return res.status(500).json({ error: 'Không thể tạo danh mục mới.' });
  }
});
