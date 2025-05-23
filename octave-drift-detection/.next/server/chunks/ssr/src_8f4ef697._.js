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
"[project]/src/components/Header.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>Header)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
'use client';
;
;
;
function Header({ title, logoUrl, navigationItems = [], className = '', onNavigation }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: `flex items-center p-4 bg-white shadow-sm ${className}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        src: logoUrl,
                        alt: `${title} logo`,
                        width: 48,
                        height: 48,
                        className: "rounded-full",
                        priority: true
                    }, void 0, false, {
                        fileName: "[project]/src/components/Header.tsx",
                        lineNumber: 32,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "ml-3 text-xl font-semibold text-gray-800",
                        children: title
                    }, void 0, false, {
                        fileName: "[project]/src/components/Header.tsx",
                        lineNumber: 40,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/Header.tsx",
                lineNumber: 31,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                className: "ml-auto",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                    className: "flex space-x-4",
                    children: navigationItems.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: item.path,
                                onClick: ()=>onNavigation?.(item.path),
                                className: `flex items-center px-3 py-2 rounded-md transition-colors ${item.isActive ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`,
                                children: [
                                    item.icon && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "mr-2",
                                        children: item.icon
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/Header.tsx",
                                        lineNumber: 56,
                                        columnNumber: 31
                                    }, this),
                                    item.label
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/Header.tsx",
                                lineNumber: 47,
                                columnNumber: 15
                            }, this)
                        }, item.path, false, {
                            fileName: "[project]/src/components/Header.tsx",
                            lineNumber: 46,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/src/components/Header.tsx",
                    lineNumber: 44,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/Header.tsx",
                lineNumber: 43,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/Header.tsx",
        lineNumber: 30,
        columnNumber: 5
    }, this);
}
}}),
"[project]/src/app/mode1/page.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>Mode1Page)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/chart.js/dist/chart.mjs [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/chart.js/dist/chart.mjs [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$backendService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/backendService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$dashboardService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/dashboardService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Header$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/Header.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-alert.js [app-ssr] (ecmascript) <export default as AlertCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-ssr] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-check-big.js [app-ssr] (ecmascript) <export default as CheckCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/info.js [app-ssr] (ecmascript) <export default as Info>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sun.js [app-ssr] (ecmascript) <export default as Sun>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/moon.js [app-ssr] (ecmascript) <export default as Moon>");
"use client";
;
;
;
;
;
;
;
;
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Chart"].register(...__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["registerables"]);
const ERROR_RANGES = [
    {
        min: 0,
        max: 10,
        label: "0-10%"
    },
    {
        min: 10,
        max: 20,
        label: "10-20%"
    },
    {
        min: 20,
        max: 30,
        label: "20-30%"
    },
    {
        min: 30,
        max: 40,
        label: "30-40%"
    },
    {
        min: 40,
        max: 50,
        label: "40-50%"
    },
    {
        min: 50,
        max: 60,
        label: "50-60%"
    },
    {
        min: 60,
        max: 70,
        label: "60-70%"
    },
    {
        min: 70,
        max: 80,
        label: "70-80%"
    },
    {
        min: 80,
        max: 90,
        label: "80-90%"
    },
    {
        min: 90,
        max: 100,
        label: "90-100%"
    },
    {
        min: 100,
        max: Number.POSITIVE_INFINITY,
        label: ">100%"
    }
];
const TooltipPopup = ({ type, onClose })=>{
    const tooltipContent = {
        kstest: "Kolmogorov-Smirnov test measures the distance between two cumulative distributions.",
        wasserstein: "Wasserstein distance quantifies the dissimilarity between two probability distributions.",
        drift: "Drift detection identifies significant changes in data patterns over time."
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                    className: "text-lg font-bold text-sky-700 dark:text-sky-400 mb-2",
                    children: "Information"
                }, void 0, false, {
                    fileName: "[project]/src/app/mode1/page.tsx",
                    lineNumber: 80,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-gray-800 dark:text-gray-300",
                    children: tooltipContent[type]
                }, void 0, false, {
                    fileName: "[project]/src/app/mode1/page.tsx",
                    lineNumber: 81,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: onClose,
                    className: "mt-4 px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 transition-colors",
                    children: "Close"
                }, void 0, false, {
                    fileName: "[project]/src/app/mode1/page.tsx",
                    lineNumber: 82,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/mode1/page.tsx",
            lineNumber: 79,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/mode1/page.tsx",
        lineNumber: 78,
        columnNumber: 5
    }, this);
};
function Mode1Page() {
    const [kpis, setKpis] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [errors, setErrors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        plotData: [],
        tableData: []
    });
    const [outletsExceedingThreshold, setOutletsExceedingThreshold] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [allOutlets, setAllOutlets] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [entries, setEntries] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [businessUnit, setBusinessUnit] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("Not Selected");
    const [useCase, setUseCase] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("Not Selected");
    const [shortCode, setShortCode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("Not Available");
    const [alertKeeperValue, setAlertKeeperValue] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("Not Selected");
    const [runtimeValue, setRuntimeValue] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [runtimeOptions, setRuntimeOptions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [referencePeriod, setReferencePeriod] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("N/A");
    const [errorPercentageThreshold, setErrorPercentageThreshold] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const [mseTrend, setMseTrend] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [sortedPeriods, setSortedPeriods] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [driftDetected, setDriftDetected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [statusDistribution, setStatusDistribution] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        good: 65,
        warning: 25,
        error: 10
    });
    const [activeTooltip, setActiveTooltip] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [backendError, setBackendError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [errorTableView, setErrorTableView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("all");
    const [filteredErrorData, setFilteredErrorData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedRange, setSelectedRange] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [selectedRangeOutlets, setSelectedRangeOutlets] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [errorRangeData, setErrorRangeData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const errorRangeChartRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Theme state
    const [theme, setTheme] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("light");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        document.documentElement.setAttribute("data-theme", theme);
    }, [
        theme
    ]);
    const renderPieChart = ()=>{
    // Your existing pie chart rendering logic here
    };
    const renderErrorRangeChart = ()=>{
        const ctx = document.getElementById("errorRangeChart");
        if (!ctx) return;
        if (errorRangeChartRef.current) {
            errorRangeChartRef.current.destroy();
        }
        const dataToUse = errorRangeData;
        const gradientColors = [
            "rgba(52, 211, 153, 0.8)",
            "rgba(96, 165, 250, 0.8)",
            "rgba(234, 179, 8, 0.8)",
            "rgba(251, 191, 36, 0.8)",
            "rgba(251, 146, 60, 0.8)",
            "rgba(249, 115, 22, 0.8)",
            "rgba(236, 72, 153, 0.8)",
            "rgba(244, 114, 182, 0.8)",
            "rgba(248, 113, 113, 0.8)",
            "rgba(244, 63, 94, 0.8)",
            "rgba(239, 68, 68, 0.8)"
        ];
        const borderColors = [
            "rgba(52, 211, 153, 1)",
            "rgba(96, 165, 250, 1)",
            "rgba(234, 179, 8, 1)",
            "rgba(251, 191, 36, 1)",
            "rgba(251, 146, 60, 1)",
            "rgba(249, 115, 22, 1)",
            "rgba(236, 72, 153, 1)",
            "rgba(244, 114, 182, 1)",
            "rgba(248, 113, 113, 1)",
            "rgba(244, 63, 94, 1)",
            "rgba(239, 68, 68, 1)"
        ];
        errorRangeChartRef.current = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Chart"](ctx, {
            type: "bar",
            data: {
                labels: dataToUse.map((d)=>d.range),
                datasets: [
                    {
                        label: "Number of IDs",
                        data: dataToUse.map((d)=>d.count),
                        backgroundColor: gradientColors.slice(0, dataToUse.length),
                        borderColor: borderColors.slice(0, dataToUse.length),
                        borderWidth: 1,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: "top",
                        labels: {
                            color: "#334155",
                            font: {
                                size: 14
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: "ID Distribution by Error Percentage Range",
                        color: "#0369a1",
                        font: {
                            size: 16,
                            weight: "bold"
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx)=>`IDs: ${ctx.raw}`,
                            afterLabel: (ctx)=>`Click to view details`
                        },
                        backgroundColor: "rgba(15, 23, 42, 0.8)",
                        titleColor: "#ffffff",
                        bodyColor: "#ffffff",
                        borderColor: "#1e40af",
                        borderWidth: 1,
                        padding: 10
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: "Error Percentage Range",
                            color: "#0369a1",
                            font: {
                                weight: "bold"
                            }
                        },
                        grid: {
                            color: "rgba(148, 163, 184, 0.1)",
                            borderColor: "rgba(148, 163, 184, 0.2)"
                        },
                        ticks: {
                            color: "#334155",
                            font: {
                                size: 12
                            }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: "Number of IDs",
                            color: "#0369a1",
                            font: {
                                weight: "bold"
                            }
                        },
                        beginAtZero: true,
                        grid: {
                            color: "rgba(148, 163, 184, 0.1)",
                            borderColor: "rgba(148, 163, 184, 0.2)"
                        },
                        ticks: {
                            color: "#334155",
                            font: {
                                size: 12
                            },
                            precision: 0
                        }
                    }
                },
                onClick: (_event, elements)=>{
                    if (elements && elements.length > 0) {
                        const index = elements[0].index;
                        if (index !== undefined && index >= 0 && index < dataToUse.length) {
                            handleBarClick(index);
                        }
                    }
                }
            }
        });
    };
    const handleBarClick = (rangeIndex)=>{
        if (rangeIndex >= 0 && rangeIndex < errorRangeData.length) {
            const range = errorRangeData[rangeIndex];
            setSelectedRange(range.range);
            setSelectedRangeOutlets(range.outlets);
        }
    };
    const calculateMseChange = ()=>{
        const refMse = Number.parseFloat(kpis.find((k)=>k.rowKey === "mseRef")?.value || "0");
        const currMse = Number.parseFloat(kpis.find((k)=>k.rowKey === "mseCurrent")?.value || "0");
        if (refMse === 0) return "N/A";
        const change = (currMse - refMse) / refMse * 100;
        return `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`;
    };
    const getStatusColor = (s)=>{
        if (!s) return "text-gray-700 dark:text-gray-300";
        switch(s.toLowerCase()){
            case "warning":
                return "text-amber-700 dark:text-amber-400";
            case "error":
                return "text-rose-700 dark:text-rose-400";
            case "success":
                return "text-emerald-700 dark:text-emerald-400";
            default:
                return "text-sky-700 dark:text-sky-400";
        }
    };
    const getStatusIcon = (s)=>{
        if (!s) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__["Info"], {
            className: "h-5 w-5 text-gray-700 dark:text-gray-300"
        }, void 0, false, {
            fileName: "[project]/src/app/mode1/page.tsx",
            lineNumber: 303,
            columnNumber: 20
        }, this);
        switch(s.toLowerCase()){
            case "warning":
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                    className: "h-5 w-5 text-amber-700 dark:text-amber-400"
                }, void 0, false, {
                    fileName: "[project]/src/app/mode1/page.tsx",
                    lineNumber: 306,
                    columnNumber: 16
                }, this);
            case "error":
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                    className: "h-5 w-5 text-rose-700 dark:text-rose-400"
                }, void 0, false, {
                    fileName: "[project]/src/app/mode1/page.tsx",
                    lineNumber: 308,
                    columnNumber: 16
                }, this);
            case "success":
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"], {
                    className: "h-5 w-5 text-emerald-700 dark:text-emerald-400"
                }, void 0, false, {
                    fileName: "[project]/src/app/mode1/page.tsx",
                    lineNumber: 310,
                    columnNumber: 16
                }, this);
            default:
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__["Info"], {
                    className: "h-5 w-5 text-sky-700 dark:text-sky-400"
                }, void 0, false, {
                    fileName: "[project]/src/app/mode1/page.tsx",
                    lineNumber: 312,
                    columnNumber: 16
                }, this);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const fetchAllData = async ()=>{
            setLoading(true);
            setBackendError(null);
            try {
                const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$backendService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fetchData"])({
                    runtime: runtimeValue
                });
                setKpis(data.kpis || []);
                setErrors(data.errors || {
                    plotData: [],
                    tableData: []
                });
                setOutletsExceedingThreshold(data.outletsExceedingThreshold || []);
                setAllOutlets(data.all_outlets || []);
                if (data.sorted_periods && data.sorted_periods.length > 0) {
                    setReferencePeriod(data.sorted_periods[0]);
                } else {
                    setReferencePeriod("N/A");
                }
                setErrorPercentageThreshold(data.error_percentage_threshold ?? 0);
                setSortedPeriods(data.sorted_periods || []);
                setDriftDetected(data.driftDetected || null);
                // Status distribution
                const tableData = data.errors?.tableData || [];
                const threshold = data.error_percentage_threshold || 5;
                let goodCount = 0;
                let warningCount = 0;
                let errorCount = 0;
                tableData.forEach((row)=>{
                    const errorValue = Math.abs(row.difference ?? 0);
                    if (errorValue >= threshold) {
                        errorCount++;
                    } else if (errorValue >= threshold * 0.8) {
                        warningCount++;
                    } else {
                        goodCount++;
                    }
                });
                setStatusDistribution({
                    good: goodCount,
                    warning: warningCount,
                    error: errorCount
                });
                // Error range data
                const rangeData = ERROR_RANGES.map((range)=>{
                    const outletsInRange = data.all_outlets.filter((outlet)=>{
                        const pe = outlet.percentage_error;
                        return pe >= range.min && pe < range.max;
                    });
                    return {
                        range: range.label,
                        count: outletsInRange.length,
                        outlets: outletsInRange
                    };
                });
                setErrorRangeData(rangeData);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setBackendError("Failed to load data.");
                setLoading(false);
            }
        };
        if (runtimeValue) {
            fetchAllData();
        }
    }, [
        runtimeValue
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!loading) {
            renderPieChart();
            renderErrorRangeChart();
        }
    }, [
        loading,
        statusDistribution,
        errorRangeData
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const fetchEntries = async ()=>{
            try {
                const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$dashboardService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fetchEntriesTable"])();
                const filtered = res.filter((e)=>e.ShortCode !== "Not Available");
                setEntries(filtered);
                if (filtered.length === 0) {
                    setBusinessUnit("Not Selected");
                    setUseCase("Not Selected");
                    setShortCode("Not Available");
                    setRuntimeOptions([]);
                    setAlertKeeperValue("Not Selected");
                    setRuntimeValue("");
                } else {
                    setBusinessUnit(filtered[0].BusinessUnit);
                    setUseCase(filtered[0].useCase);
                    setShortCode(filtered[0].ShortCode);
                    const uniqueRuntimes = Array.from(new Set(filtered.map((e)=>e.Runtime)));
                    setRuntimeOptions(uniqueRuntimes);
                    setRuntimeValue(uniqueRuntimes[0]);
                    const initialKeeper = filtered.find((e)=>e.Runtime === uniqueRuntimes[0])?.alertKeeper;
                    setAlertKeeperValue(initialKeeper || "Not Selected");
                }
            } catch (error) {
                console.error("Failed to fetch entries:", error);
            }
        };
        fetchEntries();
    }, []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const keeper = entries.find((e)=>e.Runtime === runtimeValue)?.alertKeeper;
        setAlertKeeperValue(keeper || "Not Selected");
    }, [
        runtimeValue,
        entries
    ]);
    const filterErrorData = ()=>{
        const uniqueData = errors.tableData;
        if (errorTableView === "all") {
            setFilteredErrorData(uniqueData);
        } else if (errorTableView === "top20") {
            const top20 = uniqueData.slice(0, 20);
            const bottom20 = [
                ...uniqueData
            ].sort((a, b)=>(a.difference ?? 0) - (b.difference ?? 0)).slice(0, 20);
            setFilteredErrorData([
                ...top20,
                ...bottom20
            ]);
        } else if (errorTableView === "top50") {
            const top50 = uniqueData.slice(0, 50);
            const bottom50 = [
                ...uniqueData
            ].sort((a, b)=>(a.difference ?? 0) - (b.difference ?? 0)).slice(0, 50);
            setFilteredErrorData([
                ...top50,
                ...bottom50
            ]);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        filterErrorData();
    }, [
        errorTableView,
        errors.tableData
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Header$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/src/app/mode1/page.tsx",
                lineNumber: 458,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `min-h-screen flex flex-col ${theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-800"}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("title", {
                        children: "Mode 1 | Business Dashboard"
                    }, void 0, false, {
                        fileName: "[project]/src/app/mode1/page.tsx",
                        lineNumber: 464,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                        className: "flex-grow container mx-auto px-4 py-8",
                        children: [
                            backendError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-rose-950/40 border border-rose-800/60 rounded-lg p-4 mb-6 backdrop-blur-sm shadow-lg",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"], {
                                            className: "h-5 w-5 text-rose-400 mr-2"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/mode1/page.tsx",
                                            lineNumber: 470,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-sm font-medium text-rose-400",
                                            children: backendError
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/mode1/page.tsx",
                                            lineNumber: 471,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/mode1/page.tsx",
                                    lineNumber: 469,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode1/page.tsx",
                                lineNumber: 468,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-6",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 md:grid-cols-2 gap-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mb-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-lg font-medium text-sky-700 dark:text-sky-400",
                                                            children: "Business Unit: "
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/mode1/page.tsx",
                                                            lineNumber: 481,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sky-900 dark:text-sky-300",
                                                            children: loading ? "Loading..." : businessUnit || "Not Selected"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/mode1/page.tsx",
                                                            lineNumber: 482,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/mode1/page.tsx",
                                                    lineNumber: 480,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-lg font-medium text-sky-700 dark:text-sky-400",
                                                            children: "Use Case: "
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/mode1/page.tsx",
                                                            lineNumber: 487,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sky-900 dark:text-sky-300",
                                                            children: loading ? "Loading..." : useCase || "Not Selected"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/mode1/page.tsx",
                                                            lineNumber: 488,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/mode1/page.tsx",
                                                    lineNumber: 486,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/mode1/page.tsx",
                                            lineNumber: 479,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mb-4",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-lg font-medium text-sky-700 dark:text-sky-400",
                                                            children: "Short Code: "
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/mode1/page.tsx",
                                                            lineNumber: 495,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sky-900 dark:text-sky-300",
                                                            children: loading ? "Loading..." : shortCode || "Not Available"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/mode1/page.tsx",
                                                            lineNumber: 496,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/mode1/page.tsx",
                                                    lineNumber: 494,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-lg font-medium text-sky-700 dark:text-sky-400",
                                                            children: "Alert Keeper: "
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/mode1/page.tsx",
                                                            lineNumber: 501,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sky-900 dark:text-sky-300",
                                                            children: loading ? "Loading..." : alertKeeperValue || "Not Selected"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/mode1/page.tsx",
                                                            lineNumber: 502,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/mode1/page.tsx",
                                                    lineNumber: 500,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/mode1/page.tsx",
                                            lineNumber: 493,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/mode1/page.tsx",
                                    lineNumber: 478,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode1/page.tsx",
                                lineNumber: 477,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `rounded-xl shadow-xl overflow-hidden p-6 mb-6 border ${theme === "dark" ? "border-sky-700 bg-gray-800" : "border-sky-200 bg-white/90"}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-sky-800 mb-4",
                                        children: "Key Performance Indicators"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode1/page.tsx",
                                        lineNumber: 518,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "grid grid-cols-1 md:grid-cols-3 gap-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `${theme === "dark" ? "bg-gradient-to-br from-gray-800 to-sky-900/50 border-sky-700" : "bg-gradient-to-br from-white to-sky-100/50 border-sky-300/50"} p-4 rounded-lg border shadow-md hover:shadow-sky-900/20 hover:border-sky-700/50 transition-all relative`,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>setActiveTooltip("kstest"),
                                                        className: "absolute top-2 right-2 text-sky-400 hover:text-sky-300 transition-colors",
                                                        "aria-label": "KS Test Information",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__["Info"], {
                                                            className: "h-5 w-5"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/mode1/page.tsx",
                                                            lineNumber: 534,
                                                            columnNumber: 19
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/mode1/page.tsx",
                                                        lineNumber: 529,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center justify-between",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-sm text-gray-600 dark:text-gray-300",
                                                                children: "KS-test:"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/mode1/page.tsx",
                                                                lineNumber: 537,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-sm font-medium text-gray-800 dark:text-gray-200",
                                                                children: loading ? "Loading..." : kpis.find((k)=>k.rowKey === "kstest")?.value || "N/A"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/mode1/page.tsx",
                                                                lineNumber: 538,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/mode1/page.tsx",
                                                        lineNumber: 536,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/mode1/page.tsx",
                                                lineNumber: 522,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `${theme === "dark" ? "bg-gradient-to-br from-gray-800 to-sky-900/50 border-sky-700" : "bg-gradient-to-br from-white to-sky-100/50 border-sky-300/50"} p-4 rounded-lg border shadow-md hover:shadow-sky-900/20 hover:border-sky-700/50 transition-all`,
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center justify-between",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sm text-gray-600 dark:text-gray-300",
                                                            children: "Wasserstein:"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/mode1/page.tsx",
                                                            lineNumber: 552,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sm font-medium text-gray-800 dark:text-gray-200",
                                                            children: loading ? "Loading..." : kpis.find((k)=>k.rowKey === "wasserstein")?.value || "N/A"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/mode1/page.tsx",
                                                            lineNumber: 553,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/mode1/page.tsx",
                                                    lineNumber: 551,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode1/page.tsx",
                                                lineNumber: 544,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `${theme === "dark" ? "bg-gradient-to-br from-gray-800 to-sky-900/50 border-sky-700" : "bg-gradient-to-br from-white to-sky-100/50 border-sky-300/50"} p-4 rounded-lg border shadow-md hover:shadow-sky-900/20 hover:border-sky-700/50 transition-all`,
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center justify-between",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sm text-gray-600 dark:text-gray-300",
                                                            children: "Drift Detected:"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/mode1/page.tsx",
                                                            lineNumber: 567,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: `text-sm font-medium ${driftDetected === null ? "text-gray-700 dark:text-gray-300" : driftDetected ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`,
                                                            children: loading ? "Loading..." : driftDetected === null ? "N/A" : driftDetected ? "Yes" : "No"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/mode1/page.tsx",
                                                            lineNumber: 568,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/mode1/page.tsx",
                                                    lineNumber: 566,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode1/page.tsx",
                                                lineNumber: 559,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/mode1/page.tsx",
                                        lineNumber: 521,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode1/page.tsx",
                                lineNumber: 511,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `${theme === "dark" ? "bg-gray-800 border-sky-700" : "bg-white/90 border-sky-200/70"} rounded-xl shadow-xl overflow-hidden p-6 border`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                className: "text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-sky-800 mb-4",
                                                children: "Error Comparison (Current Period)"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode1/page.tsx",
                                                lineNumber: 594,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "overflow-x-auto",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                                    className: "min-w-full divide-y divide-gray-200 dark:divide-gray-700",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                        className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
                                                                        children: "ID"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/mode1/page.tsx",
                                                                        lineNumber: 601,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                        className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
                                                                        children: "Current (%)"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/mode1/page.tsx",
                                                                        lineNumber: 604,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                        className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
                                                                        children: "Reference (%)"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/mode1/page.tsx",
                                                                        lineNumber: 607,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                        className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
                                                                        children: "Difference"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/mode1/page.tsx",
                                                                        lineNumber: 610,
                                                                        columnNumber: 23
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/mode1/page.tsx",
                                                                lineNumber: 600,
                                                                columnNumber: 21
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/mode1/page.tsx",
                                                            lineNumber: 599,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                            className: `${theme === "dark" ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-200"} divide-y`,
                                                            children: filteredErrorData.map((row, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                    className: "hover:bg-sky-50 dark:hover:bg-gray-700 transition-colors duration-150",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200",
                                                                            children: i + 1
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/mode1/page.tsx",
                                                                            lineNumber: 622,
                                                                            columnNumber: 25
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200",
                                                                            children: (row.abs_curr_per ?? 0).toFixed(2)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/mode1/page.tsx",
                                                                            lineNumber: 625,
                                                                            columnNumber: 25
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200",
                                                                            children: (row.abs_ref_per ?? 0).toFixed(2)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/mode1/page.tsx",
                                                                            lineNumber: 628,
                                                                            columnNumber: 25
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: `px-6 py-4 whitespace-nowrap text-sm font-medium ${(row.difference ?? 0) > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`,
                                                                            children: [
                                                                                (row.difference ?? 0) > 0 ? "+" : "",
                                                                                (row.difference ?? 0).toFixed(2)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/app/mode1/page.tsx",
                                                                            lineNumber: 631,
                                                                            columnNumber: 25
                                                                        }, this)
                                                                    ]
                                                                }, row.id, true, {
                                                                    fileName: "[project]/src/app/mode1/page.tsx",
                                                                    lineNumber: 621,
                                                                    columnNumber: 23
                                                                }, this))
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/mode1/page.tsx",
                                                            lineNumber: 615,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/mode1/page.tsx",
                                                    lineNumber: 598,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode1/page.tsx",
                                                lineNumber: 597,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/mode1/page.tsx",
                                        lineNumber: 587,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `${theme === "dark" ? "bg-rose-900/70 border-rose-700" : "bg-rose-100/70 border-rose-300/50"} rounded-xl shadow-xl overflow-hidden p-6 border`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                className: "text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-sky-800 mb-4",
                                                children: "Top Outlets Exceeding Threshold"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode1/page.tsx",
                                                lineNumber: 656,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "overflow-x-auto",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                                    className: "min-w-full divide-y divide-rose-200/70 dark:divide-gray-700",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                        className: "px-6 py-3 text-left text-xs font-medium text-rose-700 uppercase tracking-wider",
                                                                        children: "ID"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/mode1/page.tsx",
                                                                        lineNumber: 663,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                        className: "px-6 py-3 text-left text-xs font-medium text-rose-700 uppercase tracking-wider",
                                                                        children: "True Value"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/mode1/page.tsx",
                                                                        lineNumber: 666,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                        className: "px-6 py-3 text-left text-xs font-medium text-rose-700 uppercase tracking-wider",
                                                                        children: "Predicted Value"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/mode1/page.tsx",
                                                                        lineNumber: 669,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                        className: "px-6 py-3 text-left text-xs font-medium text-rose-700 uppercase tracking-wider",
                                                                        children: "% Error"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/mode1/page.tsx",
                                                                        lineNumber: 672,
                                                                        columnNumber: 23
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/mode1/page.tsx",
                                                                lineNumber: 662,
                                                                columnNumber: 21
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/mode1/page.tsx",
                                                            lineNumber: 661,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                            className: "bg-white divide-y divide-rose-200/70 dark:divide-gray-700",
                                                            children: outletsExceedingThreshold.slice().sort((a, b)=>b.percentage_error - a.percentage_error).map((outlet, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                    className: "hover:bg-rose-50 dark:hover:bg-gray-800 transition-colors duration-150",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200",
                                                                            children: i + 1
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/mode1/page.tsx",
                                                                            lineNumber: 686,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200",
                                                                            children: outlet.y_true
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/mode1/page.tsx",
                                                                            lineNumber: 689,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200",
                                                                            children: outlet.y_pred
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/mode1/page.tsx",
                                                                            lineNumber: 692,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                            className: "px-6 py-4 whitespace-nowrap text-sm font-medium text-rose-600 dark:text-rose-400",
                                                                            children: outlet.percentage_error.toFixed(2)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/mode1/page.tsx",
                                                                            lineNumber: 695,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, outlet.id, true, {
                                                                    fileName: "[project]/src/app/mode1/page.tsx",
                                                                    lineNumber: 682,
                                                                    columnNumber: 25
                                                                }, this))
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/mode1/page.tsx",
                                                            lineNumber: 677,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/mode1/page.tsx",
                                                    lineNumber: 660,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode1/page.tsx",
                                                lineNumber: 659,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/mode1/page.tsx",
                                        lineNumber: 649,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode1/page.tsx",
                                lineNumber: 585,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `${theme === "dark" ? "bg-gray-800 border-sky-700" : "bg-white/90 border-sky-200/70"} rounded-xl shadow-xl overflow-hidden p-6 mb-6 border`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-sky-800 mb-4",
                                        children: "ID Distribution by Error Percentage Range"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode1/page.tsx",
                                        lineNumber: 714,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-80 bg-gray-100/80 rounded-lg p-4 border border-sky-200/70 mb-4",
                                        children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center justify-center h-full",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                className: "animate-spin h-8 w-8 text-sky-500 mb-2",
                                                xmlns: "http://www.w3.org/2000/svg",
                                                fill: "none",
                                                viewBox: "0 0 24 24",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                        className: "opacity-25",
                                                        cx: "12",
                                                        cy: "12",
                                                        r: "10",
                                                        stroke: "currentColor",
                                                        strokeWidth: "4"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/mode1/page.tsx",
                                                        lineNumber: 721,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        className: "opacity-75",
                                                        fill: "currentColor",
                                                        d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/mode1/page.tsx",
                                                        lineNumber: 722,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/mode1/page.tsx",
                                                lineNumber: 720,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/mode1/page.tsx",
                                            lineNumber: 719,
                                            columnNumber: 17
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                                            id: "errorRangeChart"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/mode1/page.tsx",
                                            lineNumber: 726,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode1/page.tsx",
                                        lineNumber: 717,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode1/page.tsx",
                                lineNumber: 707,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `${theme === "dark" ? "from-gray-800 to-sky-900/50 border-sky-700" : "from-white to-sky-100/50 border-sky-300/50"} p-6 rounded-lg border shadow-md`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-lg font-medium text-sky-700 dark:text-sky-400 mb-2",
                                        children: "Status Distribution"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode1/page.tsx",
                                        lineNumber: 739,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-64",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                                            id: "statusPieChart"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/mode1/page.tsx",
                                            lineNumber: 741,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode1/page.tsx",
                                        lineNumber: 740,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode1/page.tsx",
                                lineNumber: 732,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/mode1/page.tsx",
                        lineNumber: 465,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "fixed top-4 right-4 z-50",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setTheme(theme === "dark" ? "light" : "dark"),
                            className: `p-2 rounded-full ${theme === "dark" ? "bg-sky-100 text-sky-700 hover:bg-sky-200" : "bg-sky-700 text-sky-100 hover:bg-sky-800"} transition-colors`,
                            "aria-label": "Toggle theme",
                            children: theme === "dark" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sun$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sun$3e$__["Sun"], {
                                className: "h-5 w-5"
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode1/page.tsx",
                                lineNumber: 758,
                                columnNumber: 15
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$moon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Moon$3e$__["Moon"], {
                                className: "h-5 w-5"
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode1/page.tsx",
                                lineNumber: 760,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/mode1/page.tsx",
                            lineNumber: 748,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/mode1/page.tsx",
                        lineNumber: 747,
                        columnNumber: 9
                    }, this),
                    activeTooltip && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(TooltipPopup, {
                        type: activeTooltip,
                        onClose: ()=>setActiveTooltip(null)
                    }, void 0, false, {
                        fileName: "[project]/src/app/mode1/page.tsx",
                        lineNumber: 765,
                        columnNumber: 27
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/mode1/page.tsx",
                lineNumber: 459,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
}}),

};

//# sourceMappingURL=src_8f4ef697._.js.map