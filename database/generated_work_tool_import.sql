-- 업무도구 문서 일괄 등록 SQL
-- generated_at: 2026-06-14T13:36:36.622837+00:00
-- 같은 board_type/title 조합은 중복 등록하지 않습니다.

INSERT INTO work_tool_boards (
  board_type, title, content, author_id, author_name, views, created_at, updated_at
)
SELECT
  'TROUBLESHOOTING',
  '[840D][전삭기] 8. R파라메터 생성 및 전송방법 기술',
  $content$## [840D][전삭기] 8. R파라메터 생성 및 전송방법 기술

### 분류

- 장비 구분: 840D
- 설비 구분: 전삭기

원본 파일: [[840D][전삭기] 8. R파라메터 생성 및 전송방법 기술](/work-tool-files/imported/8-r파라메터-생성-및-전송방법-기술-2.pdf)

### 문서 내용

8.  R 파라메터 생성 및 전송관련 자료(생성, 언로드방법)
- 1 -
1. R-Parameter를 전송하기 위하여 설정하기 위한 것임.1.1 F:\DH \BD.DIR\ PLC_IN_OUT_001.TEA파일을 생성(대문자사용해서) 가. PLC 프로그램에서 W#16#81사용하여 MOVE시켜서 DB19.DBB16으로 OUT시키는 것은    - W#16#81은 16진수이며 이진수로 고치면 10000001로 PLC_IN_OUT_001.TEA을 말함   - W#16#82은 16진수이며 이진수로 고치면 10000010로 PLC_IN_OUT_002.TEA을 말함 나. PLC 프로그램에서 W#16#1사용하여 MOVE시켜서 DB19.DBB17으로 OUT시키는 것은    - W#16#1은 16진수이며 이진수로 고치면 00000001로 PLC_IN_OUT_001.TEA의 내부 라인 번호를     말함 따라서 그 라인번호( LINE NO.)의 JOB파일을 사용한다는 의미를 지닌다.
   
     내용:    N1 /WKS.DIR/TRANS.WPD/MEAS.JOB1.2 JOB FILE을 생성한다     => F:\DH \BD.DIR\ PLC_IN_OUT_001.TEA파일의 내용이 지정하는 곳으로    가. F:\DH \ WKS.DIR\ TRANS.WPD\ MEAS.JOB 내용에 R-Parameter를 생성한다. 이는       서브프로그램을 설정하는 곳이다.        =>F:\DH \ WKS.DIR\ TRANS.WPD를 폴더로 만들고, 폴더안에 MEAS.JOB(작업목록)파일을 생성한다.
    
    내용 :  LOAD /WKS.DIR/NC2PC/MEAS.SPF

8.  R 파라메터 생성 및 전송관련 자료(생성, 언로드방법)
- 2 -
1.3 DATA FILE을 생성한다  => NC 프로그램에서 DATA프로그램을 호출하면 F:\DH \ WKS.DIR\ECOMAISTER.WPD   \ DATA.SPF 프로그램을 실행하면 프로그램내용에 들어있는 루트에 해당하는 파일 안에 R0부터 R37번까지의 값이 저장되어 TR.SPF 파일로 생성되며, 이파일은 차륜관리 프로그램이 항상 감시하고 있다가 파일을 가져가서 삭제시킨다.- NC에서는 파일을 만들고 생성된것을 언로드까지 시켜주어야 차륜관리프로그램에서 가져갈 수 있다.
* 자동모드 - 오버스토어 - DATA를 입력하고 [Cycle Start]버튼을 누르면 TR.SPF에 위와 같이 R 파라메터가 저장되어 파일이 생성된다.* F:\DH \BD.DIR폴더안에 PLC_IN_OUT_001.TEA과 PLC_IN_OUT_002.TEA 가 안 들어 있고, F:\DH \ WKS.DIR\ TRANS.WPD를 폴더와 그 안에MEAS.JOB(작업목록)파일을 생성하지 않으면  TR.SPF 파일이 생성은 되나 언로드가 안 된다.  
내용: DEF INT ERRORWRITE (ERROR, "_N_WKS_DIR/_N_NC2PC_WPD/_N_MEAS_SPF","[DATA]")WRITE (ERROR, "_N_WKS_DIR/_N_NC2PC_WPD/_N_MEAS_SPF","R1="<<R1)WRITE (ERROR, "_N_WKS_DIR/_N_NC2PC_WPD/_N_MEAS_SPF","R2="<<R2)~G4F1STOPREM89  ( TR.SPF를 UNLOAD시켜줘야 하드디스크에서 남게 되고, 차륜관리 PC에서 가져가고 삭제할 수 있음)G4F1M171. 4. R 파라메터     : 블록서치 기능 사용시 R90에 쓰는 곳 : FC81 NW4

8.  R 파라메터 생성 및 전송관련 자료(생성, 언로드방법)
- 3 -
1. 5. PLC PROGRAM 생성한다.==> 

8.  R 파라메터 생성 및 전송관련 자료(생성, 언로드방법)
- 4 -$content$,
  'system',
  '관리자',
  0,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM work_tool_boards
  WHERE board_type = 'TROUBLESHOOTING'
    AND title = '[840D][전삭기] 8. R파라메터 생성 및 전송방법 기술'
);
