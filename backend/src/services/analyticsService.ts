import { prisma } from '../prisma.js';

export type AnalyticsPeriodInput = 'day' | '7days' | 'week' | '30days' | 'month';

function formatDayLabel(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

function formatMonthLabel(date: Date): string {
  return `Tháng ${date.getMonth() + 1}`;
}

function formatHourLabel(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  return `${hh}:00`;
}

export async function getStoreAnalyticsData(storeId: string, rawPeriod?: string) {
  const now = new Date();
  let normalizedPeriod: 'day' | 'week' | 'month' = 'day';
  let startDate: Date | undefined;

  if (rawPeriod === '30days' || rawPeriod === 'week') {
    normalizedPeriod = 'week';
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (rawPeriod === 'month') {
    normalizedPeriod = 'month';
    startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  } else if (rawPeriod === '7days') {
    normalizedPeriod = 'day';
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const periodFilter = startDate ? { gte: startDate } : undefined;

  const [completedOrders, allOrdersCount] = await Promise.all([
    prisma.order.findMany({
      where: {
        storeId,
        status: 'COMPLETED',
        ...(periodFilter ? { createdAt: periodFilter } : {}),
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.order.count({
      where: {
        storeId,
        ...(periodFilter ? { createdAt: periodFilter } : {}),
      },
    }),
  ]);

  const totalRevenue = completedOrders.reduce((acc, order) => acc + Number(order.totalAmount), 0);
  const completedOrdersCount = completedOrders.length;
  const averageOrderValue =
    completedOrdersCount > 0 ? Math.round(totalRevenue / completedOrdersCount) : 0;

  // Nhóm doanh thu theo mốc thời gian cho biểu đồ Recharts
  const chartMap = new Map<string, { time: string; revenue: number; ordersCount: number }>();

  for (const order of completedOrders) {
    const created = new Date(order.createdAt);
    let label: string;

    if (normalizedPeriod === 'month') {
      label = formatMonthLabel(created);
    } else if (normalizedPeriod === 'week') {
      const weekOfMonth = Math.min(4, Math.ceil(created.getDate() / 7));
      label = `Tuần ${weekOfMonth}`;
    } else if (rawPeriod === '7days') {
      label = formatDayLabel(created);
    } else {
      label = formatHourLabel(created);
    }

    const existing = chartMap.get(label) || { time: label, revenue: 0, ordersCount: 0 };
    existing.revenue += Number(order.totalAmount);
    existing.ordersCount += 1;
    chartMap.set(label, existing);
  }

  const revenueChart = Array.from(chartMap.values());

  // Tổng hợp top món ăn bán chạy nhất từ bảng order_items thực tế
  const productMap = new Map<
    string,
    {
      productId: string;
      productName: string;
      categoryName: string;
      salesCount: number;
      quantitySold: number;
      revenue: number;
      totalRevenue: number;
      image_s3_url: string;
    }
  >();

  for (const order of completedOrders) {
    for (const item of order.items) {
      const lineRevenue = Number(item.unitPrice) * item.quantity;
      const existing = productMap.get(item.productId) || {
        productId: item.productId,
        productName: item.product?.name || 'Món ăn AstralFood',
        categoryName: item.product?.category?.name || 'Món chính',
        salesCount: 0,
        quantitySold: 0,
        revenue: 0,
        totalRevenue: 0,
        image_s3_url:
          item.product?.imageS3Url ||
          'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80',
      };

      existing.salesCount += item.quantity;
      existing.quantitySold += item.quantity;
      existing.revenue += lineRevenue;
      existing.totalRevenue += lineRevenue;
      productMap.set(item.productId, existing);
    }
  }

  const topSellingProducts = Array.from(productMap.values())
    .sort((a, b) => b.quantitySold - a.quantitySold || b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  return {
    storeId,
    period: normalizedPeriod,
    totalRevenue,
    totalOrders: allOrdersCount,
    completedOrdersCount,
    averageOrderValue,
    revenueChart,
    topSellingProducts,
  };
}
