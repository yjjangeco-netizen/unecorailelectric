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
"[project]/src/app/api/test/search/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "GET": ()=>GET,
    "POST": ()=>POST
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-route] (ecmascript)");
;
;
async function POST(request) {
    try {
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerSupabaseClient"])();
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
        // 검색 쿼리 구성
        let searchQuery = supabase.from('current_stock').select('*');
        // 품명, 규격, 분류에서 검색
        searchQuery = searchQuery.or(`name.ilike.%${query}%,specification.ilike.%${query}%,category.ilike.%${query}%`);
        // 카테고리 필터
        if (category && category !== '전체') {
            searchQuery = searchQuery.eq('category', category);
        }
        // 가격 범위 필터
        if (minPrice !== undefined && minPrice > 0) {
            searchQuery = searchQuery.gte('unit_price', minPrice);
        }
        if (maxPrice !== undefined && maxPrice > 0) {
            searchQuery = searchQuery.lte('unit_price', maxPrice);
        }
        // 재고 상태 필터
        if (inStock !== undefined) {
            if (inStock) {
                searchQuery = searchQuery.gt('current_quantity', 0);
            } else {
                searchQuery = searchQuery.eq('current_quantity', 0);
            }
        }
        // 검색 실행
        const { data: searchResults, error: searchError } = await searchQuery.order('name').limit(100);
        if (searchError) {
            throw new Error(`검색 실행 실패: ${searchError.message}`);
        }
        // 검색 통계 계산
        const totalQuantity = searchResults?.reduce((sum, item)=>sum + (item.current_quantity || 0), 0) || 0;
        const totalValue = searchResults?.reduce((sum, item)=>sum + (item.total_amount || 0), 0) || 0;
        const averagePrice = searchResults && searchResults.length > 0 ? totalValue / totalQuantity : 0;
        // 카테고리별 분포
        const categoryDistribution = searchResults?.reduce((acc, item)=>{
            const cat = item.category || '미분류';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {}) || {};
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: true,
            message: '검색 완료',
            data: {
                query,
                category,
                minPrice,
                maxPrice,
                inStock,
                resultCount: searchResults?.length || 0,
                totalQuantity,
                totalValue,
                averagePrice: Math.round(averagePrice),
                categoryDistribution,
                results: searchResults || [],
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('검색 테스트 오류:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: false,
            error: '검색 처리 중 오류가 발생했습니다.',
            details: error instanceof Error ? error.message : '알 수 없는 오류'
        }, {
            status: 500
        });
    }
}
async function GET(request) {
    try {
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerSupabaseClient"])();
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const category = searchParams.get('category') || '';
        const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')) : undefined;
        const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')) : undefined;
        const inStock = searchParams.get('inStock') === 'true';
        if (!query) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: false,
                error: '검색어가 필요합니다'
            }, {
                status: 400
            });
        }
        // 검색 쿼리 구성
        let searchQuery = supabase.from('current_stock').select('*');
        // 품명, 규격, 분류에서 검색
        searchQuery = searchQuery.or(`name.ilike.%${query}%,specification.ilike.%${query}%,category.ilike.%${query}%`);
        // 카테고리 필터
        if (category && category !== '전체') {
            searchQuery = searchQuery.eq('category', category);
        }
        // 가격 범위 필터
        if (minPrice !== undefined && minPrice > 0) {
            searchQuery = searchQuery.gte('unit_price', minPrice);
        }
        if (maxPrice !== undefined && maxPrice > 0) {
            searchQuery = searchQuery.lte('unit_price', maxPrice);
        }
        // 재고 상태 필터
        if (inStock !== undefined) {
            if (inStock) {
                searchQuery = searchQuery.gt('current_quantity', 0);
            } else {
                searchQuery = searchQuery.eq('current_quantity', 0);
            }
        }
        // 검색 실행
        const { data: searchResults, error: searchError } = await searchQuery.order('name').limit(50);
        if (searchError) {
            throw new Error(`검색 실행 실패: ${searchError.message}`);
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: true,
            message: '검색 완료',
            data: {
                query,
                resultCount: searchResults?.length || 0,
                results: searchResults || [],
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('검색 테스트 오류:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: false,
            error: '검색 처리 중 오류가 발생했습니다.',
            details: error instanceof Error ? error.message : '알 수 없는 오류'
        }, {
            status: 500
        });
    }
}
}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__43ecc241._.js.map