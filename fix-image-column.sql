-- market 테이블에 image_url 컬럼 추가하고 기존 image 데이터 마이그레이션

DO $$ 
BEGIN
    -- image_url 컬럼이 없는 경우에만 추가
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'market' 
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE market ADD COLUMN image_url TEXT;
        RAISE NOTICE 'image_url 컬럼이 추가되었습니다.';
        
        -- 기존 image 컬럼 데이터를 image_url로 복사 (image 컬럼이 있는 경우)
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'market' 
            AND column_name = 'image'
        ) THEN
            UPDATE market SET image_url = image WHERE image IS NOT NULL AND image_url IS NULL;
            RAISE NOTICE '기존 image 데이터가 image_url로 복사되었습니다.';
        END IF;
    ELSE
        RAISE NOTICE 'image_url 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- 컬럼 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'market' 
AND column_name IN ('image', 'image_url')
ORDER BY column_name; 