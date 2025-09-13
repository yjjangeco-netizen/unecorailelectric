-- ========================================
-- 테스트용 SQLite 데이터베이스 생성 스크립트
-- 품목 상태 표시 테스트를 위한 샘플 데이터 포함
-- ========================================

-- 1) 품목 테이블 생성
CREATE TABLE IF NOT EXISTS Items (
  ItemID       INTEGER PRIMARY KEY AUTOINCREMENT,
  Name         TEXT NOT NULL,
  Spec         TEXT,
  Maker        TEXT,
  Location     TEXT,
  UnitPrice    INTEGER NOT NULL DEFAULT 0,
  Status       TEXT NOT NULL CHECK (Status IN ('사용중','단종','중지')),
  StockStatus  TEXT DEFAULT 'new' CHECK (StockStatus IN ('new', 'used-new', 'used-used', 'broken')),
  Remark       TEXT
);

-- 2) 재고 이력 테이블 생성
CREATE TABLE IF NOT EXISTS StockHistory (
  HistoryID    INTEGER PRIMARY KEY AUTOINCREMENT,
  ItemID       INTEGER NOT NULL,
  EventType    TEXT NOT NULL CHECK (EventType IN ('IN','OUT','PLUS','MINUS','DISPOSAL')),
  Quantity     INTEGER NOT NULL CHECK (Quantity > 0),
  EventDate    DATE NOT NULL,
  Note         TEXT,
  StockStatus  TEXT DEFAULT 'new',
  CreatedAt    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ItemID) REFERENCES Items(ItemID)
);

-- 3) 인덱스 생성
CREATE INDEX IF NOT EXISTS IX_StockHistory_ItemDate ON StockHistory(ItemID, EventDate);
CREATE INDEX IF NOT EXISTS IX_StockHistory_Type ON StockHistory(EventType);

-- 4) 현재고 계산 뷰 생성
CREATE VIEW IF NOT EXISTS v_CurrentStock AS
SELECT
  i.ItemID, i.Name, i.Spec, i.Maker, i.Location, i.Status, i.StockStatus, i.Remark, i.UnitPrice,
  COALESCE(SUM(
    CASE EventType
      WHEN 'IN'       THEN  Quantity
      WHEN 'PLUS'     THEN  Quantity
      WHEN 'OUT'      THEN -Quantity
      WHEN 'MINUS'    THEN -Quantity
      WHEN 'DISPOSAL' THEN -Quantity
    END
  ),0) AS CurrentQty,
  COUNT(CASE WHEN h.EventType = 'IN' THEN 1 END) AS InCount
FROM Items i
LEFT JOIN StockHistory h ON h.ItemID = i.ItemID
GROUP BY i.ItemID, i.Name, i.Spec, i.Maker, i.Location, i.Status, i.StockStatus, i.Remark, i.UnitPrice;

-- 5) 음수 재고 방지 트리거
CREATE TRIGGER IF NOT EXISTS trg_NoNegative AFTER INSERT ON StockHistory
WHEN NEW.EventType IN ('OUT','MINUS','DISPOSAL')
BEGIN
  SELECT
    CASE
      WHEN (
        (SELECT
           COALESCE(SUM(CASE
             WHEN EventType IN ('IN','PLUS') THEN Quantity
             ELSE -Quantity
           END),0)
         FROM StockHistory
         WHERE ItemID = NEW.ItemID)
      ) < 0
      THEN RAISE(ABORT, '재고가 음수가 됩니다')
    END;
END;

-- 6) 샘플 데이터 삽입 (다양한 상태 포함)
INSERT INTO Items(Name, Spec, Maker, Location, UnitPrice, Status, StockStatus, Remark) VALUES
('전선 (2.0SQ)', '2.0SQ', 'LS전선', '창고A', 1500, '사용중', 'new', '전기 배선용'),
('모니터', '24인치', '삼성', '창고B', 250000, '사용중', 'new', '사무용'),
('자전거', '88', '대림', '창고C', 150000, '사용중', 'new', '운송용'),
('키보드', '기계식', '체리', '창고A', 150000, '사용중', 'used-new', '중고 신품'),
('마우스', '무선', '로지텍', '창고B', 80000, '사용중', 'used-used', '중고 사용품'),
('헤드폰', '노이즈캔슬링', '소니', '창고C', 300000, '중지', 'broken', '고장품'),
('프린터', '레이저', 'HP', '창고A', 500000, '사용중', 'new', '사무용'),
('스캐너', '플랫베드', '캐논', '창고B', 200000, '사용중', 'used-new', '중고 신품');

-- 7) 샘플 입고 이력
INSERT INTO StockHistory(ItemID, EventType, Quantity, EventDate, StockStatus, Note) VALUES
(1, 'IN', 100, '2025-01-15', 'new', '초도물량'),
(2, 'IN', 5, '2025-01-15', 'new', '초도물량'),
(3, 'IN', 3, '2025-01-15', 'new', '초도물량'),
(4, 'IN', 2, '2025-01-15', 'used-new', '중고 신품'),
(5, 'IN', 1, '2025-01-15', 'used-used', '중고 사용품'),
(6, 'IN', 1, '2025-01-15', 'broken', '고장품'),
(7, 'IN', 3, '2025-01-15', 'new', '초도물량'),
(8, 'IN', 1, '2025-01-15', 'used-new', '중고 신품');

-- 8) 데이터 확인 쿼리
SELECT '=== 품목 상태별 통계 ===' as info;
SELECT 
  StockStatus,
  COUNT(*) as count,
  GROUP_CONCAT(Name, ', ') as items
FROM Items 
GROUP BY StockStatus
ORDER BY StockStatus;

SELECT '=== 현재고 상태 확인 ===' as info;
SELECT 
  Name,
  Spec,
  StockStatus,
  CurrentQty,
  Status
FROM v_CurrentStock
ORDER BY StockStatus, Name;

-- 9) 완료 메시지
SELECT '========================================' as message;
SELECT '테스트용 데이터베이스 생성 완료!' as message;
SELECT '다양한 품목 상태를 테스트할 수 있습니다.' as message;
SELECT '========================================' as message;
