/**
 * Olagon AI Gateway Service
 * Clean Architecture: Data Layer - Service
 * 
 * Handles communication with the Olagon AI Gateway.
 * This service is stateless and only performs HTTP operations.
 */

const API_BASE_URL = 'https://api.olagon.com';
const API_KEY = process.env.OLAGON_API_KEY || '';

/**
 * Olagon API Configuration
 */
export interface OlagonConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
}

/**
 * Olagon Request Options
 */
export interface OlagonRequestOptions {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, any>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * Olagon Response
 */
export interface OlagonResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Default configuration
 */
let config: OlagonConfig = {
  baseUrl: API_BASE_URL,
  apiKey: API_KEY,
  timeout: 30000,
};

/**
 * Configure Olagon service
 */
export function configureOlagonService(newConfig: Partial<OlagonConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Send request to Olagon API
 */
async function sendRequest<T = any>(options: OlagonRequestOptions): Promise<OlagonResponse<T>> {
  const { endpoint, method = 'GET', body, headers = {}, signal } = options;
  
  const url = `${config.baseUrl}${endpoint}`;
  
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-Key': config.apiKey || '',
    ...headers,
  };
  
  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
    
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
    
    const data = await response.json();
    
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timeout',
      };
    }
    
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Chat with AI assistant
 */
export async function chatWithAI(
  message: string,
  context?: Record<string, any>
): Promise<OlagonResponse<{ reply: string; suggestions?: string[] }>> {
  return sendRequest({
    endpoint: '/chat',
    method: 'POST',
    body: {
      message,
      context,
    },
  });
}

/**
 * Get water level advice from AI
 */
export async function getWaterLevelAdvice(
  waterLevel: number,
  pumpStatus: 'ON' | 'OFF',
  tankId: string
): Promise<OlagonResponse<{ advice: string; alertLevel: 'normal' | 'warning' | 'critical' }>> {
  return sendRequest({
    endpoint: '/advice/water-level',
    method: 'POST',
    body: {
      waterLevel,
      pumpStatus,
      tankId,
    },
  });
}

/**
 * Analyze sensor data with AI
 */
export async function analyzeSensorData(
  sensor50: boolean,
  sensor90: boolean,
  pumpStatus: 'ON' | 'OFF'
): Promise<OlagonResponse<{ analysis: string; recommendations: string[] }>> {
  return sendRequest({
    endpoint: '/analyze/sensors',
    method: 'POST',
    body: {
      sensor50Percent: sensor50,
      sensor90Percent: sensor90,
      pumpStatus,
    },
  });
}

/**
 * Check service health
 */
export async function checkHealth(): Promise<boolean> {
  const response = await sendRequest({
    endpoint: '/health',
    method: 'GET',
  });
  
  return response.success;
}

/**
 * Create abort controller with timeout
 */
export function createAbortableRequest(timeout: number = config.timeout || 30000): {
  controller: AbortController;
  signal: AbortSignal;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  // Clear timeout if request completes
  controller.signal.addEventListener('abort', () => clearTimeout(timeoutId));
  
  return {
    controller,
    signal: controller.signal,
  };
}
