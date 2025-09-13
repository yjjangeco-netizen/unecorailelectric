-- 기존 테이블 삭제 후 SQLite 구조로 재생성
-- Supabase SQL 편집기에서 실행하세요

-- ========================================
-- 1단계: 기존 테이블 및 관련 객체 완전 삭제
-- ========================================

-- 기존 테이블 삭제 (주의: 모든 데이터 손실)
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS current_stock CASCADE;
DROP TABLE IF EXISTS stock_in CASCADE;
DROP TABLE IF EXISTS stock_out CASCADE;
DROP TABLE IF EXISTS disposal CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;

-- 시퀀스도 삭제
DROP SEQUENCE IF EXISTS items_id_seq CASCADE;
DROP SEQUENCE IF EXISTS current_stock_id_seq CASCADE;
DROP SEQUENCE IF EXISTS stock_in_id_seq CASCADE;
DROP SEQUENCE IF EXISTS stock_out_id_seq CASCADE;
DROP SEQUENCE IF EXISTS disposal_id_seq CASCADE;
DROP SEQUENCE IF EXISTS users_id_seq CASCADE;
DROP SEQUENCE IF EXISTS audit_logs_id_seq CASCADE;

-- ========================================
-- 2단계: SQLite 구조로 새 테이블 생성
-- ========================================

-- 1) 제품 마스터
CREATE TABLE Items (
  ItemID      SERIAL PRIMARY KEY,
  Name        TEXT NOT NULL,
  Spec        TEXT,
  Maker       TEXT,
  Location    TEXT,
  UnitPrice   NUMERIC NOT NULL CHECK (UnitPrice >= 0),
  Status      TEXT NOT NULL CHECK (Status IN ('사용중','단종','중지')),
  Remark      TEXT
);

-- 중복 제품 방지
CREATE UNIQUE INDEX UX_Items_NameSpecMaker
  ON Items(Name, Spec, Maker);

-- 2) 재고 이력(입/출/조정/폐기 통합)
CREATE TABLE StockHistory (
  HistoryID   SERIAL PRIMARY KEY,
  ItemID      INTEGER NOT NULL
               REFERENCES Items(ItemID) ON DELETE RESTRICT,
  EventType   TEXT NOT NULL
               CHECK (EventType IN ('IN','OUT','PLUS','MINUS','DISPOSAL')),
  Quantity    INTEGER NOT NULL CHECK (Quantity > 0),
  EventDate   DATE NOT NULL,
  Note        TEXT,
  CreatedAt   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IX_StockHistory_ItemDate
  ON StockHistory(ItemID, EventDate);

CREATE INDEX IX_StockHistory_Type
  ON StockHistory(EventType);

-- 3) 폐기 상세
CREATE TABLE Disposals (
  DisposalID    SERIAL PRIMARY KEY,
  HistoryID     INTEGER NOT NULL
                 REFERENCES StockHistory(HistoryID) ON DELETE CASCADE,
  DisposalReason TEXT,
  Approver       TEXT,
  EvidenceURL    TEXT
);

CREATE UNIQUE INDEX UX_Disposals_History 
  ON Disposals(HistoryID);

-- 4) 사용자 테이블
CREATE TABLE Users (
  UserID       SERIAL PRIMARY KEY,
  Username     TEXT UNIQUE NOT NULL,
  Password     TEXT NOT NULL,
  Name         TEXT NOT NULL,
  Department   TEXT,
  Position     TEXT,
  Level        TEXT DEFAULT '1',
  IsActive     BOOLEAN DEFAULT true,
  CreatedAt    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5) 감사 로그 테이블
CREATE TABLE AuditLogs (
  LogID        SERIAL PRIMARY KEY,
  UserID       INTEGER REFERENCES Users(UserID),
  Action       TEXT NOT NULL,
  TableName    TEXT,
  RecordID     INTEGER,
  OldValues    JSONB,
  NewValues    JSONB,
  Timestamp    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  IPAddress    INET,
  UserAgent    TEXT
);

-- ========================================
-- 3단계: 권한 설정
-- ========================================

-- 모든 테이블에 대한 권한 부여
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ========================================
-- 4단계: 샘플 데이터 삽입
-- ========================================

-- 샘플 사용자 데이터는 제거됨
-- 실제 운영 환경에서는 관리자가 직접 사용자 계정을 추가하세요

-- 샘플 품목 추가
INSERT INTO Items (Name, Spec, Maker, Location, UnitPrice, Status, Remark) 
VALUES 
  ('자전거', '11', '테스트제조사', '창고A', 100, '사용중', '테스트 품목'),
  ('전선', '2.5sq', 'LS전선', '창고B', 500, '사용중', '전기공사용'),
  ('스위치', '15A', 'LS산전', '창고C', 2000, '사용중', '조명용');

-- ========================================
-- 5단계: 생성 확인
-- ========================================

SELECT '✅ 테이블 생성 완료' as result;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

SELECT '🎉 SQLite 구조 테이블 재생성 완료!' as final_result;
