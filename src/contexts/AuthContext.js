'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { createCommentsTableSimple } from '../lib/initDatabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 비밀번호 해시 함수 (간단한 예시 - 실제로는 더 안전한 방법 사용 권장)
  const hashPassword = async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'salt_string'); // 실제로는 랜덤 솔트 사용
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // 세션 저장
  const saveSession = (userData) => {
    localStorage.setItem('user_session', JSON.stringify({
      id: userData.id,
      email: userData.email,
      nickname: userData.nickname,
      avatar_url: userData.avatar_url,
      location: userData.location,
      rating: userData.rating,
      trade_count: userData.trade_count,
      loginTime: Date.now()
    }));
  };

  // 세션 가져오기
  const getSession = () => {
    try {
      const session = localStorage.getItem('user_session');
      if (!session) return null;
      
      const sessionData = JSON.parse(session);
      
      // 24시간 후 세션 만료
      if (Date.now() - sessionData.loginTime > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('user_session');
        return null;
      }
      
      return sessionData;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  };

  // 세션 삭제
  const clearSession = () => {
    localStorage.removeItem('user_session');
  };

  // 로그인
  const signIn = async (email, password) => {
    try {
      const passwordHash = await hashPassword(password);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password_hash', passwordHash)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null, error: { message: '이메일 또는 비밀번호가 올바르지 않습니다.' } };
        }
        return { data: null, error };
      }

      if (data) {
        setUser(data);
        saveSession(data);
        return { data, error: null };
      }

      return { data: null, error: { message: '이메일 또는 비밀번호가 올바르지 않습니다.' } };
    } catch (error) {
      console.error('Login error:', error);
      return { data: null, error: { message: '로그인 중 오류가 발생했습니다.' } };
    }
  };

  // 회원가입
  const signUp = async (email, password, nickname, location = '함정동') => {
    try {
      // 이메일 중복 확인
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return { data: null, error: { message: '이미 존재하는 이메일입니다.' } };
      }

      // 닉네임 중복 확인
      const { data: existingNickname } = await supabase
        .from('users')
        .select('id')
        .eq('nickname', nickname)
        .single();

      if (existingNickname) {
        return { data: null, error: { message: '이미 존재하는 닉네임입니다.' } };
      }

      const passwordHash = await hashPassword(password);

      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            email,
            password_hash: passwordHash,
            nickname,
            location,  // 사용자가 선택한 위치 저장
            rating: 5.0,
            trade_count: 0
          }
        ])
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { data: null, error: { message: '회원가입 중 오류가 발생했습니다.' } };
    }
  };

  // 로그아웃
  const signOut = async () => {
    setUser(null);
    clearSession();
    return { error: null };
  };

  // 사용자 정보 업데이트
  const updateProfile = async (updates) => {
    try {
      if (!user) return { data: null, error: { message: '로그인이 필요합니다.' } };

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      setUser(data);
      saveSession(data);
      return { data, error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { data: null, error: { message: '프로필 업데이트 중 오류가 발생했습니다.' } };
    }
  };

  // 댓글 관련 함수들
  
  // 댓글 목록 가져오기
  const getComments = async (productId) => {
    try {
      // 댓글과 사용자 정보를 별도로 조회하여 수동으로 조인
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('id, user_id, content, created_at, updated_at')
        .eq('product_id', productId)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('Comments fetch error:', commentsError);
        
        // comments 테이블이 없는 경우 자동 생성 시도
        if (commentsError.code === 'PGRST204' || commentsError.code === '42P01') {
          console.log('🔧 comments 테이블이 없습니다. 자동 생성을 시도합니다...');
          
          const initResult = await createCommentsTableSimple();
          
          if (initResult.needsManualSetup) {
            return { 
              data: [], 
              error: { 
                message: '댓글 테이블이 없습니다.\n\nSupabase Dashboard → SQL Editor에서 다음 SQL을 실행해주세요:\n\nCREATE TABLE comments (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  product_id UUID NOT NULL,\n  user_id UUID NOT NULL,\n  content TEXT NOT NULL,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);\n\nALTER TABLE comments DISABLE ROW LEVEL SECURITY;',
                needsManualSetup: true
              } 
            };
          } else if (!initResult.success) {
            return { 
              data: [], 
              error: { message: initResult.error || '댓글 테이블 생성에 실패했습니다.' } 
            };
          }
          
          // 테이블이 생성되었으므로 다시 시도
          console.log('✅ 테이블이 생성되었습니다. 댓글을 다시 불러옵니다...');
          return await getComments(productId);
        }
        
        let errorMessage = '댓글을 불러오는 중 오류가 발생했습니다.';
        if (commentsError.message) {
          errorMessage = commentsError.message;
        }
        
        return { data: [], error: { message: errorMessage } };
      }

      if (!commentsData || commentsData.length === 0) {
        return { data: [], error: null };
      }

      // 사용자 ID들 수집
      const userIds = [...new Set(commentsData.map(comment => comment.user_id))];

      // 사용자 정보 조회
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, nickname, avatar_url')
        .in('id', userIds);

      if (usersError) {
        console.error('Users fetch error:', usersError);
        // 사용자 정보를 가져오지 못해도 댓글은 표시 (fallback 처리)
      }

      // 댓글에 사용자 정보 매핑
      const commentsWithUsers = commentsData.map(comment => ({
        ...comment,
        users: usersData?.find(user => user.id === comment.user_id) || {
          id: comment.user_id,
          nickname: '알 수 없음',
          avatar_url: null
        }
      }));

      return { data: commentsWithUsers, error: null };
    } catch (error) {
      console.error('Comments fetch error:', error);
      return { data: [], error: { message: '댓글을 불러오는 중 오류가 발생했습니다.' } };
    }
  };

  // 댓글 작성
  const createComment = async (productId, content) => {
    if (!user) {
      return { data: null, error: { message: '로그인이 필요합니다.' } };
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          product_id: productId,
          user_id: user.id,
          content: content.trim()
        })
        .select('id, user_id, content, created_at, updated_at')
        .single();

      if (error) {
        console.error('Comment create error:', error);
        
        // comments 테이블이 없는 경우 자동 생성 시도
        if (error.code === 'PGRST204' || error.code === '42P01') {
          console.log('🔧 댓글 작성 중 테이블이 없습니다. 자동 생성을 시도합니다...');
          
          const initResult = await createCommentsTableSimple();
          
          if (initResult.needsManualSetup) {
            return { 
              data: null, 
              error: { 
                message: '댓글 테이블이 없습니다.\n\n아래 SQL을 Supabase에서 실행해주세요:\n\nCREATE TABLE comments (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  product_id UUID NOT NULL,\n  user_id UUID NOT NULL,\n  content TEXT NOT NULL,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);\n\nALTER TABLE comments DISABLE ROW LEVEL SECURITY;',
                needsManualSetup: true
              } 
            };
          } else if (!initResult.success) {
            return { 
              data: null, 
              error: { message: initResult.error || '댓글 테이블 생성에 실패했습니다.' } 
            };
          }
          
          // 테이블이 생성되었으므로 다시 시도
          console.log('✅ 테이블이 생성되었습니다. 댓글을 다시 작성합니다...');
          return await createComment(productId, content);
        }
        
        // Supabase 에러를 사용자 친화적인 메시지로 변환
        let errorMessage = '댓글 작성 중 오류가 발생했습니다.';
        
        if (error.code === '23503') {
          errorMessage = '존재하지 않는 상품입니다.';
        } else if (error.code === '23502') {
          errorMessage = '필수 정보가 누락되었습니다.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        return { data: null, error: { message: errorMessage } };
      }

      // 새로 생성된 댓글에 현재 사용자 정보 추가
      const commentWithUser = {
        ...data,
        users: {
          id: user.id,
          nickname: user.nickname,
          avatar_url: user.avatar_url
        }
      };

      return { data: commentWithUser, error: null };
    } catch (error) {
      console.error('Comment create error:', error);
      return { data: null, error: { message: '댓글 작성 중 오류가 발생했습니다.' } };
    }
  };

  // 댓글 삭제
  const deleteComment = async (commentId) => {
    if (!user) {
      return { error: { message: '로그인이 필요합니다.' } };
    }

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id); // 본인의 댓글만 삭제 가능

      if (error) {
        console.error('Comment delete error:', error);
        return { error: { message: error.message || '댓글 삭제 중 오류가 발생했습니다.' } };
      }

      return { error: null };
    } catch (error) {
      console.error('Comment delete error:', error);
      return { error: { message: '댓글 삭제 중 오류가 발생했습니다.' } };
    }
  };

  // 댓글 수정
  const updateComment = async (commentId, content) => {
    if (!user) {
      return { data: null, error: { message: '로그인이 필요합니다.' } };
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .update({
          content: content.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('user_id', user.id) // 본인의 댓글만 수정 가능
        .select('id, user_id, content, created_at, updated_at')
        .single();

      if (error) {
        console.error('Comment update error:', error);
        return { data: null, error: { message: error.message || '댓글 수정 중 오류가 발생했습니다.' } };
      }

      // 수정된 댓글에 현재 사용자 정보 추가
      const commentWithUser = {
        ...data,
        users: {
          id: user.id,
          nickname: user.nickname,
          avatar_url: user.avatar_url
        }
      };

      return { data: commentWithUser, error: null };
    } catch (error) {
      console.error('Comment update error:', error);
      return { data: null, error: { message: '댓글 수정 중 오류가 발생했습니다.' } };
    }
  };

  // 초기 세션 복원
  useEffect(() => {
    const initializeAuth = async () => {
      const sessionData = getSession();
      
      if (sessionData) {
        // 세션이 있으면 사용자 정보를 DB에서 다시 가져와 최신 상태 확인
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', sessionData.id)
            .single();

          if (data && !error) {
            setUser(data);
            saveSession(data); // 최신 정보로 세션 업데이트
          } else {
            clearSession(); // 유효하지 않은 세션 제거
          }
        } catch (error) {
          console.error('Session restore error:', error);
          clearSession();
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    getComments,
    createComment,
    deleteComment,
    updateComment
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 