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

  // 회원가입 - Supabase Auth + 사용자 추가 정보
  const signUp = async (email, password, nickname, location = '함정동') => {
    try {
      // 1. Supabase Auth로 계정 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        return { data: null, error: { message: authError.message } };
      }

      // 2. 인증이 성공했지만 이메일 확인 대기 중일 수 있음
      const userId = authData.user?.id;
      if (!userId) {
        return { data: null, error: { message: '사용자 ID를 생성할 수 없습니다.' } };
      }

      // 3. 닉네임 중복 확인
      const { data: existingNickname } = await supabase
        .from('users')
        .select('id')
        .eq('nickname', nickname)
        .single();

      if (existingNickname) {
        // Auth에서 생성된 계정 삭제 시도 (실제로는 불가능하지만 알려줌)
        return { data: null, error: { message: '이미 존재하는 닉네임입니다.' } };
      }

      // 4. users 테이블에 추가 정보 저장
      const { data: userProfileData, error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: userId, // Supabase Auth의 UID 사용
            email,
            nickname,
            location,
            rating: 5.0,
            trade_count: 0
          }
        ])
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        return { data: null, error: { message: '사용자 프로필 생성 중 오류가 발생했습니다.' } };
      }

      return { data: { auth: authData, profile: userProfileData }, error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { data: null, error: { message: '회원가입 중 오류가 발생했습니다.' } };
    }
  };

  // 로그인 - Supabase Auth + 사용자 추가 정보 조회
  const signIn = async (email, password) => {
    try {
      // 1. Supabase Auth로 로그인
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        return { data: null, error: { message: authError.message } };
      }

      // 2. users 테이블에서 추가 정보 조회
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        // 프로필이 없는 경우 Auth 정보만으로 기본 사용자 객체 생성
        const basicUser = {
          id: authData.user.id,
          email: authData.user.email,
          nickname: authData.user.email.split('@')[0],
          location: '함정동',
          rating: 5.0,
          trade_count: 0
        };
        setUser(basicUser);
        return { data: { auth: authData, profile: basicUser }, error: null };
      }

      // 3. Auth 정보와 프로필 정보 병합
      const combinedUser = {
        ...userProfile,
        auth: authData.user
      };

      setUser(combinedUser);
      return { data: { auth: authData, profile: combinedUser }, error: null };
    } catch (error) {
      console.error('Login error:', error);
      return { data: null, error: { message: '로그인 중 오류가 발생했습니다.' } };
    }
  };

  // 로그아웃
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        return { error: { message: '로그아웃 중 오류가 발생했습니다.' } };
      }
      
      setUser(null);
      return { error: null };
    } catch (error) {
      console.error('Logout error:', error);
      return { error: { message: '로그아웃 중 오류가 발생했습니다.' } };
    }
  };

  // 사용자 프로필 업데이트
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

      setUser({ ...user, ...data });
      return { data, error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { data: null, error: { message: '프로필 업데이트 중 오류가 발생했습니다.' } };
    }
  };

  // 댓글 관련 함수들 (기존 로직 유지)
  
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

  // Supabase Auth 상태 변화 감지 및 초기화
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 현재 세션 확인
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // users 테이블에서 추가 정보 조회
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userProfile && !profileError) {
            setUser({
              ...userProfile,
              auth: session.user
            });
          } else {
            // 프로필이 없는 경우 기본 사용자 객체 생성
            const basicUser = {
              id: session.user.id,
              email: session.user.email,
              nickname: session.user.email?.split('@')[0] || '사용자',
              location: '함정동',
              rating: 5.0,
              trade_count: 0,
              auth: session.user
            };
            setUser(basicUser);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Auth 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // 로그인 시 추가 정보 조회
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userProfile) {
            setUser({
              ...userProfile,
              auth: session.user
            });
          } else {
            const basicUser = {
              id: session.user.id,
              email: session.user.email,
              nickname: session.user.email?.split('@')[0] || '사용자',
              location: '함정동',
              rating: 5.0,
              trade_count: 0,
              auth: session.user
            };
            setUser(basicUser);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription?.unsubscribe();
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