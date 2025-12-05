import os

file_path = 'src/app/schedule/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 0-based index corrections
corrections = {
    989: '              <h1 className="text-2xl font-bold tracking-tight text-gray-900">일정 관리</h1>\n',
    991: '                프로젝트 일정 및 개인 업무 일정을 관리합니다.\n',
    997: '                새로고침\n',
    1004: '                휴가/반차 신청\n',
    1008: '                일정 추가\n',
    1017: '              <span className="font-semibold text-sm text-gray-700">필터:</span>\n',
    1029: '                <span className="text-sm font-medium text-gray-700">프로젝트</span>\n',
    1040: '                <span className="text-sm font-medium text-gray-700">휴가/반차</span>\n',
    1051: '                <span className="text-sm font-medium text-gray-700">출장/외근</span>\n',
    1062: '                <span className="text-sm font-medium text-gray-700">기타</span>\n',
    1108: '                  오늘\n',
    1113: '                {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월\n',
    1126: '                  2달\n',
    1136: '                  3달\n',
    1146: '                  월\n',
    1156: '                  주\n',
    1166: '                  일\n',
    1177: "                  일정목록 {showEventList ? '닫기' : ''}\n"
}

# Apply single line corrections
for idx, content in corrections.items():
    if idx < len(lines):
        lines[idx] = content

# Special block handling for Legend (1067-1070 in 1-based, 1066-1069 in 0-based)
# Lines in view_file:
# 1067:             {/* 踰붾? 援щ텇??*/}
# 1068:             {/* 踰붾? (Legend) : ?ъ슜??紐⑸줉留??쒖떆 */}
# 1069:             <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 pl-1">
# 1070:               {/* ?ъ슜??紐⑸줉 */}
if len(lines) > 1070:
    lines[1066] = '            {/* 범례 구분선 */}\n'
    lines[1067] = '            {/* 범례 (Legend) : 사용자 목록만 표시 */}\n'
    lines[1069] = '              {/* 사용자 목록 */}\n'

# Truncate garbage at end
# Keep up to line 1264 (0-based 1263: '}')
# view_file showed 1264: }
if len(lines) > 1264:
    lines = lines[:1264]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Successfully patched src/app/schedule/page.tsx")
