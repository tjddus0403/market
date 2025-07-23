-- 커스텀 user 테이블 생성
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nickname TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  location TEXT DEFAULT '함정동',
  rating REAL DEFAULT 5.0,
  trade_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- market 테이블에 user_id 컬럼 추가 (users 테이블과 연결)
ALTER TABLE market 
ADD COLUMN user_id UUID REFERENCES users(id);

-- trade_type 컬럼도 추가 (없는 경우)
ALTER TABLE market 
ADD COLUMN trade_type TEXT DEFAULT 'sell' 
CHECK (trade_type IN ('sell', 'share'));

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE market ENABLE ROW LEVEL SECURITY;

-- users 테이블 정책
CREATE POLICY "Anyone can view users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (id = current_setting('app.current_user_id')::uuid);

-- market 테이블 정책  
CREATE POLICY "Anyone can view products" ON market FOR SELECT USING (true);
CREATE POLICY "Users can insert products" ON market FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id')::uuid);
CREATE POLICY "Users can update own products" ON market FOR UPDATE USING (user_id = current_setting('app.current_user_id')::uuid);
CREATE POLICY "Users can delete own products" ON market FOR DELETE USING (user_id = current_setting('app.current_user_id')::uuid);

-- 이메일 인덱스 추가 (로그인 성능 향상)
CREATE INDEX idx_users_email ON users(email);

-- 샘플 사용자 추가 (테스트용)
INSERT INTO users (email, password_hash, nickname, location) VALUES
('test@example.com', '$2b$10$example_hash_here', '테스트유저', '함정동'),
('user@example.com', '$2b$10$example_hash_here', '당근이', '함정동'); 