-- market 테이블에 updated_at 컬럼 추가

DO $$ 
BEGIN
    -- updated_at 컬럼이 없는 경우에만 추가
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'market' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE market ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());
        RAISE NOTICE 'updated_at 컬럼이 추가되었습니다.';
        
        -- 기존 상품들의 updated_at을 created_at과 동일하게 설정
        UPDATE market 
        SET updated_at = created_at 
        WHERE updated_at IS NULL;
        
        RAISE NOTICE '기존 상품들의 updated_at이 created_at으로 설정되었습니다.';
    ELSE
        RAISE NOTICE 'updated_at 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- 컬럼 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'market' 
AND column_name IN ('created_at', 'updated_at')
ORDER BY column_name; 