'use client';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useFavorites } from '../../../contexts/FavoritesContext';
import { supabase } from '../../../lib/supabase';

export default function ProductDetailPage({ params }) {
  const router = useRouter();
  const { user, getComments, createComment, deleteComment, updateComment } = useAuth();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [commentsError, setCommentsError] = useState(null);

  const productId = params.id;

  // 로컬 상태 대신 Context의 isFavorite 직접 사용
  const isProductFavorite = isFavorite(productId);

  useEffect(() => {
    if (productId) {
      fetchProduct();
      fetchComments();
    }
  }, [productId, fetchProduct, fetchComments]);

  const fetchProduct = useCallback(async () => {
    try {
      // 상품 정보 가져오기
      const { data: productData, error: productError } = await supabase
        .from('market')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) {
        console.error('Product fetch error:', productError);
        setError('상품을 찾을 수 없습니다.');
        return;
      }

      console.log('📦 상품 데이터 로드:', {
        id: productData.id,
        title: productData.title,
        image_url: productData.image_url ? productData.image_url.substring(0, 50) + '...' : 'null',
        image: productData.image ? productData.image.substring(0, 50) + '...' : 'null'
      });

      setProduct(productData);

      // 판매자 정보 별도로 가져오기
      if (productData.user_id) {
        const { data: sellerData, error: sellerError } = await supabase
          .from('users')
          .select('id, nickname, avatar_url, location, rating, trade_count')
          .eq('id', productData.user_id)
          .single();

        if (sellerError) {
          console.error('Seller fetch error:', sellerError);
          // 판매자 정보를 가져올 수 없어도 상품은 표시
          setSeller({
            nickname: '알 수 없음',
            location: '위치 정보 없음',
            rating: 0,
            trade_count: 0
          });
        } else {
          setSeller(sellerData);
        }
      }

    } catch (error) {
      console.error('Fetch error:', error);
      setError('상품 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const fetchComments = useCallback(async () => {
    const { data, error } = await getComments(productId);
    if (error) {
      console.error('Comments fetch error:', error);
      
      // 테이블이 없는 경우 사용자에게 알림
      if (error.needsManualSetup) {
        console.log('💡 댓글 테이블 설정이 필요합니다.');
        // 에러는 로그만 남기고 UI에서는 안내 메시지 표시
      }
    } else {
      setComments(data);
    }
  }, [getComments, productId]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    console.log('💬 Comment submission started:', {
      productId,
      comment: newComment,
      user: user?.nickname
    });

    setCommentLoading(true);
    const { data, error } = await createComment(productId, newComment);
    
    if (error) {
      console.error('Comment submission error:', error);
      
      if (error.needsManualSetup) {
        // 사용자 친화적인 설정 안내
        const confirmSetup = window.confirm(
          '댓글 기능을 사용하려면 데이터베이스 설정이 필요합니다.\n\n' +
          '설정 방법을 확인하시겠습니까?'
        );
        
        if (confirmSetup) {
          alert(
            '📋 댓글 테이블 설정 방법:\n\n' +
            '1. Supabase Dashboard에 로그인\n' +
            '2. SQL Editor 메뉴 클릭\n' +
            '3. 아래 SQL 코드를 복사해서 실행:\n\n' +
            'CREATE TABLE comments (\n' +
            '  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n' +
            '  product_id UUID NOT NULL,\n' +
            '  user_id UUID NOT NULL,\n' +
            '  content TEXT NOT NULL,\n' +
            '  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n' +
            '  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n' +
            ');\n\n' +
            'ALTER TABLE comments DISABLE ROW LEVEL SECURITY;\n\n' +
            '4. 실행 후 페이지를 새로고침하세요!'
          );
        }
      } else {
        alert(error.message || '댓글 작성 중 오류가 발생했습니다.');
      }
    } else {
      setComments(prev => [...prev, data]);
      setNewComment('');
      console.log('Comment added successfully:', data);
    }
    setCommentLoading(false);
  };

  const handleCommentDelete = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;

    const { error } = await deleteComment(commentId);
    if (error) {
      alert(error.message);
    } else {
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    }
  };

  const handleCommentEdit = (comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const handleCommentUpdate = async (commentId) => {
    if (!editContent.trim()) return;

    const { data, error } = await updateComment(commentId, editContent);
    if (error) {
      alert(error.message);
    } else {
      setComments(prev => prev.map(comment => 
        comment.id === commentId ? data : comment
      ));
      setEditingComment(null);
      setEditContent('');
    }
  };

  const handleFavoriteClick = () => {
    console.log('🔍 ProductDetail 찜하기 토글:', {
      productId: productId,
      currentlyLiked: isProductFavorite
    });
    
    const wasAdded = toggleFavorite(productId);
    
    // 간단한 피드백
    if (wasAdded) {
      console.log('🔍 관심상품에 추가됨');
      // 선택사항: 토스트 메시지 등을 추가할 수 있음
    } else {
      console.log('🔍 관심상품에서 제거됨');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">상품 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😞</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => router.back()}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">상품을 찾을 수 없습니다.</p>
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
          <h1 className="text-lg font-semibold">상품 상세</h1>
          <button
            onClick={handleFavoriteClick}
            className={`text-2xl w-8 h-8 rounded-full flex items-center justify-center ${
              isProductFavorite 
                ? 'text-red-500 hover:bg-red-50' 
                : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            {isProductFavorite ? '❤️' : '🤍'}
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto">
        {/* 상품 이미지 */}
        <div className="aspect-square bg-gray-200 relative">
          {(product.image || product.image_url) ? (
            <Image 
              src={product.image || product.image_url}
              alt={product.title}
              fill
              className="object-cover"
              onError={(e) => {
                // 이미지 로드 실패 시 부모 요소를 숨기고 fallback 표시
                e.target.parentElement.innerHTML = '<div class="flex items-center justify-center h-full"><span class="text-4xl">📦</span></div>';
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-4xl">📦</span>
            </div>
          )}
        </div>

        {/* 상품 정보 */}
        <div className="bg-white p-4 space-y-4">
          {/* 제목 */}
          <h1 className="text-xl font-bold text-gray-800">
            {product.title}
          </h1>

          {/* 가격 섹션 */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {product.trade_type === 'share' ? (
                <div className="inline-flex items-center px-3 py-2 bg-green-100 text-green-800 text-lg font-semibold rounded-lg">
                  <span className="mr-1">🎁</span>
                  나눔
                </div>
              ) : product.price && product.price > 0 ? (
                <div className="text-2xl font-bold text-gray-900">
                  {product.price.toLocaleString()}원
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-lg text-gray-600">가격 협의 가능</div>
                  <button 
                    onClick={() => {
                      if (seller?.nickname) {
                        alert(`${seller.nickname}님에게 가격 문의하기\n(실제 연락 기능은 구현 예정)`);
                      } else {
                        alert('판매자 정보를 불러오는 중입니다.');
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <span className="mr-1">💬</span>
                    가격 문의하기
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 카테고리 */}
          {product.category && (
            <div className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded">
              {product.category}
            </div>
          )}

          {/* 설명 */}
          {product.description && (
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          )}

          {/* 게시 시간 */}
          <div className="text-sm text-gray-500">
            {product.created_at 
              ? new Date(product.created_at).toLocaleDateString('ko-KR') + ' ' + 
                new Date(product.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
              : '게시 시간 정보 없음'
            }
          </div>
        </div>

        {/* 판매자 정보 */}
        {seller && (
          <div className="bg-white mt-2 p-4">
            <h3 className="font-semibold text-gray-800 mb-3">판매자 정보</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                {seller.avatar_url ? (
                  <img 
                    src={seller.avatar_url} 
                    alt={seller.nickname}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-orange-600 font-bold">
                    {seller.nickname?.[0] || '🥕'}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">{seller.nickname}</div>
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  <span>📍</span>
                  {seller.location}
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <span>⭐</span>
                    {seller.rating || 5.0}
                  </span>
                  <span className="flex items-center gap-1">
                    <span>🤝</span>
                    거래 {seller.trade_count || 0}회
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 댓글 섹션 */}
        <div className="bg-white mt-2 p-4">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            💬 댓글 ({comments.length})
          </h3>

          {/* 댓글 작성 폼 */}
          {user ? (
            <form onSubmit={handleCommentSubmit} className="mb-6">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center flex-shrink-0">
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.nickname}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-orange-600 font-bold text-sm">
                      {user.nickname?.[0] || '🥕'}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="댓글을 입력하세요..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20 resize-none"
                    disabled={commentLoading}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={commentLoading || !newComment.trim()}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        commentLoading || !newComment.trim()
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-orange-500 text-white hover:bg-orange-600'
                      }`}
                    >
                      {commentLoading ? '등록 중...' : '댓글 등록'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-600 mb-3">댓글을 작성하려면 로그인이 필요합니다.</p>
              <button
                onClick={() => router.push('/auth/login')}
                className="text-orange-500 font-medium hover:text-orange-600"
              >
                로그인하기
              </button>
            </div>
          )}

          {/* 댓글 목록 */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">💭</div>
                <p>아직 댓글이 없습니다.</p>
                <p className="text-sm">첫 번째 댓글을 남겨보세요!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center flex-shrink-0">
                    {comment.users?.avatar_url ? (
                      <img 
                        src={comment.users.avatar_url} 
                        alt={comment.users.nickname}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-orange-600 font-bold text-sm">
                        {comment.users?.nickname?.[0] || '🥕'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800">
                        {comment.users?.nickname || '알 수 없음'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString('ko-KR')} {' '}
                        {new Date(comment.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {comment.updated_at !== comment.created_at && (
                        <span className="text-xs text-gray-400">(수정됨)</span>
                      )}
                    </div>
                    
                    {editingComment === comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCommentUpdate(comment.id)}
                            className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => {setEditingComment(null); setEditContent('');}}
                            className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-2">
                          {comment.content}
                        </p>
                        {user && user.id === comment.users?.id && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCommentEdit(comment)}
                              className="text-xs text-gray-500 hover:text-orange-500"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleCommentDelete(comment.id)}
                              className="text-xs text-gray-500 hover:text-red-500"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 연락하기 버튼 */}
        {/* 하단 액션 버튼 */}
        <div className="bg-white mt-2 p-4 border-t">
          <div className="flex gap-3">
            {product.trade_type === 'share' ? (
              <button 
                onClick={() => {
                  if (seller?.nickname) {
                    alert(`${seller.nickname}님에게 나눔 문의하기\n(실제 연락 기능은 구현 예정)`);
                  } else {
                    alert('판매자 정보를 불러오는 중입니다.');
                  }
                }}
                className="flex-1 bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                🎁 나눔 문의하기
              </button>
            ) : product.price && product.price > 0 ? (
              <>
                <button 
                  onClick={() => {
                    if (seller?.nickname) {
                      alert(`${seller.nickname}님에게 구매 문의하기\n가격: ${product.price.toLocaleString()}원\n(실제 연락 기능은 구현 예정)`);
                    } else {
                      alert('판매자 정보를 불러오는 중입니다.');
                    }
                  }}
                  className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
                >
                  💰 구매 문의하기
                </button>
                <button 
                  onClick={() => {
                    if (seller?.nickname) {
                      alert(`${seller.nickname}님과 채팅하기\n(실제 채팅 기능은 구현 예정)`);
                    } else {
                      alert('판매자 정보를 불러오는 중입니다.');
                    }
                  }}
                  className="px-6 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  💬 채팅
                </button>
              </>
            ) : (
              <button 
                onClick={() => {
                  if (seller?.nickname) {
                    alert(`${seller.nickname}님에게 가격 문의하기\n(실제 연락 기능은 구현 예정)`);
                  } else {
                    alert('판매자 정보를 불러오는 중입니다.');
                  }
                }}
                className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
              >
                💬 가격 문의하기
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 