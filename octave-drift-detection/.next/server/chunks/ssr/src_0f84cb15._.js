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
"[project]/src/app/mode3/page.tsx [app-ssr] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const e = new Error(`Could not parse module '[project]/src/app/mode3/page.tsx'

Unexpected token `div`. Expected jsx identifier`);
e.code = 'MODULE_UNPARSEABLE';
throw e;}}),

};

//# sourceMappingURL=src_0f84cb15._.js.map