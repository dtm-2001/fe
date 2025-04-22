module.exports = {

"[project]/src/services/backendService.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "checkBackendHealth": (()=>checkBackendHealth),
    "fetchBusinessUnits": (()=>fetchBusinessUnits),
    "fetchErrors": (()=>fetchErrors),
    "fetchMode1KPIs": (()=>fetchMode1KPIs),
    "fetchMode1XAIData": (()=>fetchMode1XAIData),
    "fetchMode2KPIs": (()=>fetchMode2KPIs),
    "fetchMode2XAIData": (()=>fetchMode2XAIData),
    "fetchMode3KPIs": (()=>fetchMode3KPIs),
    "fetchMode4KPIs": (()=>fetchMode4KPIs)
});
const API_BASE = 'http://localhost:5000/api';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response;
    } catch (error) {
        if (retries <= 0) throw error;
        console.warn(`Retrying ${url} (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
        await new Promise((resolve)=>setTimeout(resolve, RETRY_DELAY));
        return fetchWithRetry(url, options, retries - 1);
    }
}
async function fetchBusinessUnits() {
    try {
        const response = await fetchWithRetry(`${API_BASE}/businessUnits`);
        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error('Invalid business units response format');
        }
        return data;
    } catch (error) {
        console.error('Failed to fetch business units:', error);
        throw new Error('Failed to fetch business units. Please try again later.');
    }
}
async function fetchMode1KPIs(retries = MAX_RETRIES) {
    try {
        const response = await fetchWithRetry(`${API_BASE}/metrics/1`);
        console.log('API response status:', response.status);
        console.log('API response headers:', Object.fromEntries(response.headers.entries()));
        const text = await response.text();
        console.log('Raw API response:', text);
        console.log('Response length:', text.length);
        try {
            // First clean the response text
            const cleanedText = text.trim();
            // Enhanced error code detection with better pattern matching
            const errorCodePatterns = [
                /^[A-Z0-9]{5,8}$/i,
                /^"[A-Z0-9]{5,8}"$/i,
                /(?:code|error)[":\s]+([A-Z0-9]{5,8})/i,
                /(?:error|code)[":\s]+([A-Z0-9]{5,8})/i // Matches error:"ABC123" or code: "ABC123"
            ];
            let errorCode = null;
            for (const pattern of errorCodePatterns){
                const match = cleanedText.match(pattern);
                if (match) {
                    errorCode = match[0].replace(/["{}[\]]/g, ''); // Clean the code
                    break;
                }
            }
            if (errorCode) {
                const errorDetails = {
                    code: errorCode,
                    status: response.status,
                    headers: Object.fromEntries(response.headers.entries()),
                    url: response.url,
                    timestamp: new Date().toISOString(),
                    rawResponse: text,
                    retryAttempt: MAX_RETRIES - retries + 1
                };
                console.error('Backend error detected:', errorDetails);
                // If we have retries left, automatically retry
                if (retries > 0) {
                    console.warn(`Retrying due to backend error code (${cleanedText})...`);
                    await new Promise((resolve)=>setTimeout(resolve, RETRY_DELAY));
                    return fetchMode1KPIs(retries - 1);
                }
                throw new Error(`Backend service temporarily unavailable (code: ${cleanedText})`);
            }
            // Check if response looks like JSON (starts with { or [)
            if (!(cleanedText.startsWith('{') || cleanedText.startsWith('['))) {
                console.error('Unexpected non-JSON response:', {
                    response: cleanedText,
                    status: response.status,
                    headers: Object.fromEntries(response.headers.entries())
                });
                throw new Error(`Unexpected API response format: ${cleanedText.substring(0, 20)}...`);
            }
            let data;
            try {
                // First try parsing the cleaned text directly
                try {
                    data = JSON.parse(cleanedText);
                } catch (initialError) {
                    // If direct parse fails, try extracting JSON
                    const jsonStart = cleanedText.search(/[{\[]/);
                    if (jsonStart === -1) {
                        throw new Error('No JSON found in response');
                    }
                    // More robust JSON extraction that handles nested structures
                    let jsonEnd = jsonStart;
                    let bracketCount = 0;
                    let inString = false;
                    let escapeNext = false;
                    for(let i = jsonStart; i < cleanedText.length; i++){
                        const char = cleanedText[i];
                        if (escapeNext) {
                            escapeNext = false;
                            continue;
                        }
                        if (char === '\\') {
                            escapeNext = true;
                            continue;
                        }
                        if (char === '"') {
                            inString = !inString;
                            continue;
                        }
                        if (!inString) {
                            if (char === '{' || char === '[') bracketCount++;
                            if (char === '}' || char === ']') bracketCount--;
                            if (bracketCount === 0) {
                                jsonEnd = i;
                                break;
                            }
                        }
                    }
                    const jsonText = cleanedText.substring(jsonStart, jsonEnd + 1);
                    data = JSON.parse(jsonText);
                }
            } catch (err) {
                const parseError = err instanceof Error ? err : new Error(String(err));
                console.error('JSON parse error:', {
                    error: parseError.message,
                    response: cleanedText,
                    status: response.status,
                    headers: Object.fromEntries(response.headers.entries()),
                    stack: parseError.stack
                });
                throw new Error(`API response parsing failed: ${parseError.message}`);
            }
            // Handle both array and object response formats
            if (Array.isArray(data)) {
                // If response is an array, assume it's the kpis array
                data = {
                    kpis: data
                };
            }
            // Validate the data structure
            if (!data || !data.kpis) {
                console.error('Invalid KPIs format:', {
                    response: data,
                    status: response.status,
                    headers: Object.fromEntries(response.headers.entries())
                });
                throw new Error('Invalid KPIs response format - missing kpis array');
            }
            if (!Array.isArray(data.kpis)) {
                console.error('KPIs is not an array:', data.kpis);
                throw new Error('Invalid KPIs array format');
            }
            // Process each KPI and remove the ID field
            const processedKPIs = data.kpis.map((kpi)=>{
                if (!kpi.rowKey || !kpi.value) {
                    console.error('Invalid KPI format:', kpi);
                    throw new Error('Missing required KPI fields');
                }
                // Special handling for status KPI
                if (kpi.rowKey === 'status') {
                    return {
                        rowKey: 'Status',
                        value: kpi.value,
                        status: kpi.value // Use value as status
                    };
                }
                // For all other KPIs
                return {
                    rowKey: kpi.rowKey,
                    value: kpi.value,
                    status: 'Normal' // Default status
                };
            });
            console.log('Processed KPIs:', processedKPIs);
            return processedKPIs;
        } catch (parseError) {
            console.error('JSON parse error:', parseError, 'on text:', text);
            throw new Error('Failed to parse API response');
        }
    } catch (error) {
        console.error('Failed to fetch mode1 KPIs:', error);
        throw new Error('Failed to fetch KPIs. Please try again later.');
    }
}
async function fetchMode2KPIs(businessUnit) {
    try {
        const url = businessUnit ? `${API_BASE}/metrics/2/${businessUnit}` : `${API_BASE}/metrics/2`;
        const response = await fetchWithRetry(url);
        const text = await response.text();
        if (!response.ok) {
            console.warn('API returned non-OK status, using mock data');
            return generateMockKPIs();
        }
        let data;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error('Failed to parse API response:', parseError);
            throw new Error('Invalid API response format');
        }
        // Handle both direct array response and wrapped {kpis: [...]} format
        const kpis = Array.isArray(data) ? data : data?.kpis || [];
        if (kpis.length === 0) {
            console.warn('Empty KPIs array received, using mock data');
            return generateMockKPIs();
        }
        // Enhanced response processing with better type checking
        return kpis.map((kpi)=>{
            if (!kpi.rowKey || kpi.value === undefined) {
                console.warn('Invalid KPI format:', kpi);
                throw new Error('Invalid KPI response format');
            }
            return {
                rowKey: kpi.rowKey,
                value: String(kpi.value),
                status: kpi.status || 'Normal',
                businessUnit: kpi.businessUnit,
                useCase: kpi.useCase,
                ...kpi.id && {
                    id: kpi.id
                }
            };
        });
    } catch (error) {
        console.error('Failed to fetch mode2 KPIs:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch KPIs: ${error.message}`);
        }
        throw new Error('Failed to fetch KPIs. Please try again later.');
    }
}
async function fetchMode3KPIs() {
    try {
        const response = await fetchWithRetry(`${API_BASE}/metrics/3`);
        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error('Invalid KPIs response format');
        }
        return data;
    } catch (error) {
        console.error('Failed to fetch mode3 KPIs:', error);
        throw new Error('Failed to fetch KPIs. Please try again later.');
    }
}
async function fetchMode4KPIs() {
    try {
        const response = await fetchWithRetry(`${API_BASE}/metrics/4`);
        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error('Invalid KPIs response format');
        }
        return data;
    } catch (error) {
        console.error('Failed to fetch mode4 KPIs:', error);
        throw new Error('Failed to fetch KPIs. Please try again later.');
    }
}
async function fetchMode1XAIData() {
    try {
        const response = await fetchWithRetry(`${API_BASE}/xai/1`);
        const data = await response.json();
        if (typeof data === 'string') {
            return data;
        } else if (data?.text) {
            return data.text;
        }
        throw new Error('Invalid XAI response format');
    } catch (error) {
        console.error('Failed to fetch mode1 XAI data:', error);
        throw new Error('Failed to fetch XAI data. Please try again later.');
    }
}
async function fetchMode2XAIData(businessUnit) {
    try {
        const url = businessUnit ? `${API_BASE}/xai/2/${businessUnit}` : `${API_BASE}/xai/2`;
        const response = await fetchWithRetry(url);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }
        // Handle both string and object response formats
        if (typeof data === 'string') {
            return data;
        } else if (data?.text) {
            return data.text;
        } else if (data?.explanation) {
            return data.explanation;
        }
        throw new Error('Invalid XAI response format');
    } catch (error) {
        console.error('Failed to fetch mode2 XAI data:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch XAI data: ${error.message}`);
        }
        throw new Error('Failed to fetch XAI data. Please try again later.');
    }
}
function generateMockKPIs() {
    const now = new Date();
    const businessUnits = [
        'CCS',
        'JMSL'
    ];
    const useCases = {
        'CCS': [
            'CC-Di',
            'CC-MT'
        ],
        'JMSL': [
            'JM-Ch'
        ]
    };
    const selectedBU = businessUnits[Math.floor(Math.random() * businessUnits.length)];
    return [
        {
            rowKey: 'alertTime',
            value: new Date(now.getTime() - Math.random() * 48 * 60 * 60 * 1000).toISOString(),
            status: 'Normal',
            businessUnit: selectedBU,
            useCase: useCases[selectedBU][0]
        },
        {
            rowKey: 'runtimeCount',
            value: Math.floor(Math.random() * 300).toString(),
            status: 'Normal',
            businessUnit: selectedBU,
            useCase: useCases[selectedBU][0]
        },
        {
            rowKey: 'alertKeeper',
            value: `${selectedBU} Admin`,
            status: 'Normal',
            businessUnit: selectedBU,
            useCase: useCases[selectedBU][0]
        },
        {
            rowKey: 'currentDrift1',
            value: Math.random().toFixed(2),
            status: Math.random() > 0.8 ? 'Warning' : 'Normal',
            businessUnit: selectedBU,
            useCase: useCases[selectedBU][0]
        },
        {
            rowKey: 'currentDrift2',
            value: Math.random().toFixed(2),
            status: Math.random() > 0.8 ? 'Warning' : 'Normal',
            businessUnit: selectedBU,
            useCase: useCases[selectedBU][0]
        },
        {
            rowKey: 'status',
            value: Math.random() > 0.9 ? 'Error' : Math.random() > 0.7 ? 'Warning' : 'Normal',
            status: Math.random() > 0.9 ? 'Error' : Math.random() > 0.7 ? 'Warning' : 'Normal',
            businessUnit: selectedBU,
            useCase: useCases[selectedBU][0]
        },
        {
            rowKey: 'businessUnit',
            value: selectedBU,
            status: 'Normal',
            businessUnit: selectedBU,
            useCase: useCases[selectedBU][0]
        },
        {
            rowKey: 'useCase',
            value: useCases[selectedBU][0],
            status: 'Normal',
            businessUnit: selectedBU,
            useCase: useCases[selectedBU][0]
        }
    ];
}
async function checkBackendHealth() {
    try {
        const response = await fetchWithRetry(`${API_BASE}/health`, {}, 1); // Only retry once for health check
        return response.ok;
    } catch (error) {
        console.error('Backend health check failed:', error);
        return false;
    }
}
async function fetchErrors() {
    try {
        const response = await fetchWithRetry(`${API_BASE}/errors`);
        const text = await response.text();
        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }
        let backendErrors;
        try {
            backendErrors = JSON.parse(text);
        } catch (parseError) {
            console.error('Failed to parse errors response:', parseError, 'Response:', text);
            throw new Error('Invalid errors response format');
        }
        if (!backendErrors) {
            throw new Error('Empty errors response');
        }
        // Enhanced error data processing with better type safety
        const processErrorData = (err)=>{
            if (!err.id) {
                console.error('Backend error data missing ID:', err);
                throw new Error('Backend error data is missing required id field');
            }
            const meanPred = typeof err.meanPrediction === 'number' ? err.meanPrediction : 0;
            const errorVal = typeof err.error === 'number' ? err.error : 0;
            return {
                id: err.id,
                timePeriod: err.timePeriod || new Date().toISOString(),
                meanPrediction: meanPred,
                error: errorVal,
                percentageError: typeof err.percentageError === 'number' ? err.percentageError : meanPred ? errorVal / meanPred * 100 : 0,
                status: err.exceedsThreshold ? 'Alert' : 'Normal'
            };
        };
        // Handle both array and object response formats
        const errors = Array.isArray(backendErrors) ? {
            plotData: [],
            tableData: backendErrors
        } : backendErrors;
        const plotData = (errors.plotData || []).map((err)=>{
            const timePeriod = err.timePeriod || new Date().toISOString();
            const errorValue = typeof err.error === 'number' ? err.error : 0;
            return {
                x: timePeriod,
                y: errorValue,
                exceedsThreshold: Boolean(err.exceedsThreshold)
            };
        });
        const tableData = (errors.tableData || []).map((err)=>{
            const timePeriod = err.timePeriod || new Date().toISOString();
            const meanPrediction = typeof err.meanPrediction === 'number' ? err.meanPrediction : 0;
            const errorValue = typeof err.error === 'number' ? err.error : 0;
            const percentageError = typeof err.percentageError === 'number' ? err.percentageError : 0;
            return {
                id: err.id || '',
                timePeriod: timePeriod,
                meanPrediction: meanPrediction,
                error: errorValue,
                percentageError: percentageError,
                status: err.exceedsThreshold ? 'Alert' : 'Normal'
            };
        });
        // If no data, generate sample data
        if (plotData.length === 0 && tableData.length === 0) {
            console.warn('No error data received, generating sample data');
            const sampleErrors = Array.from({
                length: 10
            }, (_, i)=>({
                    id: `MISSING_BACKEND_ID_${i}`,
                    timePeriod: new Date(Date.now() - i * 86400000).toISOString(),
                    meanPrediction: Math.random() * 100,
                    error: Math.random() * 20,
                    exceedsThreshold: Math.random() > 0.7,
                    percentageError: Math.random() * 30
                }));
            return {
                plotData: sampleErrors.map((err)=>({
                        x: err.timePeriod || new Date().toISOString(),
                        y: err.error || 0,
                        exceedsThreshold: Boolean(err.exceedsThreshold)
                    })),
                tableData: sampleErrors.map((err)=>({
                        id: err.id || '',
                        timePeriod: err.timePeriod || new Date().toISOString(),
                        meanPrediction: err.meanPrediction || 0,
                        error: err.error || 0,
                        percentageError: err.percentageError || 0,
                        status: err.exceedsThreshold ? 'Alert' : 'Normal'
                    }))
            };
        }
        return {
            plotData,
            tableData
        };
    } catch (error) {
        console.error('Failed to fetch errors:', error);
        // Generate comprehensive fallback data
        const sampleErrors = Array.from({
            length: 10
        }, (_, i)=>({
                id: `MISSING_BACKEND_ID_${i}`,
                timePeriod: new Date(Date.now() - i * 86400000).toISOString(),
                meanPrediction: Math.random() * 100,
                error: Math.random() * 20,
                exceedsThreshold: Math.random() > 0.7,
                percentageError: Math.random() * 30
            }));
        return {
            plotData: sampleErrors.map((err)=>({
                    x: err.timePeriod || new Date().toISOString(),
                    y: err.error || 0,
                    exceedsThreshold: Boolean(err.exceedsThreshold)
                })),
            tableData: sampleErrors.map((err)=>({
                    id: err.id || '',
                    timePeriod: err.timePeriod || new Date().toISOString(),
                    meanPrediction: err.meanPrediction || 0,
                    error: err.error || 0,
                    percentageError: err.percentageError || 0,
                    status: err.exceedsThreshold ? 'Alert' : 'Normal'
                }))
        };
    }
}
}}),
"[project]/src/app/mode2/page.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>Mode2Page)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/chart.js/dist/chart.mjs [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/chart.js/dist/chart.mjs [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$noop$2d$head$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/components/noop-head.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$backendService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/backendService.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Chart"].register(...__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["registerables"]);
;
;
function Mode2Page() {
    const chartRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [businessUnits] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([
        'CCS',
        'JMSL'
    ]);
    const [useCases] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        'CCS': [
            'CC-Di',
            'CC-MT'
        ],
        'JMSL': [
            'JM-Ch'
        ]
    });
    const [businessUnit, setBusinessUnit] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [useCase, setUseCase] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [kpis, setKpis] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [errors, setErrors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        plotData: [],
        tableData: []
    });
    const [xaiExplanation, setXaiExplanation] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const initData = async ()=>{
            try {
                const [kpiData, errorData, xaiResponse] = await Promise.all([
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$backendService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fetchMode2KPIs"])(),
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$backendService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fetchErrors"])(),
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$backendService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fetchMode2XAIData"])()
                ]);
                setKpis(kpiData);
                setErrors({
                    plotData: errorData.plotData,
                    tableData: errorData.tableData
                });
                setXaiExplanation(xaiResponse || 'No explanation available');
            } catch (error) {
                console.error('Error loading data:', error);
                // Generate comprehensive fallback data
                const sampleErrors = Array.from({
                    length: 10
                }, (_, i)=>({
                        id: `ERR-SAMPLE-${i + 1}`,
                        timePeriod: `2023-01-${String(i + 1).padStart(2, '0')}`,
                        meanPrediction: Math.random() * 100,
                        error: Math.random() * 20,
                        exceedsThreshold: Math.random() > 0.7,
                        percentageError: Math.random() * 30
                    }));
                setKpis([
                    {
                        rowKey: 'alertTime',
                        value: new Date().toISOString(),
                        status: 'Normal'
                    },
                    {
                        rowKey: 'runtimeCount',
                        value: '5',
                        status: 'Normal'
                    },
                    {
                        rowKey: 'alertKeeper',
                        value: 'Sample User',
                        status: 'Normal'
                    },
                    {
                        rowKey: 'currentDrift1',
                        value: '1',
                        status: 'Normal'
                    },
                    {
                        rowKey: 'currentDrift2',
                        value: '0',
                        status: 'Normal'
                    },
                    {
                        rowKey: 'status',
                        value: 'Normal',
                        status: 'Normal'
                    },
                    {
                        rowKey: 'businessUnit',
                        value: 'CCS',
                        status: 'Normal'
                    },
                    {
                        rowKey: 'useCase',
                        value: 'CC-Di',
                        status: 'Normal'
                    }
                ]);
                setErrors({
                    plotData: sampleErrors.map((err)=>({
                            x: err.timePeriod,
                            y: err.error,
                            exceedsThreshold: err.exceedsThreshold
                        })),
                    tableData: sampleErrors.map((err)=>({
                            id: err.id,
                            timePeriod: err.timePeriod,
                            meanPrediction: err.meanPrediction,
                            error: err.error,
                            percentageError: err.percentageError,
                            status: err.exceedsThreshold ? 'Alert' : 'Normal'
                        }))
                });
                setXaiExplanation(`XAI Analysis Results:
- Drift Type: Covariate Shift
- Confidence: 87%
- Affected Features: 
  * Feature1 (Importance: 0.45)
  * Feature2 (Importance: 0.32)
- Recommended Actions:
  1. Review training data distribution
  2. Check for data pipeline issues
  3. Consider model retraining`);
            } finally{
                setLoading(false);
            }
        };
        initData();
    }, []);
    const handleBusinessUnitChange = (e)=>{
        const value = e.target.value;
        setBusinessUnit(value);
        setUseCase('');
        localStorage.setItem('businessUnit', value);
    };
    const handleUseCaseChange = (e)=>{
        const value = e.target.value;
        setUseCase(value);
        localStorage.setItem('useCase', value);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-gray-900 min-h-screen flex flex-col",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$noop$2d$head$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("title", {
                    children: "Mode 2 | Business Dashboard"
                }, void 0, false, {
                    fileName: "[project]/src/app/mode2/page.tsx",
                    lineNumber: 127,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/mode2/page.tsx",
                lineNumber: 126,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "flex-grow container mx-auto px-4 py-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-2xl font-semibold text-blue-300 mb-4",
                                children: "OCTAVE - RG Dashboard"
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 133,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-1 md:grid-cols-4 gap-4 mb-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-blue-900/30 p-4 rounded-lg border border-blue-800/50",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "text-lg font-medium text-blue-200 mb-2",
                                                children: "Business Unit"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                lineNumber: 138,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                className: "w-full bg-gray-700 border-blue-600 rounded p-2 text-white",
                                                value: businessUnit,
                                                onChange: handleBusinessUnitChange,
                                                children: businessUnits.map((unit)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: unit,
                                                        children: unit
                                                    }, unit, false, {
                                                        fileName: "[project]/src/app/mode2/page.tsx",
                                                        lineNumber: 145,
                                                        columnNumber: 19
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                lineNumber: 139,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/mode2/page.tsx",
                                        lineNumber: 137,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-blue-900/30 p-4 rounded-lg border border-blue-800/50",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "text-lg font-medium text-blue-200 mb-2",
                                                children: "Use Case"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                lineNumber: 150,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                className: "w-full bg-gray-700 border-blue-600 rounded p-2 text-white",
                                                value: useCase,
                                                onChange: handleUseCaseChange,
                                                disabled: !businessUnit,
                                                children: businessUnit && useCases[businessUnit]?.map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: option,
                                                        children: option
                                                    }, option, false, {
                                                        fileName: "[project]/src/app/mode2/page.tsx",
                                                        lineNumber: 158,
                                                        columnNumber: 19
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                lineNumber: 151,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/mode2/page.tsx",
                                        lineNumber: 149,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-blue-900/30 p4 rounded-lg border border-blue-800/50",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "text-lg font-medium text-blue-200 mb-2",
                                                children: "Short Code"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                lineNumber: 163,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                value: businessUnit && useCase ? `${businessUnit.substring(0, 2)}-${useCase.substring(0, 2)}` : '-',
                                                readOnly: true,
                                                className: "w-full bg-gray-700 border-blue-600 rounded p-2 text-white"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                lineNumber: 164,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/mode2/page.tsx",
                                        lineNumber: 162,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-blue-900/30 p-4 rounded-lg border border-blue-800/50",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "text-lg font-medium text-blue-200 mb-2",
                                                children: "Runtime"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                lineNumber: 172,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                value: "2h 45m",
                                                readOnly: true,
                                                className: "w-full bg-gray-700 border-blue-600 rounded p-2 text-white"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                lineNumber: 173,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/mode2/page.tsx",
                                        lineNumber: 171,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 136,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-1 md:grid-cols-3 gap-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-blue-900/30 p-4 rounded-lg border border-blue-800/50",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "text-lg font-medium text-blue-200 mb-2",
                                                children: "Current Alert Time"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                lineNumber: 185,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xl",
                                                children: loading ? 'Loading...' : kpis.find((k)=>k.rowKey === 'alertTime')?.value || 'N/A'
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                lineNumber: 186,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/mode2/page.tsx",
                                        lineNumber: 184,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-blue-900/30 p-4 rounded-lg border border-blue-800/50",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "text-lg font-medium text-blue-200 mb-2",
                                                children: "No. of Runtime"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                lineNumber: 191,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xl",
                                                children: loading ? 'Loading...' : kpis.find((k)=>k.rowKey === 'runtimeCount')?.value || '0'
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                lineNumber: 192,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/mode2/page.tsx",
                                        lineNumber: 190,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-blue-900/30 p-4 rounded-lg border border-blue-800/50",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "text-lg font-medium text-blue-200 mb-2",
                                                children: "Alert Keeper"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                lineNumber: 197,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xl",
                                                children: loading ? 'Loading...' : kpis.find((k)=>k.rowKey === 'alertKeeper')?.value || 'N/A'
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                lineNumber: 198,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/mode2/page.tsx",
                                        lineNumber: 196,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 183,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/mode2/page.tsx",
                        lineNumber: 132,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-2xl font-semibold text-blue-300 mb-4",
                                children: "Drift Warning Plot"
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 207,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-64 bg-gray-700 rounded p-4",
                                children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-center h-full",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-white",
                                        children: "Loading drift warnings..."
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode2/page.tsx",
                                        lineNumber: 211,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/mode2/page.tsx",
                                    lineNumber: 210,
                                    columnNumber: 15
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "relative h-full",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                                        id: "driftWarningChart",
                                        className: "w-full h-full",
                                        ref: (el)=>{
                                            if (el && !loading) {
                                                const ctx = el.getContext('2d');
                                                if (ctx) {
                                                    if (chartRef.current) {
                                                        chartRef.current.destroy();
                                                    }
                                                    chartRef.current = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chart$2e$js$2f$dist$2f$chart$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Chart"](ctx, {
                                                        type: 'line',
                                                        data: {
                                                            labels: errors.plotData.map((point, i)=>point.x || `Time ${i + 1}`),
                                                            datasets: [
                                                                {
                                                                    label: 'Drift Level',
                                                                    data: errors.plotData.length > 0 ? errors.plotData.map((point)=>Math.floor(point.y) % 3) // Ensures only 0,1,2
                                                                     : kpis.filter((k)=>k.rowKey.includes('currentDrift')).map((k)=>Math.floor(parseFloat(k.value)) % 3),
                                                                    borderColor: 'rgb(239, 68, 68)',
                                                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                                    tension: 0.1,
                                                                    fill: true
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
                                                                    mode: 'index',
                                                                    intersect: false
                                                                }
                                                            },
                                                            scales: {
                                                                x: {
                                                                    title: {
                                                                        display: true,
                                                                        text: 'Data Points',
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
                                                                        text: 'Drift Value',
                                                                        color: '#93c5fd',
                                                                        font: {
                                                                            weight: 'bold'
                                                                        }
                                                                    },
                                                                    beginAtZero: true,
                                                                    grid: {
                                                                        color: 'rgba(255, 255, 255, 0.1)'
                                                                    },
                                                                    ticks: {
                                                                        color: '#e5e7eb',
                                                                        font: {
                                                                            size: 12
                                                                        },
                                                                        callback: (value)=>typeof value === 'number' ? value.toFixed(2) : value
                                                                    }
                                                                }
                                                            },
                                                            animation: {
                                                                duration: 1000,
                                                                easing: 'easeInOutQuad'
                                                            },
                                                            elements: {
                                                                point: {
                                                                    radius: 4,
                                                                    hoverRadius: 6
                                                                }
                                                            }
                                                        }
                                                    });
                                                }
                                            }
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode2/page.tsx",
                                        lineNumber: 215,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/mode2/page.tsx",
                                    lineNumber: 214,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 208,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/mode2/page.tsx",
                        lineNumber: 206,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-2xl font-semibold text-blue-300 mb-4",
                                children: "Hyperparameters"
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 323,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-1 md:grid-cols-2 gap-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-blue-900/30 p-4 rounded-lg border border-blue-800/50",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "text-lg font-medium text-blue-200 mb-2",
                                                children: "Hyperparameters"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                lineNumber: 326,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xl",
                                                children: "Default"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                lineNumber: 327,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/mode2/page.tsx",
                                        lineNumber: 325,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-blue-900/30 p-4 rounded-lg border border-blue-800/50",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "text-lg font-medium text-blue-200 mb-2",
                                                children: "Status"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                lineNumber: 330,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: `text-xl ${loading ? '' : kpis.find((k)=>k.rowKey === 'status')?.value === 'Warning' ? 'text-yellow-400' : kpis.find((k)=>k.rowKey === 'status')?.value === 'Error' ? 'text-red-400' : 'text-green-400'}`,
                                                children: loading ? 'Loading...' : kpis.find((k)=>k.rowKey === 'status')?.value || 'N/A'
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                lineNumber: 331,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/mode2/page.tsx",
                                        lineNumber: 329,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 324,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/mode2/page.tsx",
                        lineNumber: 322,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 mb-6 border border-gray-700",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-2xl font-semibold text-blue-300 mb-4",
                                children: "XAI Result"
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 346,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-3 text-white",
                                children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    children: "Loading XAI explanation..."
                                }, void 0, false, {
                                    fileName: "[project]/src/app/mode2/page.tsx",
                                    lineNumber: 349,
                                    columnNumber: 15
                                }, this) : xaiExplanation ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-blue-900/20 p-4 rounded-lg",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "whitespace-pre-wrap",
                                        children: xaiExplanation
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode2/page.tsx",
                                        lineNumber: 352,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/mode2/page.tsx",
                                    lineNumber: 351,
                                    columnNumber: 15
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-yellow-400",
                                    children: "No XAI explanation available"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/mode2/page.tsx",
                                    lineNumber: 355,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 347,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/mode2/page.tsx",
                        lineNumber: 345,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 lg:grid-cols-2 gap-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-gray-800 rounded-xl shadow-md overflow-hidden p-6 border border-gray-700",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-2xl font-semibold text-blue-300 mb-4",
                                        children: "Error Comparison"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode2/page.tsx",
                                        lineNumber: 364,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "overflow-x-auto",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                            className: "min-w-full divide-y divide-gray-700",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider",
                                                                children: "ID"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                                lineNumber: 369,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider",
                                                                children: "Time Period"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                                lineNumber: 370,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider",
                                                                children: "Error"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                                lineNumber: 371,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/mode2/page.tsx",
                                                        lineNumber: 368,
                                                        columnNumber: 19
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode2/page.tsx",
                                                    lineNumber: 367,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                    className: "divide-y divide-gray-700",
                                                    children: errors.tableData.slice(0, 5).map((error, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "px-6 py-4 whitespace-nowrap text-sm text-white",
                                                                    children: error.id
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/mode2/page.tsx",
                                                                    lineNumber: 377,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "px-6 py-4 whitespace-nowrap text-sm text-white",
                                                                    children: error.timePeriod
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/mode2/page.tsx",
                                                                    lineNumber: 378,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "px-6 py-4 whitespace-nowrap text-sm text-red-400",
                                                                    children: error.error
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/mode2/page.tsx",
                                                                    lineNumber: 379,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, index, true, {
                                                            fileName: "[project]/src/app/mode2/page.tsx",
                                                            lineNumber: 376,
                                                            columnNumber: 21
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode2/page.tsx",
                                                    lineNumber: 374,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/mode2/page.tsx",
                                            lineNumber: 366,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode2/page.tsx",
                                        lineNumber: 365,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 363,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-red-900/20 rounded-xl shadow-md overflow-hidden p-6 border border-red-800/50",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-2xl font-semibold text-red-300 mb-4",
                                        children: "Threshold Exceedances"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode2/page.tsx",
                                        lineNumber: 389,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "overflow-x-auto",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                            className: "min-w-full divide-y divide-red-800/50",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "px-6 py-3 text-left text-xs font-medium text-red-200 uppercase tracking-wider",
                                                                children: "ID"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                                lineNumber: 394,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "px-6 py-3 text-left text-xs font-medium text-red-200 uppercase tracking-wider",
                                                                children: "Error %"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                                lineNumber: 395,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                className: "px-6 py-3 text-left text-xs font-medium text-red-200 uppercase tracking-wider",
                                                                children: "Exceeds"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/mode2/page.tsx",
                                                                lineNumber: 396,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/mode2/page.tsx",
                                                        lineNumber: 393,
                                                        columnNumber: 19
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode2/page.tsx",
                                                    lineNumber: 392,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                    className: "divide-y divide-red-800/50",
                                                    children: errors.tableData.filter((e)=>e.status === 'Alert').slice(0, 5).map((error, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "px-6 py-4 whitespace-nowrap text-sm text-white",
                                                                    children: error.id
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/mode2/page.tsx",
                                                                    lineNumber: 405,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "px-6 py-4 whitespace-nowrap text-sm text-white",
                                                                    children: [
                                                                        error.percentageError,
                                                                        "%"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/mode2/page.tsx",
                                                                    lineNumber: 406,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                    className: "px-6 py-4 whitespace-nowrap text-sm text-red-300",
                                                                    children: error.status === 'Alert' ? 'Yes' : 'No'
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/mode2/page.tsx",
                                                                    lineNumber: 407,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, index, true, {
                                                            fileName: "[project]/src/app/mode2/page.tsx",
                                                            lineNumber: 404,
                                                            columnNumber: 23
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode2/page.tsx",
                                                    lineNumber: 399,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/mode2/page.tsx",
                                            lineNumber: 391,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/mode2/page.tsx",
                                        lineNumber: 390,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/mode2/page.tsx",
                                lineNumber: 388,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/mode2/page.tsx",
                        lineNumber: 361,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/mode2/page.tsx",
                lineNumber: 130,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/mode2/page.tsx",
        lineNumber: 125,
        columnNumber: 5
    }, this);
}
}}),

};

//# sourceMappingURL=src_c6d13077._.js.map