'use client';
import Link from "next/link";
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-orange-500">🥕 당근마켓</h1>
          
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                안녕하세요, {user.nickname}님!
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link 
                href="/auth/login"
                className="text-sm bg-white border border-orange-500 text-orange-500 px-3 py-1.5 rounded font-medium hover:bg-orange-50"
              >
                로그인
              </Link>
              <Link 
                href="/auth/signup"
                className="text-sm bg-orange-500 text-white px-3 py-1.5 rounded font-medium hover:bg-orange-600"
              >
                회원가입
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-4 space-y-4">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {user ? `${user.nickname}님, 안녕하세요!` : '안녕하세요!'}
          </h2>
          <p className="text-gray-600">우리 동네 중고거래 당근마켓</p>
          
          <div className="space-y-3">
            {user ? (
              <>
                <Link 
                  href="/sell"
                  className="block w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-medium text-center hover:bg-orange-600 transition-colors"
                >
                  내 물건 팔기
                </Link>
                
                <Link 
                  href="/products"
                  className="block w-full bg-white border-2 border-orange-500 text-orange-500 py-3 px-4 rounded-lg font-medium text-center hover:bg-orange-50 transition-colors"
                >
                  상품 둘러보기
                </Link>
              </>
            ) : (
              <>
                <div className="bg-gray-100 text-gray-500 py-3 px-4 rounded-lg font-medium text-center">
                  로그인 후 상품을 등록할 수 있습니다
                </div>
                
                <Link 
                  href="/products"
                  className="block w-full bg-white border-2 border-orange-500 text-orange-500 py-3 px-4 rounded-lg font-medium text-center hover:bg-orange-50 transition-colors"
                >
                  상품 둘러보기
                </Link>
              </>
            )}
          </div>
        </div>

        {/* User Info Card (if logged in) */}
        {user && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-semibold text-gray-800 mb-3">내 정보</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.nickname}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-orange-600 font-bold">
                    {user.nickname?.[0] || '🥕'}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{user.nickname}</p>
                <p className="text-sm text-gray-500">{user.location}</p>
                <p className="text-sm text-gray-500">
                  ⭐ {user.rating} • 거래 {user.trade_count}회
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Feature Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl mb-2">🏠</div>
            <h3 className="font-semibold text-gray-800">우리동네</h3>
            <p className="text-sm text-gray-600">가까운 이웃과 거래</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl mb-2">💰</div>
            <h3 className="font-semibold text-gray-800">안전거래</h3>
            <p className="text-sm text-gray-600">믿을 수 있는 거래</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-lg shadow-sm p-6 text-white">
          <h3 className="text-lg font-semibold mb-3">이번 주 거래 현황</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">12</div>
              <div className="text-sm opacity-90">판매완료</div>
            </div>
            <div>
              <div className="text-2xl font-bold">8</div>
              <div className="text-sm opacity-90">구매완료</div>
            </div>
            <div>
              <div className="text-2xl font-bold">5</div>
              <div className="text-sm opacity-90">관심상품</div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto px-4 py-2">
          <div className="flex justify-around">
            <Link href="/" className="flex flex-col items-center py-2 text-orange-500">
              <div className="text-xl">🏠</div>
              <span className="text-xs">홈</span>
            </Link>
            <Link href="/products" className="flex flex-col items-center py-2 text-gray-400">
              <div className="text-xl">🛍️</div>
              <span className="text-xs">상품</span>
            </Link>
            {user ? (
              <Link href="/sell" className="flex flex-col items-center py-2 text-gray-400">
                <div className="text-xl">➕</div>
                <span className="text-xs">판매</span>
              </Link>
            ) : (
              <div className="flex flex-col items-center py-2 text-gray-300">
                <div className="text-xl">➕</div>
                <span className="text-xs">판매</span>
              </div>
            )}
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
