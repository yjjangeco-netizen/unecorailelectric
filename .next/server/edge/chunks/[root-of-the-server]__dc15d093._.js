(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push(["chunks/[root-of-the-server]__dc15d093._.js", {

"[externals]/node:buffer [external] (node:buffer, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}}),
"[project]/src/middleware.ts [middleware-edge] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "config": ()=>config,
    "middleware": ()=>middleware
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/spec-extension/response.js [middleware-edge] (ecmascript)");
;
function middleware(_request) {
    const response = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    // 보안 헤더 설정
    const securityHeaders = {
        // XSS 방지
        'X-XSS-Protection': '1; mode=block',
        // MIME 타입 스니핑 방지
        'X-Content-Type-Options': 'nosniff',
        // 클릭재킹 방지
        'X-Frame-Options': 'SAMEORIGIN',
        // 리퍼러 정책
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        // 권한 정책
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
        // HSTS (HTTPS 강제)
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    };
    // CSP (Content Security Policy) 설정
    const cspDirectives = [
        // 기본 소스 제한
        "default-src 'self'",
        // 스크립트 소스 (자체 도메인 + Supabase)
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://pnmyxzgyeipbvvnnwtoi.supabase.co",
        // 스타일 소스
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        // 폰트 소스
        "font-src 'self' https://fonts.gstatic.com",
        // 이미지 소스
        "img-src 'self' data: https: blob:",
        // 연결 소스 (Supabase API)
        "connect-src 'self' https://pnmyxzgyeipbvvnnwtoi.supabase.co https://*.supabase.co",
        // 프레임 소스 제한
        "frame-ancestors 'self'",
        // 객체 소스 제한
        "object-src 'none'",
        // 기본 URI 제한
        "base-uri 'self'",
        // 폼 액션 제한
        "form-action 'self'",
        // 업그레이드 인시큐어 요청
        "upgrade-insecure-requests"
    ];
    // 헤더 적용
    Object.entries(securityHeaders).forEach(([key, value])=>{
        response.headers.set(key, value);
    });
    // CSP 헤더 설정
    response.headers.set('Content-Security-Policy', cspDirectives.join('; '));
    return response;
}
const config = {
    matcher: [
        /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */ '/((?!api|_next/static|_next/image|favicon.ico).*)'
    ]
};
}),
}]);

//# sourceMappingURL=%5Broot-of-the-server%5D__dc15d093._.js.map