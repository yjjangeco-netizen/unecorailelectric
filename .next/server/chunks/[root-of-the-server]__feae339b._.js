module.exports = {

"[project]/.next-internal/server/app/api/test/stock-in/route/actions.js [app-rsc] (server actions loader, ecmascript)": ((__turbopack_context__) => {

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
"[project]/src/app/api/test/stock-in/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
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
        const { itemName, quantity, unitPrice, notes, conditionType, reason, orderedBy, receivedBy } = body;
        // 입력값 검증
        if (!itemName || itemName.length < 1) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: false,
                error: '품목명이 비어있습니다'
            }, {
                status: 400
            });
        }
        if (quantity <= 0 || quantity > 999999) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: false,
                error: '수량이 유효하지 않습니다 (1~999,999)'
            }, {
                status: 400
            });
        }
        if (unitPrice < 0 || unitPrice > 999999999) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: false,
                error: '단가가 유효하지 않습니다 (0~999,999,999)'
            }, {
                status: 400
            });
        }
        // 총 금액 계산
        const totalAmount = quantity * unitPrice;
        if (totalAmount > 999999999999) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: false,
                error: '총 금액이 너무 큽니다'
            }, {
                status: 400
            });
        }
        // 기존 품목 확인
        const { data: existingItem } = await supabase.from('items').select('*').eq('name', itemName).single();
        let itemId;
        let newItem = false;
        if (existingItem) {
            // 기존 품목 업데이트
            itemId = existingItem.id;
            const { error: updateError } = await supabase.from('items').update({
                unit_price: unitPrice,
                updated_at: new Date().toISOString()
            }).eq('id', itemId);
            if (updateError) {
                throw new Error(`품목 업데이트 실패: ${updateError.message}`);
            }
        } else {
            // 새 품목 생성
            const newItemData = {
                id: `item_${Date.now()}`,
                name: itemName,
                specification: itemName,
                maker: '미정',
                unit_price: unitPrice,
                purpose: '재고입고',
                min_stock: 0,
                category: '일반',
                description: notes || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            const { data: insertedItem, error: insertError } = await supabase.from('items').insert(newItemData).select().single();
            if (insertError) {
                throw new Error(`새 품목 생성 실패: ${insertError.message}`);
            }
            itemId = insertedItem.id;
            newItem = true;
        }
        // 입고 기록 생성
        const stockInData = {
            id: `stock_in_${Date.now()}`,
            item_id: itemId,
            quantity,
            unit_price: unitPrice,
            condition_type: conditionType || 'new',
            reason: reason || '테스트 입고',
            ordered_by: orderedBy || '테스트',
            received_by: receivedBy || '테스트',
            received_at: new Date().toISOString()
        };
        const { error: stockInError } = await supabase.from('stock_in').insert(stockInData);
        if (stockInError) {
            throw new Error(`입고 기록 생성 실패: ${stockInError.message}`);
        }
        // 현재 재고 업데이트
        const { data: currentStock } = await supabase.from('current_stock').select('*').eq('name', itemName).single();
        if (currentStock) {
            // 기존 재고 수량 증가
            const newQuantity = currentStock.current_quantity + quantity;
            const newTotalAmount = newQuantity * unitPrice;
            const { error: updateStockError } = await supabase.from('current_stock').update({
                current_quantity: newQuantity,
                total_amount: newTotalAmount,
                unit_price: unitPrice,
                updated_at: new Date().toISOString()
            }).eq('id', currentStock.id);
            if (updateStockError) {
                throw new Error(`재고 업데이트 실패: ${updateStockError.message}`);
            }
        } else {
            // 새 재고 생성
            const newStockData = {
                id: `stock_${Date.now()}`,
                name: itemName,
                specification: itemName,
                unit_price: unitPrice,
                current_quantity: quantity,
                total_amount: totalAmount,
                notes: notes || '테스트 입고',
                category: '일반',
                stock_status: 'normal'
            };
            const { error: insertStockError } = await supabase.from('current_stock').insert(newStockData);
            if (insertStockError) {
                throw new Error(`새 재고 생성 실패: ${insertStockError.message}`);
            }
        }
        // 재고 이력 생성
        const stockHistoryData = {
            id: `history_${Date.now()}`,
            item_id: itemId,
            action_type: 'stock_in',
            quantity_change: quantity,
            previous_quantity: currentStock ? currentStock.current_quantity : 0,
            new_quantity: currentStock ? currentStock.current_quantity + quantity : quantity,
            unit_price: unitPrice,
            total_amount_change: totalAmount,
            notes: `테스트 입고: ${notes || ''}`,
            performed_by: receivedBy || '테스트',
            performed_at: new Date().toISOString()
        };
        const { error: historyError } = await supabase.from('stock_history').insert(stockHistoryData);
        if (historyError) {
            console.warn('이력 생성 경고:', historyError.message);
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: true,
            message: newItem ? '새 품목 입고 완료' : '기존 품목 입고 완료',
            data: {
                itemId,
                itemName,
                quantity,
                unitPrice,
                totalAmount,
                newItem,
                stockInId: stockInData.id,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('입고 테스트 오류:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: false,
            error: '입고 처리 중 오류가 발생했습니다.',
            details: error instanceof Error ? error.message : '알 수 없는 오류'
        }, {
            status: 500
        });
    }
}
}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__feae339b._.js.map