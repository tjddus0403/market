'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import LocationPicker from '../../../components/LocationPicker';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, loading, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    nickname: '',
    location: '',
    avatar_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // 사용자 정보로 폼 초기화
  useEffect(() => {
    if (user) {
      setFormData({
        nickname: user.nickname || '',
        location: user.location || '',
        avatar_url: user.avatar_url || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setError('');

    // 사용자 로그인 확인
    if (!user) {
      setError('로그인이 필요합니다.');
      return;
    }

    // 닉네임 검증
    if (!formData.nickname || formData.nickname.trim().length < 2) {
      setError('닉네임은 2자 이상이어야 합니다.');
      return;
    }

    // 위치 검증
    if (!formData.location || formData.location.trim().length === 0) {
      setError('지역을 선택해주세요.');
      return;
    }

    // 변경사항이 있는지 확인
    const hasChanges = 
      formData.nickname !== user.nickname ||
      formData.location !== user.location ||
      formData.avatar_url !== (user.avatar_url || '');

    if (!hasChanges) {
      alert('변경된 내용이 없습니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await updateProfile({
        nickname: formData.nickname,
        location: formData.location,
        avatar_url: formData.avatar_url || null
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data) {
        alert('프로필이 성공적으로 수정되었습니다!');
        router.push('/profile');
      }

    } catch (error) {
      console.error('Profile update error:', error);
      setError('프로필 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 헤더 저장 버튼용 핸들러
  const handleHeaderSave = () => {
    handleSubmit();
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
    return null; // useEffect에서 리다이렉트 처리
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="text-2xl hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center"
            disabled={isSubmitting}
          >
            ←
          </button>
          <h1 className="text-lg font-semibold">프로필 수정</h1>
          <button
            onClick={handleHeaderSave}
            disabled={isSubmitting}
            className={`text-sm font-medium ${
              isSubmitting 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-orange-500 hover:text-orange-600'
            }`}
          >
            {isSubmitting ? '저장 중...' : '저장'}
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          {/* 프로필 이미지 섹션 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4">프로필 사진</h3>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-orange-200 rounded-full flex items-center justify-center">
                {formData.avatar_url ? (
                  <Image 
                    src={formData.avatar_url} 
                    alt="프로필"
                    width={80}
                    height={80}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-orange-600 font-bold text-2xl">
                    {formData.nickname?.[0] || '🥕'}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="url"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                  placeholder="프로필 이미지 URL (선택사항)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  이미지 URL을 입력하거나 비워두면 기본 이미지가 사용됩니다
                </p>
              </div>
            </div>
          </div>

          {/* 기본 정보 */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-gray-800 mb-4">기본 정보</h3>
            
            {/* 닉네임 */}
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
                닉네임
              </label>
              <input
                id="nickname"
                type="text"
                required
                value={formData.nickname}
                onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20"
                placeholder="닉네임을 입력하세요"
                disabled={isSubmitting}
              />
            </div>

            {/* 위치 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                우리 동네
              </label>
              <LocationPicker
                currentLocation={formData.location}
                onLocationChange={(location) => setFormData(prev => ({ ...prev, location }))}
              />
              <p className="mt-1 text-xs text-gray-500">
                서울 또는 경기도 지역을 선택해주세요
              </p>
            </div>

            {/* 읽기 전용 정보 */}
            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-3">계정 정보</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">이메일</span>
                  <span className="text-gray-800">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">평점</span>
                  <span className="text-gray-800">⭐ {user.rating || 5.0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">거래 수</span>
                  <span className="text-gray-800">{user.trade_count || 0}회</span>
                </div>
                <div className="flex justify-between">
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
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 저장 버튼 */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-lg font-medium ${
              isSubmitting
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            {isSubmitting ? '저장 중...' : '변경사항 저장'}
          </button>
        </form>

        {/* 안내 메시지 */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 안내:</strong> 프로필 정보는 다른 사용자들에게 공개됩니다. 
            거래 시 신뢰도를 높이기 위해 정확한 정보를 입력해주세요.
          </p>
        </div>
      </main>
    </div>
  );
} 