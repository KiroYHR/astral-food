import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  Clock,
  MapPin,
  Flame,
  Plus,
  ArrowRight,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { storeService, productService } from '../../api/services';
import type { Store, Product } from '../../types';
import { FoodDetailModal } from '../../components/FoodDetailModal';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const [stores, setStores] = useState<Store[]>([]);
  const [allProducts, setAllProducts] = useState<{ product: Product; store: Store }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'price-asc'>('popular');

  // Modal xem món
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductStore, setSelectedProductStore] = useState<Store | null>(null);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const storeList = await storeService.getStores();
      setStores(storeList);

      // Thu thập các món ăn nổi bật từ các cửa hàng
      const prodsWithStore: { product: Product; store: Store }[] = [];
      for (const store of storeList.slice(0, 4)) {
        const prods = await productService.getProductsByStore(store.id);
        prods.slice(0, 2).forEach((p) => {
          prodsWithStore.push({ product: p, store });
        });
      }
      setAllProducts(prodsWithStore);
    } catch (err) {
      console.error('Error loading home data:', err);
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

  // Lọc quán ăn theo danh mục, tìm kiếm và đánh giá
  const filteredStores = stores
    .filter((s) => {
      const matchCat =
        selectedCategory === 'Tất cả' ||
        s.category_tag?.toLowerCase().includes(selectedCategory.toLowerCase());
      const matchSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRating = !minRating || (s.rating || 0) >= minRating;
      return matchCat && matchSearch && matchRating;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return 0;
    });

  // Lọc món ăn nổi bật
  const filteredProducts = allProducts.filter(({ product }) => {
    if (priceFilter === 'under35') return product.price < 35000;
    if (priceFilter === '35to60') return product.price >= 35000 && product.price <= 60000;
    if (priceFilter === 'above60') return product.price > 60000;
    return true;
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
          2. CATEGORY PILLS BAR
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
          3. SMART FILTER & SEARCH BAR
         ========================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Left Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Bộ Lọc:
            </span>

            {/* Price Filter */}
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className="px-3 py-2 bg-[#FFFDF9] border border-gray-200 rounded-xl font-semibold text-gray-700 focus:outline-none focus:border-orange-500"
            >
              <option value="all">Khoảng giá: Tất cả</option>
              <option value="under35">Dưới 35.000đ</option>
              <option value="35to60">35.000đ - 60.000đ</option>
              <option value="above60">Trên 60.000đ</option>
            </select>

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
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-[#FFFDF9] border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-orange-500"
            >
              <option value="popular">Phổ biến nhất</option>
              <option value="rating">Đánh giá cao nhất</option>
            </select>
          </div>
        </div>
      </section>

      {/* ==========================================
          4. "QUÁN NGON QUANH BẠN" (STORES GRID)
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
                setSearchQuery('');
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
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-bold text-gray-800 flex items-center gap-1 shadow-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{store.rating || 4.8}</span>
                    </div>

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

      {/* ==========================================
          5. "MÓN NGON ĐANG HOT" (HOT DISHES)
         ========================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-[#FF5A1F]" />
              <span>Món Ngon Đang Bán Chạy</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Những món ăn được khách hàng yêu thích và đặt nhiều nhất trong tuần
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredProducts.map(({ product, store }) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs hover:border-orange-200 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div
                  className="relative h-40 overflow-hidden bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setSelectedProduct(product);
                    setSelectedProductStore(store);
                  }}
                >
                  <img
                    src={product.image_s3_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-medium backdrop-blur-xs">
                    {store.name}
                  </div>
                </div>

                <div className="p-3.5 space-y-1.5">
                  <h4
                    onClick={() => {
                      setSelectedProduct(product);
                      setSelectedProductStore(store);
                    }}
                    className="font-bold text-xs text-gray-900 hover:text-[#FF5A1F] transition-colors line-clamp-1 cursor-pointer"
                  >
                    {product.name}
                  </h4>
                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-tight">
                    {product.description}
                  </p>
                </div>
              </div>

              <div className="p-3.5 pt-0 flex items-center justify-between">
                <span className="font-black text-sm text-[#FF5A1F]">
                  {product.price.toLocaleString('vi-VN')} đ
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedProduct(product);
                    setSelectedProductStore(store);
                  }}
                  className="p-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-all active:scale-95 shadow-xs cursor-pointer flex items-center gap-1 text-xs font-bold px-3"
                  title="Thêm vào giỏ"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Chọn</span>
                </button>
              </div>
            </div>
          ))}
        </div>
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