module.exports = {

"[project]/src/app/mode3/page.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>Mode3Page)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chartjs$2d$chart$2d$matrix$2f$dist$2f$chartjs$2d$chart$2d$matrix$2e$esm$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/chartjs-chart-matrix/dist/chartjs-chart-matrix.esm.js [app-ssr] (ecmascript)");
'use client';
;
;
function Mode3Page() {
    const [businessUnit, setBusinessUnit] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('CCS');
    const [useCase, setUseCase] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('CC-Di');
    const [kpis, setKpis] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [errors, setErrors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [confusionMatrix, setConfusionMatrix] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        reference: {
            matrix: [
                [
                    0,
                    0
                ],
                [
                    0,
                    0
                ]
            ],
            labels: [
                'Class A',
                'Class B'
            ],
            precision: 0,
            recall: 0,
            f1: 0,
            accuracy: 0
        },
        current: {
            matrix: [
                [
                    0,
                    0
                ],
                [
                    0,
                    0
                ]
            ],
            labels: [
                'Class A',
                'Class B'
            ],
            precision: 0,
            recall: 0,
            f1: 0,
            accuracy: 0
        }
    });
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const initData = async ()=>{
            try {
                const savedBusinessUnit = localStorage.getItem('businessUnit');
                const savedUseCase = localStorage.getItem('useCase');
                if (savedBusinessUnit) setBusinessUnit(savedBusinessUnit);
                if (savedUseCase) setUseCase(savedUseCase);
                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const [metricsRes, errorsRes] = await Promise.all([
                    fetch(`${apiBase}/api/metrics?mode=3`),
                    fetch(`${apiBase}/api/errors`)
                ]);
                if (!metricsRes.ok || !errorsRes.ok) {
                    throw new Error(`API request failed: ${metricsRes.status} ${errorsRes.status}`);
                }
                const metricsData = await metricsRes.json();
                const errorsData = await errorsRes.json();
                // Normalize KPIs data format
                const normalizedKpis = (metricsData.kpis || Object.entries(metricsData).map(([rowKey, value])=>({
                        rowKey,
                        value: String(value),
                        status: metricsData.status
                    }))).filter((k)=>k.rowKey && k.value);
                // Normalize errors data format
                const normalizedErrors = (errorsData.tableData || errorsData || []).map((e)=>({
                        predicted: e.predicted || e.pred || '',
                        actual: e.actual || e.act || '',
                        timePeriod: e.timePeriod || e.date || '',
                        meanPrediction: Number(e.meanPrediction || e.meanPred || 0),
                        error: Number(e.error || e.err || 0),
                        exceedsThreshold: Boolean(e.exceedsThreshold || e.exceedsThresh),
                        ...e.yTrue !== undefined && {
                            yTrue: Number(e.yTrue)
                        },
                        ...e.yPred !== undefined && {
                            yPred: Number(e.yPred)
                        },
                        ...e.percentageError !== undefined && {
                            percentageError: Number(e.percentageError)
                        }
                    })).filter((e)=>e.predicted && e.actual);
                setKpis(normalizedKpis);
                setErrors(normalizedErrors);
                // Helper function to get numeric value from KPIs
                const getKpiNumberValue = (key)=>{
                    const kpi = normalizedKpis.find((k)=>k.rowKey === key);
                    if (!kpi) return 0;
                    const num = Number(kpi.value);
                    return isNaN(num) ? 0 : num;
                };
                setConfusionMatrix({
                    reference: {
                        matrix: [
                            [
                                getKpiNumberValue('refTrueA'),
                                getKpiNumberValue('refFalseB')
                            ],
                            [
                                getKpiNumberValue('refFalseA'),
                                getKpiNumberValue('refTrueB')
                            ]
                        ],
                        labels: [
                            'Class A',
                            'Class B'
                        ],
                        precision: getKpiNumberValue('refPrecision'),
                        recall: getKpiNumberValue('refRecall'),
                        f1: getKpiNumberValue('refF1'),
                        accuracy: getKpiNumberValue('refAccuracy')
                    },
                    current: {
                        matrix: [
                            [
                                getKpiNumberValue('currTrueA'),
                                getKpiNumberValue('currFalseB')
                            ],
                            [
                                getKpiNumberValue('currFalseA'),
                                getKpiNumberValue('currTrueB')
                            ]
                        ],
                        labels: [
                            'Class A',
                            'Class B'
                        ],
                        precision: getKpiNumberValue('currPrecision'),
                        recall: getKpiNumberValue('currRecall'),
                        f1: getKpiNumberValue('currF1'),
                        accuracy: getKpiNumberValue('currAccuracy')
                    }
                });
            } catch (error) {
                console.error('Error loading data:', error);
            } finally{
                setLoading(false);
            }
        };
        initData();
    }, []);
// ... rest of the component code remains unchanged ...
}
}}),

};

//# sourceMappingURL=src_app_mode3_page_tsx_389a6852._.js.map