import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Star,
  Clock,
  MapPin,
  Flame,
  Plus,
  ArrowRight,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Award,
  ShoppingBag,
} from 'lucide-react';
import { storeService, productService } from '../../api/services';
import type { Store, Product, TopSellingDishItem } from '../../types';
import { FoodDetailModal } from '../../components/FoodDetailModal';

function getYesterdayDateLabel(): string {
  const vnOffsetMs = 7 * 60 * 60 * 1000;
  const nowVn = new Date(Date.now() + vnOffsetMs);
  const startTodayVnUtc =
    Date.UTC(nowVn.getUTCFullYear(), nowVn.getUTCMonth(), nowVn.getUTCDate()) - vnOffsetMs;
  const yesterdayVn = new Date(startTodayVnUtc - 24 * 60 * 60 * 1000 + vnOffsetMs);
  return `${String(yesterdayVn.getUTCDate()).padStart(2, '0')}/${String(
    yesterdayVn.getUTCMonth() + 1
  ).padStart(2, '0')}/${yesterdayVn.getUTCFullYear()}`;
}

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const [stores, setStores] = useState<Store[]>([]);
  const [topDishes, setTopDishes] = useState<TopSellingDishItem[]>([]);
  const [topDateLabel, setTopDateLabel] = useState<string>(() => getYesterdayDateLabel());
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'popular' | 'rating'>('popular');

  // Top 4 Carousel state (tự động đổi sau 3s + vuốt qua lại)
  const [activeSlide, setActiveSlide] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [dragDeltaX, setDragDeltaX] = useState(0);
  const dragStartXRef = useRef<number | null>(null);
  const didSwipeRef = useRef(false);

  // Modal xem món
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductStore, setSelectedProductStore] = useState<Store | null>(null);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const [storeList, topRes] = await Promise.all([
        storeService.getStores(),
        productService.getTopSellingDishes(4).catch(() => null),
      ]);
      setStores(storeList);

      if (topRes && topRes.items.length > 0) {
        setTopDishes(topRes.items.slice(0, 4));
        if (topRes.date_label) {
          setTopDateLabel(topRes.date_label);
        }
        return;
      }

      // Fallback an toàn nếu server chưa cập nhật route /products/top-selling
      const prioritizedStores = [...storeList].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      const storeProductBuckets = await Promise.all(
        prioritizedStores.slice(0, 6).map(async (store) => {
          try {
            const prods = await productService.getProductsByStore(store.id);
            return prods
              .filter((p) => p.is_available !== false)
              .map((p) => ({ product: p, store }));
          } catch {
            return [];
          }
        })
      );

      const fallbackItems: TopSellingDishItem[] = [];
      const usedProductIds = new Set<string>();

      for (const bucket of storeProductBuckets) {
        if (fallbackItems.length >= 4) break;
        if (bucket.length > 0) {
          const first = bucket[0];
          usedProductIds.add(first.product.id);
          fallbackItems.push({
            rank: fallbackItems.length + 1,
            quantity_sold: 0,
            orders_count: 0,
            source: 'featured',
            product: first.product,
            store: first.store,
          });
        }
      }

      if (fallbackItems.length < 4) {
        for (const pair of storeProductBuckets.flat()) {
          if (fallbackItems.length >= 4) break;
          if (!usedProductIds.has(pair.product.id)) {
            usedProductIds.add(pair.product.id);
            fallbackItems.push({
              rank: fallbackItems.length + 1,
              quantity_sold: 0,
              orders_count: 0,
              source: 'featured',
              product: pair.product,
              store: pair.store,
            });
          }
        }
      }

      setTopDishes(fallbackItems);
    } catch (err) {
      console.error('Error loading home data:', err);
    }
  };

  // Tự động chuyển món sau mỗi 3 giây
  useEffect(() => {
    if (topDishes.length <= 1 || isCarouselPaused) return;

    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % topDishes.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [topDishes.length, isCarouselPaused]);

  const safeSlideIndex = topDishes.length > 0 ? activeSlide % topDishes.length : 0;

  const goPrevSlide = () => {
    if (topDishes.length <= 1) return;
    setActiveSlide((prev) => (prev - 1 + topDishes.length) % topDishes.length);
  };

  const goNextSlide = () => {
    if (topDishes.length <= 1) return;
    setActiveSlide((prev) => (prev + 1) % topDishes.length);
  };

  const handleDragStart = (clientX: number) => {
    dragStartXRef.current = clientX;
    didSwipeRef.current = false;
    setIsCarouselPaused(true);
  };

  const handleDragMove = (clientX: number) => {
    if (dragStartXRef.current === null) return;
    const delta = clientX - dragStartXRef.current;
    if (Math.abs(delta) > 6) {
      didSwipeRef.current = true;
    }
    setDragDeltaX(delta);
  };

  const handleDragEnd = () => {
    if (dragStartXRef.current === null) return;
    const delta = dragDeltaX;
    dragStartXRef.current = null;
    setDragDeltaX(0);
    setIsCarouselPaused(false);

    if (delta <= -45) {
      goNextSlide();
    } else if (delta >= 45) {
      goPrevSlide();
    }
  };

  const categories = [
    { id: 'Tất cả', name: 'Tất cả', icon: '🍽️' },
    { id: 'Cơm tấm', name: 'Cơm tấm', icon: '🍚' },
    { id: 'Trà sữa', name: 'Trà sữa & Cafe', icon: '🧋' },
    { id: 'Gà rán', name: 'Gà rán & Burger', icon: '🍗' },
    { id: 'Phở', name: 'Phở & Bún', icon: '🍜' },
    { id: 'Ăn vặt', name: 'Ăn vặt', icon: '🍟' },
    { id: 'Món cuốn', name: 'Bún đậu & Cuốn', icon: '🥢' },
  ];

  const normalizeVietnamese = (str: string) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .trim();

  const normalizedQuery = normalizeVietnamese(searchQuery);

  // Lọc quán ăn theo danh mục, tìm kiếm và đánh giá
  const filteredStores = stores
    .filter((s) => {
      const catTag = s.category_tag?.toLowerCase() || '';
      const matchCat =
        selectedCategory === 'Tất cả' ||
        (selectedCategory === 'Món cuốn'
          ? catTag.includes('cuốn')
          : catTag.includes(selectedCategory.toLowerCase()));
      const matchSearch =
        !normalizedQuery ||
        normalizeVietnamese(s.name).includes(normalizedQuery) ||
        normalizeVietnamese(s.description).includes(normalizedQuery) ||
        normalizeVietnamese(s.category_tag || '').includes(normalizedQuery);
      const matchRating = !minRating || (s.rating || 0) >= minRating;
      return matchCat && matchSearch && matchRating;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return 0;
    });

  return (
    <div className="space-y-12 pb-16">
      {/* ==========================================
          1. HERO PROMOTIONAL BANNER
         ========================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Huge Promo Card */}
          <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-coral-gradient p-8 sm:p-10 text-white flex flex-col justify-between shadow-xl shadow-orange-500/20 min-h-[300px]">
            <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-25 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

            <div className="space-y-3 z-10 max-w-md">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 fill-white" /> Giảm 50% Toàn Thực Đơn
              </span>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Bữa Trưa Rực Rỡ, <br />
                Đậm Vị Món Ngon
              </h1>
              <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
                Hàng nghìn quán cơm tấm, phở tái lăn, gà rán giòn rụm đang sẵn sàng giao nóng hổi tận bàn ăn của bạn.
              </p>
            </div>

            <div className="pt-6 z-10 flex flex-wrap items-center gap-3">
              <div className="bg-white/20 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                <span>Mã:</span>
                <span className="font-mono bg-white text-[#FF5A1F] px-2 py-0.5 rounded-lg text-xs font-black">
                  ASTRAL20
                </span>
                <span className="text-white/80">(-20k)</span>
              </div>

              <div className="bg-white/20 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                <span>Mã:</span>
                <span className="font-mono bg-white text-emerald-600 px-2 py-0.5 rounded-lg text-xs font-black">
                  FREESHIP
                </span>
                <span className="text-white/80">(-15k ship)</span>
              </div>
            </div>
          </div>

          {/* Secondary Quick Deal Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-8 text-white flex flex-col justify-between shadow-lg shadow-amber-500/15">
            <div className="space-y-3 z-10">
              <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-extrabold tracking-wider uppercase">
                ⚡ Giờ Vàng 11h - 13h
              </span>
              <h2 className="text-2xl font-black tracking-tight">
                Freeship 0Đ <br /> Đơn Từ 100K
              </h2>
              <p className="text-xs text-amber-100 leading-relaxed">
                Giao siêu tốc 20 phút bảo toàn độ giòn rụm và hương vị ấm nóng của món ăn.
              </p>
            </div>

            <div className="pt-6 z-10">
              <button
                type="button"
                onClick={() => setSelectedCategory('Gà rán')}
                className="w-full py-3 bg-white text-gray-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors shadow-md cursor-pointer"
              >
                <span>Đặt món gà rán giòn</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          2. TOP 4 MÓN NGON BÁN CHẠY HÔM QUA (BANNER CAROUSEL 3S)
         ========================================== */}
      {topDishes.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-[#FF5A1F]" />
                  <span>Món Ngon Bán Chạy Hôm Qua</span>
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-[#FF5A1F] border border-orange-200 text-[11px] font-black uppercase tracking-wider">
                  <Award className="w-3.5 h-3.5" /> TOP {topDishes.length} • {topDateLabel}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                4 món ăn được đặt nhiều nhất trong ngày hôm qua — tự động chuyển sau 3 giây, vuốt qua lại để khám phá
              </p>
            </div>

            {topDishes.length > 1 && (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-bold text-gray-500 mr-1">
                  {safeSlideIndex + 1} / {topDishes.length}
                </span>
                <button
                  type="button"
                  onClick={goPrevSlide}
                  className="w-9 h-9 rounded-full bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-300 text-gray-700 hover:text-[#FF5A1F] flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                  aria-label="Món trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={goNextSlide}
                  className="w-9 h-9 rounded-full bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-300 text-gray-700 hover:text-[#FF5A1F] flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                  aria-label="Món tiếp theo"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Large Promotional Banner Viewport */}
          <div
            className="relative rounded-3xl overflow-hidden shadow-2xl shadow-orange-500/15 border border-orange-100 bg-gray-950 select-none touch-pan-y cursor-grab active:cursor-grabbing"
            onMouseEnter={() => setIsCarouselPaused(true)}
            onMouseLeave={() => {
              setIsCarouselPaused(false);
              if (dragStartXRef.current !== null) {
                handleDragEnd();
              }
            }}
            onPointerDown={(e) => {
              if ((e.target as HTMLElement).closest('button, a')) return;
              handleDragStart(e.clientX);
            }}
            onPointerMove={(e) => handleDragMove(e.clientX)}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
          >
            {/* Sliding Track */}
            <div
              className={`flex ${dragDeltaX === 0 ? 'transition-transform duration-700 ease-out' : ''}`}
              style={{
                transform: `translateX(calc(-${safeSlideIndex * 100}% + ${dragDeltaX}px))`,
              }}
            >
              {topDishes.map((item, idx) => {
                const isActive = idx === safeSlideIndex;
                return (
                  <div
                    key={item.product.id}
                    className="w-full shrink-0 relative h-[420px] sm:h-[460px] lg:h-[500px] overflow-hidden"
                  >
                    {/* Background Dish Image */}
                    <img
                      src={item.product.image_s3_url}
                      alt={item.product.name}
                      draggable={false}
                      className={`w-full h-full object-cover transition-transform duration-[3000ms] ease-out ${
                        isActive ? 'scale-105' : 'scale-100'
                      }`}
                    />

                    {/* Dark Cinematic Scrim */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/15" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/25" />

                    {/* Banner Content */}
                    <div className="relative z-10 h-full flex flex-col justify-between p-6 sm:p-10 lg:p-14 max-w-2xl">
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-coral-gradient text-white text-xs font-black tracking-wide shadow-lg shadow-orange-500/30">
                          <Flame className="w-3.5 h-3.5 fill-white" />
                          <span>TOP #{item.rank} BÁN CHẠY</span>
                        </span>

                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-amber-200 border border-white/20 text-xs font-bold">
                          <ShoppingBag className="w-3.5 h-3.5" />
                          {item.quantity_sold > 0 ? (
                            <span>
                              {item.quantity_sold} phần đã đặt{' '}
                              {item.source === 'yesterday' ? 'hôm qua' : 'gần đây'}
                            </span>
                          ) : (
                            <span>Món nổi bật được yêu thích</span>
                          )}
                        </span>
                      </div>

                      {/* Middle & Bottom Dish Showcase */}
                      <div className="space-y-4">
                        {/* Store pill */}
                        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white">
                          <img
                            src={item.store.logo_s3_url}
                            alt={item.store.name}
                            draggable={false}
                            className="w-6 h-6 rounded-lg object-cover border border-white/30"
                          />
                          <span className="text-xs font-bold">{item.store.name}</span>
                          {(item.store.review_count ?? 0) > 0 && Number(item.store.rating) > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 pl-1 border-l border-white/25">
                              <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                              {Number(item.store.rating).toFixed(1)}
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-sm line-clamp-2">
                            {item.product.name}
                          </h3>
                          <p className="text-xs sm:text-base text-white/85 line-clamp-2 max-w-xl leading-relaxed">
                            {item.product.description || 'Hương vị đậm đà chuẩn quán, nguyên liệu tươi ngon mỗi ngày.'}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 pt-2">
                          <div className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">
                            {Number(item.product.price).toLocaleString('vi-VN')} đ
                          </div>

                          <div className="flex flex-wrap items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (didSwipeRef.current) return;
                                setSelectedProduct(item.product);
                                setSelectedProductStore(item.store);
                              }}
                              className="px-5 py-3 rounded-2xl bg-coral-gradient hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-xl shadow-orange-500/30 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Đặt Ngay Món Này</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (didSwipeRef.current) return;
                                navigate(`/stores/${item.store.id}`);
                              }}
                              className="px-4 py-3 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white border border-white/25 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <span>Xem Quán</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Overlay Prev/Next Buttons on Desktop */}
            {topDishes.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrevSlide}
                  className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/45 hover:bg-black/70 text-white border border-white/20 backdrop-blur-md items-center justify-center transition-all cursor-pointer"
                  aria-label="Slide trước"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={goNextSlide}
                  className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/45 hover:bg-black/70 text-white border border-white/20 backdrop-blur-md items-center justify-center transition-all cursor-pointer"
                  aria-label="Slide tiếp theo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* 4-Dish Quick Selector Cards Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {topDishes.map((item, idx) => {
              const isSelected = idx === safeSlideIndex;
              return (
                <button
                  key={item.product.id}
                  type="button"
                  onClick={() => setActiveSlide(idx)}
                  className={`group text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 relative overflow-hidden ${
                    isSelected
                      ? 'bg-orange-50/90 border-[#FF5A1F] shadow-md shadow-orange-500/10'
                      : 'bg-white border-gray-100 hover:border-orange-200 hover:bg-orange-50/40'
                  }`}
                >
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                    <img
                      src={item.product.image_s3_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span
                      className={`absolute top-1 left-1 px-1.5 py-0.5 rounded-md text-[10px] font-black text-white ${
                        isSelected ? 'bg-[#FF5A1F]' : 'bg-black/70'
                      }`}
                    >
                      #{item.rank}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-extrabold line-clamp-1 ${
                        isSelected ? 'text-[#FF5A1F]' : 'text-gray-900'
                      }`}
                    >
                      {item.product.name}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">{item.store.name}</p>
                    <div className="flex items-center justify-between gap-1 mt-1">
                      <span className="text-xs font-black text-gray-900">
                        {Number(item.product.price).toLocaleString('vi-VN')} đ
                      </span>
                      {item.quantity_sold > 0 && (
                        <span className="text-[10px] font-bold text-orange-600 shrink-0">
                          {item.quantity_sold} đơn
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <span className="absolute bottom-0 left-0 right-0 h-1 bg-coral-gradient" />
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ==========================================
          3. CATEGORY PILLS BAR
         ========================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all duration-200 cursor-pointer shadow-xs ${
                  isSelected
                    ? 'bg-coral-gradient text-white shadow-md shadow-orange-500/20 scale-105'
                    : 'bg-white hover:bg-orange-50 text-gray-700 hover:text-[#FF5A1F] border border-gray-100 hover:scale-102'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ==========================================
          4. SMART FILTER & SEARCH BAR
         ========================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Left Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Bộ Lọc:
            </span>

            {/* Rating Filter */}
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="px-3 py-2 bg-[#FFFDF9] border border-gray-200 rounded-xl font-semibold text-gray-700 focus:outline-none focus:border-orange-500"
            >
              <option value={0}>Đánh giá: Mọi mức sao</option>
              <option value={4.5}>Từ 4.5 ⭐ trở lên</option>
              <option value={4.8}>Từ 4.8 ⭐ (Xuất sắc)</option>
            </select>
          </div>

          {/* Right Sort */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-medium">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'popular' | 'rating')}
              className="px-3 py-2 bg-[#FFFDF9] border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-orange-500"
            >
              <option value="popular">Phổ biến nhất</option>
              <option value="rating">Đánh giá cao nhất</option>
            </select>
          </div>
        </div>
      </section>

      {/* ==========================================
          5. "QUÁN NGON QUANH BẠN" (STORES GRID)
         ========================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <span>Quán Ngon Quanh Bạn</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#FF5A1F]">
                {filteredStores.length} quán
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Tuyển tập những quán ăn chuẩn vị, giao nhanh được đánh giá cao nhất tại khu vực của bạn
            </p>
          </div>
        </div>

        {filteredStores.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 text-gray-500 space-y-3">
            <p className="text-base font-bold">Không tìm thấy quán ăn phù hợp với bộ lọc</p>
            <p className="text-xs text-gray-400">Hãy thử chọn lại danh mục hoặc tìm từ khóa khác</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('Tất cả');
                setSearchParams({}, { replace: true });
                setMinRating(0);
              }}
              className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors cursor-pointer"
            >
              Khôi phục bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map((store) => (
              <div
                key={store.id}
                onClick={() => navigate(`/stores/${store.id}`)}
                className="group card-astral overflow-hidden cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Cover Image */}
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    <img
                      src={store.logo_s3_url}
                      alt={store.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {(store.review_count ?? 0) > 0 && Number(store.rating) > 0 ? (
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-bold text-gray-800 flex items-center gap-1 shadow-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>
                          {Number(store.rating).toFixed(1)} ({store.review_count})
                        </span>
                      </div>
                    ) : (
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-bold text-[#FF5A1F] shadow-xs">
                        Mới • Chưa có đánh giá
                      </div>
                    )}

                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-semibold text-gray-700 flex items-center gap-1 shadow-xs">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      <span>{store.delivery_time || '20-30 phút'}</span>
                    </div>

                    <div className="absolute bottom-3 left-3">
                      <span className="px-2.5 py-1 rounded-lg bg-orange-600/95 text-white text-[10px] font-bold backdrop-blur-xs shadow-xs">
                        {store.category_tag}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-extrabold text-base text-gray-900 group-hover:text-[#FF5A1F] transition-colors line-clamp-1">
                      {store.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {store.description}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                      <span className="truncate">{store.address}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <div className="w-full py-2.5 px-3 rounded-xl bg-orange-50 group-hover:bg-[#FF5A1F] text-[#FF5A1F] group-hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors">
                    <span>Xem Thực Đơn & Đặt Món</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Food Detail Modal */}
      <FoodDetailModal
        product={selectedProduct}
        store={selectedProductStore}
        onClose={() => {
          setSelectedProduct(null);
          setSelectedProductStore(null);
        }}
      />
    </div>
  );
};

export default HomePage;