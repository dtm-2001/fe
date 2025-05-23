module.exports = {

"[project]/src/services/backendService.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// services/backendService.ts
__turbopack_context__.s({
    "fetchData": (()=>fetchData)
});
async function fetchData({ runtime } = {
    runtime: ""
}) {
    try {
        // 1. Fetch drift data
        const resp = await fetch(`/api/mode1/data${runtime ? `?runtime=${runtime}` : ""}`, {
            credentials: "include"
        });
        if (!resp.ok) {
            throw new Error(`HTTP error! Status: ${resp.status}`);
        }
        const rawData = await resp.json();
        // 2. Fetch dashboard config
        const dashResp = await fetch(`/dashboard.json`);
        if (!dashResp.ok) {
            throw new Error(`HTTP error fetching dashboard.json! Status: ${dashResp.status}`);
        }
        const dashboardData = await dashResp.json();
        // 3. Extract drift metrics
        const driftMetrics = rawData.drift_state?.metrics || {};
        const driftDetected = rawData.drift_state?.drift_detected ?? false;
        const sorted_periods = rawData.sorted_periods ?? [];
        const referencePeriod = sorted_periods.length > 0 ? sorted_periods[0] : "N/A";
        // 4. Build KPI list
        const kpis = [
            {
                rowKey: "Drift Detected",
                value: driftDetected ? "Yes" : "No",
                status: driftDetected ? "Alert" : "Normal"
            },
            {
                rowKey: "Error Percentage Threshold",
                value: String(rawData.error_percentage_threshold ?? "N/A"),
                status: "Normal"
            },
            {
                rowKey: "Average Percentage Error (All)",
                value: rawData.average_percentage_error_all != null ? rawData.average_percentage_error_all.toFixed(2) : "N/A",
                status: "Normal"
            },
            {
                rowKey: "Average Percentage Error (Exceeding)",
                value: rawData.average_percentage_error_exceeding != null ? rawData.average_percentage_error_exceeding.toFixed(2) : "N/A",
                status: "Alert"
            },
            {
                rowKey: "kstest",
                value: driftMetrics.ks_statistic?.toFixed(3) ?? "N/A",
                status: "Normal"
            },
            {
                rowKey: "wasserstein",
                value: driftMetrics.wasserstein_distance?.toFixed(3) ?? "N/A",
                status: "Normal"
            },
            {
                rowKey: "mseRef",
                value: driftMetrics.mean_mse_reference?.toFixed(3) ?? "N/A",
                status: "Normal"
            },
            {
                rowKey: "mseCurrent",
                value: driftMetrics.mean_mse_current?.toFixed(3) ?? "N/A",
                status: "Normal"
            },
            {
                rowKey: "status",
                value: driftDetected ? "Warning" : "Normal",
                status: driftDetected ? "Warning" : "Normal"
            }
        ];
        // 5. Map filtered_data => tableData
        const filtered_data = rawData.filtered_data ?? [];
        const tableData = filtered_data.map((item)=>{
            const abs_curr_per = item.abs_curr_per ?? 0;
            const abs_ref_per = item.abs_ref_per ?? 0;
            const diff = abs_curr_per - abs_ref_per;
            return {
                id: String(item.id ?? ""),
                timePeriod: item.period ?? "",
                abs_curr_per,
                abs_ref_per,
                difference: diff,
                status: diff > 0 ? "Alert" : "Normal"
            };
        });
        // 6. Build errors object
        const errors = {
            plotData: (rawData.id_error ?? []).map((item)=>({
                    x: String(item.id ?? ""),
                    y: item.Mean_Prediction_Error ?? 0,
                    exceedsThreshold: Math.abs(item.Mean_Prediction_Error ?? 0) > (rawData.error_percentage_threshold ?? 0)
                })),
            tableData: tableData.length > 0 ? tableData : (rawData.id_error ?? []).map((item)=>({
                    id: String(item.id ?? ""),
                    timePeriod: item.time_period ?? "",
                    meanPrediction: item.Mean_Prediction_Error ?? 0,
                    error: item.Mean_Prediction_Error ?? 0,
                    percentageError: Math.abs(item.Mean_Prediction_Error ?? 0),
                    status: Math.abs(item.Mean_Prediction_Error ?? 0) > (rawData.error_percentage_threshold ?? 0) ? "Alert" : "Normal"
                }))
        };
        // 7. Outlets exceeding threshold
        const outletsExceedingThreshold = (rawData.outlets_exceeding_threshold ?? []).map((item)=>({
                id: String(item.id ?? ""),
                y_true: item.y_true ?? 0,
                y_pred: item.y_pred ?? 0,
                percentage_error: item.percentage_error ?? 0
            }));
        // 8. MSE trend
        const mse_trend = (rawData.mse_trend ?? []).map((item)=>({
                MSE: typeof item.MSE === "number" ? item.MSE : typeof item.mse === "number" ? item.mse : 0,
                time_period: item.time_period ?? item.timePeriod ?? ""
            }));
        // 9. XAI explanation and periods
        const xaiExplanation = rawData.explanation ?? "No explanation available";
        const currentPeriod = rawData.current_period ?? rawData.currentPeriod ?? "N/A";
        const error_percentage_threshold = rawData.error_percentage_threshold ?? 0;
        // 10. Compute status distribution for pie chart
        const threshold = error_percentage_threshold;
        const warningThreshold = threshold * 0.8;
        let goodCount = 0;
        let warningCount = 0;
        let errorCount = 0;
        const allTableRows = errors.tableData;
        allTableRows.forEach((row)=>{
            const errVal = Math.abs(row.difference ?? row.percentageError ?? 0);
            if (errVal >= threshold) {
                errorCount++;
            } else if (errVal >= warningThreshold) {
                warningCount++;
            } else {
                goodCount++;
            }
        });
        const total = Math.max(goodCount + warningCount + errorCount, 1);
        const good = Math.round(goodCount / total * 100);
        const warning = Math.round(warningCount / total * 100);
        const error = 100 - good - warning;
        const status_distribution = {
            good,
            warning,
            error
        };
        return {
            kpis,
            errors,
            outletsExceedingThreshold,
            xaiExplanation,
            currentPeriod,
            referencePeriod,
            error_percentage_threshold,
            dashboardData,
            all_outlets: rawData.all_outlets ?? [],
            mse_trend,
            sorted_periods,
            driftDetected,
            filtered_data,
            status_distribution
        };
    } catch (err) {
        console.error("Error fetching data:", err);
        throw new Error("Failed to fetch and process data");
    }
}
}}),
"[project]/src/services/dashboardService.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * Shared typings
 * -------------------------------------------------------------------------- */ __turbopack_context__.s({
    "fetchEntriesTable": (()=>fetchEntriesTable)
});
/**
 * Utility helpers
 * -------------------------------------------------------------------------- */ const eq = (a, b)=>a !== undefined && b !== undefined ? a.toLowerCase() === b.toLowerCase() : true;
async function fetchEntriesTable(filters = {}) {
    /* ------------------------------------------------------------------ */ /* 1️⃣  Build the query string we’ll send to the server                */ /* ------------------------------------------------------------------ */ const params = new URLSearchParams();
    if (filters.user) params.append('user', filters.user);
    if (filters.Runtime) params.append('Runtime', filters.Runtime);
    if (filters.BusinessUnit) params.append('BusinessUnit', filters.BusinessUnit);
    if (filters.useCase) params.append('useCase', filters.useCase);
    if (filters.ShortCode) params.append('ShortCode', filters.ShortCode);
    if (filters.JSONLink) params.append('JSONLink', filters.JSONLink);
    if (filters.alertKeeper) params.append('alertKeeper', filters.alertKeeper);
    /* ------------------------------------------------------------------ */ /* 2️⃣  Fetch from the API                                             */ /* ------------------------------------------------------------------ */ const res = await fetch(`/api/entries-table?${params.toString()}`, {
        credentials: 'include'
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch entries table: ${res.status} ${res.statusText}`);
    }
    const allRows = await res.json();
    /* ------------------------------------------------------------------ */ /* 3️⃣  Apply the same filters client‑side (safety‑net)                */ /* ------------------------------------------------------------------ */ const rows = allRows.filter((e)=>{
        if (filters.user && !eq(e.user, filters.user)) return false;
        if (filters.Runtime && e.Runtime !== filters.Runtime) return false;
        if (filters.BusinessUnit && !eq(e.BusinessUnit, filters.BusinessUnit)) return false;
        if (filters.useCase && !eq(e.useCase, filters.useCase)) return false;
        if (filters.ShortCode && e.ShortCode !== filters.ShortCode) return false;
        if (filters.JSONLink && e.JSONLink !== filters.JSONLink) return false;
        /* alertKeeper: treat it as a comma‑separated list in the source    */ if (filters.alertKeeper) {
            const keepers = e.alertKeeper.split(',').map((s)=>s.trim().toLowerCase());
            if (!keepers.includes(filters.alertKeeper.toLowerCase())) return false;
        }
        return true;
    });
    return rows;
}
}}),
"[externals]/tty [external] (tty, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("tty", () => require("tty"));

module.exports = mod;
}}),
"[externals]/util [external] (util, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}}),
"[externals]/os [external] (os, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}}),
"[externals]/node:path [external] (node:path, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("node:path", () => require("node:path"));

module.exports = mod;
}}),
"[externals]/node:path [external] (node:path, cjs) <export default as minpath>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "minpath": (()=>__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
}}),
"[externals]/node:process [external] (node:process, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("node:process", () => require("node:process"));

module.exports = mod;
}}),
"[externals]/node:process [external] (node:process, cjs) <export default as minproc>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "minproc": (()=>__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$process__$5b$external$5d$__$28$node$3a$process$2c$__cjs$29$__["default"])
});
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$process__$5b$external$5d$__$28$node$3a$process$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:process [external] (node:process, cjs)");
}}),
"[externals]/node:url [external] (node:url, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("node:url", () => require("node:url"));

module.exports = mod;
}}),
"[externals]/node:url [external] (node:url, cjs) <export fileURLToPath as urlToPath>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "urlToPath": (()=>__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$url__$5b$external$5d$__$28$node$3a$url$2c$__cjs$29$__["fileURLToPath"])
});
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$url__$5b$external$5d$__$28$node$3a$url$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:url [external] (node:url, cjs)");
}}),
"[project]/src/components/Markdown.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// components/Markdown.tsx
__turbopack_context__.s({
    "Markdown": (()=>Markdown)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$markdown$2f$lib$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__Markdown__as__default$3e$__ = __turbopack_context__.i("[project]/node_modules/react-markdown/lib/index.js [app-ssr] (ecmascript) <export Markdown as default>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$rehype$2d$raw$2f$lib$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/rehype-raw/lib/index.js [app-ssr] (ecmascript)");
;
;
;
function Markdown({ content }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$markdown$2f$lib$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__Markdown__as__default$3e$__["default"], {
        children: content,
        rehypePlugins: [
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$rehype$2d$raw$2f$lib$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]
        ]
    }, void 0, false, {
        fileName: "[project]/src/components/Markdown.tsx",
        lineNumber: 8,
        columnNumber: 5
    }, this);
}
}}),
"[project]/src/app/mode1/page.tsx [app-ssr] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const e = new Error(`Could not parse module '[project]/src/app/mode1/page.tsx'

Unexpected token `div`. Expected jsx identifier`);
e.code = 'MODULE_UNPARSEABLE';
throw e;}}),

};

//# sourceMappingURL=%5Broot%20of%20the%20server%5D__7a5bfb50._.js.map