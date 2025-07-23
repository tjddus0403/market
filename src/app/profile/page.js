'use client';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { supabase } from '../../lib/supabase';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { favoritesCount, refreshFavorites } = useFavorites();
  const [myProductsCount, setMyProductsCount] = useState(0);

  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // 내가 올린 상품 개수 가져오기
  const fetchMyProductsCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { count, error } = await supabase
        .from('market')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching my products count:', error);
        return;
      }

      setMyProductsCount(count || 0);

    } catch (error) {
      console.error('Unexpected error:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchMyProductsCount();
      // 프로필 페이지 로드 시 관심상품 정리 (한 번만 실행)
      refreshFavorites();
    }
  }, [user?.id, fetchMyProductsCount]); // refreshFavorites 제거

  const handleSignOut = async () => {
    const confirmed = window.confirm('정말 로그아웃 하시겠습니까?');
    if (confirmed) {
      const { error } = await signOut();
      if (error) {
        alert('로그아웃 중 오류가 발생했습니다.');
      } else {
        router.push('/');
      }
    }
  };

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link 
            href="/"
            className="text-2xl hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center"
          >
            ←
          </Link>
          <h1 className="text-lg font-semibold">내 프로필</h1>
          <Link 
            href="/profile/edit"
            className="text-sm text-orange-500 font-medium hover:text-orange-600"
          >
            수정
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* 프로필 카드 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-orange-200 rounded-full flex items-center justify-center">
              {user.avatar_url ? (
                <Image 
                  src={user.avatar_url} 
                  alt={user.nickname}
                  width={80}
                  height={80}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-orange-600 font-bold text-2xl">
                  {user.nickname?.[0] || '🥕'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800 mb-1">
                {user.nickname}
              </h2>
              <p className="text-gray-600 flex items-center gap-1">
                <span>📍</span>
                {user.location}
              </p>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <span>⭐</span>
                  {user.rating || 5.0}
                </span>
                <span className="flex items-center gap-1">
                  <span>🤝</span>
                  거래 {user.trade_count || 0}회
                </span>
              </div>
            </div>
          </div>

          {/* 프로필 통계 */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{user.trade_count || 0}</div>
              <div className="text-sm text-gray-600">거래완료</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{favoritesCount}</div>
              <div className="text-sm text-gray-600">관심상품</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{user.rating || 5.0}</div>
              <div className="text-sm text-gray-600">평점</div>
            </div>
          </div>
        </div>

        {/* 계정 정보 */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-3">계정 정보</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">이메일</span>
              <span className="text-gray-800">{user.email}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">가입일</span>
              <span className="text-gray-800">
                {user.created_at 
                  ? new Date(user.created_at).toLocaleDateString('ko-KR')
                  : '정보 없음'
                }
              </span>
            </div>
          </div>
        </div>

        {/* 내 활동 */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-3">내 활동</h3>
          <div className="space-y-1">
            <div className="flex items-center justify-between py-3 px-2">
              <Link 
                href="/products?filter=favorites"
                className="flex-1 flex items-center justify-between hover:bg-gray-50 rounded-lg py-1"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">❤️</span>
                  <span className="text-gray-800">관심상품</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{favoritesCount}개</span>
                  <span className="text-gray-400">→</span>
                </div>
              </Link>
              <button
                onClick={async () => {
                  console.log('🧹 Manual favorites cleanup triggered');
                  await refreshFavorites();
                }}
                className="ml-2 text-xs text-gray-400 hover:text-orange-500 px-2 py-1 rounded"
                title="삭제된 상품 정리"
              >
                🧹
              </button>
            </div>
            <Link 
              href="/my-products"
              className="flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg px-2"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">📦</span>
                <span className="text-gray-800">내가 올린 상품</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{myProductsCount}개</span>
                <span className="text-gray-400">→</span>
              </div>
            </Link>
            <div className="flex items-center justify-between py-3 px-2">
              <div className="flex items-center gap-3">
                <span className="text-xl">💬</span>
                <span className="text-gray-800">채팅</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">준비중</span>
                <span className="text-gray-400">→</span>
              </div>
            </div>
          </div>
        </div>

        {/* 설정 */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-3">설정</h3>
          <div className="space-y-1">
            <Link 
              href="/profile/edit"
              className="flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg px-2"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">✏️</span>
                <span className="text-gray-800">프로필 수정</span>
              </div>
              <span className="text-gray-400">→</span>
            </Link>
            <div className="flex items-center justify-between py-3 px-2">
              <div className="flex items-center gap-3">
                <span className="text-xl">🔔</span>
                <span className="text-gray-800">알림 설정</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">준비중</span>
                <span className="text-gray-400">→</span>
              </div>
            </div>
          </div>
        </div>

        {/* 로그아웃 버튼 */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium"
          >
            <span className="text-xl">🚪</span>
            로그아웃
          </button>
        </div>

        {/* 앱 정보 */}
        <div className="text-center text-gray-400 text-sm">
          <p>당근마켓 클론 v1.0</p>
          <p className="mt-1">우리 동네 중고거래</p>
        </div>
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
            <Link href="/profile" className="flex flex-col items-center py-2 text-orange-500">
              <div className="text-xl">👤</div>
              <span className="text-xs">프로필</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
} 