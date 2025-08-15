const CHUNK_PUBLIC_PATH = "server/app/api/test/run-all/route.js";
const runtime = require("../../../../chunks/[turbopack]_runtime.js");
runtime.loadChunk("server/chunks/node_modules_next_dfa43a8f._.js");
runtime.loadChunk("server/chunks/[root-of-the-server]__9e2b347b._.js");
runtime.getOrInstantiateRuntimeModule("[project]/.next-internal/server/app/api/test/run-all/route/actions.js [app-rsc] (server actions loader, ecmascript)", CHUNK_PUBLIC_PATH);
runtime.getOrInstantiateRuntimeModule("[project]/node_modules/next/dist/esm/build/templates/app-route.js { INNER_APP_ROUTE => \"[project]/src/app/api/test/run-all/route.ts [app-route] (ecmascript)\" } [app-route] (ecmascript)", CHUNK_PUBLIC_PATH);
module.exports = runtime.getOrInstantiateRuntimeModule("[project]/node_modules/next/dist/esm/build/templates/app-route.js { INNER_APP_ROUTE => \"[project]/src/app/api/test/run-all/route.ts [app-route] (ecmascript)\" } [app-route] (ecmascript)", CHUNK_PUBLIC_PATH).exports;
