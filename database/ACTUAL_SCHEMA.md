# 실제 DB 스키마 (Supabase 기준)

이 문서는 실제 운영 중인 Supabase DB 스키마를 정확히 기록합니다.

## 주요 차이점

### ❌ `complete_schema.sql` 파일과의 불일치

`complete_schema.sql` 파일은 이상적인 스키마 정의이지만, 실제 Supabase DB와 다릅니다.

| 항목 | complete_schema.sql | 실제 Supabase DB |
|------|---------------------|------------------|
| **프로젝트 ID** | `id UUID` | `id INTEGER` |
| **프로젝트명** | `name VARCHAR(255)` | `project_name VARCHAR` |
| **사용자 ID** | `id UUID` | `id TEXT` |
| **사용자명** | `first_name`, `last_name` | `name` (단일 필드) |
| **업무일지** | `work_diaries` | `work_diary` |

---

## 1. projects 테이블

```sql
CREATE TABLE projects (
  id INTEGER PRIMARY KEY,  -- ⚠️ UUID가 아님!
  project_number VARCHAR,
  project_name VARCHAR NOT NULL,  -- ⚠️ 'name'이 아님!
  description TEXT,
  ProjectStatus VARCHAR(50) DEFAULT 'Manufacturing',  -- ⚠️ 대문자 P
  is_active BOOLEAN DEFAULT true,  -- 아직 존재 (호환성)
  assembly_date DATE,
  factory_test_date DATE,
  site_test_date DATE,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### ProjectStatus 값
- `Manufacturing` - 제작중
- `WarrantyComplete` - 하자보증완료
- `Warranty` - 하자보증중
- `Demolished` - 철거

---

## 2. users 테이블

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,  -- ⚠️ UUID가 아님!
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,  -- ⚠️ first_name, last_name이 아님!
  email TEXT,
  department TEXT,  -- 또는 depart
  position TEXT,
  level TEXT DEFAULT '1',
  is_active BOOLEAN DEFAULT true,
  stock_view BOOLEAN DEFAULT false,
  stock_in BOOLEAN DEFAULT false,
  stock_out BOOLEAN DEFAULT false,
  stock_disposal BOOLEAN DEFAULT false,
  work_tools BOOLEAN DEFAULT false,
  daily_log BOOLEAN DEFAULT false,
  work_manual BOOLEAN DEFAULT false,
  sop BOOLEAN DEFAULT false,
  user_management BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 3. work_diary 테이블

```sql
CREATE TABLE work_diary (  -- ⚠️ 's' 없음!
  id INTEGER PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  work_date DATE NOT NULL,
  project_id INTEGER REFERENCES projects(id),
  work_content TEXT NOT NULL,
  work_type VARCHAR,
  work_sub_type VARCHAR,
  custom_project_name VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 4. items 테이블 (재고)

```sql
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specification TEXT,
  maker TEXT,
  category TEXT DEFAULT '일반',
  location TEXT,
  purpose TEXT DEFAULT '재고관리',
  min_stock INTEGER DEFAULT 0,
  current_quantity INTEGER DEFAULT 0,
  closing_quantity INTEGER DEFAULT 0,
  stock_in INTEGER DEFAULT 0,
  stock_out INTEGER DEFAULT 0,
  disposal_qunty INTEGER DEFAULT 0,
  total_qunty INTEGER DEFAULT 0,
  unit_price NUMERIC DEFAULT 0,
  note TEXT,
  stock_status TEXT DEFAULT 'new',
  status TEXT DEFAULT 'active',
  date_index VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 5. stock_history 테이블

```sql
CREATE TABLE stock_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id),
  event_type TEXT NOT NULL,  -- 'IN', 'OUT', 'DISPOSAL'
  quantity INTEGER NOT NULL,
  unit_price NUMERIC,
  reason TEXT,
  ordered_by TEXT,
  received_by TEXT,
  project TEXT,
  notes TEXT,
  return_date TIMESTAMP WITH TIME ZONE,
  disposal_reason TEXT,
  requester TEXT,
  approver TEXT,
  approval_date TIMESTAMP WITH TIME ZONE,
  approval_notes TEXT,
  evidence_url TEXT,
  condition_type TEXT DEFAULT 'new',
  is_rental BOOLEAN DEFAULT false,
  disposal_status TEXT DEFAULT 'pending',
  date_index VARCHAR,
  event_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 6. business_trips 테이블

```sql
CREATE TABLE business_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  purpose TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  status TEXT DEFAULT 'scheduled',
  report_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 7. business_trip_reports 테이블

```sql
CREATE TABLE business_trip_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES business_trips(id),
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  status TEXT DEFAULT 'submitted',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 8. local_events 테이블

```sql
CREATE TABLE local_events (
  id VARCHAR PRIMARY KEY,
  participant_id VARCHAR NOT NULL REFERENCES users(id),
  created_by_id VARCHAR NOT NULL REFERENCES users(id),
  summary VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  sub_category VARCHAR,
  sub_sub_category VARCHAR,
  project_id INTEGER REFERENCES projects(id),
  project_type VARCHAR,
  custom_project VARCHAR,
  description TEXT,
  location VARCHAR,
  start_date DATE,
  end_date DATE,
  start_date_time TIMESTAMP,
  end_date_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 9. project_events 테이블

```sql
CREATE TABLE project_events (
  id VARCHAR PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id),
  event_type VARCHAR NOT NULL,
  event_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## API 매핑 가이드

### 프로젝트 조회 시
```typescript
// ❌ 잘못된 방법
item.name

// ✅ 올바른 방법
item.project_name
```

### 프로젝트 생성/수정 시
```typescript
// ❌ 잘못된 방법
{
  name: projectData.name,
  status: projectData.status
}

// ✅ 올바른 방법
{
  project_name: projectData.name,
  ProjectStatus: projectData.status
}
```

### ID 타입 변환
```typescript
// ❌ 잘못된 방법
id: item.id  // INTEGER를 그대로 사용

// ✅ 올바른 방법
id: item.id.toString()  // STRING으로 변환
```

---

## 주요 인덱스

```sql
-- 프로젝트
CREATE UNIQUE INDEX unique_project_number ON projects(project_number);
CREATE INDEX idx_projects_project_status ON projects("ProjectStatus");

-- 업무일지
CREATE INDEX idx_work_diary_work_date ON work_diary(work_date);
CREATE INDEX idx_work_diary_user_id ON work_diary(user_id);
CREATE INDEX idx_work_diary_project_id ON work_diary(project_id);

-- 사용자
CREATE UNIQUE INDEX users_username_key ON users(username);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_level ON users(level);
```

---

## 데이터 통계 (2025-10-07 기준)

- **프로젝트**: 109개 (제작중 5개, 하자보증완료 104개)
- **사용자**: 7명 (레벨 1~5, Administrator)
- **업무일지**: 17개 (2025-09: 16개, 2025-10: 1개)
- **재고**: 0개 (시스템 준비 중)

---

## 주의사항

⚠️ **이 스키마 문서를 항상 우선 참조하세요!**

1. `complete_schema.sql` 파일은 **참고용**입니다.
2. 실제 코드는 **이 문서의 스키마**를 따라야 합니다.
3. 컬럼명 대소문자에 주의하세요 (`ProjectStatus` 등).
4. ID 타입 변환을 잊지 마세요 (INTEGER → STRING).

