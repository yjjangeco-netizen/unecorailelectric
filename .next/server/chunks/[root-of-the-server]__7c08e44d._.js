module.exports = {

"[project]/.next-internal/server/app/api/test/search/route/actions.js [app-rsc] (server actions loader, ecmascript)": ((__turbopack_context__) => {

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
"[project]/src/app/api/test/search/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "GET": ()=>GET,
    "POST": ()=>POST
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
async function POST(request) {
    try {
        const body = await request.json();
        const { query, category, minPrice, maxPrice, inStock } = body;
        // 입력값 검증
        if (!query || query.length < 1) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: false,
                error: '검색어가 비어있습니다'
            }, {
                status: 400
            });
        }
        if (query.length > 200) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: false,
                error: '검색어가 너무 깁니다 (200자 이하)'
            }, {
                status: 400
            });
        }
        // 테스트용 더미 데이터
        const dummyResults = [
            {
                id: '1',
                name: '테스트 품목 1',
                specification: '규격 A',
                unit_price: 5000,
                current_quantity: 100,
                total_amount: 500000,
                category: '전기자재',
                stock_status: 'normal'
            },
            {
                id: '2',
                name: '테스트 품목 2',
                specification: '규격 B',
                unit_price: 3000,
                current_quantity: 50,
                total_amount: 150000,
                category: '전기자재',
                stock_status: 'normal'
            }
        ];
        // 검색어에 따라 결과 필터링
        const filteredResults = dummyResults.filter((item)=>item.name.toLowerCase().includes(query.toLowerCase()) || item.specification.toLowerCase().includes(query.toLowerCase()) || item.category.toLowerCase().includes(query.toLowerCase()));
        // 검색 통계 계산
        const totalQuantity = filteredResults.reduce((sum, item)=>sum + (item.current_quantity || 0), 0);
        const totalValue = filteredResults.reduce((sum, item)=>sum + (item.total_amount || 0), 0);
        const averagePrice = filteredResults.length > 0 ? totalValue / totalQuantity : 0;
        // 카테고리별 분포
        const categoryDistribution = filteredResults.reduce((acc, item)=>{
            const cat = item.category || '미분류';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {});
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: true,
            message: '검색 완료 (테스트 데이터)',
            data: {
                query,
                category,
                minPrice,
                maxPrice,
                inStock,
                resultCount: filteredResults.length,
                totalQuantity,
                totalValue,
                averagePrice: Math.round(averagePrice),
                categoryDistribution,
                results: filteredResults,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('검색 테스트 오류:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: false,
            error: '검색 중 오류가 발생했습니다',
            details: error instanceof Error ? error.message : '알 수 없는 오류'
        }, {
            status: 500
        });
    }
}
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        // GET 요청용 간단한 검색
        if (!query || query.length < 1) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: false,
                error: '검색어가 비어있습니다'
            }, {
                status: 400
            });
        }
        // 테스트용 더미 데이터
        const dummyResults = [
            {
                id: '1',
                name: '테스트 품목 1',
                specification: '규격 A',
                unit_price: 5000,
                current_quantity: 100,
                total_amount: 500000,
                category: '전기자재',
                stock_status: 'normal'
            },
            {
                id: '2',
                name: '테스트 품목 2',
                specification: '규격 B',
                unit_price: 3000,
                current_quantity: 50,
                total_amount: 150000,
                category: '전기자재',
                stock_status: 'normal'
            }
        ];
        // 검색어에 따라 결과 필터링
        const filteredResults = dummyResults.filter((item)=>item.name.toLowerCase().includes(query.toLowerCase()) || item.specification.toLowerCase().includes(query.toLowerCase()) || item.category.toLowerCase().includes(query.toLowerCase()));
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: true,
            message: '검색 완료 (테스트 데이터)',
            data: {
                query,
                resultCount: filteredResults.length,
                totalQuantity: filteredResults.reduce((sum, item)=>sum + (item.current_quantity || 0), 0),
                totalValue: filteredResults.reduce((sum, item)=>sum + (item.total_amount || 0), 0),
                results: filteredResults,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('검색 테스트 오류:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: false,
            error: '검색 중 오류가 발생했습니다',
            details: error instanceof Error ? error.message : '알 수 없는 오류'
        }, {
            status: 500
        });
    }
}
}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__7c08e44d._.js.map