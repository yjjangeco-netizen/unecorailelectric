-- =====================================================
-- users FK 강화 (선택사항)
-- stock_in/out와 users.auth_user_id 연결
-- =====================================================

-- 1. users.auth_user_id를 유니크로 만들기
SELECT '=== users.auth_user_id 유니크 설정 ===' as info;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'users' AND indexname = 'users_auth_user_id_key'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_auth_user_id_key UNIQUE (auth_user_id);
    
    RAISE NOTICE 'users.auth_user_id에 유니크 제약 추가됨';
  ELSE
    RAISE NOTICE 'users.auth_user_id 유니크 제약이 이미 존재함';
  END IF;
END $$;

-- 2. stock_in.received_by_user_id -> users.auth_user_id FK 추가
SELECT '=== stock_in.received_by_user_id FK 추가 ===' as info;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_stock_in_received_user'
  ) THEN
    ALTER TABLE stock_in
      ADD CONSTRAINT fk_stock_in_received_user
      FOREIGN KEY (received_by_user_id)
      REFERENCES users(auth_user_id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
    
    RAISE NOTICE 'stock_in.received_by_user_id FK 추가됨';
  ELSE
    RAISE NOTICE 'stock_in.received_by_user_id FK가 이미 존재함';
  END IF;
END $$;

-- 3. stock_out.issued_by_user_id -> users.auth_user_id FK 추가
SELECT '=== stock_out.issued_by_user_id FK 추가 ===' as info;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_stock_out_issued_user'
  ) THEN
    ALTER TABLE stock_out
      ADD CONSTRAINT fk_stock_out_issued_user
      FOREIGN KEY (issued_by_user_id)
      REFERENCES users(auth_user_id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
    
    RAISE NOTICE 'stock_out.issued_by_user_id FK 추가됨';
  ELSE
    RAISE NOTICE 'stock_out.issued_by_user_id FK가 이미 존재함';
  END IF;
END $$;

-- 4. 강화된 FK 관계 확인
SELECT '=== 강화된 FK 관계 확인 ===' as info;

SELECT 
  conname as fk_name,
  conrelid::regclass as child_table,
  confrelid::regclass as parent_table,
  confupdtype as update_action,
  confdeltype as delete_action
FROM pg_constraint
WHERE contype = 'f'
  AND (conrelid::regclass::text LIKE '%stock_in%' 
       OR conrelid::regclass::text LIKE '%stock_out%'
       OR confrelid::regclass::text LIKE '%users%')
ORDER BY 2, 1;

-- 5. users 테이블 구조 확인
SELECT '=== users 테이블 구조 확인 ===' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 6. 완료 메시지
SELECT '=== users FK 강화 완료 ===' as info;
SELECT 'stock_in/out와 users.auth_user_id가 FK로 연결되었습니다!' as status;
SELECT '이제 RLS 정책에서 auth.uid()와 연동할 수 있습니다!' as rls_ready;
