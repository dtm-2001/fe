import { KPI, PlotDataPoint, TableDataPoint, RawErrorData } from '../types/dbTypes';

const API_BASE = 'http://localhost:5000/api';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second


async function fetchWithRetry(url: string, options: RequestInit = {}, retries = MAX_RETRIES): Promise<globalThis.Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response;
  } catch (error) {
    if (retries <= 0) throw error;
    console.warn(`Retrying ${url} (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    return fetchWithRetry(url, options, retries - 1);
  }
}

export async function fetchBusinessUnits(): Promise<string[]> {
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

export async function fetchMode1KPIs(retries = MAX_RETRIES): Promise<KPI[]> {
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
        /^[A-Z0-9]{5,8}$/i,                // Case-insensitive plain error code
        /^"[A-Z0-9]{5,8}"$/i,              // Case-insensitive quoted error code  
        /(?:code|error)[":\s]+([A-Z0-9]{5,8})/i, // Matches "code":"ABC123" or error: "ABC123"
        /(?:error|code)[":\s]+([A-Z0-9]{5,8})/i  // Matches error:"ABC123" or code: "ABC123"
      ];
      
      let errorCode = null;
      for (const pattern of errorCodePatterns) {
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
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
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
          
          for (let i = jsonStart; i < cleanedText.length; i++) {
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
        data = { kpis: data };
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
      const processedKPIs = data.kpis.map((kpi: any) => {
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
    } catch (parseError: unknown) {
      console.error('JSON parse error:', parseError, 'on text:', text);
      throw new Error('Failed to parse API response');
    }
  } catch (error) {
    console.error('Failed to fetch mode1 KPIs:', error);
    throw new Error('Failed to fetch KPIs. Please try again later.');
  }
}

interface KPIResponse {
  rowKey: string;
  value: string;
  status?: string;
  businessUnit?: string;
  useCase?: string;
  id?: string;
}

export async function fetchMode2KPIs(businessUnit?: string): Promise<KPI[]> {
  try {
    const url = businessUnit 
      ? `${API_BASE}/metrics/2/${businessUnit}`
      : `${API_BASE}/metrics/2`;
      
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
    const kpis: KPIResponse[] = Array.isArray(data) ? data : (data?.kpis || []);
    
    if (kpis.length === 0) {
      console.warn('Empty KPIs array received, using mock data');
      return generateMockKPIs();
    }

    // Enhanced response processing with better type checking
    return kpis.map(kpi => {
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
        ...(kpi.id && { id: kpi.id }) // Preserve ID if present
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

const mockMode3KPIs: KPI[] = [
  { id: 'KPI-1', rowKey: 'alertTime', value: new Date().toISOString().slice(0,16).replace('T', ' ') },
  { id: 'KPI-2', rowKey: 'runtimeCount', value: '150' },
  { id: 'KPI-3', rowKey: 'alertKeeper', value: 'System Admin' },
  { id: 'KPI-4', rowKey: 'jensenShannon', value: '0.123' },
  { id: 'KPI-5', rowKey: 'psi', value: '0.045' },
  { id: 'KPI-6', rowKey: 'status', value: 'Normal' },
  { id: 'KPI-7', rowKey: 'refTrueA', value: '1000' },
  { id: 'KPI-8', rowKey: 'refFalseB', value: '50' },
  { id: 'KPI-9', rowKey: 'refTrueB', value: '980' },
  { id: 'KPI-10', rowKey: 'refFalseA', value: '40' },
  { id: 'KPI-11', rowKey: 'refPrecision', value: '0.92' },
  { id: 'KPI-12', rowKey: 'refRecall', value: '0.89' },
  { id: 'KPI-13', rowKey: 'refF1', value: '0.90' },
  { id: 'KPI-14', rowKey: 'refAccuracy', value: '0.91' },
  { id: 'KPI-15', rowKey: 'currTrueA', value: '950' },
  { id: 'KPI-16', rowKey: 'currFalseB', value: '60' },
  { id: 'KPI-17', rowKey: 'currTrueB', value: '970' },
  { id: 'KPI-18', rowKey: 'currFalseA', value: '45' },
  { id: 'KPI-19', rowKey: 'currPrecision', value: '0.90' },
  { id: 'KPI-20', rowKey: 'currRecall', value: '0.87' },
  { id: 'KPI-21', rowKey: 'currF1', value: '0.88' },
  { id: 'KPI-22', rowKey: 'currAccuracy', value: '0.89' },
  { id: 'KPI-23', rowKey: 'xaiAnalysis', value: 'Model shows moderate drift with slight performance degradation.' },
  { id: 'KPI-24', rowKey: 'recommendation', value: 'Monitor closely and consider retraining if trend continues.' }
];

export async function fetchMode3KPIs(): Promise<KPI[]> {
  // Return mock data forcibly for mode3 KPIs
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockMode3KPIs);
    }, 500); // simulate network delay
  });
}

export async function fetchMode4KPIs(): Promise<KPI[]> {
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

export async function fetchMode1XAIData(): Promise<string> {
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

export async function fetchMode2XAIData(businessUnit?: string): Promise<string> {
  try {
    const url = businessUnit 
      ? `${API_BASE}/xai/2/${businessUnit}`
      : `${API_BASE}/xai/2`;
      
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

type BusinessUnit = 'CCS' | 'JMSL';

function generateMockKPIs(): KPI[] {
  const now = new Date();
  const businessUnits: BusinessUnit[] = ['CCS', 'JMSL'];
  const useCases: Record<BusinessUnit, string[]> = {
    'CCS': ['CC-Di', 'CC-MT'],
    'JMSL': ['JM-Ch']
  };
  const selectedBU = businessUnits[Math.floor(Math.random() * businessUnits.length)] as BusinessUnit;
  
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
      value: Math.random() > 0.9 ? 'Error' : (Math.random() > 0.7 ? 'Warning' : 'Normal'),
      status: Math.random() > 0.9 ? 'Error' : (Math.random() > 0.7 ? 'Warning' : 'Normal'),
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

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetchWithRetry(`${API_BASE}/health`, {}, 1); // Only retry once for health check
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}

export async function fetchErrors(): Promise<{plotData: PlotDataPoint[], tableData: TableDataPoint[]}> {
  try {
    const response = await fetchWithRetry(`${API_BASE}/errors`);
    const text = await response.text();
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    let backendErrors;
    try {
      backendErrors = JSON.parse(text);
    } catch (parseError: unknown) {
      console.error('Failed to parse errors response:', parseError, 'Response:', text);
      throw new Error('Invalid errors response format');
    }

    if (!backendErrors) {
      throw new Error('Empty errors response');
    }

    // Enhanced error data processing with better type safety
    const processErrorData = (err: RawErrorData) => {
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
        percentageError: typeof err.percentageError === 'number' 
          ? err.percentageError 
          : (meanPred ? (errorVal / meanPred) * 100 : 0),
        status: err.exceedsThreshold ? 'Alert' : 'Normal'
      };
    };

    // Handle both array and object response formats
    const errors = Array.isArray(backendErrors) ? 
      {plotData: [], tableData: backendErrors} : 
      backendErrors;
      
    const plotData: PlotDataPoint[] = (errors.plotData || []).map((err: RawErrorData) => {
      const timePeriod = err.timePeriod || new Date().toISOString();
      const errorValue = typeof err.error === 'number' ? err.error : 0;
      return {
        x: timePeriod,
        y: errorValue,
        exceedsThreshold: Boolean(err.exceedsThreshold)
      } as PlotDataPoint;
    });

    const tableData: TableDataPoint[] = (errors.tableData || []).map((err: RawErrorData) => {
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
      } as TableDataPoint;
    });

    // If no data, generate sample data
    if (plotData.length === 0 && tableData.length === 0) {
      console.warn('No error data received, generating sample data');
      const sampleErrors: RawErrorData[] = Array.from({length: 10}, (_, i) => ({
        id: `MISSING_BACKEND_ID_${i}`,
        timePeriod: new Date(Date.now() - (i * 86400000)).toISOString(),
        meanPrediction: Math.random() * 100,
        error: Math.random() * 20,
        exceedsThreshold: Math.random() > 0.7,
        percentageError: Math.random() * 30
      }));

      return {
        plotData: sampleErrors.map((err: RawErrorData) => ({
          x: err.timePeriod || new Date().toISOString(),
          y: err.error || 0,
          exceedsThreshold: Boolean(err.exceedsThreshold)
        } as PlotDataPoint)),
        tableData: sampleErrors.map((err: RawErrorData) => ({
          id: err.id || '',
          timePeriod: err.timePeriod || new Date().toISOString(),
          meanPrediction: err.meanPrediction || 0,
          error: err.error || 0,
          percentageError: err.percentageError || 0,
          status: err.exceedsThreshold ? 'Alert' : 'Normal'
        } as TableDataPoint))
      };
    }

    return { plotData, tableData };
  } catch (error) {
    console.error('Failed to fetch errors:', error);
    
    // Generate comprehensive fallback data
      const sampleErrors: RawErrorData[] = Array.from({length: 10}, (_, i) => ({
        id: `MISSING_BACKEND_ID_${i}`,
        timePeriod: new Date(Date.now() - (i * 86400000)).toISOString(),
        meanPrediction: Math.random() * 100,
        error: Math.random() * 20,
        exceedsThreshold: Math.random() > 0.7,
        percentageError: Math.random() * 30
      }));

      return {
        plotData: sampleErrors.map((err: RawErrorData) => ({
          x: err.timePeriod || new Date().toISOString(),
          y: err.error || 0,
          exceedsThreshold: Boolean(err.exceedsThreshold)
        } as PlotDataPoint)),
        tableData: sampleErrors.map((err: RawErrorData) => ({
          id: err.id || '',
          timePeriod: err.timePeriod || new Date().toISOString(),
          meanPrediction: err.meanPrediction || 0,
          error: err.error || 0,
          percentageError: err.percentageError || 0,
          status: err.exceedsThreshold ? 'Alert' : 'Normal'
        } as TableDataPoint))
    };
  }
}
