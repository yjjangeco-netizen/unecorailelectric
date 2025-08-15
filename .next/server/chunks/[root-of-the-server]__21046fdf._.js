module.exports = {

"[project]/.next-internal/server/app/api/test/run-all/route/actions.js [app-rsc] (server actions loader, ecmascript)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
}}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/stream [external] (stream, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}}),
"[externals]/http [external] (http, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}}),
"[externals]/url [external] (url, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}}),
"[externals]/punycode [external] (punycode, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("punycode", () => require("punycode"));

module.exports = mod;
}}),
"[externals]/https [external] (https, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}}),
"[externals]/zlib [external] (zlib, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}}),
"[project]/src/lib/supabase.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "createBrowserSupabaseClient": ()=>createBrowserSupabaseClient,
    "createServerSupabaseClient": ()=>createServerSupabaseClient,
    "supabase": ()=>supabase
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/module/index.js [app-route] (ecmascript) <locals>");
;
// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'example-key';
// 개발 환경에서는 기본값 사용, 프로덕션에서는 환경변수 필수
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
const createBrowserSupabaseClient = ()=>{
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    });
};
const createServerSupabaseClient = ()=>{
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};
const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});
}),
"[project]/src/app/api/test/run-all/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "POST": ()=>POST
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-route] (ecmascript)");
;
;
async function POST() {
    try {
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerSupabaseClient"])();
        const testResults = [];
        const startTime = Date.now();
        // 1. 테스트 데이터 생성
        console.log('🧪 1. 테스트 데이터 생성 시작...');
        const testItems = [
            {
                id: 'test_item_1',
                name: '전기 케이블 3C 2.5sq',
                specification: '3C 2.5sq',
                maker: 'LS전선',
                unit_price: 2500,
                purpose: '전기 배선',
                min_stock: 100,
                category: '전기자재',
                description: '테스트용 전기 케이블',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 'test_item_2',
                name: '배선용 차단기 20A',
                specification: '20A 1P',
                maker: 'LS산전',
                unit_price: 15000,
                purpose: '전기 보호',
                min_stock: 50,
                category: '전기자재',
                description: '테스트용 차단기',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];
        // 품목 데이터 삽입
        for (const item of testItems){
            const { error } = await supabase.from('items').upsert(item, {
                onConflict: 'id'
            });
            if (error) {
                throw new Error(`품목 데이터 삽입 실패: ${error.message}`);
            }
        }
        // 현재 재고 데이터 생성
        const testCurrentStock = [
            {
                id: 'test_stock_1',
                name: '전기 케이블 3C 2.5sq',
                specification: '3C 2.5sq',
                unit_price: 2500,
                current_quantity: 500,
                total_amount: 1250000,
                notes: '테스트 재고',
                category: '전기자재',
                stock_status: 'normal'
            },
            {
                id: 'test_stock_2',
                name: '배선용 차단기 20A',
                specification: '20A 1P',
                unit_price: 15000,
                current_quantity: 100,
                total_amount: 1500000,
                notes: '테스트 재고',
                category: '전기자재',
                stock_status: 'normal'
            }
        ];
        for (const stock of testCurrentStock){
            const { error } = await supabase.from('current_stock').upsert(stock, {
                onConflict: 'id'
            });
            if (error) {
                throw new Error(`재고 데이터 삽입 실패: ${error.message}`);
            }
        }
        testResults.push({
            test: '데이터 생성',
            status: 'success',
            message: '테스트 데이터 생성 완료',
            details: {
                items: testItems.length,
                stock: testCurrentStock.length
            }
        });
        // 2. 입고 기능 테스트
        console.log('📥 2. 입고 기능 테스트 시작...');
        const stockInData = {
            itemName: 'LED 조명 20W',
            quantity: 200,
            unitPrice: 8000,
            notes: '테스트 입고',
            conditionType: 'new',
            reason: '테스트 사유',
            orderedBy: '테스트 주문자',
            receivedBy: '테스트 입고자'
        };
        const stockInResponse = await fetch('http://localhost:3000/api/test/stock-in', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(stockInData)
        });
        if (stockInResponse.ok) {
            const stockInResult = await stockInResponse.json();
            testResults.push({
                test: '입고 기능',
                status: 'success',
                message: '입고 테스트 성공',
                details: stockInResult.data
            });
        } else {
            testResults.push({
                test: '입고 기능',
                status: 'error',
                message: '입고 테스트 실패',
                details: {
                    error: await stockInResponse.text()
                }
            });
        }
        // 3. 출고 기능 테스트
        console.log('📤 3. 출고 기능 테스트 시작...');
        const stockOutData = {
            itemId: 'test_stock_1',
            quantity: 50,
            project: '테스트 프로젝트',
            notes: '테스트 출고',
            isRental: false,
            issuedBy: '테스트 출고자'
        };
        const stockOutResponse = await fetch('http://localhost:3000/api/test/stock-out', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(stockOutData)
        });
        if (stockOutResponse.ok) {
            const stockOutResult = await stockOutResponse.json();
            testResults.push({
                test: '출고 기능',
                status: 'success',
                message: '출고 테스트 성공',
                details: stockOutResult.data
            });
        } else {
            testResults.push({
                test: '출고 기능',
                status: 'error',
                message: '출고 테스트 실패',
                details: {
                    error: await stockOutResponse.text()
                }
            });
        }
        // 4. 폐기 기능 테스트
        console.log('🗑️ 4. 폐기 기능 테스트 시작...');
        const disposalData = {
            itemId: 'test_stock_2',
            quantity: 10,
            reason: '테스트 폐기',
            notes: '테스트 폐기 비고',
            disposedBy: '테스트 폐기자'
        };
        const disposalResponse = await fetch('http://localhost:3000/api/test/disposal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(disposalData)
        });
        if (disposalResponse.ok) {
            const disposalResult = await disposalResponse.json();
            testResults.push({
                test: '폐기 기능',
                status: 'success',
                message: '폐기 테스트 성공',
                details: disposalResult.data
            });
        } else {
            testResults.push({
                test: '폐기 기능',
                status: 'error',
                message: '폐기 테스트 실패',
                details: {
                    error: await disposalResponse.text()
                }
            });
        }
        // 5. 검색 기능 테스트
        console.log('🔍 5. 검색 기능 테스트 시작...');
        const searchData = {
            query: '전기',
            category: '전기자재',
            minPrice: 1000,
            maxPrice: 20000,
            inStock: true
        };
        const searchResponse = await fetch('http://localhost:3000/api/test/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(searchData)
        });
        if (searchResponse.ok) {
            const searchResult = await searchResponse.json();
            testResults.push({
                test: '검색 기능',
                status: 'success',
                message: '검색 테스트 성공',
                details: searchResult.data
            });
        } else {
            testResults.push({
                test: '검색 기능',
                status: 'error',
                message: '검색 테스트 실패',
                details: {
                    error: await searchResponse.text()
                }
            });
        }
        // 6. 재고 계산 테스트
        console.log('🧮 6. 재고 계산 테스트 시작...');
        const { data: currentStock } = await supabase.from('current_stock').select('*').eq('id', 'test_stock_1').single();
        if (currentStock) {
            const expectedQuantity = 500 - 50 // 초기 500개 - 출고 50개
            ;
            const expectedAmount = expectedQuantity * currentStock.unit_price;
            if (currentStock.current_quantity === expectedQuantity && currentStock.total_amount === expectedAmount) {
                testResults.push({
                    test: '재고 계산',
                    status: 'success',
                    message: '재고 계산 정확성 검증 성공',
                    details: {
                        expectedQuantity,
                        actualQuantity: currentStock.current_quantity,
                        expectedAmount,
                        actualAmount: currentStock.total_amount
                    }
                });
            } else {
                testResults.push({
                    test: '재고 계산',
                    status: 'error',
                    message: '재고 계산 정확성 검증 실패',
                    details: {
                        expectedQuantity,
                        actualQuantity: currentStock.current_quantity,
                        expectedAmount,
                        actualAmount: currentStock.total_amount
                    }
                });
            }
        }
        // 7. 데이터 무결성 테스트
        console.log('🔒 7. 데이터 무결성 테스트 시작...');
        const { data: allStock } = await supabase.from('current_stock').select('*');
        let integrityErrors = 0;
        let integritySuccess = 0;
        if (allStock) {
            for (const stock of allStock){
                // 음수 재고 체크
                if (stock.current_quantity < 0) {
                    integrityErrors++;
                }
                // 총액 계산 정확성 체크
                const calculatedAmount = stock.current_quantity * stock.unit_price;
                if (Math.abs(calculatedAmount - stock.total_amount) > 0.01) {
                    integrityErrors++;
                } else {
                    integritySuccess++;
                }
            }
        }
        testResults.push({
            test: '데이터 무결성',
            status: integrityErrors === 0 ? 'success' : 'warning',
            message: `데이터 무결성 검증 완료 (성공: ${integritySuccess}, 오류: ${integrityErrors})`,
            details: {
                success: integritySuccess,
                errors: integrityErrors
            }
        });
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        // 테스트 요약
        const successCount = testResults.filter((r)=>r.status === 'success').length;
        const errorCount = testResults.filter((r)=>r.status === 'error').length;
        const warningCount = testResults.filter((r)=>r.status === 'warning').length;
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: true,
            message: '통합 테스트 완료',
            summary: {
                totalTests: testResults.length,
                successCount,
                errorCount,
                warningCount,
                totalTime: `${totalTime}ms`,
                successRate: `${Math.round(successCount / testResults.length * 100)}%`
            },
            results: testResults,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('통합 테스트 오류:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: false,
            error: '통합 테스트 실행 중 오류가 발생했습니다.',
            details: error instanceof Error ? error.message : '알 수 없는 오류'
        }, {
            status: 500
        });
    }
}
}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__21046fdf._.js.map