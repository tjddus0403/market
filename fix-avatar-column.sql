-- users 테이블에 avatar_url 컬럼 추가
-- 이미 존재하는 경우 에러가 발생하지만 무시해도 됩니다

DO $$ 
BEGIN
    -- avatar_url 컬럼이 없는 경우에만 추가
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'avatar_url 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE 'avatar_url 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- 컬럼 추가 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position; 