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
"[project]/src/app/api/test/run-all/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "POST": ()=>POST
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
async function POST() {
    try {
        const testResults = [];
        const startTime = Date.now();
        // 1. 테스트 데이터 생성 (더미)
        console.log('🧪 1. 테스트 데이터 생성 시작...');
        testResults.push({
            test: '데이터 생성',
            status: 'success',
            message: '테스트 데이터 생성 완료 (더미)',
            details: {
                items: 2,
                stock: 2
            }
        });
        // 2. 입고 기능 테스트 (더미)
        console.log('📥 2. 입고 기능 테스트 시작...');
        testResults.push({
            test: '입고 기능',
            status: 'success',
            message: '입고 기능 테스트 완료 (더미)',
            details: {
                itemName: 'LED 조명 20W',
                quantity: 200,
                unitPrice: 8000,
                totalAmount: 1600000
            }
        });
        // 3. 출고 기능 테스트 (더미)
        console.log('📤 3. 출고 기능 테스트 시작...');
        testResults.push({
            test: '출고 기능',
            status: 'success',
            message: '출고 기능 테스트 완료 (더미)',
            details: {
                itemId: 'test_item_1',
                quantity: 50,
                project: '테스트 프로젝트',
                previousQuantity: 500,
                newQuantity: 450
            }
        });
        // 4. 폐기 기능 테스트 (더미)
        console.log('🗑️ 4. 폐기 기능 테스트 시작...');
        testResults.push({
            test: '폐기 기능',
            status: 'success',
            message: '폐기 기능 테스트 완료 (더미)',
            details: {
                itemId: 'test_item_2',
                quantity: 10,
                reason: '테스트 폐기',
                previousQuantity: 100,
                newQuantity: 90
            }
        });
        // 5. 검색 기능 테스트 (더미)
        console.log('🔍 5. 검색 기능 테스트 시작...');
        testResults.push({
            test: '검색 기능',
            status: 'success',
            message: '검색 기능 테스트 완료 (더미)',
            details: {
                query: '전기',
                resultCount: 2,
                totalQuantity: 600,
                totalValue: 2750000
            }
        });
        // 6. 재고 계산 테스트 (더미)
        console.log('🧮 6. 재고 계산 테스트 시작...');
        testResults.push({
            test: '재고 계산',
            status: 'success',
            message: '재고 계산 테스트 완료 (더미)',
            details: {
                totalItems: 2,
                calculationSuccess: 2,
                calculationErrors: 0
            }
        });
        // 7. 데이터 무결성 테스트 (더미)
        console.log('🔒 7. 데이터 무결성 테스트 시작...');
        testResults.push({
            test: '데이터 무결성',
            status: 'success',
            message: '데이터 무결성 테스트 완료 (더미)',
            details: {
                totalItems: 2,
                integritySuccess: 2,
                integrityErrors: 0,
                integrityRate: '100%'
            }
        });
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        // 결과 요약
        const successCount = testResults.filter((r)=>r.status === 'success').length;
        const errorCount = testResults.filter((r)=>r.status === 'error').length;
        const successRate = testResults.length > 0 ? successCount / testResults.length * 100 : 0;
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: true,
            message: '전체 테스트 완료 (더미 데이터)',
            data: {
                totalTests: testResults.length,
                successCount,
                errorCount,
                successRate: `${successRate.toFixed(1)}%`,
                totalTime: `${totalTime}ms`,
                results: testResults,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('전체 테스트 오류:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: false,
            error: '전체 테스트 실행 중 오류가 발생했습니다',
            details: error instanceof Error ? error.message : '알 수 없는 오류'
        }, {
            status: 500
        });
    }
}
}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__9e2b347b._.js.map