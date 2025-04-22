(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push(["static/chunks/src_638ea39d._.js", {

"[project]/src/components/D3ConfusionMatrix.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>D3ConfusionMatrix)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2f$src$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/d3/src/index.js [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$selection$2f$src$2f$select$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__select$3e$__ = __turbopack_context__.i("[project]/node_modules/d3-selection/src/select.js [app-client] (ecmascript) <export default as select>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$scale$2f$src$2f$sequential$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__scaleSequential$3e$__ = __turbopack_context__.i("[project]/node_modules/d3-scale/src/sequential.js [app-client] (ecmascript) <export default as scaleSequential>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$scale$2d$chromatic$2f$src$2f$sequential$2d$single$2f$Blues$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__interpolateBlues$3e$__ = __turbopack_context__.i("[project]/node_modules/d3-scale-chromatic/src/sequential-single/Blues.js [app-client] (ecmascript) <export default as interpolateBlues>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$array$2f$src$2f$max$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__max$3e$__ = __turbopack_context__.i("[project]/node_modules/d3-array/src/max.js [app-client] (ecmascript) <export default as max>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function D3ConfusionMatrix({ data, labels, title, width = 500, height = 500, cellSize = 40, minCellSize = 20, maxCellSize = 60 }) {
    _s();
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "D3ConfusionMatrix.useEffect": ()=>{
            if (!ref.current || !data?.length || !labels?.length) return;
            // Validate dimensions
            const safeWidth = Math.max(100, width || 500);
            const safeHeight = Math.max(100, height || 500);
            const containerWidth = ref.current?.clientWidth || safeWidth;
            const containerHeight = ref.current?.clientHeight || safeHeight;
            const calculatedCellSize = Math.min(Math.max(minCellSize || 20, Math.min(containerWidth, containerHeight) / Math.max(data.length, data[0]?.length || 1)), maxCellSize || 60);
            const safeCellSize = Math.max(10, cellSize || calculatedCellSize);
            // Clear previous render
            ref.current.innerHTML = '';
            const margin = {
                top: 30,
                right: 30,
                bottom: 30,
                left: 30
            };
            const innerWidth = safeWidth - margin.left - margin.right;
            const innerHeight = safeHeight - margin.top - margin.bottom;
            const svg = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$selection$2f$src$2f$select$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__select$3e$__["select"])(ref.current).append('svg').attr('width', safeWidth).attr('height', safeHeight).append('g').attr('transform', `translate(${margin.left},${margin.top})`);
            // Color scale
            const colorScale = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$scale$2f$src$2f$sequential$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__scaleSequential$3e$__["scaleSequential"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$scale$2d$chromatic$2f$src$2f$sequential$2d$single$2f$Blues$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__interpolateBlues$3e$__["interpolateBlues"]).domain([
                0,
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$array$2f$src$2f$max$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__max$3e$__["max"])(data.flat()) || 1
            ]);
            // Create matrix
            svg.selectAll('g').data(data).enter().append('g').selectAll('rect').data({
                "D3ConfusionMatrix.useEffect": (d, i)=>d.map({
                        "D3ConfusionMatrix.useEffect": (value, j)=>({
                                value,
                                x: j,
                                y: i
                            })
                    }["D3ConfusionMatrix.useEffect"])
            }["D3ConfusionMatrix.useEffect"]).enter().append('rect').attr('x', {
                "D3ConfusionMatrix.useEffect": (d)=>d.x * safeCellSize
            }["D3ConfusionMatrix.useEffect"]).attr('y', {
                "D3ConfusionMatrix.useEffect": (d)=>d.y * safeCellSize
            }["D3ConfusionMatrix.useEffect"]).attr('width', safeCellSize - 1).attr('height', safeCellSize - 1).style('fill', {
                "D3ConfusionMatrix.useEffect": (d)=>colorScale(d.value)
            }["D3ConfusionMatrix.useEffect"]).style('stroke', '#fff');
            // Add labels
            svg.selectAll('.row-label').data(labels).enter().append('text').attr('x', -5).attr('y', {
                "D3ConfusionMatrix.useEffect": (d, i)=>i * safeCellSize + safeCellSize / 2
            }["D3ConfusionMatrix.useEffect"]).style('text-anchor', 'end').style('fill', '#e5e7eb').text({
                "D3ConfusionMatrix.useEffect": (d)=>d
            }["D3ConfusionMatrix.useEffect"]);
            svg.selectAll('.col-label').data(labels).enter().append('text').attr('y', -5).attr('x', {
                "D3ConfusionMatrix.useEffect": (d, i)=>i * safeCellSize + safeCellSize / 2
            }["D3ConfusionMatrix.useEffect"]).style('text-anchor', 'middle').style('fill', '#e5e7eb').text({
                "D3ConfusionMatrix.useEffect": (d)=>d
            }["D3ConfusionMatrix.useEffect"]);
        }
    }["D3ConfusionMatrix.useEffect"], [
        data,
        labels,
        width,
        height,
        cellSize,
        minCellSize,
        maxCellSize
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative h-full w-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "text-lg font-medium text-blue-200 mb-2",
                children: title
            }, void 0, false, {
                fileName: "[project]/src/components/D3ConfusionMatrix.tsx",
                lineNumber: 101,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: ref
            }, void 0, false, {
                fileName: "[project]/src/components/D3ConfusionMatrix.tsx",
                lineNumber: 102,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/D3ConfusionMatrix.tsx",
        lineNumber: 100,
        columnNumber: 5
    }, this);
}
_s(D3ConfusionMatrix, "8uVE59eA/r6b92xF80p7sH8rXLk=");
_c = D3ConfusionMatrix;
var _c;
__turbopack_context__.k.register(_c, "D3ConfusionMatrix");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/services/dummyDbService.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "getBusinessUnits": (()=>getBusinessUnits),
    "getErrorData": (()=>getErrorData),
    "getKPIs": (()=>getKPIs),
    "getUseCases": (()=>getUseCases)
});
async function getBusinessUnits() {
    const response = await fetch('/api/businessUnits');
    return await response.json();
}
async function getUseCases(businessUnit) {
    const response = await fetch(`/api/useCases?businessUnit=${businessUnit}`);
    return await response.json();
}
async function getKPIs(mode) {
    const response = await fetch(`/api/metrics?mode=${mode}`);
    const data = await response.json();
    return data.map((item)=>({
            rowKey: item.rowKey,
            value: item.value,
            ...item.status && {
                status: item.status
            }
        }));
}
async function getErrorData() {
    const response = await fetch('/api/errors');
    const data = await response.json();
    return data.map((item)=>({
            timePeriod: item.timePeriod,
            meanPrediction: item.meanPrediction,
            error: item.error,
            exceedsThreshold: item.exceedsThreshold
        }));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/app/mode4/page.tsx [app-client] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, k: __turbopack_refresh__, m: module, e: exports } = __turbopack_context__;
{
const e = new Error(`Could not parse module '[project]/src/app/mode4/page.tsx'

Expected ';', got 'ConfusionMatrixData'`);
e.code = 'MODULE_UNPARSEABLE';
throw e;}}),
}]);

//# sourceMappingURL=src_638ea39d._.js.map