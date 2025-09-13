// 정렬 문제 즉시 해결 스크립트
// 브라우저 DevTools 콘솔에서 실행하세요

console.log('🔧 정렬 문제 해결 시작...')

// 1. 현재 저장된 정렬 관련 값들 확인
console.log('\n📋 현재 저장된 정렬 관련 값들:')
for (const k in localStorage) {
  if (/(order|sort)/i.test(k)) {
    console.log(`  ${k}: ${localStorage[k]}`)
  }
}

// 2. 정렬 관련 키들 모두 제거
const keysToRemove = [
  'order', 'sort', 'inv.order', 'inv.sort', 
  'items.order', 'items.sort', 'inv:items:orderBy', 'inv-order-by',
  'stock.order', 'stock.sort', 'stock.orderBy'
]

console.log('\n🗑️ 제거할 키들:')
keysToRemove.forEach(key => {
  if (localStorage.getItem(key)) {
    console.log(`  ${key}: ${localStorage.getItem(key)} → 제거됨`)
    localStorage.removeItem(key)
  }
})

// 3. name이 포함된 모든 키 찾아서 제거
console.log('\n🔍 name이 포함된 키들 검색:')
for (const key in localStorage) {
  const value = localStorage.getItem(key)
  if (value && value.includes('name')) {
    console.log(`  ${key}: ${value} → 제거됨 (name 포함)`)
    localStorage.removeItem(key)
  }
}

// 4. 세션스토리지도 확인
console.log('\n📋 세션스토리지 정렬 관련 값들:')
for (const k in sessionStorage) {
  if (/(order|sort)/i.test(k)) {
    console.log(`  ${k}: ${sessionStorage[k]}`)
    if (sessionStorage[k].includes('name')) {
      sessionStorage.removeItem(k)
      console.log(`    → 제거됨 (name 포함)`)
    }
  }
}

// 5. 정리 완료 확인
console.log('\n✅ 정리 완료!')
console.log('이제 페이지를 새로고침(F5)하세요.')
console.log('Network 탭에서 요청이 ?order=product.asc로 나가는지 확인하세요.')

// 6. 추가 안전망: URL 쿼리 파라미터도 확인
if (window.location.search.includes('name')) {
  console.log('\n⚠️ URL에 name이 포함되어 있습니다!')
  console.log('현재 URL:', window.location.href)
  console.log('수동으로 URL을 수정하거나 페이지를 새로고침하세요.')
}
