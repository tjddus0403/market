-- 댓글 테이블 생성
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES market(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 댓글 테이블 인덱스
CREATE INDEX IF NOT EXISTS comments_product_id_idx ON comments(product_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON comments(user_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON comments(created_at DESC);

-- 커스텀 유저 시스템을 사용하므로 RLS는 비활성화하고 public 액세스 허용
-- RLS를 사용하지 않으므로 모든 댓글 작업이 애플리케이션 레벨에서 처리됩니다
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;

-- 댓글 수 업데이트를 위한 함수 (선택사항)
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  -- 상품의 댓글 수를 업데이트할 수 있지만, 
  -- 현재는 실시간으로 계산하는 방식을 사용
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 댓글 생성/삭제 시 트리거 (선택사항)
-- CREATE TRIGGER comment_count_trigger
--   AFTER INSERT OR DELETE ON comments
--   FOR EACH ROW EXECUTE FUNCTION update_comment_count(); 