import { PrismaClient, Role, OrderStatus } from '@prisma/client';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-1';
const S3_BUCKET = process.env.S3_BUCKET_MEDIA || '';
const HAS_AWS = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && S3_BUCKET);

const s3Client = HAS_AWS
  ? new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  : null;

/**
 * Tải ảnh thực tế từ nguồn mở và đẩy thẳng lên Amazon S3 Bucket của dự án.
 * Nếu đã có object trên S3 thì tái sử dụng; nếu chưa có AWS creds thì fallback URL gốc.
 */
async function ensureImageOnS3(s3Key: string, sourceUrl: string): Promise<string> {
  if (!s3Client || !S3_BUCKET) return sourceUrl;

  const publicS3Url = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;

  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: s3Key }));
    return publicS3Url;
  } catch {
    // Object chưa tồn tại trên S3 -> tải từ nguồn và upload lên S3
  }

  try {
    const resp = await fetch(sourceUrl);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const arrayBuf = await resp.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    const contentType = resp.headers.get('content-type') || 'image/jpeg';

    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    return publicS3Url;
  } catch (err: any) {
    console.warn(`⚠️ Không thể upload ${s3Key} lên S3 (${err.message}), dùng URL dự phòng.`);
    return sourceUrl;
  }
}

interface SeedStoreInput {
  slug: string;
  name: string;
  description: string;
  address: string;
  rating: number;
  logoSourceUrl: string;
  categories: {
    name: string;
    products: {
      slug: string;
      name: string;
      description: string;
      price: number;
      imageSourceUrl: string;
    }[];
  }[];
}

const REAL_STORES: SeedStoreInput[] = [
  {
    slug: 'com-tam-phuc-loc-tho',
    name: 'Cơm Tấm Phúc Lộc Thọ – Tô Hiến Thành',
    description: 'Hệ thống cơm tấm sườn nướng than hoa chuẩn vị Sài Gòn, nước mắm kẹo gia truyền.',
    address: '236 Tô Hiến Thành, Phường 15, Quận 10, TP. Hồ Chí Minh',
    rating: 4.9,
    logoSourceUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80',
    categories: [
      {
        name: 'Cơm Tấm Đặc Biệt',
        products: [
          {
            slug: 'com-suon-nuong-mat-ong',
            name: 'Cơm Sườn Nướng Mật Ong',
            description: 'Sườn cốt lết ướp mật ong nướng than thơm lừng, ăn kèm đồ chua và mỡ hành.',
            price: 49000,
            imageSourceUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
          },
          {
            slug: 'com-suon-bi-cha-trung',
            name: 'Cơm Sườn Bì Chả Trứng Ốp La',
            description: 'Phần cơm tấm đầy đủ sườn nướng, bì thính, chả trứng hấp và ốp la lòng đào.',
            price: 68000,
            imageSourceUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
          },
          {
            slug: 'com-dui-ga-nuong-ngu-vi',
            name: 'Cơm Đùi Gà Nướng Ngũ Vị',
            description: 'Đùi gà góc tư tẩm ngũ vị hương nướng da giòn, thịt mềm mọng nước.',
            price: 59000,
            imageSourceUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600&q=80',
          },
        ],
      },
      {
        name: 'Canh & Món Thêm',
        products: [
          {
            slug: 'canh-kho-qua-nhoi-thit',
            name: 'Canh Khổ Qua Nhồi Thịt',
            description: 'Khổ qua hầm mềm nhân thịt băm mộc nhĩ, nước dùng thanh ngọt giải nhiệt.',
            price: 22000,
            imageSourceUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80',
          },
        ],
      },
    ],
  },
  {
    slug: 'phuc-long-van-hanh-mall',
    name: 'Phúc Long Coffee & Tea – Vạn Hạnh Mall',
    description: 'Trà sữa đậm vị trà Thái Nguyên & Lâm Đồng, cà phê rang xay truyền thống.',
    address: '11 Sư Vạn Hạnh, Phường 12, Quận 10, TP. Hồ Chí Minh',
    rating: 4.8,
    logoSourceUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
    categories: [
      {
        name: 'Trà Trái Cây & Trà Sữa',
        products: [
          {
            slug: 'tra-dao-cam-sa',
            name: 'Trà Đào Cam Sả Phúc Long',
            description: 'Hồng trà ủ lạnh kết hợp đào miếng giòn, hương cam tươi và sả thanh mát.',
            price: 55000,
            imageSourceUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80',
          },
          {
            slug: 'tra-sua-olong-nuong',
            name: 'Trà Sữa Ô Long Nướng Trân Châu',
            description: 'Trà Ô Long rang đậm thơm, sữa tươi béo nhẹ cùng trân châu trắng giòn.',
            price: 52000,
            imageSourceUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&q=80',
          },
          {
            slug: 'hong-tra-sua-phuc-long',
            name: 'Hồng Trà Sữa Phúc Long',
            description: 'Thức uống biểu tượng với vị trà đen đậm đà hòa quyện sữa đặc thơm béo.',
            price: 50000,
            imageSourceUrl: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=600&q=80',
          },
        ],
      },
      {
        name: 'Cà Phê Phin Truyền Thống',
        products: [
          {
            slug: 'ca-phe-phin-sua-da',
            name: 'Cà Phê Phin Sữa Đá',
            description: 'Cà phê Robusta pha phin đậm đặc kết hợp sữa đặc có đường chuẩn gu Việt.',
            price: 42000,
            imageSourceUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80',
          },
        ],
      },
    ],
  },
  {
    slug: 'pho-hoa-pasteur',
    name: 'Phở Hòa Pasteur',
    description: 'Thương hiệu phở bò gia truyền nổi tiếng từ năm 1968 tại TP.HCM, nước dùng hầm xương 12 giờ.',
    address: '260C Pasteur, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh',
    rating: 4.9,
    logoSourceUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80',
    categories: [
      {
        name: 'Phở Bò & Phở Gà',
        products: [
          {
            slug: 'pho-tai-nam-gau-dac-biet',
            name: 'Phở Tái Nạm Gầu Đặc Biệt',
            description: 'Tô phở lớn đầy đủ thịt bò tái mềm, nạm giòn, gầu béo và hành lá thơm nồng.',
            price: 85000,
            imageSourceUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&q=80',
          },
          {
            slug: 'pho-bo-vien-nam',
            name: 'Phở Bò Viên Nạm',
            description: 'Bò viên gân dai sần sật kết hợp nạm bò thái mỏng và nước lèo trong ngọt.',
            price: 75000,
            imageSourceUrl: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=600&q=80',
          },
          {
            slug: 'pho-ga-ta-xe-phay',
            name: 'Phở Gà Ta Xé Phay',
            description: 'Gà ta da vàng giòn xé phay, kèm lá chanh thái chỉ và nước dùng xương gà.',
            price: 70000,
            imageSourceUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
          },
          {
            slug: 'quay-nong-gion',
            name: 'Quẩy Nóng Giòn (Đĩa 4 cái)',
            description: 'Quẩy chiên vàng giòn rụm chấm cùng nước phở nóng hổi.',
            price: 12000,
            imageSourceUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80',
          },
        ],
      },
    ],
  },
  {
    slug: 'popeyes-cmt8',
    name: 'Gà Rán Popeyes – Cách Mạng Tháng 8',
    description: 'Gà rán giòn cay kiểu Louisiana tẩm ướp 12 giờ, burger giòn rụm và khoai tây sốt Cajun.',
    address: '588 Cách Mạng Tháng 8, Phường 11, Quận 3, TP. Hồ Chí Minh',
    rating: 4.7,
    logoSourceUrl: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&q=80',
    categories: [
      {
        name: 'Gà Rán & Burger',
        products: [
          {
            slug: 'combo-2-ga-gion-cay',
            name: 'Combo 2 Miếng Gà Giòn Cay + Khoai Tây',
            description: '2 miếng gà rán vỏ giòn rụm vị cay Cajun đặc trưng kèm khoai tây chiên vừa.',
            price: 89000,
            imageSourceUrl: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&q=80',
          },
          {
            slug: 'burger-tom-gion-cajun',
            name: 'Burger Tôm Giòn Sốt Cajun',
            description: 'Nhân tôm chiên giòn nguyên con, xà lách tươi và sốt Cajun béo cay.',
            price: 65000,
            imageSourceUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
          },
          {
            slug: 'ga-khong-xuong-sot-nuoc-mam',
            name: 'Gà Không Xương Sốt Tắm Nước Mắm',
            description: '5 miếng gà phi-lê chiên giòn phủ sốt nước mắm tỏi ớt mặn ngọt đậm đà.',
            price: 79000,
            imageSourceUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=80',
          },
          {
            slug: 'khoai-tay-nghien-cajun',
            name: 'Khoai Tây Nghiền Sốt Cajun',
            description: 'Khoai tây nghiền mịn béo ngậy rưới sốt thịt bằm Cajun nóng hổi.',
            price: 29000,
            imageSourceUrl: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600&q=80',
          },
        ],
      },
    ],
  },
  {
    slug: 'bun-dau-co-khan',
    name: 'Bún Đậu Mắm Tôm Cô Khàn',
    description: 'Mẹt bún đậu mắm tôm chuẩn vị Hà Nội giữa lòng Sài Gòn: đậu rán giòn, chả cốm, nem chua rán.',
    address: '102/26 Cống Quỳnh, Phường Phạm Ngũ Lão, Quận 1, TP. Hồ Chí Minh',
    rating: 4.8,
    logoSourceUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80',
    categories: [
      {
        name: 'Bún Đậu & Món Cuốn',
        products: [
          {
            slug: 'met-bun-dau-ta-la',
            name: 'Mẹt Bún Đậu Tá Lả Đầy Đủ',
            description: 'Bún lá, đậu hũ chiên giòn, thịt chân giò luộc, chả cốm, nem chua rán và mắm tôm pha tắc.',
            price: 75000,
            imageSourceUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80',
          },
          {
            slug: 'bun-dau-cha-com-ha-noi',
            name: 'Bún Đậu Chả Cốm Hà Nội',
            description: 'Đậu mơ rán nóng ngoài giòn trong béo kết hợp chả cốm Làng Vòng thơm dẻo.',
            price: 55000,
            imageSourceUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
          },
          {
            slug: 'nem-chua-ran-pho-co',
            name: 'Nem Chua Rán Phố Cổ (8 cây)',
            description: 'Nem chua tẩm bột chiên xù giòn rụm chấm tương ớt Bắc cay nồng.',
            price: 45000,
            imageSourceUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80',
          },
          {
            slug: 'tra-tac-mat-ong',
            name: 'Trà Tắc Mật Ong Khổng Lồ',
            description: 'Trà xanh pha tắc tươi và mật ong hoa nhãn chua ngọt giải ngấy cực đã.',
            price: 20000,
            imageSourceUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80',
          },
        ],
      },
    ],
  },
  {
    slug: 'astral-gourmet-cafe',
    name: 'Astral Gourmet Cafe & Bakery',
    description: 'Thương hiệu cà phê đặc sản, bánh nướng thủ công và đồ ăn vặt phong cách Cloud-Kitchen hiện đại.',
    address: '268 Lý Thường Kiệt, Phường 14, Quận 10, TP. Hồ Chí Minh',
    rating: 4.9,
    logoSourceUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
    categories: [
      {
        name: 'Cà Phê & Trà Sữa Đặc Sản',
        products: [
          {
            slug: 'ca-phe-muoi-astral',
            name: 'Cà Phê Muối Astral Cloud',
            description: 'Cà phê Robusta Đắk Lắk kết hợp lớp kem béo mặn sánh mịn độc quyền.',
            price: 35000,
            imageSourceUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80',
          },
          {
            slug: 'tra-sua-tran-chau-hoang-kim',
            name: 'Trà Sữa Trân Châu Hoàng Kim',
            description: 'Trà đen Ceylon đậm đà, sữa tươi thanh trùng và trân châu mật ong giòn dai.',
            price: 42000,
            imageSourceUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&q=80',
          },
        ],
      },
      {
        name: 'Bánh Mì, Bánh Nướng & Ăn Vặt',
        products: [
          {
            slug: 'banh-mi-chao-bo-pho-mai',
            name: 'Bánh Mì Chảo Bò Phô Mai Astral',
            description: 'Bò Mỹ mềm ướp sốt tiêu đen, phô mai Mozzarella kéo sợi và pate nhà làm.',
            price: 49000,
            imageSourceUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&q=80',
          },
          {
            slug: 'croissant-trung-muoi',
            name: 'Croissant Trứng Muối Hoàng Kim',
            description: 'Vỏ bánh ngàn lớp bơ Pháp giòn rụm với nhân trứng muối kim sa tan chảy.',
            price: 38000,
            imageSourceUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80',
          },
          {
            slug: 'panna-cotta-dau-rung',
            name: 'Panna Cotta Dâu Rừng Đà Lạt',
            description: 'Panna cotta mềm mượt thanh mát phủ mứt dâu tây tươi chua ngọt tự nhiên.',
            price: 29000,
            imageSourceUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80',
          },
        ],
      },
    ],
  },
];

async function main() {
  console.log('🌱 Bắt đầu nạp dữ liệu thực tế (Stores, Menus, Prices & S3 Images) cho AstralFood...');
  console.log(HAS_AWS ? `☁️  Đang bật tự động upload ảnh lên AWS S3: ${S3_BUCKET}` : 'ℹ️ Chạy không có AWS S3 creds, giữ URL ảnh gốc.');

  const passwordHashAdmin = await bcrypt.hash('Admin@123', 10);
  const passwordHashMerchant = await bcrypt.hash('Merchant@123', 10);
  const passwordHashCustomer = await bcrypt.hash('Customer@123', 10);

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
  console.log(`✅ 3 tài khoản sẵn sàng: ${admin.email}, ${merchant.email}, ${customer.email}`);

  let totalStores = 0;
  let totalProducts = 0;
  let firstStoreId = '';
  const firstStoreProducts: { id: string; price: number }[] = [];

  for (const s of REAL_STORES) {
    const logoS3Url = await ensureImageOnS3(`stores/${s.slug}.jpg`, s.logoSourceUrl);

    let store = await prisma.store.findFirst({ where: { name: s.name } });
    if (!store) {
      store = await prisma.store.create({
        data: {
          ownerId: merchant.id,
          name: s.name,
          description: s.description,
          address: s.address,
          logoS3Url,
          rating: s.rating,
          isActive: true,
        },
      });
    } else {
      store = await prisma.store.update({
        where: { id: store.id },
        data: { description: s.description, address: s.address, logoS3Url, rating: s.rating, isActive: true },
      });
    }
    totalStores++;
    if (!firstStoreId) firstStoreId = store.id;

    for (let catIdx = 0; catIdx < s.categories.length; catIdx++) {
      const catInput = s.categories[catIdx];
      let category = await prisma.category.findFirst({
        where: { storeId: store.id, name: catInput.name },
      });
      if (!category) {
        category = await prisma.category.create({
          data: { storeId: store.id, name: catInput.name, displayOrder: catIdx + 1 },
        });
      }

      for (const p of catInput.products) {
        const imageS3Url = await ensureImageOnS3(`products/${p.slug}.jpg`, p.imageSourceUrl);
        let product = await prisma.product.findFirst({
          where: { storeId: store.id, name: p.name },
        });
        if (!product) {
          product = await prisma.product.create({
            data: {
              storeId: store.id,
              categoryId: category.id,
              name: p.name,
              description: p.description,
              price: p.price,
              imageS3Url,
              isAvailable: true,
            },
          });
        } else {
          product = await prisma.product.update({
            where: { id: product.id },
            data: { description: p.description, price: p.price, imageS3Url, categoryId: category.id, isAvailable: true },
          });
        }
        totalProducts++;
        if (store.id === firstStoreId) {
          firstStoreProducts.push({ id: product.id, price: p.price });
        }
      }
    }
    console.log(`✅ Quán: ${store.name} (${s.address})`);
  }

  // Nạp 5 đơn hàng COMPLETED rải đều 5 ngày gần đây nếu bảng orders còn trống (để biểu đồ Recharts lên đẹp)
  const existingOrders = await prisma.order.count();
  if (existingOrders === 0 && firstStoreId && firstStoreProducts.length >= 2) {
    const now = Date.now();
    for (let dayAgo = 4; dayAgo >= 0; dayAgo--) {
      const p1 = firstStoreProducts[dayAgo % firstStoreProducts.length];
      const p2 = firstStoreProducts[(dayAgo + 1) % firstStoreProducts.length];
      const qty1 = (dayAgo % 2) + 1;
      const qty2 = 1;
      const total = p1.price * qty1 + p2.price * qty2;

      await prisma.order.create({
        data: {
          customerId: customer.id,
          storeId: firstStoreId,
          totalAmount: total,
          discountAmount: 0,
          status: OrderStatus.COMPLETED,
          deliveryAddress: '268 Lý Thường Kiệt, Phường 14, Quận 10, TP. Hồ Chí Minh',
          note: 'Giao giờ trưa, ít ớt',
          createdAt: new Date(now - dayAgo * 24 * 60 * 60 * 1000),
          items: {
            create: [
              { productId: p1.id, quantity: qty1, unitPrice: p1.price },
              { productId: p2.id, quantity: qty2, unitPrice: p2.price },
            ],
          },
        },
      });
    }
    console.log('✅ Đã nạp 5 đơn hàng mẫu COMPLETED trong 5 ngày gần nhất cho biểu đồ Analytics.');
  }

  console.log(`\n🎉 HOÀN TẤT! Đã đồng bộ ${totalStores} quán ăn, ${totalProducts} món ăn lên RDS & AWS S3!`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi nạp Seed Data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
