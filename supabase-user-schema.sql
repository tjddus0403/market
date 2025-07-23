-- 사용자 프로필 테이블 생성
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  nickname TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  location TEXT DEFAULT '함정동',
  rating DECIMAL(2,1) DEFAULT 5.0,
  trade_count INTEGER DEFAULT 0,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- market 테이블에 user_id 컬럼 추가
ALTER TABLE market 
ADD COLUMN user_id UUID REFERENCES users(id);

-- RLS (Row Level Security) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 사용자 정책: 모든 사람이 사용자 정보를 볼 수 있음
CREATE POLICY "Anyone can view users" ON users FOR SELECT USING (true);

-- 사용자 정책: 본인만 자신의 정보를 수정할 수 있음
CREATE POLICY "Users can update own profile" ON users FOR UPDATE 
USING (auth.uid() = id);

-- 사용자 정책: 인증된 사용자만 프로필을 생성할 수 있음
CREATE POLICY "Authenticated users can insert profile" ON users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- market 테이블 정책 업데이트: 인증된 사용자만 상품을 등록할 수 있음
DROP POLICY IF EXISTS "Anyone can insert products" ON market;
CREATE POLICY "Authenticated users can insert products" ON market FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- market 테이블 정책: 본인만 자신의 상품을 수정/삭제할 수 있음
CREATE POLICY "Users can update own products" ON market FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products" ON market FOR DELETE 
USING (auth.uid() = user_id);

-- 사용자 트리거: 사용자 가입 시 자동으로 프로필 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, nickname, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nickname', '사용자' || substring(new.id::text, 1, 8)),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user(); 