#!/bin/bash

# =============================================
# 데이터베이스 복구 스크립트
# =============================================

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 환경 변수 설정
DB_NAME="unecorailelectric"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"
BACKUP_DIR="./backup"

# 사용법 출력
usage() {
    echo "사용법: $0 [백업파일명]"
    echo ""
    echo "예시:"
    echo "  $0 initial_setup_20241201_120000.sql.gz"
    echo "  $0 backup_20241201_120000.sql"
    echo ""
    echo "사용 가능한 백업 파일:"
    ls -la $BACKUP_DIR/*.sql* 2>/dev/null | awk '{print "  " $9}' | sed 's/.*\///'
    exit 1
}

# 백업 파일 확인
if [ $# -eq 0 ]; then
    usage
fi

BACKUP_FILE=$1

# 백업 파일 경로 설정
if [[ $BACKUP_FILE == *.gz ]]; then
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"
    TEMP_FILE="/tmp/restore_$(date +%Y%m%d_%H%M%S).sql"
else
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"
    TEMP_FILE=""
fi

# 백업 파일 존재 확인
if [ ! -f "$BACKUP_PATH" ]; then
    log_error "백업 파일을 찾을 수 없습니다: $BACKUP_PATH"
    usage
fi

log_info "데이터베이스 복구를 시작합니다..."
log_info "백업 파일: $BACKUP_PATH"

# 1. 현재 데이터베이스 백업 (복구 전)
log_info "현재 데이터베이스 백업 중..."
CURRENT_BACKUP="$BACKUP_DIR/backup_before_restore_$(date +%Y%m%d_%H%M%S).sql"
if psql -h $DB_HOST -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $CURRENT_BACKUP
    log_success "현재 데이터베이스가 백업되었습니다: $CURRENT_BACKUP"
else
    log_warning "복구할 데이터베이스가 존재하지 않습니다."
fi

# 2. 압축된 백업 파일인 경우 압축 해제
if [[ $BACKUP_FILE == *.gz ]]; then
    log_info "압축된 백업 파일을 해제 중..."
    gunzip -c $BACKUP_PATH > $TEMP_FILE
    if [ $? -eq 0 ]; then
        log_success "압축 해제 완료: $TEMP_FILE"
        RESTORE_FILE=$TEMP_FILE
    else
        log_error "압축 해제에 실패했습니다."
        exit 1
    fi
else
    RESTORE_FILE=$BACKUP_PATH
fi

# 3. 데이터베이스 삭제 및 재생성
log_info "데이터베이스 재생성 중..."
psql -h $DB_HOST -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;"
psql -h $DB_HOST -U $DB_USER -c "CREATE DATABASE $DB_NAME;"

if [ $? -eq 0 ]; then
    log_success "데이터베이스가 재생성되었습니다."
else
    log_error "데이터베이스 재생성에 실패했습니다."
    exit 1
fi

# 4. 백업 파일로부터 복구
log_info "백업 파일로부터 복구 중..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f $RESTORE_FILE

if [ $? -eq 0 ]; then
    log_success "데이터베이스 복구가 완료되었습니다."
else
    log_error "데이터베이스 복구에 실패했습니다."
    exit 1
fi

# 5. 임시 파일 정리
if [ ! -z "$TEMP_FILE" ] && [ -f "$TEMP_FILE" ]; then
    rm $TEMP_FILE
    log_info "임시 파일이 정리되었습니다."
fi

# 6. 복구 검증
log_info "복구 검증 중..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'work_diary', COUNT(*) FROM work_diary
UNION ALL
SELECT 'local_events', COUNT(*) FROM local_events
UNION ALL
SELECT 'project_events', COUNT(*) FROM project_events;
"

# 7. 외래키 제약조건 검증
log_info "외래키 제약조건 검증 중..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
SELECT 
    'work_diary' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN user_id IN (SELECT id FROM users) THEN 1 END) as valid_user_refs,
    COUNT(CASE WHEN project_id IN (SELECT id FROM projects) OR project_id IS NULL THEN 1 END) as valid_project_refs
FROM work_diary
UNION ALL
SELECT 
    'local_events',
    COUNT(*),
    COUNT(CASE WHEN participant_id IN (SELECT id FROM users) THEN 1 END),
    COUNT(CASE WHEN project_id IN (SELECT id FROM projects) OR project_id IS NULL THEN 1 END)
FROM local_events
UNION ALL
SELECT 
    'project_events',
    COUNT(*),
    0,
    COUNT(CASE WHEN project_id IN (SELECT id FROM projects) THEN 1 END)
FROM project_events;
"

log_success "데이터베이스 복구가 성공적으로 완료되었습니다!"
log_info "복구 전 백업: $CURRENT_BACKUP"
log_info "복구된 백업: $BACKUP_PATH"
