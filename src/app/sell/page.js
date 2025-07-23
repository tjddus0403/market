'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function SellPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    images: [],
    tradeType: 'sell' // 'sell' or 'share'
  });
  const [aiWriting, setAiWriting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 로그인 확인
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

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
      console.log('📝 상품 등록 데이터:', {
        title: formData.title,
        description: formData.description,
        price: formData.tradeType === 'share' ? 0 : parseInt(formData.price),
        image_url: formData.images[0] ? formData.images[0].substring(0, 50) + '...' : '/iphone.jpg',
        trade_type: formData.tradeType,
        user_id: user.id,
        images_count: formData.images.length
      });

      // Supabase에 상품 데이터 저장
      const { data, error } = await supabase
        .from('market')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            price: formData.tradeType === 'share' ? 0 : parseInt(formData.price),
            image: formData.images[0] || '/iphone.jpg',
            trade_type: formData.tradeType,
            user_id: user.id // 커스텀 user 테이블의 ID 사용
          }
        ])
        .select();

      if (error) {
        console.error('Error inserting product:', error);
        alert('상품 등록 중 오류가 발생했습니다: ' + error.message);
        return;
      }

      console.log('상품 등록 성공:', data);
      alert('상품이 성공적으로 등록되었습니다!');
      
      // 폼 초기화
      setFormData({
        title: '',
        description: '',
        price: '',
        images: [],
        tradeType: 'sell'
      });
      
      // 상품 목록 페이지로 이동
      router.push('/products');

    } catch (error) {
      console.error('Unexpected error:', error);
      alert('예상치 못한 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addFrequentPhrase = (phrase) => {
    setFormData(prev => ({
      ...prev,
      description: prev.description + (prev.description ? '\n' : '') + phrase
    }));
  };

  // 로딩 중이거나 로그인하지 않은 경우
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-gray-600 mb-4">로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="text-2xl"
          disabled={isSubmitting}
        >
          ✕
        </button>
        <h1 className="text-lg font-semibold">내 물건 팔기</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {user.nickname}
          </span>
          <button 
            onClick={handleSubmit}
            className="text-orange-500 font-medium"
            disabled={isSubmitting}
          >
            임시저장
          </button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* AI 작성하기 */}
        <div className="bg-purple-100 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded">Beta</span>
            <span className="font-medium">AI로 작성하기</span>
          </div>
          <button
            type="button"
            onClick={() => setAiWriting(!aiWriting)}
            disabled={isSubmitting}
            className={`w-12 h-6 rounded-full transition-colors ${
              aiWriting ? 'bg-purple-600' : 'bg-gray-300'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              aiWriting ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {/* 이미지 업로드 */}
        <div>
          <div className="grid grid-cols-3 gap-2">
            <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer bg-gray-50">
              <div className="text-2xl text-gray-400">📷</div>
              <div className="text-sm text-gray-500 mt-1">
                {formData.images.length}/10
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isSubmitting}
              />
            </label>
            
            {formData.images.map((image, index) => (
              <div key={index} className="relative aspect-square">
                <img 
                  src={image} 
                  alt={`업로드된 이미지 ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  disabled={isSubmitting}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium mb-2">제목</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="글 제목"
            className="w-full p-3 border rounded-lg bg-gray-50"
            disabled={isSubmitting}
            required
          />
        </div>

        {/* 자세한 설명 */}
        <div>
          <label className="block text-sm font-medium mb-2">자세한 설명</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="함정동에 올릴 게시글 내용을 작성해 주세요.&#10;(판매 금지 물품은 게시가 제한될 수 있어요.)&#10;&#10;신뢰할 수 있는 거래를 위해 자세히 적어주세요. 과학기술정보통신부, 한국 인터넷진흥원과 함께 해요."
            className="w-full p-3 border rounded-lg bg-gray-50 h-32 resize-none"
            disabled={isSubmitting}
            required
          />
          
          {/* 자주 쓰는 문구 */}
          <button
            type="button"
            onClick={() => addFrequentPhrase('깨끗하게 사용했습니다.')}
            disabled={isSubmitting}
            className="mt-2 bg-gray-200 px-3 py-1 rounded-full text-sm"
          >
            자주 쓰는 문구
          </button>
        </div>

        {/* 가격 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            가격 {formData.tradeType === 'share' && <span className="text-gray-500">(나눔 상품)</span>}
          </label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            placeholder={formData.tradeType === 'share' ? '나눔 상품 (가격 입력 불필요)' : '가격을 입력해주세요'}
            className={`w-full p-3 border rounded-lg ${
              formData.tradeType === 'share' 
                ? 'bg-gray-100 text-gray-500' 
                : 'bg-gray-50'
            }`}
            disabled={isSubmitting || formData.tradeType === 'share'}
            min="0"
            required={formData.tradeType === 'sell'}
          />
        </div>

        {/* 거래 방식 */}
        <div>
          <label className="block text-sm font-medium mb-3">거래 방식</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, tradeType: 'sell' }))}
              disabled={isSubmitting}
              className={`flex-1 py-3 px-4 rounded-lg border font-medium ${
                formData.tradeType === 'sell'
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-gray-100 text-gray-700 border-gray-300'
              }`}
            >
              판매하기
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, tradeType: 'share' }))}
              disabled={isSubmitting}
              className={`flex-1 py-3 px-4 rounded-lg border font-medium ${
                formData.tradeType === 'share'
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-gray-100 text-gray-700 border-gray-300'
              }`}
            >
              나눠하기
            </button>
          </div>
        </div>

        {/* 작성 완료 버튼 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-4 rounded-lg font-medium text-lg ${
            isSubmitting
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-orange-500 text-white hover:bg-orange-600'
          }`}
        >
          {isSubmitting ? '등록 중...' : '작성 완료'}
        </button>
      </form>
    </div>
  );
} 