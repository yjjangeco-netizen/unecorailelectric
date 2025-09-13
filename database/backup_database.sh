#!/bin/bash

# =============================================
# 데이터베이스 백업 스크립트
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

# 사용법 출력
usage() {
    echo "사용법: $0 [옵션]"
    echo ""
    echo "옵션:"
    echo "  -f, --full        전체 데이터베이스 백업 (기본값)"
    echo "  -t, --table       테이블별 백업"
    echo "  -d, --data-only   데이터만 백업 (스키마 제외)"
    echo "  -s, --schema-only 스키마만 백업 (데이터 제외)"
    echo "  -c, --compress    압축 백업"
    echo "  -h, --help        도움말 표시"
    echo ""
    echo "예시:"
    echo "  $0                    # 전체 백업"
    echo "  $0 -t                 # 테이블별 백업"
    echo "  $0 -c                 # 압축 백업"
    echo "  $0 -d -c              # 데이터만 압축 백업"
    exit 1
}

# 기본 옵션
BACKUP_TYPE="full"
COMPRESS=false
DATA_ONLY=false
SCHEMA_ONLY=false
TABLE_BY_TABLE=false

# 옵션 파싱
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--full)
            BACKUP_TYPE="full"
            shift
            ;;
        -t|--table)
            BACKUP_TYPE="table"
            TABLE_BY_TABLE=true
            shift
            ;;
        -d|--data-only)
            DATA_ONLY=true
            shift
            ;;
        -s|--schema-only)
            SCHEMA_ONLY=true
            shift
            ;;
        -c|--compress)
            COMPRESS=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            log_error "알 수 없는 옵션: $1"
            usage
            ;;
    esac
done

# 데이터베이스 존재 확인
log_info "데이터베이스 존재 확인 중..."
if ! psql -h $DB_HOST -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    log_error "데이터베이스 '$DB_NAME'이 존재하지 않습니다."
    exit 1
fi

log_success "데이터베이스 '$DB_NAME'이 확인되었습니다."

# 백업 옵션 설정
BACKUP_OPTIONS=""
if [ "$DATA_ONLY" = true ]; then
    BACKUP_OPTIONS="$BACKUP_OPTIONS --data-only"
    log_info "데이터만 백업합니다."
elif [ "$SCHEMA_ONLY" = true ]; then
    BACKUP_OPTIONS="$BACKUP_OPTIONS --schema-only"
    log_info "스키마만 백업합니다."
fi

# 1. 전체 데이터베이스 백업
if [ "$BACKUP_TYPE" = "full" ]; then
    log_info "전체 데이터베이스 백업 중..."
    BACKUP_FILE="$BACKUP_DIR/full_backup_$DATE.sql"
    
    pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME $BACKUP_OPTIONS > $BACKUP_FILE
    
    if [ $? -eq 0 ]; then
        log_success "전체 백업이 완료되었습니다: $BACKUP_FILE"
        
        if [ "$COMPRESS" = true ]; then
            log_info "백업 파일 압축 중..."
            gzip $BACKUP_FILE
            log_success "압축 완료: $BACKUP_FILE.gz"
        fi
    else
        log_error "전체 백업에 실패했습니다."
        exit 1
    fi
fi

# 2. 테이블별 백업
if [ "$TABLE_BY_TABLE" = true ]; then
    log_info "테이블별 백업 중..."
    
    # 테이블 목록 가져오기
    TABLES=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';")
    
    for table in $TABLES; do
        table=$(echo $table | xargs) # 공백 제거
        if [ ! -z "$table" ]; then
            log_info "테이블 '$table' 백업 중..."
            BACKUP_FILE="$BACKUP_DIR/table_${table}_$DATE.sql"
            
            pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -t $table $BACKUP_OPTIONS > $BACKUP_FILE
            
            if [ $? -eq 0 ]; then
                log_success "테이블 '$table' 백업 완료: $BACKUP_FILE"
                
                if [ "$COMPRESS" = true ]; then
                    gzip $BACKUP_FILE
                    log_success "압축 완료: $BACKUP_FILE.gz"
                fi
            else
                log_error "테이블 '$table' 백업에 실패했습니다."
            fi
        fi
    done
fi

# 3. 백업 파일 정보 출력
log_info "백업 파일 정보:"
ls -lah $BACKUP_DIR/*$DATE* 2>/dev/null | while read line; do
    echo "  $line"
done

# 4. 오래된 백업 파일 정리 (30일 이상)
log_info "오래된 백업 파일 정리 중..."
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
log_success "30일 이상 된 백업 파일이 정리되었습니다."

# 5. 백업 검증
log_info "백업 검증 중..."
if [ "$BACKUP_TYPE" = "full" ]; then
    BACKUP_FILE="$BACKUP_DIR/full_backup_$DATE.sql"
    if [ "$COMPRESS" = true ]; then
        BACKUP_FILE="$BACKUP_FILE.gz"
        if gunzip -t $BACKUP_FILE 2>/dev/null; then
            log_success "압축된 백업 파일이 유효합니다."
        else
            log_error "압축된 백업 파일이 손상되었습니다."
        fi
    else
        if pg_restore --list $BACKUP_FILE > /dev/null 2>&1; then
            log_success "백업 파일이 유효합니다."
        else
            log_error "백업 파일이 손상되었습니다."
        fi
    fi
fi

# 6. 백업 통계
TOTAL_SIZE=$(du -sh $BACKUP_DIR | cut -f1)
BACKUP_COUNT=$(ls $BACKUP_DIR/*$DATE* 2>/dev/null | wc -l)

echo ""
echo "============================================="
echo "백업 완료 통계"
echo "============================================="
echo "백업 시간: $(date)"
echo "백업 파일 수: $BACKUP_COUNT"
echo "총 백업 크기: $TOTAL_SIZE"
echo "백업 디렉토리: $BACKUP_DIR"
echo "============================================="

log_success "데이터베이스 백업이 완료되었습니다!"
