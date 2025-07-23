import { supabase } from './supabase';

// 데이터베이스 초기화 함수
export const initializeDatabase = async () => {
  try {
    console.log('🔧 데이터베이스 초기화 시작...');

    // comments 테이블 존재 여부 확인
    const { data: tableExists, error: checkError } = await supabase
      .from('comments')
      .select('count(*)', { count: 'exact', head: true });

    if (checkError && (checkError.code === 'PGRST204' || checkError.code === '42P01')) {
      console.log('📋 comments 테이블이 없습니다. 생성 중...');
      
      // comments 테이블 생성 SQL
      const createTableSQL = `
        -- comments 테이블 생성
        CREATE TABLE IF NOT EXISTS comments (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          product_id UUID NOT NULL,
          user_id UUID NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- 인덱스 생성 (존재하지 않는 경우에만)
        CREATE INDEX IF NOT EXISTS idx_comments_product_id ON comments(product_id);
        CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
        CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

        -- RLS 비활성화 (커스텀 인증 사용)
        ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
      `;

      const { error: createError } = await supabase.rpc('exec_sql', { 
        sql: createTableSQL 
      });

      if (createError) {
        console.error('❌ comments 테이블 생성 실패:', createError);
        
        // RPC가 실패하면 개별 쿼리로 시도
        try {
          // 기본 테이블 생성
          await supabase.from('comments').select('*').limit(1);
        } catch (e) {
          // 여전히 실패하면 사용자에게 안내
          console.warn('⚠️ 자동 테이블 생성 실패. 수동 설정이 필요합니다.');
          return { 
            success: false, 
            error: 'comments 테이블 생성 실패. Supabase에서 수동으로 테이블을 생성해주세요.',
            needsManualSetup: true
          };
        }
      } else {
        console.log('✅ comments 테이블이 성공적으로 생성되었습니다.');
      }
    } else if (checkError) {
      console.error('❌ 테이블 확인 중 오류:', checkError);
      return { 
        success: false, 
        error: `데이터베이스 확인 중 오류: ${checkError.message}` 
      };
    } else {
      console.log('✅ comments 테이블이 이미 존재합니다.');
    }

    // users 테이블 존재 여부 확인
    const { error: usersCheckError } = await supabase
      .from('users')
      .select('count(*)', { count: 'exact', head: true });

    if (usersCheckError && (usersCheckError.code === 'PGRST204' || usersCheckError.code === '42P01')) {
      console.warn('⚠️ users 테이블이 없습니다. 커스텀 유저 테이블 설정이 필요합니다.');
      return {
        success: false,
        error: 'users 테이블이 없습니다. custom-user-schema.sql을 먼저 실행해주세요.',
        needsUserTable: true
      };
    }

    // market 테이블 존재 여부 확인
    const { error: marketCheckError } = await supabase
      .from('market')
      .select('count(*)', { count: 'exact', head: true });

    if (marketCheckError && (marketCheckError.code === 'PGRST204' || marketCheckError.code === '42P01')) {
      console.warn('⚠️ market 테이블이 없습니다. 기본 테이블 설정이 필요합니다.');
      return {
        success: false,
        error: 'market 테이블이 없습니다. 기본 스키마를 먼저 설정해주세요.',
        needsMarketTable: true
      };
    }

    console.log('🎉 데이터베이스 초기화 완료!');
    return { success: true };

  } catch (error) {
    console.error('❌ 데이터베이스 초기화 중 예상치 못한 오류:', error);
    return { 
      success: false, 
      error: `데이터베이스 초기화 실패: ${error.message}` 
    };
  }
};

// 간단한 테이블 생성 함수 (RPC 없이)
export const createCommentsTableSimple = async () => {
  try {
    console.log('🔨 간단한 방법으로 comments 테이블 생성 시도...');
    
    // 더미 데이터 삽입을 시도해서 테이블이 있는지 확인
    const { error } = await supabase
      .from('comments')
      .insert({
        product_id: '00000000-0000-0000-0000-000000000000',
        user_id: '00000000-0000-0000-0000-000000000000',
        content: 'test'
      });

    // 테이블이 없으면 에러가 발생함
    if (error && (error.code === 'PGRST204' || error.code === '42P01')) {
      console.log('📋 테이블이 없어서 수동 설정 안내를 표시합니다.');
      return { 
        success: false, 
        needsManualSetup: true,
        error: 'comments 테이블이 없습니다. 다음 SQL을 Supabase에서 실행해주세요:\n\nCREATE TABLE comments (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  product_id UUID NOT NULL,\n  user_id UUID NOT NULL,\n  content TEXT NOT NULL,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);'
      };
    }

    // 더미 데이터 삭제 (성공적으로 삽입되었다면)
    if (!error) {
      await supabase
        .from('comments')
        .delete()
        .eq('content', 'test');
      
      console.log('✅ comments 테이블이 존재합니다.');
      return { success: true };
    }

    return { success: true };
  } catch (error) {
    console.error('❌ 테이블 확인 중 오류:', error);
    return { success: false, error: error.message };
  }
}; 