-- 업무도구 > 기술자료 등록
-- 원본 PDF: /work-tool-files/r-parameter-transfer.pdf

INSERT INTO work_tool_boards (
  board_type,
  title,
  content,
  author_id,
  author_name,
  views,
  created_at,
  updated_at
)
SELECT
  'TECH_DATA',
  'R파라메터 생성 및 전송방법 기술',
  $content$
## R 파라메터 생성 및 전송방법 기술

원본 PDF: [R파라메터 생성 및 전송방법 기술](/work-tool-files/r-parameter-transfer.pdf)

### 목적

R-Parameter를 전송하기 위해 필요한 파일 생성, JOB FILE 구성, DATA FILE 생성 및 UNLOAD 절차를 정리한 기술자료입니다.

---

### 1. PLC_IN_OUT_001.TEA 파일 생성

`F:\DH\BD.DIR\PLC_IN_OUT_001.TEA` 파일을 생성합니다.

파일명은 대문자를 사용합니다.

#### PLC 프로그램 설정

- PLC 프로그램에서 `W#16#81`을 사용하여 MOVE 후 `DB19.DBB16`으로 OUT합니다.
- `W#16#81`은 16진수이며, 이진수로 변환하면 `10000001`입니다.
- 이 값은 `PLC_IN_OUT_001.TEA`를 의미합니다.
- `W#16#82`는 16진수이며, 이진수로 변환하면 `10000010`입니다.
- 이 값은 `PLC_IN_OUT_002.TEA`를 의미합니다.

#### 내부 라인 번호 설정

- PLC 프로그램에서 `W#16#1`을 사용하여 MOVE 후 `DB19.DBB17`으로 OUT합니다.
- `W#16#1`은 16진수이며, 이진수로 변환하면 `00000001`입니다.
- 이 값은 `PLC_IN_OUT_001.TEA`의 내부 라인 번호를 의미합니다.
- 즉, 해당 LINE NO.의 JOB 파일을 사용한다는 의미입니다.

#### PLC_IN_OUT_001.TEA 내용

```text
N1 /WKS.DIR/TRANS.WPD/MEAS.JOB
```

---

### 2. JOB FILE 생성

`F:\DH\BD.DIR\PLC_IN_OUT_001.TEA` 파일의 내용이 지정하는 위치에 JOB 파일을 생성합니다.

생성 위치:

```text
F:\DH\WKS.DIR\TRANS.WPD\MEAS.JOB
```

`TRANS.WPD` 폴더를 만들고, 그 안에 `MEAS.JOB` 작업목록 파일을 생성합니다.

#### MEAS.JOB 내용

```text
LOAD /WKS.DIR/NC2PC/MEAS.SPF
```

---

### 3. DATA FILE 생성

NC 프로그램에서 DATA 프로그램을 호출하면 아래 프로그램이 실행됩니다.

```text
F:\DH\WKS.DIR\ECOMAISTER.WPD\DATA.SPF
```

실행 결과:

- 프로그램 내용에 들어있는 경로에 해당하는 파일 안에 `R0`부터 `R37`까지의 값이 저장됩니다.
- 저장된 값은 `TR.SPF` 파일로 생성됩니다.
- 차륜관리 프로그램은 `TR.SPF` 파일을 항상 감시합니다.
- 파일이 생성되면 차륜관리 프로그램이 가져간 뒤 삭제합니다.

#### 주의사항

NC에서는 파일을 만들고, 생성된 파일을 UNLOAD까지 해주어야 차륜관리 프로그램에서 가져갈 수 있습니다.

자동모드 절차:

1. 자동모드 진입
2. 오버스토어
3. `DATA` 입력
4. `Cycle Start` 버튼 실행
5. `TR.SPF`에 R 파라메터가 저장되어 파일 생성

아래 파일 또는 폴더가 없으면 `TR.SPF` 파일은 생성되더라도 UNLOAD가 되지 않습니다.

- `F:\DH\BD.DIR\PLC_IN_OUT_001.TEA`
- `F:\DH\BD.DIR\PLC_IN_OUT_002.TEA`
- `F:\DH\WKS.DIR\TRANS.WPD`
- `F:\DH\WKS.DIR\TRANS.WPD\MEAS.JOB`

#### DATA.SPF 예시 내용

```text
DEF INT ERROR
WRITE (ERROR, "_N_WKS_DIR/_N_NC2PC_WPD/_N_MEAS_SPF","[DATA]")
WRITE (ERROR, "_N_WKS_DIR/_N_NC2PC_WPD/_N_MEAS_SPF","R1="<<R1)
WRITE (ERROR, "_N_WKS_DIR/_N_NC2PC_WPD/_N_MEAS_SPF","R2="<<R2)
~
G4F1
STOPRE
M89
G4F1
M17
```

`TR.SPF`를 UNLOAD해야 하드디스크에 남고, 차륜관리 PC에서 가져간 뒤 삭제할 수 있습니다.

---

### 4. R 파라메터 참고

블록서치 기능 사용 시 `R90`에 쓰는 곳:

```text
FC81 NW4
```

---

### 5. PLC PROGRAM

원본 문서 3쪽 이후에 PLC PROGRAM 관련 이미지 자료가 포함되어 있습니다.
상세 이미지는 상단 원본 PDF를 확인하십시오.
$content$,
  'system',
  '관리자',
  0,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1
  FROM work_tool_boards
  WHERE board_type = 'TECH_DATA'
    AND title = 'R파라메터 생성 및 전송방법 기술'
);
