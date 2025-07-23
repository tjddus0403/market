-- 상품 테이블 생성
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  image TEXT,
  trade_type TEXT NOT NULL DEFAULT 'sell' CHECK (trade_type IN ('sell', 'share')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS (Row Level Security) 활성화
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 상품을 조회할 수 있도록 허용
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);

-- 모든 사용자가 상품을 등록할 수 있도록 허용 (나중에 인증 추가시 수정 가능)
CREATE POLICY "Anyone can insert products" ON products FOR INSERT WITH CHECK (true); 