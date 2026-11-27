import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  Clock,
  MapPin,
  ArrowLeft,
  Plus,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Utensils,
} from 'lucide-react';
import { storeService, productService } from '../../api/services';
import type { Store, Category, Product, StoreReviewsResponse } from '../../types';
import { FoodDetailModal } from '../../components/FoodDetailModal';
import { useCartStore } from '../../store/useCartStore';

export const StoreDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toggleCart, getItemCount } = useCartStore();

  const [store, setStore] = useState<Store | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviewStats, setReviewStats] = useState<StoreReviewsResponse>({
    average_rating: 0,
    review_count: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    reviews: [],
  });
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadStoreData(id);
    }
  }, [id]);

  const loadStoreData = async (storeId: string) => {
    setIsLoading(true);
    try {
      const [storeData, catList, prodList, reviewsData] = await Promise.all([
        storeService.getStoreById(storeId),
        storeService.getCategories(storeId),
        productService.getProductsByStore(storeId),
        storeService.getStoreReviews(storeId).catch(() => ({
          average_rating: 0,
          review_count: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          reviews: [],
        })),
      ]);
      setStore(storeData);
      setCategories(catList);
      setProducts(prodList);
      setReviewStats(reviewsData);
    } catch (err) {
      console.error('Error loading store detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderDishCard = (product: Product) => {
    const isAvailable = product.is_available !== false;
    return (
      <div
        key={product.id}
        className={`p-4 rounded-3xl border transition-all flex gap-4 ${
          isAvailable
            ? 'bg-white border-gray-100 hover:border-orange-200 hover:shadow-md'
            : 'bg-gray-50 border-gray-200 opacity-60'
        }`}
      >
        {/* Dish Photo */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shrink-0 bg-gray-100">
          <img
            src={product.image_s3_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white text-[10px] font-bold text-center px-1">
              <XCircle className="w-3.5 h-3.5 mr-1 text-red-400" /> Tạm hết
            </div>
          )}
        </div>

        {/* Dish Details */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900 leading-tight">
                {product.name}
              </h3>
            </div>

            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
              {product.description}
            </p>

            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {product.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="font-black text-base text-[#FF5A1F]">
              {product.price.toLocaleString('vi-VN')} đ
            </span>

            {isAvailable ? (
              <button
                type="button"
                onClick={() => setSelectedProduct(product)}
                className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Chọn Món</span>
              </button>
            ) : (
              <span className="text-[11px] font-bold text-gray-400 uppercase">
                Hết hàng
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-500">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-bold">Đang tải thực đơn quán ăn...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-500 space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Không tìm thấy thông tin quán ăn</h2>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-5 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors cursor-pointer"
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  const knownCatIds = new Set(categories.map((c) => c.id));
  const uncategorizedProducts = products.filter((p) => !knownCatIds.has(p.category_id));
  const selectedCategoryObj =
    selectedCatId !== 'all' ? categories.find((c) => c.id === selectedCatId) : null;
  const filteredSingleCategoryProducts = products.filter((p) => p.category_id === selectedCatId);

  return (
    <div className="space-y-8 pb-20">
      {/* Header Banner */}
      <section className="relative bg-white border-b border-gray-100">
        {/* Cover Photo */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-gray-900">
          <img
            src={store.logo_s3_url}
            alt={store.name}
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Back Button */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="absolute top-6 left-6 p-2.5 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md backdrop-blur-md transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>
        </div>

        {/* Store Info Card */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-16 sm:-mt-20 bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-3 py-0.5 rounded-full bg-orange-100 text-[#FF5A1F] text-[11px] font-extrabold uppercase">
                    {store.category_tag || 'Ẩm thực'}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Quán Đang Mở Cửa
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
                  {store.name}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
                  {store.description}
                </p>
              </div>

              {/* Quick Floating Cart Open Button */}
              <button
                type="button"
                onClick={toggleCart}
                className="self-start sm:self-center px-5 py-3 rounded-2xl bg-coral-gradient text-white text-xs font-black shadow-lg shadow-orange-500/25 hover:opacity-95 transition-opacity flex items-center gap-2 cursor-pointer shrink-0"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Giỏ Hàng ({getItemCount()})</span>
              </button>
            </div>

            {/* Badges metadata */}
            <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-5 text-xs text-gray-600">
              <div className="flex items-center gap-1.5 text-gray-900 font-extrabold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {reviewStats.review_count > 0 ? (
                  <>
                    <span>{reviewStats.average_rating.toFixed(1)} / 5.0</span>
                    <span className="text-gray-400 font-normal">
                      ({reviewStats.review_count} đánh giá)
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500 font-bold">Chưa có đánh giá</span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-orange-500" />
                <span>Thời gian giao: <strong>{store.delivery_time || '20-30 phút'}</strong></span>
              </div>

              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{store.address}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          CATEGORY PILLS FOR STORE MENU
         ========================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 sticky top-20 z-30 bg-[#FFFDF9]/95 backdrop-blur-md py-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCatId('all')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              selectedCatId === 'all'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-white hover:bg-orange-50 text-gray-700 border border-gray-200'
            }`}
          >
            Tất cả món ({products.length})
          </button>

          {categories.map((cat) => {
            const count = products.filter((p) => p.category_id === cat.id).length;
            const isSelected = selectedCatId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCatId(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-white hover:bg-orange-50 text-gray-700 border border-gray-200'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </section>

      {/* ==========================================
          PRODUCTS LIST (GROUPED BY CATEGORY)
         ========================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {selectedCatId === 'all' ? (
          <>
            {categories.map((cat) => {
              const catProducts = products.filter((p) => p.category_id === cat.id);
              if (catProducts.length === 0) return null;
              return (
                <div key={cat.id} className="space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-orange-100">
                    <h2 className="text-lg sm:text-xl font-black text-gray-900">{cat.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-[#FF5A1F] text-xs font-bold">
                      {catProducts.length} món
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {catProducts.map(renderDishCard)}
                  </div>
                </div>
              );
            })}

            {uncategorizedProducts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-orange-100">
                  <h2 className="text-lg sm:text-xl font-black text-gray-900">Khác</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                    {uncategorizedProducts.length} món
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {uncategorizedProducts.map(renderDishCard)}
                </div>
              </div>
            )}

            {products.length === 0 && (
              <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center text-gray-500 space-y-2">
                <Utensils className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="font-bold text-sm text-gray-800">Quán hiện chưa có món ăn nào</p>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            {selectedCategoryObj && (
              <div className="flex items-center gap-2.5 pb-2 border-b border-orange-100">
                <h2 className="text-lg sm:text-xl font-black text-gray-900">
                  {selectedCategoryObj.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-[#FF5A1F] text-xs font-bold">
                  {filteredSingleCategoryProducts.length} món
                </span>
              </div>
            )}

            {filteredSingleCategoryProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredSingleCategoryProducts.map(renderDishCard)}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center text-gray-500 space-y-2">
                <Utensils className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="font-bold text-sm text-gray-800">
                  Danh mục này hiện chưa có món ăn nào
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ==========================================
          CUSTOMER REVIEWS SECTION
         ========================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#FF5A1F]" />
              <span>Đánh Giá Từ Khách Hàng ({reviewStats.review_count})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-5 rounded-2xl bg-[#FFFDF9] border border-orange-100">
            <div className="text-center md:border-r md:border-orange-100 md:pr-6">
              <div className="text-4xl font-black text-gray-900">
                {reviewStats.review_count > 0 ? reviewStats.average_rating.toFixed(1) : '—'}
              </div>
              <div className="flex items-center justify-center gap-1 my-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(reviewStats.average_rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 font-semibold">
                {reviewStats.review_count > 0
                  ? `Dựa trên ${reviewStats.review_count} đánh giá thực tế`
                  : 'Chưa có đánh giá nào từ khách hàng'}
              </p>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviewStats.distribution[star] || 0;
                const pct =
                  reviewStats.review_count > 0
                    ? Math.round((count / reviewStats.review_count) * 100)
                    : 0;
                return (
                  <div key={star} className="flex items-center gap-3 text-xs">
                    <span className="w-10 font-bold text-gray-700 flex items-center gap-1 shrink-0">
                      {star} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-gray-500 font-semibold">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {reviewStats.reviews.length > 0 ? (
            <div className="space-y-3">
              {reviewStats.reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-[#FF5A1F] font-black text-xs flex items-center justify-center">
                        {rev.customer_name ? rev.customer_name.charAt(0).toUpperCase() : 'K'}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-gray-900">{rev.customer_name}</p>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= rev.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-400">
                      {new Date(rev.created_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  {rev.comment && (
                    <p className="text-xs text-gray-700 leading-relaxed pl-10">{rev.comment}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-4">
              Hãy đặt đơn và trở thành khách hàng đầu tiên đánh giá quán nhé!
            </p>
          )}
        </div>
      </section>

      {/* Modal Customize Dish */}
      <FoodDetailModal
        product={selectedProduct}
        store={store}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};

export default StoreDetailPage;