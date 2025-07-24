-- ===========================================
-- 당근마켓 클론 - 통합 데이터베이스 스키마
-- ===========================================
-- 사용 테이블: users, market, comments

-- ===========================================
-- 0. 필수 Extension 활성화
-- ===========================================
-- UUID 생성을 위한 pgcrypto extension 활성화
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================
-- 1. USERS 테이블 (사용자 정보)
-- ===========================================
-- Supabase Auth의 UID를 참조하는 사용자 추가 정보 테이블
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nickname TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  location TEXT DEFAULT '함정동',
  rating REAL DEFAULT 5.0,
  trade_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- users 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);

-- ===========================================
-- 2. MARKET 테이블 (상품 정보)
-- ===========================================
CREATE TABLE IF NOT EXISTS market (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER DEFAULT 0,
  image TEXT,
  trade_type TEXT DEFAULT 'sell' CHECK (trade_type IN ('sell', 'share')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- market 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_market_user_id ON market(user_id);
CREATE INDEX IF NOT EXISTS idx_market_created_at ON market(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_trade_type ON market(trade_type);
CREATE INDEX IF NOT EXISTS idx_market_price ON market(price);

-- ===========================================
-- 3. COMMENTS 테이블 (댓글 정보)
-- ===========================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES market(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- comments 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_comments_product_id ON comments(product_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- ===========================================
-- 4. RLS (Row Level Security) 설정
-- ===========================================
-- 현재 커스텀 인증 시스템을 사용하므로 RLS 비활성화
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE market DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;

-- ===========================================
-- 5. 샘플 데이터 (선택사항)
-- ===========================================
-- INSERT INTO users (email, password_hash, nickname, location) VALUES
-- ('test@example.com', 'hashed_password_here', '테스트유저', '함정동'),
-- ('admin@example.com', 'hashed_password_here', '관리자', '함정동');

-- ===========================================
-- 6. 유용한 뷰 (선택사항)
-- ===========================================
-- 상품과 판매자 정보를 함께 조회하는 뷰
CREATE OR REPLACE VIEW market_with_seller AS
SELECT 
  m.*,
  u.nickname as seller_nickname,
  u.location as seller_location,
  u.rating as seller_rating,
  u.avatar_url as seller_avatar
FROM market m
LEFT JOIN users u ON m.user_id = u.id;

-- 댓글과 작성자 정보를 함께 조회하는 뷰
CREATE OR REPLACE VIEW comments_with_user AS
SELECT 
  c.*,
  u.nickname as user_nickname,
  u.avatar_url as user_avatar
FROM comments c
LEFT JOIN users u ON c.user_id = u.id; 