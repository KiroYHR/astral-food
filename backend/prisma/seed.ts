import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu nạp dữ liệu mẫu (Seed Data) cho AstralFood...');

  // 1. Tạo mật khẩu hash mẫu
  const passwordHashAdmin = await bcrypt.hash('Admin@123', 10);
  const passwordHashMerchant = await bcrypt.hash('Merchant@123', 10);
  const passwordHashCustomer = await bcrypt.hash('Customer@123', 10);

  // 2. Tạo User Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@astralfood.com' },
    update: {},
    create: {
      email: 'admin@astralfood.com',
      passwordHash: passwordHashAdmin,
      fullName: 'Hệ thống Quản Trị Viên (Admin)',
      phone: '0901234567',
      role: Role.ADMIN,
    },
  });
  console.log(`✅ User Admin: ${admin.email} (Password: Admin@123)`);

  // 3. Tạo User Merchant (Chủ quán)
  const merchant = await prisma.user.upsert({
    where: { email: 'merchant@astralfood.com' },
    update: {},
    create: {
      email: 'merchant@astralfood.com',
      passwordHash: passwordHashMerchant,
      fullName: 'Nguyễn Văn Chủ Quán',
      phone: '0912345678',
      role: Role.MERCHANT,
    },
  });
  console.log(`✅ User Merchant: ${merchant.email} (Password: Merchant@123)`);

  // 4. Tạo User Customer (Khách hàng)
  const customer = await prisma.user.upsert({
    where: { email: 'customer@gmail.com' },
    update: {},
    create: {
      email: 'customer@gmail.com',
      passwordHash: passwordHashCustomer,
      fullName: 'Trần Lê Khách Hàng',
      phone: '0987654321',
      role: Role.CUSTOMER,
    },
  });
  console.log(`✅ User Customer: ${customer.email} (Password: Customer@123)`);

  // 5. Tạo Cửa hàng mẫu (Store)
  let store = await prisma.store.findFirst({
    where: { ownerId: merchant.id },
  });

  if (!store) {
    store = await prisma.store.create({
      data: {
        ownerId: merchant.id,
        name: 'Astral Gourmet Cafe & Bakery',
        description: 'Thương hiệu cà phê đặc sản và bánh nướng thủ công phong cách Cloud-Kitchen hiện đại.',
        address: '268 Lý Thường Kiệt, Phường 14, Quận 10, TP. Hồ Chí Minh',
        logoS3Url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&q=80',
        rating: 4.9,
        isActive: true,
      },
    });
    console.log(`✅ Cửa hàng: ${store.name}`);
  }

  // 6. Tạo Danh mục món ăn (Categories)
  const catDrinks = await prisma.category.create({
    data: {
      storeId: store.id,
      name: 'Cà Phê & Trà Sữa Đặc Sản',
      displayOrder: 1,
    },
  });

  const catBakery = await prisma.category.create({
    data: {
      storeId: store.id,
      name: 'Bánh Mì & Bánh Nướng Thủ Công',
      displayOrder: 2,
    },
  });

  const catDessert = await prisma.category.create({
    data: {
      storeId: store.id,
      name: 'Món Tráng Miệng & Chè',
      displayOrder: 3,
    },
  });
  console.log('✅ Đã tạo 3 danh mục thực đơn.');

  // 7. Tạo Món ăn (Products)
  await prisma.product.createMany({
    data: [
      {
        storeId: store.id,
        categoryId: catDrinks.id,
        name: 'Cà Phê Muối Astral Cloud',
        description: 'Cà phê Robusta Đắk Lắk kết hợp lớp kem béo mặn sánh mịn độc quyền.',
        price: 35000,
        imageS3Url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80',
        isAvailable: true,
      },
      {
        storeId: store.id,
        categoryId: catDrinks.id,
        name: 'Trà Sữa Trân Châu Hoàng Kim',
        description: 'Trà đen Ceylon đậm đà, sữa tươi thanh trùng và trân châu mật ong giòn dai.',
        price: 42000,
        imageS3Url: 'https://images.unsplash.com/photo-1558857563-b371f32a512c?w=500&q=80',
        isAvailable: true,
      },
      {
        storeId: store.id,
        categoryId: catBakery.id,
        name: 'Bánh Mì Chảo Bò Phô Mai Astral',
        description: 'Bò Mỹ mềm ướp sốt tiêu đen, phô mai Mozzarella kéo sợi và pate nhà làm.',
        price: 49000,
        imageS3Url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&q=80',
        isAvailable: true,
      },
      {
        storeId: store.id,
        categoryId: catBakery.id,
        name: 'Croissant Trứng Muối Hoàng Kim',
        description: 'Vỏ bánh ngàn lớp bơ Pháp giòn rụm với nhân trứng muối kim sa tan chảy.',
        price: 38000,
        imageS3Url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&q=80',
        isAvailable: true,
      },
      {
        storeId: store.id,
        categoryId: catDessert.id,
        name: 'Panna Cotta Dâu Rừng Đà Lạt',
        description: 'Panna cotta mềm mượt thanh mát phủ mứt dâu tây tươi chua ngọt tự nhiên.',
        price: 29000,
        imageS3Url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&q=80',
        isAvailable: true,
      },
    ],
  });
  console.log('✅ Đã tạo 5 món ăn mẫu đặc sắc kèm giá và ảnh.');

  console.log('\n🎉 NẠP DỮ LIỆU SEED DATA THÀNH CÔNG 100%!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi nạp Seed Data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
