export type WorkToolBoardType = 'SOP' | 'TOOLS' | 'TROUBLESHOOTING' | 'TECH_DATA'

export type WorkToolDocumentGroup = 'SOP' | 'Worktool' | 'Breakdown' | 'engineerData'

export type WorkToolClassification = {
  boardType: WorkToolBoardType
  documentGroup: WorkToolDocumentGroup
  groupFolder: string
  machineType: string
  hardwareType: string
  title: string
  reason: string
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()))
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ')
}

export function classifyWorkToolDocument(fileName: string, extraText = ''): WorkToolClassification {
  const text = normalizeText(`${fileName} ${extraText}`)

  let boardType: WorkToolBoardType = 'TECH_DATA'
  let documentGroup: WorkToolDocumentGroup = 'engineerData'
  let groupFolder = 'engineerData'
  let reason = '기술자료 기본 분류'

  if (includesAny(text, ['sop', '표준', '절차서', '작업절차', '작업 절차', '업무방식', '업무방법', '업무 방법'])) {
    boardType = 'SOP'
    documentGroup = 'SOP'
    groupFolder = 'SOP'
    reason = '업무방식/SOP 키워드'
  } else if (includesAny(text, ['vnc', 'viewer', 'view', 'tool', '툴', '프로그램', '유틸', '설치', '사용법', '업무툴'])) {
    boardType = 'TOOLS'
    documentGroup = 'Worktool'
    groupFolder = 'Worktool'
    reason = '업무툴/프로그램 키워드'
  } else if (includesAny(text, ['as', 'ss', '고장', '장애', '복구', '정비이력', '이력', '알람', 'alarm', 'error', 'trouble', 'breakdown'])) {
    boardType = 'TROUBLESHOOTING'
    documentGroup = 'Breakdown'
    groupFolder = 'Breakdown'
    reason = 'AS/SS/고장 이력 키워드'
  }

  let machineType = '공통'
  if (includesAny(text, ['디스크 선반', '디스크선반', 'disc lathe', 'disk lathe'])) {
    machineType = '디스크 선반'
  } else if (includesAny(text, ['전삭기', '차륜', '삭정', 'wheel lathe', 'wheel'])) {
    machineType = '전삭기'
  } else if (includesAny(text, ['wsms'])) {
    machineType = 'WSMS'
  } else if (includesAny(text, ['선반', 'lathe', 'turning'])) {
    machineType = '선반'
  }

  let hardwareType = '공통'
  if (includesAny(text, ['siemens', 'sinumerik', '840d', '840dsl', '840 dsl', 'sinumerik one'])) {
    hardwareType = 'Siemens'
  } else if (includesAny(text, ['fanuc', 'faunc', '화낙'])) {
    hardwareType = 'Fanuc'
  }

  const stem = fileName.replace(/\.[^.]+$/, '').trim()
  const title = boardType === 'TECH_DATA'
    ? `[${machineType}][${hardwareType}] ${stem}`
    : `[${documentGroup}] ${stem}`

  return {
    boardType,
    documentGroup,
    groupFolder,
    machineType,
    hardwareType,
    title,
    reason
  }
}
