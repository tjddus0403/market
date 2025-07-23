'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { supabase } from '../../lib/supabase';
import ProductCard from '../components/ProductCard';

export default function MyProductsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { refreshFavorites } = useFavorites();
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // 내가 올린 상품 목록 불러오기
  const fetchMyProducts = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // 현재 사용자가 올린 상품들만 조회
      const { data: productsData, error } = await supabase
        .from('market')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching my products:', error);
        setError('상품을 불러올 수 없습니다.');
        return;
      }

      setMyProducts(productsData || []);

    } catch (error) {
      console.error('Unexpected error:', error);
      setError('예상치 못한 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // 상품 삭제 함수
  const handleDeleteProduct = async (productId, productTitle) => {
    const confirmed = window.confirm(`"${productTitle}" 상품을 정말 삭제하시겠습니까?`);
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('market')
        .delete()
        .eq('id', productId)
        .eq('user_id', user.id); // 본인 상품만 삭제 가능

      if (error) {
        console.error('Error deleting product:', error);
        alert('상품 삭제 중 오류가 발생했습니다.');
        return;
      }

      alert('상품이 삭제되었습니다.');
      // 상품 목록에서 삭제된 상품 제거
      setMyProducts(prev => prev.filter(product => product.id !== productId));
      
      // 관심상품 목록 정리 (삭제된 상품이 관심상품에 있던 경우)
      await refreshFavorites();

    } catch (error) {
      console.error('Unexpected error during deletion:', error);
      alert('예상치 못한 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchMyProducts();
    }
  }, [user?.id, fetchMyProducts]);

  // 로딩 중
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">상품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 사용자
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-gray-600 mb-4">로그인이 필요합니다.</p>
          <Link 
            href="/auth/login"
            className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium"
          >
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <button 
              onClick={() => router.back()}
              className="text-2xl hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ←
            </button>
            <h1 className="text-lg font-semibold">내가 올린 상품</h1>
            <div className="w-8"></div>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="text-4xl mb-4">😞</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={fetchMyProducts}
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
            <h1 className="text-lg font-semibold">내가 올린 상품</h1>
            <p className="text-xs text-gray-500">총 {myProducts.length}개</p>
          </div>
          <Link 
            href="/sell"
            className="text-2xl hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center"
          >
            ➕
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        {myProducts.length === 0 ? (
          // 빈 상태
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="text-4xl mb-4">📦</div>
              <p className="text-gray-600 mb-4">아직 올린 상품이 없어요</p>
              <p className="text-sm text-gray-500 mb-6">첫 번째 상품을 등록해보세요!</p>
              <Link
                href="/sell"
                className="bg-orange-500 text-white px-6 py-3 rounded-lg font-medium inline-block hover:bg-orange-600"
              >
                상품 등록하기
              </Link>
            </div>
          </div>
        ) : (
          // 상품 목록
          <div className="space-y-4">
            {myProducts.map((product) => (
              <div key={product.id} className="relative">
                <ProductCard 
                  product={product}
                  seller={{
                    nickname: user.nickname,
                    location: user.location,
                    rating: user.rating || 5.0
                  }}
                />
                
                {/* 관리 버튼들 */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Link
                    href={`/sell/edit/${product.id}`}
                    className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-600 w-8 h-8 rounded-full flex items-center justify-center shadow-sm border text-sm"
                    title="수정"
                  >
                    ✏️
                  </Link>
                  <button
                    onClick={() => handleDeleteProduct(product.id, product.title)}
                    className="bg-white bg-opacity-90 hover:bg-opacity-100 text-red-500 w-8 h-8 rounded-full flex items-center justify-center shadow-sm border text-sm"
                    title="삭제"
                  >
                    🗑️
                  </button>
                </div>
              </div>
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
            <Link href="/products" className="flex flex-col items-center py-2 text-gray-400 hover:text-orange-500">
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