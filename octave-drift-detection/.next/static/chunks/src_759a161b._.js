(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push(["static/chunks/src_759a161b._.js", {

"[project]/src/components/D3ConfusionMatrix.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2f$src$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/d3/src/index.js [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$scale$2f$src$2f$band$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__scaleBand$3e$__ = __turbopack_context__.i("[project]/node_modules/d3-scale/src/band.js [app-client] (ecmascript) <export default as scaleBand>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$array$2f$src$2f$max$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__max$3e$__ = __turbopack_context__.i("[project]/node_modules/d3-array/src/max.js [app-client] (ecmascript) <export default as max>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$scale$2f$src$2f$sequential$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__scaleSequential$3e$__ = __turbopack_context__.i("[project]/node_modules/d3-scale/src/sequential.js [app-client] (ecmascript) <export default as scaleSequential>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$scale$2d$chromatic$2f$src$2f$sequential$2d$single$2f$Blues$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__interpolateBlues$3e$__ = __turbopack_context__.i("[project]/node_modules/d3-scale-chromatic/src/sequential-single/Blues.js [app-client] (ecmascript) <export default as interpolateBlues>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$selection$2f$src$2f$select$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__select$3e$__ = __turbopack_context__.i("[project]/node_modules/d3-selection/src/select.js [app-client] (ecmascript) <export default as select>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$axis$2f$src$2f$axis$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/d3-axis/src/axis.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const D3ConfusionMatrix = ({ data, labels, title, width, height })=>{
    _s();
    const svgRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "D3ConfusionMatrix.useEffect": ()=>{
            if (!data.length || !svgRef.current) return;
            // --- margins around the matrix, in pixels
            const margin = {
                top: title ? 30 : 10,
                right: 10,
                bottom: 10,
                left: 10
            };
            // total SVG coordinate size
            const totalWidth = width + margin.left + margin.right;
            const totalHeight = height + margin.top + margin.bottom;
            // scales for cells
            const xScale = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$scale$2f$src$2f$band$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__scaleBand$3e$__["scaleBand"])().domain(labels).range([
                0,
                width
            ]).padding(0.05);
            const yScale = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$scale$2f$src$2f$band$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__scaleBand$3e$__["scaleBand"])().domain(labels).range([
                0,
                height
            ]).padding(0.05);
            // color ramp
            const maxVal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$array$2f$src$2f$max$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__max$3e$__["max"])(data.flat()) ?? 1;
            const colorScale = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$scale$2f$src$2f$sequential$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__scaleSequential$3e$__["scaleSequential"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$scale$2d$chromatic$2f$src$2f$sequential$2d$single$2f$Blues$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__interpolateBlues$3e$__["interpolateBlues"]).domain([
                0,
                maxVal
            ]);
            // set up the SVG
            const svg = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$selection$2f$src$2f$select$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__select$3e$__["select"])(svgRef.current);
            svg.selectAll("*").remove();
            svg.attr("viewBox", `0 0 ${totalWidth} ${totalHeight}`);
            // optional title
            if (title) {
                svg.append("text").attr("x", totalWidth / 2).attr("y", margin.top / 2).attr("text-anchor", "middle").style("fill", "white").style("font-size", "14px").text(title);
            }
            // container for everything, offset by margin
            const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
            // draw cells + numbers
            data.forEach({
                "D3ConfusionMatrix.useEffect": (row, i)=>{
                    row.forEach({
                        "D3ConfusionMatrix.useEffect": (val, j)=>{
                            // raw positions in the inner 0..width / 0..height
                            const rx = xScale(labels[j]);
                            const ry = yScale(labels[i]);
                            const rw = xScale.bandwidth();
                            const rh = yScale.bandwidth();
                            // round to integers so that both rect and text align perfectly
                            const x = Math.round(rx);
                            const y = Math.round(ry);
                            const w = Math.round(rw);
                            const h = Math.round(rh);
                            // background rect
                            g.append("rect").attr("x", x).attr("y", y).attr("width", w).attr("height", h).attr("fill", colorScale(val)).attr("stroke", "#334155").attr("stroke-width", 0.5);
                            // centered text
                            g.append("text").attr("x", x + w / 2).attr("y", y + h / 2).attr("text-anchor", "middle").attr("dominant-baseline", "middle").style("font-size", `${Math.floor(Math.min(w, h) * 0.4)}px`).attr("fill", val > maxVal / 2 ? "white" : "black").text(val);
                        }
                    }["D3ConfusionMatrix.useEffect"]);
                }
            }["D3ConfusionMatrix.useEffect"]);
            // X axis (top)
            g.append("g").attr("transform", `translate(0,0)`).call((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$axis$2f$src$2f$axis$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["axisTop"])(xScale).tickSize(0)).selectAll("text").style("font-size", "10px").attr("dy", "-0.3em");
            // Y axis (left)
            g.append("g").attr("transform", `translate(0,0)`).call((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$d3$2d$axis$2f$src$2f$axis$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["axisLeft"])(yScale).tickSize(0)).selectAll("text").style("font-size", "10px").attr("dx", "-0.3em");
            // remove domain lines
            g.selectAll(".domain").remove();
            // axis labels
            g.append("text").attr("x", width / 2).attr("y", -margin.top / 2).attr("text-anchor", "middle").style("fill", "#94a3b8").style("font-size", "12px").text("Predicted");
            g.append("text").attr("transform", `translate(${-margin.left / 2},${height / 2}) rotate(-90)`).attr("text-anchor", "middle").style("fill", "#94a3b8").style("font-size", "12px").text("Actual");
        }
    }["D3ConfusionMatrix.useEffect"], [
        data,
        labels,
        title,
        width,
        height
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        ref: svgRef,
        width: "100%",
        height: "100%",
        preserveAspectRatio: "xMidYMid meet"
    }, void 0, false, {
        fileName: "[project]/src/components/D3ConfusionMatrix.tsx",
        lineNumber: 146,
        columnNumber: 5
    }, this);
};
_s(D3ConfusionMatrix, "89Ty783ABEwsfMbSOeu9vscWF34=");
_c = D3ConfusionMatrix;
const __TURBOPACK__default__export__ = D3ConfusionMatrix;
var _c;
__turbopack_context__.k.register(_c, "D3ConfusionMatrix");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/services/backendService2.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// services/backendService2.ts
__turbopack_context__.s({
    "fetchData": (()=>fetchData)
});
async function fetchData() {
    try {
        console.log("Fetching data from backend via relative URL: /mode3/data");
        const response = await fetch(`/mode3/data`, {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const rawData = await response.json();
        console.log("Parsed data:", rawData);
        // 1) Build KPIs
        const kpis = [
            {
                rowKey: "Drift Detected",
                value: rawData.drift_state?.drift_detected ? "Yes" : "No",
                status: rawData.drift_state?.drift_detected ? "Alert" : "Normal"
            },
            {
                rowKey: "Jensen–Shannon Divergence",
                value: rawData.drift_state?.jensen_shannon_divergence ? rawData.drift_state.jensen_shannon_divergence.toFixed(4) : "N/A",
                status: "Normal"
            },
            {
                rowKey: "Population Stability Index",
                value: rawData.drift_state?.population_stability_index ? rawData.drift_state.population_stability_index.toFixed(4) : "N/A",
                status: "Normal"
            },
            {
                rowKey: "Precision (Reference)",
                value: rawData.metrics?.reference?.precision ? rawData.metrics.reference.precision.toFixed(4) : "N/A",
                status: "Normal"
            },
            {
                rowKey: "Precision (Current)",
                value: rawData.metrics?.current?.precision ? rawData.metrics.current.precision.toFixed(4) : "N/A",
                status: "Normal"
            },
            {
                rowKey: "Recall (Reference)",
                value: rawData.metrics?.reference?.recall ? rawData.metrics.reference.recall.toFixed(4) : "N/A",
                status: "Normal"
            },
            {
                rowKey: "Recall (Current)",
                value: rawData.metrics?.current?.recall ? rawData.metrics.current.recall.toFixed(4) : "N/A",
                status: "Normal"
            },
            {
                rowKey: "F1 Score (Reference)",
                value: rawData.metrics?.reference?.f1_score ? rawData.metrics.reference.f1_score.toFixed(4) : "N/A",
                status: "Normal"
            },
            {
                rowKey: "F1 Score (Current)",
                value: rawData.metrics?.current?.f1_score ? rawData.metrics.current.f1_score.toFixed(4) : "N/A",
                status: "Normal"
            },
            {
                rowKey: "Accuracy",
                value: rawData.overall_metrics?.accuracy != null ? rawData.overall_metrics.accuracy.toFixed(2) : "N/A",
                status: "Normal"
            },
            {
                rowKey: "Error Rate",
                value: rawData.overall_metrics?.error_rate != null ? rawData.overall_metrics.error_rate.toFixed(2) : "N/A",
                status: "Normal"
            },
            {
                rowKey: "Status",
                value: rawData.drift_state?.drift_detected ? "Warning" : "Normal",
                status: rawData.drift_state?.drift_detected ? "Warning" : "Normal"
            }
        ];
        // 2) Pull both reference & current confusion-matrices
        const referenceMatrix = rawData.confusion_matrices?.reference ?? rawData.confusion_matrix?.normalized ?? rawData.confusion_matrix?.raw ?? [];
        const currentMatrix = rawData.confusion_matrices?.current ?? rawData.confusion_matrix?.normalized ?? rawData.confusion_matrix?.raw ?? [];
        // 3) Flatten referenceMatrix into plotData
        const plotData = [];
        referenceMatrix.forEach((row, y)=>row.forEach((val, x)=>plotData.push({
                    x,
                    y,
                    value: val,
                    exceedsThreshold: false
                })));
        // 4) Table of misclassified cases
        const tableData = (rawData.misclassified_table || []).map((item)=>({
                id: item.id,
                timePeriod: `True ${item.True} → Pred ${item.Predicted}`,
                status: "Misclassified"
            }));
        // 5) Outlets (we no longer need them—but still return for backward compatibility)
        const outletsExceedingThreshold = (rawData.outlets_exceeding_threshold || []).map((item)=>({
                id: item.id?.toString() || "",
                y_true: item.y_true || 0,
                y_pred: item.y_pred || 0,
                percentage_error: item.percentage_error || 0
            }));
        // 6) Detailed metrics
        const detailedMetrics = rawData.detailed_metrics || {};
        // 7) Other fields
        return {
            kpis,
            errors: {
                plotData,
                tableData
            },
            referenceMatrix,
            currentMatrix,
            outletsExceedingThreshold,
            detailedMetrics,
            state: rawData.state || "Unknown",
            coverage: rawData.coverage || {},
            clusters: rawData.clusters || {},
            backwardAnalysis: rawData.backward_analysis || {},
            currentPeriod: rawData.current_period || "N/A",
            totalOutlets: rawData.total_outlets || 0,
            outletsExceedingThresholdCount: rawData.outlets_exceeding_threshold_count || 0,
            xaiExplanation: rawData.explanation || "No explanation available"
        };
    } catch (error) {
        console.error("Error fetching data:", error);
        throw new Error("Failed to fetch and process data");
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/app/mode3/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>Mode3Page)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$noop$2d$head$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/components/noop-head.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$D3ConfusionMatrix$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/D3ConfusionMatrix.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-alert.js [app-client] (ecmascript) <export default as AlertCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-client] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-check-big.js [app-client] (ecmascript) <export default as CheckCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/refresh-cw.js [app-client] (ecmascript) <export default as RefreshCw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/info.js [app-client] (ecmascript) <export default as Info>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/chart.js/dist/chart.mjs [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/chart.js/dist/chart.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$backendService2$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/backendService2.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$markdown$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__Markdown__as__default$3e$__ = __turbopack_context__.i("[project]/node_modules/react-markdown/lib/index.js [app-client] (ecmascript) <export Markdown as default>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Chart"].register(...__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["registerables"]);
function Mode3Page() {
    _s();
    // --- FILTER STATES ---
    const [businessUnit, setBusinessUnit] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [useCase, setUseCase] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [shortCode, setShortCode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [alertKeeperValue, setAlertKeeperValue] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [runtimeValue, setRuntimeValue] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    // --- CORE DATA STATES ---
    const [kpis, setKpis] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [errors, setErrors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        plotData: [],
        tableData: []
    });
    const [referenceMatrix, setReferenceMatrix] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [currentMatrix, setCurrentMatrix] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [detailedMetrics, setDetailedMetrics] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [xaiExplanation, setXaiExplanation] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("No explanation available");
    const [backendError, setBackendError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    // --- CLASS ACCURACY STATE ---
    const [selectedClass, setSelectedClass] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    // --- HELPERS ---
    const makeLabels = (n)=>Array.from({
            length: n
        }, (_, i)=>i.toString());
    const computeSquareSize = (grid)=>{
        const maxPx = 300;
        const rows = grid.length, cols = grid[0]?.length || 0;
        if (!rows || !cols) return maxPx;
        const cellSize = Math.min(maxPx / rows, maxPx / cols);
        return Math.max(rows, cols) * cellSize;
    };
    const getStatusIcon = (s)=>{
        if (!s) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__["Info"], {
            className: "h-5 w-5 text-gray-400"
        }, void 0, false, {
            fileName: "[project]/src/app/mode3/page.tsx",
            lineNumber: 59,
            columnNumber: 20
        }, this);
        switch(s.toLowerCase()){
            case "warning":
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                    className: "h-5 w-5 text-amber-400"
                }, void 0, false, {
                    fileName: "[project]/src/app/mode3/page.tsx",
                    lineNumber: 61,
                    columnNumber: 30
                }, this);
            case "error":
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                    className: "h-5 w-5 text-rose-500"
                }, void 0, false, {
                    fileName: "[project]/src/app/mode3/page.tsx",
                    lineNumber: 62,
                    columnNumber: 30
                }, this);
            case "success":
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"], {
                    className: "h-5 w-5 text-emerald-400"
                }, void 0, false, {
                    fileName: "[project]/src/app/mode3/page.tsx",
                    lineNumber: 63,
                    columnNumber: 30
                }, this);
            default:
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__["Info"], {
                    className: "h-5 w-5 text-sky-400"
                }, void 0, false, {
                    fileName: "[project]/src/app/mode3/page.tsx",
                    lineNumber: 64,
                    columnNumber: 30
                }, this);
        }
    };
    const getStatusColor = (s)=>{
        if (!s) return "text-gray-400";
        switch(s.toLowerCase()){
            case "warning":
                return "text-amber-400";
            case "error":
                return "text-rose-500";
            case "success":
                return "text-emerald-400";
            default:
                return "text-sky-400";
        }
    };
    // --- FETCH DATA ---
    const initData = async ()=>{
        setLoading(true);
        setBackendError(null);
        try {
            const { kpis: fetchedKpis, errors: fetchedErrors, referenceMatrix: fetchedRefM, currentMatrix: fetchedCurrM, detailedMetrics: fetchedDetailed, xaiExplanation: fetchedXai } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$backendService2$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchData"])();
            setKpis(fetchedKpis);
            setErrors(fetchedErrors);
            setReferenceMatrix(fetchedRefM);
            setCurrentMatrix(fetchedCurrM);
            setDetailedMetrics(fetchedDetailed);
            setXaiExplanation(fetchedXai);
            const classes = Object.keys(fetchedDetailed);
            if (classes.length) setSelectedClass(classes[0]);
        } catch (err) {
            console.error(err);
            setBackendError(err instanceof Error ? err.message : "Unknown error");
        } finally{
            setLoading(false);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Mode3Page.useEffect": ()=>{
            initData();
        }
    }["Mode3Page.useEffect"], []);
    // --- CHART RENDERING WITH DESTROY LOGIC ---
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Mode3Page.useEffect": ()=>{
            if (loading) return;
            // Full status distribution
            const pieCanvas = document.getElementById("statusPieChart");
            if (pieCanvas) {
                const existing = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Chart"].getChart(pieCanvas);
                if (existing) existing.destroy();
                new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Chart"](pieCanvas, {
                    type: "pie",
                    data: {
                        labels: [
                            "Good",
                            "Warning",
                            "Error"
                        ],
                        datasets: [
                            {
                                data: [
                                    kpis.filter({
                                        "Mode3Page.useEffect": (k)=>k.status === "success"
                                    }["Mode3Page.useEffect"]).length,
                                    kpis.filter({
                                        "Mode3Page.useEffect": (k)=>k.status === "warning"
                                    }["Mode3Page.useEffect"]).length,
                                    kpis.filter({
                                        "Mode3Page.useEffect": (k)=>k.status === "error"
                                    }["Mode3Page.useEffect"]).length
                                ],
                                backgroundColor: [
                                    "rgba(52, 211, 153, 0.8)",
                                    "rgba(251, 191, 36, 0.8)",
                                    "rgba(239,  68, 68, 0.8)"
                                ],
                                borderColor: [
                                    "rgba(52, 211, 153, 1)",
                                    "rgba(251, 191, 36, 1)",
                                    "rgba(239,  68, 68, 1)"
                                ],
                                borderWidth: 1
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: "right",
                                labels: {
                                    color: "#e5e7eb",
                                    font: {
                                        size: 14
                                    },
                                    generateLabels: {
                                        "Mode3Page.useEffect": (chart)=>chart.data.labels.map({
                                                "Mode3Page.useEffect": (label, i)=>({
                                                        text: `${label}: ${chart.data.datasets[0].data[i]} pts`,
                                                        fillStyle: chart.data.datasets[0].backgroundColor[i],
                                                        strokeStyle: chart.data.datasets[0].borderColor[i],
                                                        lineWidth: 1,
                                                        hidden: false,
                                                        index: i
                                                    })
                                            }["Mode3Page.useEffect"])
                                    }["Mode3Page.useEffect"]
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: {
                                        "Mode3Page.useEffect": (ctx)=>`${ctx.label}: ${ctx.raw}`
                                    }["Mode3Page.useEffect"]
                                }
                            }
                        }
                    }
                });
            }
            // Per-class Correct vs Incorrect
            const classCanvas = document.getElementById("classAccuracyChart");
            if (classCanvas && selectedClass) {
                const existing2 = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Chart"].getChart(classCanvas);
                if (existing2) existing2.destroy();
                const dm = detailedMetrics[selectedClass];
                new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Chart"](classCanvas, {
                    type: "pie",
                    data: {
                        labels: [
                            "Correct",
                            "Incorrect"
                        ],
                        datasets: [
                            {
                                data: [
                                    dm.correct_predictions.count,
                                    dm.incorrect_predictions.count
                                ],
                                backgroundColor: [
                                    "rgba(52,211,153,0.8)",
                                    "rgba(239,68,68,0.8)"
                                ],
                                borderColor: [
                                    "rgba(52,211,153,1)",
                                    "rgba(239,68,68,1)"
                                ],
                                borderWidth: 1
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: "right",
                                labels: {
                                    color: "#e5e7eb",
                                    font: {
                                        size: 14
                                    },
                                    generateLabels: {
                                        "Mode3Page.useEffect": (chart)=>chart.data.labels.map({
                                                "Mode3Page.useEffect": (label, i)=>({
                                                        text: `${label}: ${chart.data.datasets[0].data[i]}`,
                                                        fillStyle: chart.data.datasets[0].backgroundColor[i],
                                                        strokeStyle: chart.data.datasets[0].borderColor[i],
                                                        lineWidth: 1,
                                                        hidden: false,
                                                        index: i
                                                    })
                                            }["Mode3Page.useEffect"])
                                    }["Mode3Page.useEffect"]
                                }
                            }
                        }
                    }
                });
            }
        }
    }["Mode3Page.useEffect"], [
        loading,
        selectedClass,
        detailedMetrics,
        kpis
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-gradient-to-b from-gray-950 to-gray-900 min-h-screen",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$noop$2d$head$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("title", {
                    children: "Mode 3 | CL Dashboard"
                }, void 0, false, {
                    fileName: "[project]/src/app/mode3/page.tsx",
                    lineNumber: 217,
                    columnNumber: 13
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/mode3/page.tsx",
                lineNumber: 217,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "container mx-auto px-4 py-8",
                children: [
                    backendError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-rose-950/40 border border-rose-800/60 rounded-lg p-4 mb-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                                        className: "h-5 w-5 text-rose-400 mr-2"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode3/page.tsx",
                                        lineNumber: 223,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-rose-300 font-medium",
                                        children: backendError
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode3/page.tsx",
                                        lineNumber: 224,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode3/page.tsx",
                                lineNumber: 222,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: initData,
                                className: "mt-2 inline-flex items-center gap-2 px-4 py-2 bg-rose-800/50 text-white rounded text-sm",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                                        className: "h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode3/page.tsx",
                                        lineNumber: 230,
                                        columnNumber: 15
                                    }, this),
                                    " Retry"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode3/page.tsx",
                                lineNumber: 226,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/mode3/page.tsx",
                        lineNumber: 221,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col md:flex-row justify-between mb-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-sky-600",
                                children: "OCTAVE – CL Dashboard"
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode3/page.tsx",
                                lineNumber: 237,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: initData,
                                className: "mt-4 md:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-sky-800/40 text-white rounded",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                                        className: "h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode3/page.tsx",
                                        lineNumber: 244,
                                        columnNumber: 13
                                    }, this),
                                    " Refresh"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode3/page.tsx",
                                lineNumber: 240,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/mode3/page.tsx",
                        lineNumber: 236,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "lg:col-span-2 bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-6 rounded border border-sky-800/30",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm text-sky-300",
                                                    children: "Business Unit:"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 253,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-lg text-white",
                                                    children: loading ? "Loading…" : businessUnit || "N/A"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 254,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "mt-4 text-sm text-sky-300",
                                                    children: "Use Case:"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 255,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-lg text-white",
                                                    children: loading ? "Loading…" : useCase || "N/A"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 256,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/mode3/page.tsx",
                                            lineNumber: 252,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm text-sky-300",
                                                    children: "Short Code:"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 259,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-lg text-white",
                                                    children: loading ? "Loading…" : shortCode || "N/A"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 260,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "mt-4 text-sm text-sky-300",
                                                    children: "Alert Keeper:"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 261,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-lg text-white",
                                                    children: loading ? "Loading…" : alertKeeperValue || "N/A"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 262,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/mode3/page.tsx",
                                            lineNumber: 258,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/mode3/page.tsx",
                                    lineNumber: 251,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode3/page.tsx",
                                lineNumber: 250,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-6 rounded border border-sky-800/30",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-sky-300",
                                        children: "Runtime"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode3/page.tsx",
                                        lineNumber: 267,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        className: "mt-1 w-full bg-gray-800/80 border border-sky-700/50 rounded p-2 text-white",
                                        value: runtimeValue,
                                        onChange: (e)=>setRuntimeValue(Number(e.target.value)),
                                        children: [
                                            1,
                                            2,
                                            3,
                                            4
                                        ].map((n)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: n,
                                                children: n
                                            }, n, false, {
                                                fileName: "[project]/src/app/mode3/page.tsx",
                                                lineNumber: 273,
                                                columnNumber: 35
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode3/page.tsx",
                                        lineNumber: 268,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode3/page.tsx",
                                lineNumber: 266,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/mode3/page.tsx",
                        lineNumber: 249,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6",
                        children: [
                            [
                                {
                                    title: "Reference Matrix",
                                    grid: referenceMatrix
                                },
                                {
                                    title: "Current Matrix",
                                    grid: currentMatrix
                                }
                            ].map(({ title, grid }, idx)=>{
                                const side = computeSquareSize(grid);
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-gray-900/80 p-6 rounded border border-gray-700/50 text-center",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-sky-600 mb-4",
                                            children: title
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/mode3/page.tsx",
                                            lineNumber: 287,
                                            columnNumber: 17
                                        }, this),
                                        !loading && grid.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                width: side + 40,
                                                height: side + 40
                                            },
                                            className: "mx-auto",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$D3ConfusionMatrix$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                data: grid,
                                                labels: makeLabels(grid[0].length),
                                                width: side,
                                                height: side
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode3/page.tsx",
                                                lineNumber: 292,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/mode3/page.tsx",
                                            lineNumber: 291,
                                            columnNumber: 19
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex justify-center items-center h-48",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                                                className: "animate-spin h-8 w-8 text-sky-500"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode3/page.tsx",
                                                lineNumber: 296,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/mode3/page.tsx",
                                            lineNumber: 295,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, idx, true, {
                                    fileName: "[project]/src/app/mode3/page.tsx",
                                    lineNumber: 286,
                                    columnNumber: 15
                                }, this);
                            }),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-6 rounded border border-sky-800/30",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-sky-300 mb-2",
                                        children: "Select Class:"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode3/page.tsx",
                                        lineNumber: 305,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        className: "w-full bg-gray-800/80 border border-sky-700/50 rounded p-2 mb-4 text-white",
                                        value: selectedClass,
                                        onChange: (e)=>setSelectedClass(e.target.value),
                                        children: Object.keys(detailedMetrics).map((cls)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: cls,
                                                children: cls
                                            }, cls, false, {
                                                fileName: "[project]/src/app/mode3/page.tsx",
                                                lineNumber: 312,
                                                columnNumber: 17
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode3/page.tsx",
                                        lineNumber: 306,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-48",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                                            id: "classAccuracyChart"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/mode3/page.tsx",
                                            lineNumber: 316,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode3/page.tsx",
                                        lineNumber: 315,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode3/page.tsx",
                                lineNumber: 304,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/mode3/page.tsx",
                        lineNumber: 279,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-gray-900/80 p-6 rounded border border-gray-700/50 mb-6 overflow-x-auto",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-sky-600 mb-4",
                                children: "Detailed Metrics by Class"
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode3/page.tsx",
                                lineNumber: 323,
                                columnNumber: 11
                            }, this),
                            loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-center py-12",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                                    className: "animate-spin h-8 w-8 text-sky-500"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/mode3/page.tsx",
                                    lineNumber: 328,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode3/page.tsx",
                                lineNumber: 327,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                className: "min-w-full divide-y divide-gray-700/50",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                        className: "bg-gray-800/60",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    className: "px-4 py-2 text-sky-300 text-left",
                                                    children: "Class"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 334,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    className: "px-4 py-2 text-sky-300 text-left",
                                                    children: "Total"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 335,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    className: "px-4 py-2 text-sky-300 text-left",
                                                    children: "Correct"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 336,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    className: "px-4 py-2 text-sky-300 text-left",
                                                    children: "Incorrect"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 337,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    className: "px-4 py-2 text-sky-300 text-left",
                                                    children: "Misclassifications"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 338,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/mode3/page.tsx",
                                            lineNumber: 333,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode3/page.tsx",
                                        lineNumber: 332,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                        className: "bg-gray-800/30 divide-y divide-gray-700/50",
                                        children: Object.entries(detailedMetrics).map(([cls, dm])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                className: "hover:bg-gray-700/30",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-2 text-white",
                                                        children: cls
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/mode3/page.tsx",
                                                        lineNumber: 344,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-2",
                                                        children: dm.total_samples
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/mode3/page.tsx",
                                                        lineNumber: 345,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-2 text-emerald-400",
                                                        children: [
                                                            dm.correct_predictions.count,
                                                            " (",
                                                            dm.correct_predictions.percentage.toFixed(1),
                                                            "%)"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/mode3/page.tsx",
                                                        lineNumber: 346,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-2 text-rose-400",
                                                        children: [
                                                            dm.incorrect_predictions.count,
                                                            " (",
                                                            dm.incorrect_predictions.percentage.toFixed(1),
                                                            "%)"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/mode3/page.tsx",
                                                        lineNumber: 349,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-2 text-gray-300",
                                                        children: Object.entries(dm.misclassifications).map(([p, m])=>`${p}: ${m.count} (${m.percentage.toFixed(1)}%)`).join(", ")
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/mode3/page.tsx",
                                                        lineNumber: 352,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, cls, true, {
                                                fileName: "[project]/src/app/mode3/page.tsx",
                                                lineNumber: 343,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode3/page.tsx",
                                        lineNumber: 341,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode3/page.tsx",
                                lineNumber: 331,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/mode3/page.tsx",
                        lineNumber: 322,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-gray-900/80 p-6 rounded border border-gray-700/50 mb-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-sky-600 mb-4",
                                children: "Key Performance Indicators"
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode3/page.tsx",
                                lineNumber: 366,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-1 md:grid-cols-5 gap-4",
                                children: kpis.map((kpi)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-gradient-to-br from-sky-950/40 to-sky-900/20 p-4 rounded border border-sky-800/30",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-sky-300",
                                                children: kpi.rowKey
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode3/page.tsx",
                                                lineNumber: 372,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center mt-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "w-8 h-8 flex items-center justify-center mr-2",
                                                        children: getStatusIcon(kpi.status)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/mode3/page.tsx",
                                                        lineNumber: 374,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: `text-xl font-semibold ${getStatusColor(kpi.status)}`,
                                                        children: loading ? "…" : kpi.value
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/mode3/page.tsx",
                                                        lineNumber: 377,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/mode3/page.tsx",
                                                lineNumber: 373,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, kpi.rowKey, true, {
                                        fileName: "[project]/src/app/mode3/page.tsx",
                                        lineNumber: 371,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode3/page.tsx",
                                lineNumber: 369,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/mode3/page.tsx",
                        lineNumber: 365,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-gray-900/80 p-6 rounded border border-gray-700/50 mb-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-sky-600 mb-4",
                                children: "XAI Result"
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode3/page.tsx",
                                lineNumber: 388,
                                columnNumber: 11
                            }, this),
                            loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-center py-8",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                                    className: "animate-spin h-8 w-8 text-sky-500"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/mode3/page.tsx",
                                    lineNumber: 393,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode3/page.tsx",
                                lineNumber: 392,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "prose prose-invert prose-sky",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$markdown$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__Markdown__as__default$3e$__["default"], {
                                    children: xaiExplanation
                                }, void 0, false, {
                                    fileName: "[project]/src/app/mode3/page.tsx",
                                    lineNumber: 397,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode3/page.tsx",
                                lineNumber: 396,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/mode3/page.tsx",
                        lineNumber: 387,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-gray-900/80 p-6 rounded border border-gray-700/50 max-h-96 overflow-y-auto",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-sky-600 mb-4",
                                children: "Misclassified Table"
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode3/page.tsx",
                                lineNumber: 404,
                                columnNumber: 11
                            }, this),
                            loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-center py-12",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                                    className: "animate-spin h-8 w-8 text-sky-500"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/mode3/page.tsx",
                                    lineNumber: 409,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode3/page.tsx",
                                lineNumber: 408,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                className: "min-w-full divide-y divide-gray-700/50",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                        className: "bg-gray-800/60",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    className: "px-4 py-2 text-sky-300 text-left",
                                                    children: "ID"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 415,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    className: "px-4 py-2 text-sky-300 text-left",
                                                    children: "True → Pred"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 416,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/mode3/page.tsx",
                                            lineNumber: 414,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode3/page.tsx",
                                        lineNumber: 413,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                        className: "bg-gray-800/30 divide-y divide-gray-700/50",
                                        children: errors.tableData.length ? errors.tableData.map((r, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                className: "hover:bg-rose-900/20",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-2 text-white",
                                                        children: r.id
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/mode3/page.tsx",
                                                        lineNumber: 423,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-2 text-rose-300",
                                                        children: r.timePeriod
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/mode3/page.tsx",
                                                        lineNumber: 424,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, i, true, {
                                                fileName: "[project]/src/app/mode3/page.tsx",
                                                lineNumber: 422,
                                                columnNumber: 21
                                            }, this)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                colSpan: 2,
                                                className: "px-4 py-2 text-gray-400 text-center",
                                                children: "No misclassified data"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode3/page.tsx",
                                                lineNumber: 429,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/mode3/page.tsx",
                                            lineNumber: 428,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode3/page.tsx",
                                        lineNumber: 419,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode3/page.tsx",
                                lineNumber: 412,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/mode3/page.tsx",
                        lineNumber: 403,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/mode3/page.tsx",
                lineNumber: 218,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/mode3/page.tsx",
        lineNumber: 216,
        columnNumber: 5
    }, this);
}
_s(Mode3Page, "pPClDEFlmA/97PcLijpjHS7OX8I=");
_c = Mode3Page;
var _c;
__turbopack_context__.k.register(_c, "Mode3Page");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_759a161b._.js.map