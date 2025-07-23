'use client';
import { useState, useEffect, useCallback } from 'react';
import ProductCard from '../components/ProductCard';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useFavorites } from '../../contexts/FavoritesContext';

export default function ProductsPage() {
  const router = useRouter();
  const { favorites, validFavorites, favoritesCount, loading: favoritesLoading } = useFavorites();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // all, digital, furniture, favorites
  const [searchTerm, setSearchTerm] = useState(''); // 검색어
  const [sortBy, setSortBy] = useState('latest'); // latest, price_low, price_high

  // 상품 목록 불러오기
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      // 먼저 상품 목록만 가져오기
      const { data: productsData, error } = await supabase
        .from('market')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        setError('상품을 불러올 수 없습니다.');
        return;
      }

      if (!productsData || productsData.length === 0) {
        setProducts([]);
        setFilteredProducts([]);
        return;
      }

      // user_id가 있는 상품들의 판매자 정보 조회 시도
      const productsWithSellers = await Promise.all(
        productsData.map(async (product) => {
          if (product.user_id) {
            try {
              const { data: sellerData, error: sellerError } = await supabase
                .from('users')
                .select('nickname, location, rating')
                .eq('id', product.user_id)
                .single();

              if (sellerError || !sellerData) {
                // 판매자 정보를 가져올 수 없는 경우 기본값 설정
                return {
                  ...product,
                  seller: {
                    nickname: '판매자' + product.user_id.slice(0, 4),
                    location: '함정동',
                    rating: 5.0
                  }
                };
              }

              return {
                ...product,
                seller: sellerData
              };
            } catch (err) {
              console.warn('users 테이블에 접근할 수 없습니다:', err);
              return {
                ...product,
                seller: {
                  nickname: '판매자' + (product.user_id ? product.user_id.slice(0, 4) : ''),
                  location: '함정동',
                  rating: 5.0
                }
              };
            }
          } else {
            // user_id가 없는 경우
            return {
              ...product,
              seller: {
                nickname: '익명의 판매자',
                location: '함정동',
                rating: 5.0
              }
            };
          }
        })
      );

      setProducts(productsWithSellers);
      
      // 초기 로드 시에는 favorites 필터를 제외하고 적용 (favorites는 별도 useEffect에서 처리)
      if (activeFilter !== 'favorites') {
        applyFiltersAndSearch(productsWithSellers, activeFilter, searchTerm, sortBy);
      }

    } catch (error) {
      console.error('Unexpected error:', error);
      setError('예상치 못한 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, searchTerm, sortBy]);

  // 검색 기능
  const searchProducts = (productList, term) => {
    if (!term || term.trim() === '') {
      return productList;
    }

    const searchTerm = term.toLowerCase().trim();
    return productList.filter(product => {
      const title = (product.title || '').toLowerCase();
      const description = (product.description || '').toLowerCase();
      
      return title.includes(searchTerm) || description.includes(searchTerm);
    });
  };

  // 필터 적용
  const applyFilter = (productList, filter) => {
    switch (filter) {
      case 'digital':
        // 디지털 기기 관련 키워드로 필터링
        return productList.filter(product => {
          const title = (product.title || '').toLowerCase();
          return title.includes('폰') || 
            title.includes('컴퓨터') || 
            title.includes('노트북') || 
            title.includes('태블릿') || 
            title.includes('모니터') ||
            title.includes('키보드') ||
            title.includes('마우스') ||
            title.includes('이어폰') ||
            title.includes('스피커');
        });
      case 'furniture':
        // 가구/인테리어 관련 키워드로 필터링
        return productList.filter(product => {
          const title = (product.title || '').toLowerCase();
          return title.includes('책상') || 
            title.includes('의자') || 
            title.includes('침대') || 
            title.includes('소파') || 
            title.includes('장') ||
            title.includes('수납') ||
            title.includes('조명') ||
            title.includes('커튼');
        });
      case 'favorites':
        // 관심상품만 필터링 (유효한 상품만)
        console.log('🔍 Filtering favorites:', { 
          allFavorites: favorites, 
          validFavorites, 
          productListLength: productList.length 
        });
        const filtered = productList.filter(product => {
          const productId = String(product.id);
          // validFavorites를 사용하여 실제 존재하는 상품만 필터링
          const isFavorite = validFavorites.includes(productId);
          if (isFavorite) {
            console.log('✅ Found valid favorite product:', { id: productId, title: product.title });
          }
          return isFavorite;
        });
        console.log('🔍 Filtered result:', filtered.length, 'valid favorites found');
        return filtered;
      default:
        return productList;
    }
  };

  // 상품 정렬
  const sortProducts = (productList, sortType) => {
    const sorted = [...productList];
    
    switch (sortType) {
      case 'price_low':
        return sorted.sort((a, b) => {
          // 나눔 상품 vs 일반 상품: 나눔은 가격이 0으로 취급되어 맨 앞으로
          const priceA = a.trade_type === 'share' ? 0 : (a.price || 999999999);
          const priceB = b.trade_type === 'share' ? 0 : (b.price || 999999999);
          
          if (priceA !== priceB) {
            return priceA - priceB;
          }
          
          // 가격이 같으면 최신순
          return new Date(b.created_at) - new Date(a.created_at);
        });
        
      case 'price_high':
        return sorted.sort((a, b) => {
          // 나눔 상품은 뒤로, 일반 상품 중에서는 높은 가격순
          if (a.trade_type === 'share' && b.trade_type !== 'share') return 1;
          if (b.trade_type === 'share' && a.trade_type !== 'share') return -1;
          if (a.trade_type === 'share' && b.trade_type === 'share') {
            // 둘 다 나눔이면 최신순
            return new Date(b.created_at) - new Date(a.created_at);
          }
          
          const priceA = a.price || 0;
          const priceB = b.price || 0;
          
          if (priceA !== priceB) {
            return priceB - priceA;
          }
          
          // 가격이 같으면 최신순
          return new Date(b.created_at) - new Date(a.created_at);
        });
        
      case 'latest':
      default:
        return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  };

  // 필터, 검색, 정렬을 함께 적용
  const applyFiltersAndSearch = useCallback((productList, filter, search, sort = sortBy) => {
    let filtered = [...productList];
    
    // 1. 먼저 검색 적용
    filtered = searchProducts(filtered, search);
    
    // 2. 그 다음 필터 적용
    filtered = applyFilter(filtered, filter);
    
    // 3. 마지막으로 정렬 적용
    filtered = sortProducts(filtered, sort);
    
    console.log('📊 Applied sorting:', { 
      sortType: sort, 
      beforeCount: productList.length, 
      afterCount: filtered.length 
    });

    setFilteredProducts(filtered);
  }, [sortBy, favorites, validFavorites]);

  // 검색어 변경 처리
  const handleSearchChange = (term) => {
    setSearchTerm(term);
    applyFiltersAndSearch(products, activeFilter, term, sortBy);
  };

  // 정렬 변경 처리
  const handleSortChange = (sort) => {
    console.log('📊 Sort changed to:', sort);
    setSortBy(sort);
    applyFiltersAndSearch(products, activeFilter, searchTerm, sort);
  };

  // 필터 변경
  const handleFilterChange = (filter) => {
    console.log('🔄 Filter changed to:', filter);
    setActiveFilter(filter);
    
    // favorites 필터는 useEffect에서 처리하므로 여기서는 제외
    if (filter !== 'favorites') {
      applyFiltersAndSearch(products, filter, searchTerm, sortBy);
    }
    
    // URL 업데이트 (브라우저 히스토리에 추가하지 않고 현재 URL만 변경)
    const url = new URL(window.location);
    if (filter === 'all') {
      url.searchParams.delete('filter');
    } else {
      url.searchParams.set('filter', filter);
    }
    window.history.replaceState({}, '', url);
  };

  useEffect(() => {
    fetchProducts();
    
    // URL 쿼리 파라미터에서 초기 필터 설정
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter');
    console.log('🔗 URL filter parameter:', filterParam);
    if (filterParam && ['all', 'digital', 'furniture', 'favorites'].includes(filterParam)) {
      setActiveFilter(filterParam);
    }
  }, [fetchProducts]);

  // favorites가 변경되거나 products가 로드될 때 관심상품 필터 적용
  useEffect(() => {
    if (activeFilter === 'favorites' && products.length > 0 && !favoritesLoading) {
      console.log('🔄 Re-applying favorites filter:', { 
        favorites, 
        favoritesCount,
        productsCount: products.length, 
        activeFilter,
        favoritesLoading
      });
      applyFiltersAndSearch(products, 'favorites', searchTerm, sortBy);
    }
  }, [validFavorites, products, activeFilter, searchTerm, favoritesLoading, applyFiltersAndSearch, sortBy]);

  // products가 로드되고 activeFilter가 설정된 후 일반 필터 적용
  useEffect(() => {
    if (products.length > 0 && activeFilter !== 'favorites') {
      console.log('🔄 Applying general filter:', { activeFilter, productsCount: products.length });
      applyFiltersAndSearch(products, activeFilter, searchTerm, sortBy);
    }
  }, [products, activeFilter, searchTerm, sortBy, applyFiltersAndSearch]);

  if (loading || (activeFilter === 'favorites' && favoritesLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <button 
              onClick={() => router.back()}
              className="text-2xl"
            >
              ←
            </button>
            <h1 className="text-lg font-semibold">상품 둘러보기</h1>
            <div className="w-8"></div> {/* 균형을 위한 빈 공간 */}
          </div>
        </header>

        {/* Loading */}
        <div className="max-w-md mx-auto p-4 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">상품을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <button 
              onClick={() => router.back()}
              className="text-2xl"
            >
              ←
            </button>
            <h1 className="text-lg font-semibold">상품 둘러보기</h1>
            <div className="w-8"></div>
          </div>
        </header>

        {/* Error */}
        <div className="max-w-md mx-auto p-4 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-4xl mb-4">😔</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchProducts}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="text-2xl hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center"
          >
            ←
          </button>
          <div className="text-center">
            <h1 className="text-lg font-semibold">상품 둘러보기</h1>
            {activeFilter === 'favorites' && (
              <p className="text-xs text-gray-500">
                관심상품 {favoritesCount}개 {favoritesLoading ? '(로딩중...)' : ''}
              </p>
            )}
          </div>
          <button 
            onClick={fetchProducts}
            className="text-2xl hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center"
          >
            🔄
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-white border-b sticky top-16 z-10">
        <div className="max-w-md mx-auto p-4">
          <div className="flex gap-3 items-center">
            {/* 검색 입력 */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="상품명, 설명으로 검색..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20 bg-gray-50"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <span className="text-gray-400 text-lg">🔍</span>
              </div>
              {searchTerm && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
            
            {/* 정렬 드롭다운 */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20 cursor-pointer"
              >
                <option value="latest">최신순</option>
                <option value="price_low">가격 낮은순</option>
                <option value="price_high">가격 높은순</option>
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <span className="text-gray-400">▼</span>
              </div>
            </div>
          </div>
          
          {/* 검색 결과 표시 */}
          {searchTerm && (
            <div className="mt-3 text-sm text-gray-600">
              &ldquo;<span className="font-medium text-orange-600">{searchTerm}</span>&rdquo; 검색 결과 {filteredProducts.length}개
            </div>
          )}
          
          {/* 현재 정렬 상태 표시 */}
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>
              전체 {filteredProducts.length}개 상품
            </span>
            <span className="flex items-center gap-1">
              <span>📊</span>
              {sortBy === 'latest' && '최신순'}
              {sortBy === 'price_low' && '가격 낮은순'}
              {sortBy === 'price_high' && '가격 높은순'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b sticky top-40 z-10">
        <div className="max-w-md mx-auto px-4">
          <div className="flex space-x-2 py-3 overflow-x-auto">
            <button 
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            <button 
              onClick={() => handleFilterChange('favorites')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                activeFilter === 'favorites'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>❤️</span>
              관심상품
              {favoritesCount > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                  activeFilter === 'favorites' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {favoritesCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => handleFilterChange('digital')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === 'digital'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              디지털기기
            </button>
            <button 
              onClick={() => handleFilterChange('furniture')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === 'furniture'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              가구/인테리어
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <main className="max-w-md mx-auto p-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            {searchTerm ? (
              <>
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-gray-600 mb-4">
                  &ldquo;<span className="font-medium text-orange-600">{searchTerm}</span>&rdquo; 검색 결과가 없어요
                </p>
                <p className="text-sm text-gray-500 mb-4">다른 검색어를 시도해보세요</p>
                <button
                  onClick={() => handleSearchChange('')}
                  className="text-orange-500 hover:text-orange-600 font-medium"
                >
                  검색어 지우기
                </button>
              </>
            ) : activeFilter === 'favorites' ? (
              <>
                <div className="text-4xl mb-4">❤️</div>
                <p className="text-gray-600 mb-4">아직 관심상품이 없어요</p>
                <p className="text-sm text-gray-500 mb-6">마음에 드는 상품의 하트 버튼을 눌러보세요!</p>
                <button
                  onClick={() => handleFilterChange('all')}
                  className="bg-orange-500 text-white px-6 py-3 rounded-lg font-medium inline-block hover:bg-orange-600"
                >
                  전체 상품 보기
                </button>
              </>
            ) : activeFilter === 'digital' ? (
              <>
                <div className="text-4xl mb-4">📱</div>
                <p className="text-gray-600 mb-4">디지털기기 상품이 없어요</p>
                <p className="text-sm text-gray-500">다른 카테고리를 확인해보세요</p>
              </>
            ) : activeFilter === 'furniture' ? (
              <>
                <div className="text-4xl mb-4">🪑</div>
                <p className="text-gray-600 mb-4">가구/인테리어 상품이 없어요</p>
                <p className="text-sm text-gray-500">다른 카테고리를 확인해보세요</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-4">🛍️</div>
                <p className="text-gray-600 mb-4">아직 등록된 상품이 없어요</p>
                <p className="text-sm text-gray-500 mb-6">첫 번째 상품을 등록해보세요!</p>
                <Link 
                  href="/sell"
                  className="bg-orange-500 text-white px-6 py-3 rounded-lg font-medium inline-block hover:bg-orange-600"
                >
                  상품 등록하기
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product}
                seller={product.seller}
              />
            ))}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto px-4 py-2">
          <div className="flex justify-around">
            <Link href="/" className="flex flex-col items-center py-2 text-gray-400 hover:text-orange-500">
              <div className="text-xl">🏠</div>
              <span className="text-xs">홈</span>
            </Link>
            <Link href="/products" className="flex flex-col items-center py-2 text-orange-500">
              <div className="text-xl">🛍️</div>
              <span className="text-xs">상품</span>
            </Link>
            <Link href="/sell" className="flex flex-col items-center py-2 text-gray-400 hover:text-orange-500">
              <div className="text-xl">➕</div>
              <span className="text-xs">판매</span>
            </Link>
            <div className="flex flex-col items-center py-2 text-gray-400">
              <div className="text-xl">💬</div>
              <span className="text-xs">채팅</span>
            </div>
            <Link href="/profile" className="flex flex-col items-center py-2 text-gray-400 hover:text-orange-500">
              <div className="text-xl">👤</div>
              <span className="text-xs">프로필</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
