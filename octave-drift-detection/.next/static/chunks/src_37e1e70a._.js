(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push(["static/chunks/src_37e1e70a._.js", {

"[project]/src/services/backendService1.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "fetchData": (()=>fetchData)
});
async function fetchData() {
    try {
        console.log("Fetching data from backend via proxy: /api/mode2/data");
        const response = await fetch(`/api/mode2/data`, {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const rawData = await response.json();
        console.log("Parsed data:", rawData);
        const driftMetrics = rawData.drift_state?.metrics || {};
        const kpis = [
            {
                rowKey: "Drift Detected",
                value: rawData.drift_state?.drift_detected ? "Yes" : "No",
                status: rawData.drift_state?.drift_detected ? "Alert" : "Normal"
            },
            {
                rowKey: "Error Percentage Threshold",
                value: rawData.error_percentage_threshold?.toString() || "N/A",
                status: "Normal"
            },
            {
                rowKey: "Average Percentage Error (All)",
                value: rawData.average_percentage_error_all?.toFixed(2) || "N/A",
                status: "Normal"
            },
            {
                rowKey: "Average Percentage Error (Exceeding)",
                value: rawData.average_percentage_error_exceeding?.toFixed(2) || "N/A",
                status: "Alert"
            },
            {
                rowKey: "kstest",
                value: driftMetrics.ks_statistic?.toFixed(3) || "N/A",
                status: "Normal"
            },
            {
                rowKey: "wasserstein",
                value: driftMetrics.wasserstein_distance?.toFixed(3) || "N/A",
                status: "Normal"
            },
            {
                rowKey: "mseRef",
                value: driftMetrics.mean_mse_reference?.toFixed(3) || "N/A",
                status: "Normal"
            },
            {
                rowKey: "mseCurrent",
                value: driftMetrics.mean_mse_current?.toFixed(3) || "N/A",
                status: "Normal"
            },
            {
                rowKey: "status",
                value: rawData.drift_state?.drift_detected ? "Warning" : "Normal",
                status: rawData.drift_state?.drift_detected ? "Warning" : "Normal"
            }
        ];
        const errors = {
            plotData: rawData.id_error?.map((item)=>({
                    x: item.time_period || "",
                    y: item.Mean_Prediction_Error || 0,
                    exceedsThreshold: Math.abs(item.Mean_Prediction_Error) > (rawData.error_percentage_threshold || 0)
                })) || [],
            tableData: rawData.id_error?.map((item)=>({
                    id: item.id?.toString() || "",
                    timePeriod: item.time_period || "",
                    meanPrediction: item.Mean_Prediction_Error || 0,
                    error: item.Mean_Prediction_Error || 0,
                    percentageError: Math.abs(item.Mean_Prediction_Error) || 0,
                    status: Math.abs(item.Mean_Prediction_Error) > (rawData.error_percentage_threshold || 0) ? "Alert" : "Normal"
                })) || []
        };
        const outletsExceedingThreshold = rawData.outlets_exceeding_threshold?.map((item)=>({
                id: item.id?.toString() || "",
                y_true: item.y_true || 0,
                y_pred: item.y_pred || 0,
                percentage_error: item.percentage_error || 0
            })) || [];
        // Additional fields from rawData
        const state = rawData.state || "Unknown";
        const coverage = rawData.coverage || {};
        const clusters = rawData.clusters || {};
        const backwardAnalysis = rawData.backward_analysis || {};
        const currentPeriod = rawData.current_period || "N/A";
        const totalOutlets = rawData.total_outlets || 0;
        const outletsExceedingThresholdCount = rawData.outlets_exceeding_threshold_count || 0;
        const xaiExplanation = rawData.xai?.explanation || "No explanation available";
        return {
            kpis,
            errors,
            outletsExceedingThreshold,
            state,
            coverage,
            clusters,
            backwardAnalysis,
            currentPeriod,
            totalOutlets,
            outletsExceedingThresholdCount,
            xaiExplanation
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
"[project]/src/app/mode2/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>Mode2Page)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$noop$2d$head$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/components/noop-head.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/chart.js/dist/chart.mjs [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/chart.js/dist/chart.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$backendService1$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/backendService1.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Chart"].register(...__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["registerables"]);
;
function Mode2Page() {
    _s();
    const chartRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [kpis, setKpis] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [errors, setErrors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        plotData: [],
        tableData: []
    });
    const [outletsExceedingThreshold, setOutletsExceedingThreshold] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('Unknown');
    const [coverage, setCoverage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [clusters, setClusters] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        warning: [],
        drift: [],
        combined: []
    });
    const [backwardAnalysis, setBackwardAnalysis] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [currentPeriod, setCurrentPeriod] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('N/A');
    const [totalOutlets, setTotalOutlets] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [outletsExceedingThresholdCount, setOutletsExceedingThresholdCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [xaiExplanation, setXaiExplanation] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('No explanation available');
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [backendError, setBackendError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Fetch Data from Backend
    const initData = async ()=>{
        setLoading(true);
        setBackendError(null);
        try {
            const { kpis: fetchedKpis, errors: fetchedErrors, outletsExceedingThreshold: fetchedOutlets, state: fetchedState, coverage: fetchedCoverage, clusters: fetchedClusters, backwardAnalysis: fetchedBackwardAnalysis, currentPeriod: fetchedCurrentPeriod, totalOutlets: fetchedTotalOutlets, outletsExceedingThresholdCount: fetchedOutletsExceedingThresholdCount, xaiExplanation: fetchedXai } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$backendService1$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchData"])();
            // Build plotData from indices object in clusters if available, else fallback to previous method
            const indices = fetchedClusters.indices;
            let plotData = [];
            if (indices && indices.normal && indices.warning && indices.drift) {
                indices.normal.forEach((idx)=>{
                    plotData.push({
                        x: idx,
                        y: 0,
                        exceedsThreshold: false
                    });
                });
                indices.warning.forEach((idx)=>{
                    plotData.push({
                        x: idx,
                        y: 1,
                        exceedsThreshold: false
                    });
                });
                indices.drift.forEach((idx)=>{
                    plotData.push({
                        x: idx,
                        y: 2,
                        exceedsThreshold: false
                    });
                });
                plotData.sort((a, b)=>a.x - b.x);
            } else {
                const warningSet = new Set(fetchedClusters.warning || []);
                const driftSet = new Set(fetchedClusters.drift || []);
                plotData = fetchedErrors.plotData.map((item, index)=>{
                    let yValue = 0; // normal
                    if (warningSet.has(item.x.toString())) {
                        yValue = 1;
                    } else if (driftSet.has(item.x.toString())) {
                        yValue = 2;
                    }
                    return {
                        x: index,
                        y: yValue,
                        exceedsThreshold: item.exceedsThreshold
                    };
                });
            }
            setKpis(fetchedKpis);
            setErrors({
                plotData,
                tableData: fetchedErrors.tableData
            });
            setOutletsExceedingThreshold(fetchedOutlets);
            setState(fetchedState);
            setCoverage(fetchedCoverage);
            setClusters(fetchedClusters);
            setBackwardAnalysis(fetchedBackwardAnalysis);
            setCurrentPeriod(fetchedCurrentPeriod);
            setTotalOutlets(fetchedTotalOutlets);
            setOutletsExceedingThresholdCount(fetchedOutletsExceedingThresholdCount);
            setXaiExplanation(fetchedXai || 'No explanation available');
        } catch (error) {
            console.error('Error fetching data:', error);
            if (error instanceof Error) {
                setBackendError(`Failed to load data: ${error.message}`);
            } else {
                setBackendError('Failed to load data: Unknown error');
            }
        } finally{
            setLoading(false);
        }
    };
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useEffect({
        "Mode2Page.useEffect": ()=>{
            initData();
        }
    }["Mode2Page.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-gray-900 min-h-screen flex flex-col",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$noop$2d$head$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("title", {
                    children: "Mode 2 | Business Dashboard"
                }, void 0, false, {
                    fileName: "[project]/src/app/mode2/page.tsx",
                    lineNumber: 153,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/mode2/page.tsx",
                lineNumber: 152,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "flex-grow container mx-auto px-4 py-8",
                children: [
                    backendError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        className: "h-5 w-5 text-red-300 mr-2",
                                        fill: "none",
                                        viewBox: "0 0 24 24",
                                        stroke: "currentColor",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            strokeLinecap: "round",
                                            strokeLinejoin: "round",
                                            strokeWidth: 2,
                                            d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/mode2/page.tsx",
                                            lineNumber: 161,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode2/page.tsx",
                                        lineNumber: 160,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-lg font-medium text-red-300",
                                        children: "Backend Error"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode2/page.tsx",
                                        lineNumber: 168,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 159,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-2 text-red-200",
                                children: backendError
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 170,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-2 text-red-200 text-sm",
                                children: "Displaying fallback data. Some features may be limited."
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 171,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>initData(),
                                className: "mt-3 px-4 py-2 bg-red-800/50 hover:bg-red-800 text-white rounded-md text-sm font-medium",
                                children: "Retry Connection"
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 172,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/mode2/page.tsx",
                        lineNumber: 158,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-2xl font-semibold text-blue-300 mb-4",
                                children: "OCTAVE - RG Dashboard"
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 183,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-blue-200 mb-2",
                                children: [
                                    "Current Period: ",
                                    loading ? 'Loading...' : currentPeriod
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 184,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-blue-200 mb-2",
                                children: [
                                    "State: ",
                                    loading ? 'Loading...' : state
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 185,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-blue-200 mb-2",
                                children: [
                                    "Total Outlets: ",
                                    loading ? 'Loading...' : totalOutlets
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 186,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-blue-200 mb-2",
                                children: [
                                    "Outlets Exceeding Threshold: ",
                                    loading ? 'Loading...' : outletsExceedingThresholdCount
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 187,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-blue-200 mb-2",
                                children: [
                                    "Coverage - Total Points: ",
                                    loading ? 'Loading...' : coverage.total_points ?? 'N/A'
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 188,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-blue-200 mb-2",
                                children: [
                                    "Coverage - Warning: ",
                                    loading ? 'Loading...' : coverage.warning_coverage ?? 'N/A'
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 189,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-blue-200 mb-2",
                                children: [
                                    "Coverage - Drift: ",
                                    loading ? 'Loading...' : coverage.drift_coverage ?? 'N/A'
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 190,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-blue-200 mb-2",
                                children: [
                                    "Backward Analysis - 10% Drift: ",
                                    loading ? 'Loading...' : backwardAnalysis.backward_10_percent_drift ? 'Yes' : 'No'
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 191,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-blue-200 mb-2",
                                children: [
                                    "Backward Analysis - 10% Warning: ",
                                    loading ? 'Loading...' : backwardAnalysis.backward_10_percent_warning ? 'Yes' : 'No'
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 192,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-1 md:grid-cols-5 gap-4 mt-4",
                                children: kpis.map((kpi)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-blue-900/30 p-4 rounded-lg border border-blue-800/50",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "text-lg font-medium text-blue-200 mb-2",
                                                children: kpi.rowKey
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                lineNumber: 198,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: `text-xl ${kpi.status === 'Warning' ? 'text-yellow-400' : kpi.status === 'Error' ? 'text-red-400' : 'text-green-400'}`,
                                                children: loading ? 'Loading...' : kpi.value || 'N/A'
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                lineNumber: 199,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, kpi.rowKey, true, {
                                        fileName: "[project]/src/app/mode2/page.tsx",
                                        lineNumber: 197,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 195,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/mode2/page.tsx",
                        lineNumber: 182,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-2xl font-semibold mb-4",
                                children: "Drift/Warning Plot"
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 213,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-64 bg-gray-700 rounded p-4",
                                children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-center h-full",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-white",
                                        children: "Loading plot data..."
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode2/page.tsx",
                                        lineNumber: 217,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/mode2/page.tsx",
                                    lineNumber: 216,
                                    columnNumber: 15
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                                    id: "driftWarningChart",
                                    className: "w-full h-full",
                                    ref: (el)=>{
                                        if (el && !loading) {
                                            const ctx = el.getContext('2d');
                                            if (ctx) {
                                                if (chartRef.current) {
                                                    chartRef.current.destroy();
                                                }
                                                chartRef.current = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Chart"](ctx, {
                                                    type: 'line',
                                                    data: {
                                                        labels: errors.plotData.map((item)=>item.x),
                                                        datasets: [
                                                            {
                                                                label: 'Drift State',
                                                                data: errors.plotData.map((item)=>item.y),
                                                                borderColor: 'rgb(75, 192, 192)',
                                                                backgroundColor: errors.plotData.map((item)=>{
                                                                    if (item.y === 0) return 'rgba(54, 162, 235, 0.5)'; // normal - blue
                                                                    if (item.y === 1) return 'rgba(255, 206, 86, 0.5)'; // warning - yellow
                                                                    if (item.y === 2) return 'rgba(255, 99, 132, 0.5)'; // drift - red
                                                                    return 'rgba(201, 203, 207, 0.5)'; // default grey
                                                                }),
                                                                borderWidth: 2,
                                                                tension: 0.1,
                                                                fill: true,
                                                                stepped: true
                                                            }
                                                        ]
                                                    },
                                                    options: {
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        plugins: {
                                                            legend: {
                                                                labels: {
                                                                    color: '#e5e7eb'
                                                                }
                                                            },
                                                            tooltip: {
                                                                mode: 'nearest',
                                                                intersect: true,
                                                                callbacks: {
                                                                    label: function(context) {
                                                                        const y = context.parsed.y;
                                                                        if (y === 0) return 'Normal';
                                                                        if (y === 1) return 'Warning';
                                                                        if (y === 2) return 'Drift';
                                                                        return 'Unknown';
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        scales: {
                                                            x: {
                                                                title: {
                                                                    display: true,
                                                                    text: 'Time Period',
                                                                    color: '#93c5fd',
                                                                    font: {
                                                                        weight: 'bold'
                                                                    }
                                                                },
                                                                grid: {
                                                                    color: 'rgba(255, 255, 255, 0.1)'
                                                                },
                                                                ticks: {
                                                                    color: '#e5e7eb',
                                                                    font: {
                                                                        size: 12
                                                                    }
                                                                }
                                                            },
                                                            y: {
                                                                title: {
                                                                    display: true,
                                                                    text: 'Drift State',
                                                                    color: '#93c5fd',
                                                                    font: {
                                                                        weight: 'bold'
                                                                    }
                                                                },
                                                                beginAtZero: true,
                                                                ticks: {
                                                                    stepSize: 1,
                                                                    callback: function(tickValue) {
                                                                        const value = typeof tickValue === 'string' ? parseInt(tickValue) : tickValue;
                                                                        if (value === 0) return 'Normal';
                                                                        if (value === 1) return 'Warning';
                                                                        if (value === 2) return 'Drift';
                                                                        return '';
                                                                    },
                                                                    color: '#e5e7eb',
                                                                    font: {
                                                                        size: 12
                                                                    }
                                                                },
                                                                grid: {
                                                                    color: 'rgba(255, 255, 255, 0.1)'
                                                                },
                                                                min: 0,
                                                                max: 2
                                                            }
                                                        },
                                                        animation: {
                                                            duration: 1000,
                                                            easing: 'easeInOutQuad'
                                                        },
                                                        elements: {
                                                            point: {
                                                                radius: 5,
                                                                hoverRadius: 7
                                                            }
                                                        }
                                                    }
                                                });
                                            }
                                        }
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/src/app/mode2/page.tsx",
                                    lineNumber: 220,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 214,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/mode2/page.tsx",
                        lineNumber: 212,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 lg:grid-cols-2 gap-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 border border-gray-700",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-2xl font-semibold text-blue-300 mb-4",
                                        children: "Error Comparison"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode2/page.tsx",
                                        lineNumber: 347,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "overflow-x-auto",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                            className: "min-w-full divide-y divide-gray-700",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider",
                                                                children: "ID"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                                lineNumber: 352,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider",
                                                                children: "Time Period"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                                lineNumber: 353,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "px-6 py-3 text-left text-xs font-medium text-red-400 uppercase tracking-wider",
                                                                children: "Error"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                                lineNumber: 354,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/mode2/page.tsx",
                                                        lineNumber: 351,
                                                        columnNumber: 19
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode2/page.tsx",
                                                    lineNumber: 350,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                    className: "divide-y divide-gray-700",
                                                    children: errors.tableData.slice(0, 5).map((error, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "px-6 py-4 whitespace-nowrap text-sm text-white",
                                                                    children: error.id
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/mode2/page.tsx",
                                                                    lineNumber: 360,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "px-6 py-4 whitespace-nowrap text-sm text-white",
                                                                    children: error.timePeriod
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/mode2/page.tsx",
                                                                    lineNumber: 361,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "px-6 py-4 whitespace-nowrap text-sm text-red-400",
                                                                    children: (error.error ?? 0).toFixed(2)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/mode2/page.tsx",
                                                                    lineNumber: 362,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, index, true, {
                                                            fileName: "[project]/src/app/mode2/page.tsx",
                                                            lineNumber: 359,
                                                            columnNumber: 21
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode2/page.tsx",
                                                    lineNumber: 357,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/mode2/page.tsx",
                                            lineNumber: 349,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode2/page.tsx",
                                        lineNumber: 348,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 346,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-red-900/20 rounded-xl shadow-md overflow-hidden p-6 border border-red-800/50",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-2xl font-semibold text-red-300 mb-4",
                                        children: "Threshold Exceedances"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode2/page.tsx",
                                        lineNumber: 374,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "overflow-x-auto",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                            className: "min-w-full divide-y divide-red-800/50",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "px-6 py-3 text-left text-xs font-medium text-red-200 uppercase tracking-wider",
                                                                children: "ID"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                                lineNumber: 379,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "px-6 py-3 text-left text-xs font-medium text-red-200 uppercase tracking-wider",
                                                                children: "True Value"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                                lineNumber: 380,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "px-6 py-3 text-left text-xs font-medium text-red-200 uppercase tracking-wider",
                                                                children: "Predicted Value"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                                lineNumber: 381,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "px-6 py-3 text-left text-xs font-medium text-red-200 uppercase tracking-wider",
                                                                children: "Percentage Error"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                                lineNumber: 382,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/mode2/page.tsx",
                                                        lineNumber: 378,
                                                        columnNumber: 19
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode2/page.tsx",
                                                    lineNumber: 377,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                    className: "divide-y divide-red-800/50",
                                                    children: outletsExceedingThreshold.slice(0, 5).map((outlet)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "px-6 py-4 whitespace-nowrap text-sm text-white",
                                                                    children: outlet.id
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/mode2/page.tsx",
                                                                    lineNumber: 388,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "px-6 py-4 whitespace-nowrap text-sm text-white",
                                                                    children: outlet.y_true.toFixed(2)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/mode2/page.tsx",
                                                                    lineNumber: 389,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "px-6 py-4 whitespace-nowrap text-sm text-white",
                                                                    children: outlet.y_pred.toFixed(2)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/mode2/page.tsx",
                                                                    lineNumber: 390,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "px-6 py-4 whitespace-nowrap text-sm text-red-400",
                                                                    children: [
                                                                        outlet.percentage_error.toFixed(2),
                                                                        "%"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/mode2/page.tsx",
                                                                    lineNumber: 391,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, outlet.id, true, {
                                                            fileName: "[project]/src/app/mode2/page.tsx",
                                                            lineNumber: 387,
                                                            columnNumber: 21
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode2/page.tsx",
                                                    lineNumber: 385,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/mode2/page.tsx",
                                            lineNumber: 376,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode2/page.tsx",
                                        lineNumber: 375,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 373,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-2xl font-semibold text-blue-300 mb-4",
                                        children: "XAI Result"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode2/page.tsx",
                                        lineNumber: 401,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-3 text-white",
                                        children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            children: "Loading XAI explanation..."
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/mode2/page.tsx",
                                            lineNumber: 404,
                                            columnNumber: 17
                                        }, this) : xaiExplanation ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            dangerouslySetInnerHTML: {
                                                __html: xaiExplanation
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/mode2/page.tsx",
                                            lineNumber: 406,
                                            columnNumber: 17
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-red-400",
                                            children: "No explanation available"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/mode2/page.tsx",
                                            lineNumber: 408,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode2/page.tsx",
                                        lineNumber: 402,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 400,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/mode2/page.tsx",
                        lineNumber: 344,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/mode2/page.tsx",
                lineNumber: 155,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/mode2/page.tsx",
        lineNumber: 151,
        columnNumber: 5
    }, this);
}
_s(Mode2Page, "aoUrLp+uWrjo+vw2UBhiI83Xbug=");
_c = Mode2Page;
var _c;
__turbopack_context__.k.register(_c, "Mode2Page");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_37e1e70a._.js.map