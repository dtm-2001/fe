(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push(["static/chunks/src_7be201f6._.js", {

"[project]/src/services/backendService.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
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
"[project]/src/app/mode3/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>Mode3Page)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$chartjs$2d$chart$2d$matrix$2f$dist$2f$chartjs$2d$chart$2d$matrix$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/chartjs-chart-matrix/dist/chartjs-chart-matrix.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$noop$2d$head$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/components/noop-head.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$backendService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/backendService.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$D3ConfusionMatrix$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/D3ConfusionMatrix.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
// Helper function to safely extract and validate numbers
const getValidNumber = (kpis, key, fallback = 0)=>{
    const value = kpis.find((k)=>k.rowKey === key)?.value;
    const num = Number(value);
    return isNaN(num) ? fallback : Math.max(0, num);
};
function Mode3Page() {
    _s();
    const [businessUnit, setBusinessUnit] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('CCS');
    const [useCase, setUseCase] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('CC-Di');
    const [kpis, setKpis] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [errors, setErrors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [confusionMatrix, setConfusionMatrix] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
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
            trueA: 0,
            falseB: 0,
            falseA: 0,
            trueB: 0,
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
            trueA: 0,
            falseB: 0,
            falseA: 0,
            trueB: 0,
            precision: 0,
            recall: 0,
            f1: 0,
            accuracy: 0
        }
    });
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Mode3Page.useEffect": ()=>{
            const initData = {
                "Mode3Page.useEffect.initData": async ()=>{
                    try {
                        setLoading(true);
                        const savedBusinessUnit = localStorage.getItem('businessUnit') || 'JMSL';
                        const savedUseCase = localStorage.getItem('useCase') || 'JM-Ch';
                        setBusinessUnit(savedBusinessUnit);
                        setUseCase(savedUseCase);
                        const [kpiData, errorData] = await Promise.all([
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$backendService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchMode3KPIs"])(),
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$backendService$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchErrors"])()
                        ]);
                        // Validate KPI data
                        if (!kpiData || kpiData.length === 0) {
                            console.warn('No KPI data received, using mock data');
                            const mockKpiData = generateMockKPIs();
                            setKpis(mockKpiData);
                            setErrors(generateMockErrors());
                            return;
                        }
                        // Type guard for KPI data
                        if (!kpiData.every({
                            "Mode3Page.useEffect.initData": (k)=>k.rowKey && k.value !== undefined
                        }["Mode3Page.useEffect.initData"])) {
                            throw new Error('Invalid KPI data format');
                        }
                        setKpis(kpiData.map({
                            "Mode3Page.useEffect.initData": (k)=>({
                                    rowKey: k.rowKey,
                                    value: k.value,
                                    ...k.status && {
                                        status: k.status
                                    }
                                })
                        }["Mode3Page.useEffect.initData"]));
                        setErrors(Array.isArray(errorData) ? errorData.map({
                            "Mode3Page.useEffect.initData": (e)=>({
                                    predicted: e.predicted || '',
                                    actual: e.actual || '',
                                    timePeriod: e.timePeriod || '',
                                    meanPrediction: Number(e.meanPrediction) || 0,
                                    error: Number(e.error) || 0,
                                    exceedsThreshold: Boolean(e.exceedsThreshold),
                                    ...e.yTrue !== undefined && {
                                        yTrue: Number(e.yTrue)
                                    },
                                    ...e.yPred !== undefined && {
                                        yPred: Number(e.yPred)
                                    },
                                    ...e.percentageError !== undefined && {
                                        percentageError: Number(e.percentageError)
                                    }
                                })
                        }["Mode3Page.useEffect.initData"]) : []);
                        // Extract confusion matrix data from KPIs
                        const refTrueA = getValidNumber(kpiData, 'refTrueA');
                        const refFalseB = getValidNumber(kpiData, 'refFalseB');
                        const refFalseA = getValidNumber(kpiData, 'refFalseA');
                        const refTrueB = getValidNumber(kpiData, 'refTrueB');
                        const currTrueA = getValidNumber(kpiData, 'currTrueA');
                        const currFalseB = getValidNumber(kpiData, 'currFalseB');
                        const currFalseA = getValidNumber(kpiData, 'currFalseA');
                        const currTrueB = getValidNumber(kpiData, 'currTrueB');
                        setConfusionMatrix({
                            reference: {
                                matrix: [
                                    [
                                        refTrueA,
                                        refFalseB
                                    ],
                                    [
                                        refFalseA,
                                        refTrueB
                                    ]
                                ],
                                trueA: refTrueA,
                                falseB: refFalseB,
                                falseA: refFalseA,
                                trueB: refTrueB,
                                precision: getValidNumber(kpiData, 'refPrecision'),
                                recall: getValidNumber(kpiData, 'refRecall'),
                                f1: getValidNumber(kpiData, 'refF1'),
                                accuracy: getValidNumber(kpiData, 'refAccuracy')
                            },
                            current: {
                                matrix: [
                                    [
                                        currTrueA,
                                        currFalseB
                                    ],
                                    [
                                        currFalseA,
                                        currTrueB
                                    ]
                                ],
                                trueA: currTrueA,
                                falseB: currFalseB,
                                falseA: currFalseA,
                                trueB: currTrueB,
                                precision: getValidNumber(kpiData, 'currPrecision'),
                                recall: getValidNumber(kpiData, 'currRecall'),
                                f1: getValidNumber(kpiData, 'currF1'),
                                accuracy: getValidNumber(kpiData, 'currAccuracy')
                            }
                        });
                    } catch (error) {
                        console.error('Error loading data:', error);
                    } finally{
                        setLoading(false);
                    }
                }
            }["Mode3Page.useEffect.initData"];
            initData();
        }
    }["Mode3Page.useEffect"], []);
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
    const getUseCaseOptions = ()=>{
        if (businessUnit === 'CCS') {
            return [
                'CC-Di',
                'CC-MT'
            ];
        } else if (businessUnit === 'JMSL') {
            return [
                'JM-Ch'
            ];
        }
        return [];
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-gray-900 min-h-screen flex flex-col",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$noop$2d$head$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("title", {
                    children: "Mode 3 | Octave"
                }, void 0, false, {
                    fileName: "[project]/src/app/mode3/page.tsx",
                    lineNumber: 213,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/mode3/page.tsx",
                lineNumber: 212,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "bg-gray-800 text-white p-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "container mx-auto flex justify-between items-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "text-2xl font-bold",
                            children: "Mode 3 Analysis"
                        }, void 0, false, {
                            fileName: "[project]/src/app/mode3/page.tsx",
                            lineNumber: 218,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex space-x-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            htmlFor: "businessUnit",
                                            className: "block text-sm font-medium",
                                            children: "Business Unit"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/mode3/page.tsx",
                                            lineNumber: 221,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            id: "businessUnit",
                                            value: businessUnit,
                                            onChange: handleBusinessUnitChange,
                                            className: "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-gray-700 text-white",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "CCS",
                                                    children: "CCS"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 230,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "JMSL",
                                                    children: "JMSL"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 231,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/mode3/page.tsx",
                                            lineNumber: 224,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/mode3/page.tsx",
                                    lineNumber: 220,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            htmlFor: "useCase",
                                            className: "block text-sm font-medium",
                                            children: "Use Case"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/mode3/page.tsx",
                                            lineNumber: 235,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            id: "useCase",
                                            value: useCase,
                                            onChange: handleUseCaseChange,
                                            className: "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-gray-700 text-white",
                                            children: getUseCaseOptions().map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: option,
                                                    children: option
                                                }, option, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 245,
                                                    columnNumber: 19
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/mode3/page.tsx",
                                            lineNumber: 238,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/mode3/page.tsx",
                                    lineNumber: 234,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/mode3/page.tsx",
                            lineNumber: 219,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/mode3/page.tsx",
                    lineNumber: 217,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/mode3/page.tsx",
                lineNumber: 216,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "flex-grow container mx-auto p-4",
                children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-center items-center h-full",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"
                    }, void 0, false, {
                        fileName: "[project]/src/app/mode3/page.tsx",
                        lineNumber: 258,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/app/mode3/page.tsx",
                    lineNumber: 257,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-1 lg:grid-cols-2 gap-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-gray-800 rounded-lg p-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-xl font-semibold mb-4 text-white",
                                    children: "Reference Confusion Matrix"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/mode3/page.tsx",
                                    lineNumber: 263,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$D3ConfusionMatrix$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    title: "Reference Confusion Matrix",
                                    data: confusionMatrix.reference.matrix,
                                    labels: [
                                        'True A',
                                        'False B',
                                        'False A',
                                        'True B'
                                    ]
                                }, void 0, false, {
                                    fileName: "[project]/src/app/mode3/page.tsx",
                                    lineNumber: 264,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-4 grid grid-cols-4 gap-2 text-white",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-green-600 p-2 rounded text-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "font-bold",
                                                    children: "True A"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 271,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: confusionMatrix.reference.trueA
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 272,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/mode3/page.tsx",
                                            lineNumber: 270,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-red-500 p-2 rounded text-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "font-bold",
                                                    children: "False B"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 275,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: confusionMatrix.reference.falseB
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 276,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/mode3/page.tsx",
                                            lineNumber: 274,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-red-500 p-2 rounded text-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "font-bold",
                                                    children: "False A"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 279,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: confusionMatrix.reference.falseA
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 280,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/mode3/page.tsx",
                                            lineNumber: 278,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-green-600 p-2 rounded text-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "font-bold",
                                                    children: "True B"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 283,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: confusionMatrix.reference.trueB
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 284,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/mode3/page.tsx",
                                            lineNumber: 282,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/mode3/page.tsx",
                                    lineNumber: 269,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-4 grid grid-cols-3 gap-2 text-white",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-blue-600 p-2 rounded text-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "font-bold",
                                                    children: "Precision"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 289,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: confusionMatrix.reference.precision.toFixed(2)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 290,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/mode3/page.tsx",
                                            lineNumber: 288,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-blue-600 p-2 rounded text-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "font-bold",
                                                    children: "Recall"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 293,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: confusionMatrix.reference.recall.toFixed(2)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 294,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/mode3/page.tsx",
                                            lineNumber: 292,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-blue-600 p-2 rounded text-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "font-bold",
                                                    children: "F1"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 297,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: confusionMatrix.reference.f1.toFixed(2)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 298,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/mode3/page.tsx",
                                            lineNumber: 296,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/mode3/page.tsx",
                                    lineNumber: 287,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/mode3/page.tsx",
                            lineNumber: 262,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-gray-800 rounded-lg p-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-xl font-semibold mb-4 text-white",
                                    children: "Current Confusion Matrix"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/mode3/page.tsx",
                                    lineNumber: 304,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$D3ConfusionMatrix$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    title: "Current Confusion Matrix",
                                    data: confusionMatrix.current.matrix,
                                    labels: [
                                        'True A',
                                        'False B',
                                        'False A',
                                        'True B'
                                    ]
                                }, void 0, false, {
                                    fileName: "[project]/src/app/mode3/page.tsx",
                                    lineNumber: 305,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-4 grid grid-cols-4 gap-2 text-white",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-green-600 p-2 rounded text-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "font-bold",
                                                    children: "True A"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 312,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: confusionMatrix.current.trueA
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 313,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/mode3/page.tsx",
                                            lineNumber: 311,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-red-500 p-2 rounded text-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "font-bold",
                                                    children: "False B"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 316,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: confusionMatrix.current.falseB
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 317,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/mode3/page.tsx",
                                            lineNumber: 315,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-red-500 p-2 rounded text-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "font-bold",
                                                    children: "False A"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 320,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: confusionMatrix.current.falseA
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 321,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/mode3/page.tsx",
                                            lineNumber: 319,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-green-600 p-2 rounded text-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "font-bold",
                                                    children: "True B"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 324,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: confusionMatrix.current.trueB
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 325,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/mode3/page.tsx",
                                            lineNumber: 323,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/mode3/page.tsx",
                                    lineNumber: 310,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-4 grid grid-cols-3 gap-2 text-white",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-blue-600 p-2 rounded text-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "font-bold",
                                                    children: "Precision"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 330,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: confusionMatrix.current.precision.toFixed(2)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 331,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/mode3/page.tsx",
                                            lineNumber: 329,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-blue-600 p-2 rounded text-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "font-bold",
                                                    children: "Recall"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 334,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: confusionMatrix.current.recall.toFixed(2)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 335,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/mode3/page.tsx",
                                            lineNumber: 333,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bg-blue-600 p-2 rounded text-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "font-bold",
                                                    children: "F1"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 338,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: confusionMatrix.current.f1.toFixed(2)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 339,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/mode3/page.tsx",
                                            lineNumber: 337,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/mode3/page.tsx",
                                    lineNumber: 328,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/mode3/page.tsx",
                            lineNumber: 303,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "lg:col-span-2 bg-gray-800 rounded-lg p-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-xl font-semibold mb-4 text-white",
                                    children: "Error Analysis"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/mode3/page.tsx",
                                    lineNumber: 345,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "overflow-x-auto",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                        className: "min-w-full divide-y divide-gray-700",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                className: "bg-gray-700",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider",
                                                            children: "Time Period"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/mode3/page.tsx",
                                                            lineNumber: 350,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider",
                                                            children: "Predicted"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/mode3/page.tsx",
                                                            lineNumber: 351,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider",
                                                            children: "Actual"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/mode3/page.tsx",
                                                            lineNumber: 352,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider",
                                                            children: "Error"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/mode3/page.tsx",
                                                            lineNumber: 353,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider",
                                                            children: "Status"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/mode3/page.tsx",
                                                            lineNumber: 354,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                    lineNumber: 349,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode3/page.tsx",
                                                lineNumber: 348,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                className: "bg-gray-800 divide-y divide-gray-700",
                                                children: errors.map((error, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                        className: error.exceedsThreshold ? 'bg-red-900' : '',
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-6 py-4 whitespace-nowrap text-sm text-white",
                                                                children: error.timePeriod
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/mode3/page.tsx",
                                                                lineNumber: 360,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-6 py-4 whitespace-nowrap text-sm text-white",
                                                                children: error.predicted
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/mode3/page.tsx",
                                                                lineNumber: 361,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-6 py-4 whitespace-nowrap text-sm text-white",
                                                                children: error.actual
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/mode3/page.tsx",
                                                                lineNumber: 362,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-6 py-4 whitespace-nowrap text-sm text-white",
                                                                children: error.error.toFixed(2)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/mode3/page.tsx",
                                                                lineNumber: 363,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "px-6 py-4 whitespace-nowrap text-sm text-white",
                                                                children: error.exceedsThreshold ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800",
                                                                    children: "Exceeds Threshold"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                                    lineNumber: 366,
                                                                    columnNumber: 29
                                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800",
                                                                    children: "Normal"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/mode3/page.tsx",
                                                                    lineNumber: 370,
                                                                    columnNumber: 29
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/mode3/page.tsx",
                                                                lineNumber: 364,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, index, true, {
                                                        fileName: "[project]/src/app/mode3/page.tsx",
                                                        lineNumber: 359,
                                                        columnNumber: 23
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/mode3/page.tsx",
                                                lineNumber: 357,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/mode3/page.tsx",
                                        lineNumber: 347,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/mode3/page.tsx",
                                    lineNumber: 346,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/mode3/page.tsx",
                            lineNumber: 344,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/mode3/page.tsx",
                    lineNumber: 261,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/mode3/page.tsx",
                lineNumber: 255,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/mode3/page.tsx",
        lineNumber: 211,
        columnNumber: 5
    }, this);
}
_s(Mode3Page, "sAlDhP9TOXZ3UJZTwqMkA3BBqEo=");
_c = Mode3Page;
function generateMockKPIs() {
    return [
        {
            rowKey: 'precision',
            value: '0.85',
            status: 'Normal'
        },
        {
            rowKey: 'recall',
            value: '0.82',
            status: 'Normal'
        },
        {
            rowKey: 'f1',
            value: '0.83',
            status: 'Normal'
        },
        {
            rowKey: 'accuracy',
            value: '0.88',
            status: 'Normal'
        },
        {
            rowKey: 'refTrueA',
            value: '1000',
            status: 'Normal'
        },
        {
            rowKey: 'refFalseB',
            value: '50',
            status: 'Normal'
        },
        {
            rowKey: 'refFalseA',
            value: '100',
            status: 'Normal'
        },
        {
            rowKey: 'refTrueB',
            value: '900',
            status: 'Normal'
        },
        {
            rowKey: 'currentTrueA',
            value: '950',
            status: 'Normal'
        },
        {
            rowKey: 'currentFalseB',
            value: '75',
            status: 'Warning'
        },
        {
            rowKey: 'currentFalseA',
            value: '125',
            status: 'Warning'
        },
        {
            rowKey: 'currentTrueB',
            value: '850',
            status: 'Normal'
        },
        {
            rowKey: 'status',
            value: 'Warning',
            status: 'Warning'
        },
        {
            rowKey: 'refPrecision',
            value: '0.90',
            status: 'Normal'
        },
        {
            rowKey: 'refRecall',
            value: '0.89',
            status: 'Normal'
        },
        {
            rowKey: 'refF1',
            value: '0.89',
            status: 'Normal'
        },
        {
            rowKey: 'refAccuracy',
            value: '0.92',
            status: 'Normal'
        },
        {
            rowKey: 'currPrecision',
            value: '0.85',
            status: 'Normal'
        },
        {
            rowKey: 'currRecall',
            value: '0.82',
            status: 'Normal'
        },
        {
            rowKey: 'currF1',
            value: '0.83',
            status: 'Normal'
        },
        {
            rowKey: 'currAccuracy',
            value: '0.88',
            status: 'Normal'
        }
    ];
}
function generateMockErrors() {
    return Array.from({
        length: 5
    }, (_, i)=>({
            predicted: i % 2 === 0 ? 'Class A' : 'Class B',
            actual: i % 3 === 0 ? 'Class A' : 'Class B',
            timePeriod: new Date(Date.now() - i * 86400000).toISOString(),
            meanPrediction: 1000 + i * 100,
            error: 50 + i * 10,
            exceedsThreshold: i % 2 === 0
        }));
}
var _c;
__turbopack_context__.k.register(_c, "Mode3Page");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_7be201f6._.js.map