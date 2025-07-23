'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useFavorites } from '../../contexts/FavoritesContext';

export default function ProductCard({ product, seller }) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const isLiked = isFavorite(product.id);

  const formatPrice = (price) => {
    if (price && price > 0) {
      return `${price.toLocaleString()}원`;
    }
    return '가격 협의';
  };

  const formatTime = (dateString) => {
    if (!dateString) return '방금 전';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric'
    });
  };

  const handleFavoriteClick = (e) => {
    e.preventDefault(); // Link 클릭 방지
    e.stopPropagation();
    
    console.log('🛍️ ProductCard 찜하기 토글:', {
      productId: product.id,
      currentlyLiked: isLiked
    });
    
    const wasAdded = toggleFavorite(product.id);
    
    // 간단한 피드백
    if (wasAdded) {
      console.log('🛍️ 관심상품에 추가됨');
      // 선택사항: 토스트 메시지 등을 추가할 수 있음
    } else {
      console.log('🛍️ 관심상품에서 제거됨');
    }
  };

  return (
    <div className="relative">
      <Link href={`/products/${product.id}`} className="block">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <div className="flex p-4">
            {/* Product Image */}
            <div className="flex-shrink-0 w-20 h-20 mr-4 relative">
                              <Image 
                  src={product.image || product.image_url || '/placeholder.jpg'} 
                  alt={product.title}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    // 이미지 로드 실패 시 기본 placeholder로 대체
                    e.target.src = '/placeholder.jpg';
                  }}
                />
            </div>
            
            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-base font-semibold text-gray-900 truncate pr-2">
                  {product.title}
                </h3>
              </div>
              
              <div className="mb-1">
                {product.trade_type === 'share' ? (
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
                    🎁 나눔
                  </span>
                ) : product.price && product.price > 0 ? (
                  <p className="text-lg font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </p>
                ) : (
                  <p className="text-sm text-orange-600 font-medium">
                    💬 {formatPrice(product.price)}
                  </p>
                )}
              </div>
              
              <div className="flex items-center text-xs text-gray-500 mb-2">
                <span>{seller?.location || '함정동'}</span>
                <span className="mx-1">•</span>
                <span>{formatTime(product.created_at)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-gray-500">
                  <span>관심 3</span>
                  <span className="mx-1">•</span>
                  <span>채팅 2</span>
                </div>
                
                {seller && (
                  <div className="flex items-center text-xs text-gray-500">
                    <span className="truncate max-w-16">
                      {seller.nickname || '익명'}
                    </span>
                    <span className="ml-1">⭐{seller.rating || 5.0}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* 찜하기 버튼 */}
      <button
        onClick={handleFavoriteClick}
        className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${
          isLiked 
            ? 'bg-red-500 text-white hover:bg-red-600' 
            : 'bg-white text-gray-400 hover:text-red-500 hover:bg-red-50'
        }`}
      >
        {isLiked ? '❤️' : '🤍'}
      </button>
    </div>
  );
} 