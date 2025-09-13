PRAGMA foreign_keys = ON;

-- 1) 제품 마스터 - 입고 순서대로 인덱스 번호를 기본키로 사용
CREATE TABLE Items (
  ItemID      INTEGER PRIMARY KEY AUTOINCREMENT, -- 입고 순서대로 1, 2, 3... 자동 생성
  Name        TEXT NOT NULL,
  Spec        TEXT,
  Maker       TEXT,
  Location    TEXT,
  UnitPrice   NUMERIC NOT NULL CHECK (UnitPrice >= 0),
  Status      TEXT NOT NULL CHECK (Status IN ('사용중','단종','중지')),
  StockStatus TEXT DEFAULT 'new', -- 품목 상태 추가 (new, used-new, used-used, broken)
  Remark      TEXT
);

-- 중복 제품 허용 (같은 품목+규격으로도 여러 번 입고 가능)
-- CREATE UNIQUE INDEX UX_Items_NameSpecMaker
--   ON Items(Name, Spec, Maker);

-- 2) 재고 이력(입/출/조정/폐기 통합) - 입고 순서 기반 기본키
CREATE TABLE StockHistory (
  HistoryID   INTEGER PRIMARY KEY AUTOINCREMENT,  -- 입고 순서대로 1,2,3... 자동 생성
  ItemID      INTEGER NOT NULL
               REFERENCES Items(ItemID) ON DELETE RESTRICT,
  EventType   TEXT NOT NULL
               CHECK (EventType IN ('IN','OUT','PLUS','MINUS','DISPOSAL')),
  Quantity    INTEGER NOT NULL CHECK (Quantity > 0),
  EventDate   DATE NOT NULL,
  Note        TEXT,
  StockStatus TEXT DEFAULT 'new', -- 품목 상태 추가
  CreatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IX_StockHistory_ItemDate
  ON StockHistory(ItemID, EventDate);

CREATE INDEX IX_StockHistory_Type
  ON StockHistory(EventType);

-- 3) 폐기 상세(선택)
CREATE TABLE Disposals (
  DisposalID    INTEGER PRIMARY KEY AUTOINCREMENT,
  HistoryID     INTEGER NOT NULL
                 REFERENCES StockHistory(HistoryID) ON DELETE CASCADE,
  DisposalReason TEXT,
  Approver       TEXT,
  EvidenceURL    TEXT
);
CREATE UNIQUE INDEX UX_Disposals_History ON Disposals(HistoryID);

-- 현재고 계산 뷰 - 입고 순서 기반
CREATE VIEW v_CurrentStock AS
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
  COUNT(CASE WHEN h.EventType = 'IN' THEN 1 END) AS InCount  -- 입고 횟수 표시
FROM Items i
LEFT JOIN StockHistory h ON h.ItemID = i.ItemID
GROUP BY i.ItemID, i.Name, i.Spec, i.Maker, i.Location, i.Status, i.StockStatus, i.Remark, i.UnitPrice;

-- 품목별 원장 보기 - 입고 순서 기반
CREATE VIEW v_ItemLedger AS
SELECT
  h.HistoryID, h.ItemID, i.Name, i.Spec, i.Maker,
  h.EventType, h.Quantity, h.EventDate, h.Note, h.StockStatus, h.CreatedAt,
  ROW_NUMBER() OVER (PARTITION BY i.ItemID ORDER BY h.HistoryID) AS InOrder  -- 입고 순서 표시
FROM StockHistory h
JOIN Items i ON i.ItemID = h.ItemID
ORDER BY h.ItemID, h.EventDate, h.HistoryID;

-- OUT/MINUS/DISPOSAL 시 현재고 음수 방지
CREATE TRIGGER trg_NoNegative AFTER INSERT ON StockHistory
WHEN NEW.EventType IN ('OUT','MINUS','DISPOSAL')
BEGIN
  -- 남은 수량 계산
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

-- 샘플 데이터 삽입
INSERT INTO Items(Name, Spec, Maker, Location, UnitPrice, Status, StockStatus, Remark) VALUES
('전선 (2.0SQ)', '2.0SQ', 'LS전선', '창고A', 1500, '사용중', 'new', '전기 배선용'),
('모니터', '24인치', '삼성', '창고B', 250000, '사용중', 'new', '사무용'),
('자전거', '88', '대림', '창고C', 150000, '사용중', 'new', '운송용'),
('키보드', '기계식', '체리', '창고A', 150000, '사용중', 'used-new', '중고 신품'),
('마우스', '무선', '로지텍', '창고B', 80000, '사용중', 'used-used', '중고 사용품'),
('헤드폰', '노이즈캔슬링', '소니', '창고C', 300000, '중지', 'broken', '고장품');

-- 샘플 입고 이력
INSERT INTO StockHistory(ItemID, EventType, Quantity, EventDate, StockStatus, Note) VALUES
(1, 'IN', 100, '2025-08-24', 'new', '초도물량'),
(2, 'IN', 5, '2025-08-24', 'new', '초도물량'),
(3, 'IN', 3, '2025-08-24', 'new', '초도물량'),
(4, 'IN', 2, '2025-08-24', 'used-new', '중고 신품'),
(5, 'IN', 1, '2025-08-24', 'used-used', '중고 사용품'),
(6, 'IN', 1, '2025-08-24', 'broken', '고장품');
