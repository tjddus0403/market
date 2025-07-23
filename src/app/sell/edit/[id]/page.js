'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../contexts/AuthContext';

export default function EditProductPage({ params }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    images: [],
    tradeType: 'sell' // 'sell' or 'share'
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const productId = use(params).id;

  // 로그인 확인
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // 기존 상품 정보 불러오기
  useEffect(() => {
    const fetchProduct = async () => {
      if (!user?.id || !productId) return;

      try {
        setLoading(true);
        setError(null);

        console.log('📝 Fetching product for edit:', productId);

        const { data: productData, error } = await supabase
          .from('market')
          .select('*')
          .eq('id', productId)
          .eq('user_id', user.id) // 본인 상품만 수정 가능
          .single();

        if (error) {
          console.error('Error fetching product:', error);
          if (error.code === 'PGRST116') {
            setError('상품을 찾을 수 없거나 수정 권한이 없습니다.');
          } else {
            setError('상품 정보를 불러올 수 없습니다.');
          }
          return;
        }

        if (!productData) {
          setError('상품을 찾을 수 없습니다.');
          return;
        }

        // 폼 데이터 설정
        setFormData({
          title: productData.title || '',
          description: productData.description || '',
          price: productData.trade_type === 'share' ? '' : (productData.price?.toString() || ''),
          images: productData.image ? [productData.image] : [],
          tradeType: productData.trade_type || 'sell'
        });

        console.log('📝 Product data loaded for editing:', productData);

      } catch (error) {
        console.error('Unexpected error:', error);
        setError('예상치 못한 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchProduct();
    }
  }, [user?.id, productId]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (formData.images.length + files.length > 10) {
      alert('최대 10장까지 업로드 가능합니다.');
      return;
    }
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, e.target.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('로그인이 필요합니다.');
      router.push('/auth/login');
      return;
    }

    if (!formData.title || !formData.description) {
      alert('제목과 설명을 입력해주세요.');
      return;
    }
    
    // 판매하기인 경우에만 가격 검증
    if (formData.tradeType === 'sell' && (!formData.price || formData.price <= 0)) {
      alert('올바른 가격을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('📝 Updating product:', {
        id: productId,
        title: formData.title,
        description: formData.description,
        price: formData.tradeType === 'share' ? 0 : parseInt(formData.price),
        image: formData.images[0] || '/iphone.jpg',
        trade_type: formData.tradeType
      });

      // Supabase에 상품 데이터 업데이트
      const { data, error } = await supabase
        .from('market')
        .update({
          title: formData.title,
          description: formData.description,
          price: formData.tradeType === 'share' ? 0 : parseInt(formData.price),
          image: formData.images[0] || '/iphone.jpg',
          trade_type: formData.tradeType
        })
        .eq('id', productId)
        .eq('user_id', user.id) // 본인 상품만 수정 가능
        .select();

      if (error) {
        console.error('Error updating product:', error);
        alert('상품 수정 중 오류가 발생했습니다: ' + error.message);
        return;
      }

      console.log('✅ Product updated successfully:', data);
      alert('상품이 성공적으로 수정되었습니다!');
      
      // 내가 올린 상품 페이지로 이동
      router.push('/my-products');

    } catch (error) {
      console.error('Unexpected error:', error);
      alert('예상치 못한 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 로딩 중
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">상품 정보를 불러오는 중...</p>
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
          <button 
            onClick={() => router.push('/auth/login')}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😞</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => router.back()}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg font-medium mr-2"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="text-2xl hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center"
          >
            ←
          </button>
          <h1 className="text-lg font-semibold">상품 수정</h1>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              isSubmitting 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            {isSubmitting ? '수정중...' : '완료'}
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* 거래 유형 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              거래 유형
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, tradeType: 'sell', price: '' }))}
                className={`flex-1 p-3 rounded-lg border-2 font-medium transition-colors ${
                  formData.tradeType === 'sell'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                💰 판매하기
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, tradeType: 'share', price: '' }))}
                className={`flex-1 p-3 rounded-lg border-2 font-medium transition-colors ${
                  formData.tradeType === 'share'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                🎁 나눔하기
              </button>
            </div>
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="상품 제목을 입력하세요"
              maxLength={100}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20"
              required
            />
          </div>

          {/* 가격 (판매하기인 경우에만) */}
          {formData.tradeType === 'sell' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                가격 *
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="가격을 입력하세요"
                  min="0"
                  className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20"
                  required
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">원</span>
              </div>
            </div>
          )}

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상품 설명 *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="상품에 대해 자세히 설명해주세요"
              rows={6}
              maxLength={1000}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20 resize-none"
              required
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {formData.description.length}/1000
            </div>
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상품 이미지 (최대 10장)
            </label>
            
            {/* 이미지 미리보기 */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={image}
                      alt={`상품 이미지 ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 이미지 업로드 버튼 */}
            {formData.images.length < 10 && (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className="text-2xl mb-2">📷</div>
                  <p className="text-sm text-gray-500">클릭해서 사진 추가</p>
                  <p className="text-xs text-gray-400">({formData.images.length}/10)</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* 수정 완료 버튼 */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 rounded-lg font-medium text-lg transition-colors ${
              isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            {isSubmitting ? '수정 중...' : '수정 완료'}
          </button>
        </form>
      </main>
    </div>
  );
} 