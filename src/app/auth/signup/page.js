'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import LocationPicker from '../../../components/LocationPicker';

export default function SignUpPage() {
  const router = useRouter();
  const { user, loading, signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    location: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 이미 로그인한 사용자는 홈으로 리다이렉트
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 비밀번호 길이 확인
    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    // 닉네임 확인
    if (formData.nickname.length < 2) {
      setError('닉네임은 2자 이상이어야 합니다.');
      return;
    }

    // 지역 확인
    if (!formData.location) {
      setError('동네를 선택해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await signUp(
        formData.email, 
        formData.password, 
        formData.nickname,
        formData.location  // 위치 정보 추가
      );

      if (error) {
        setError(error.message);
        return;
      }

      if (data) {
        alert('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
        router.push('/auth/login');
      }

    } catch (error) {
      console.error('Signup error:', error);
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
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

  // 이미 로그인한 사용자
  if (user) {
    return null; // useEffect에서 리다이렉트 처리
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-orange-500 mb-2">🥕</h1>
          <h2 className="text-2xl font-bold text-gray-900">당근마켓</h2>
          <p className="mt-2 text-sm text-gray-600">우리 동네 중고거래</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="이메일을 입력하세요"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
                닉네임
              </label>
              <div className="mt-1">
                <input
                  id="nickname"
                  name="nickname"
                  type="text"
                  required
                  value={formData.nickname}
                  onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="닉네임을 입력하세요"
                  disabled={isSubmitting}
                />
              </div>
            </div>

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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="비밀번호를 입력하세요 (6자 이상)"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                비밀번호 확인
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="비밀번호를 다시 입력하세요"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500'
                }`}
              >
                {isSubmitting ? '가입 중...' : '회원가입'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                이미 계정이 있으신가요?{' '}
                <Link href="/auth/login" className="font-medium text-orange-600 hover:text-orange-500">
                  로그인하기
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 