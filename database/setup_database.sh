#!/bin/bash

# =============================================
# 데이터베이스 설정 및 초기화 스크립트
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
DATE=$(date +%Y%m%d_%H%M%S)

# 백업 디렉토리 생성
mkdir -p $BACKUP_DIR

log_info "데이터베이스 설정을 시작합니다..."

# 1. 기존 데이터베이스 백업 (존재하는 경우)
log_info "기존 데이터베이스 백업 중..."
if psql -h $DB_HOST -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_DIR/backup_before_setup_$DATE.sql
    log_success "기존 데이터베이스가 백업되었습니다: $BACKUP_DIR/backup_before_setup_$DATE.sql"
else
    log_warning "기존 데이터베이스가 존재하지 않습니다."
fi

# 2. 데이터베이스 생성
log_info "데이터베이스 생성 중..."
psql -h $DB_HOST -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;"
psql -h $DB_HOST -U $DB_USER -c "CREATE DATABASE $DB_NAME;"

if [ $? -eq 0 ]; then
    log_success "데이터베이스 '$DB_NAME'이 생성되었습니다."
else
    log_error "데이터베이스 생성에 실패했습니다."
    exit 1
fi

# 3. 테이블 생성
log_info "테이블 생성 중..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f create_tables.sql

if [ $? -eq 0 ]; then
    log_success "테이블이 생성되었습니다."
else
    log_error "테이블 생성에 실패했습니다."
    exit 1
fi

# 4. 샘플 데이터 삽입
log_info "샘플 데이터 삽입 중..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f sample_data.sql

if [ $? -eq 0 ]; then
    log_success "샘플 데이터가 삽입되었습니다."
else
    log_error "샘플 데이터 삽입에 실패했습니다."
    exit 1
fi

# 5. 데이터 검증
log_info "데이터 검증 중..."
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

# 6. 최종 백업 생성
log_info "최종 백업 생성 중..."
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_DIR/initial_setup_$DATE.sql
gzip $BACKUP_DIR/initial_setup_$DATE.sql

log_success "데이터베이스 설정이 완료되었습니다!"
log_info "백업 파일: $BACKUP_DIR/initial_setup_$DATE.sql.gz"

# 7. 연결 정보 출력
echo ""
echo "============================================="
echo "데이터베이스 연결 정보"
echo "============================================="
echo "호스트: $DB_HOST"
echo "포트: $DB_PORT"
echo "데이터베이스: $DB_NAME"
echo "사용자: $DB_USER"
echo "============================================="
echo ""

# 8. 다음 단계 안내
echo "다음 단계:"
echo "1. 환경 변수 설정 (.env 파일)"
echo "2. 애플리케이션 실행"
echo "3. 데이터베이스 연결 테스트"
echo ""

log_success "설정 완료!"
