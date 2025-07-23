-- 먼저 기존 comments 테이블이 있다면 삭제 (안전하게)
DROP TABLE IF EXISTS comments CASCADE;

-- users 테이블이 존재하는지 확인
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE EXCEPTION 'users 테이블이 존재하지 않습니다. 먼저 custom-user-schema.sql을 실행해주세요.';
    END IF;
END $$;

-- comments 테이블 생성 (users와의 관계 명시적 설정)
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 외래키 제약조건 명시적 설정
  CONSTRAINT fk_comments_product FOREIGN KEY (product_id) REFERENCES market(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_comments_product_id ON comments(product_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- RLS 비활성화 (커스텀 인증 시스템 사용)
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;

-- 테이블 생성 확인
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'comments' AND tc.constraint_type = 'FOREIGN KEY';

-- comments 테이블 구조 확인
\d comments; 