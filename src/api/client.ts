// API 客戶端實現

import type { 
  ApiResult, 
  ApiResponse, 
  ApiClientConfig,
  UpdatePathsData,
  UpdateNewsData,
  GetNewsParams 
} from './types';
import { endpoints } from './endpoints';
import type { InvestmentData, NewsEvent } from '../types';

class ApiClient {
  private apiKey?: string;
  private timeout: number;

  constructor(config: ApiClientConfig = {}) {
    this.apiKey = config.apiKey || import.meta.env.VITE_API_KEY;
    this.timeout = config.timeout || 10000;
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any,
    requireAuth: boolean = false
  ): Promise<ApiResult<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (requireAuth && this.apiKey) {
        headers['X-API-Key'] = this.apiKey;
      }

      const options: RequestInit = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      };

      const response = await fetch(endpoint, options);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.error?.code || 'HTTP_ERROR',
            message: data.error?.message || `HTTP ${response.status}`,
            retryAfter: data.error?.retryAfter,
          },
        };
      }

      return data as ApiResult<T>;

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: '請求超時，請稍後再試',
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : '網絡錯誤',
        },
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ---- 讀取 API ----

  async getPaths(market: 'US' | 'HK' = 'US') {
    return this.request<{
      nodes: Record<string, any>;
      switches: Record<string, any>;
      alert: any;
      thresholdAlert: any;
    }>(endpoints.paths({ market }));
  }

  async getNews(params?: GetNewsParams) {
    return this.request<{
      news: NewsEvent[];
      total: number;
    }>(endpoints.news(params));
  }

  async getMacros() {
    return this.request<{
      macros: any[];
    }>(endpoints.macros());
  }

  async getSwitches(market: 'US' | 'HK' = 'US') {
    return this.request<{
      switches: Record<string, any>;
    }>(endpoints.switches({ market }));
  }

  async getMarket(market: 'US' | 'HK' = 'US') {
    return this.request<InvestmentData>(endpoints.market(market));
  }

  // ---- 寫入 API（需要 API Key）----

  async updatePaths(data: UpdatePathsData) {
    return this.request(endpoints.adminPaths(), 'POST', data, true);
  }

  async updateNews(data: UpdateNewsData) {
    return this.request(endpoints.adminNews(), 'POST', data, true);
  }

  // ---- Mock 模式（過渡期使用）----

  async getMockData(): Promise<ApiResponse<InvestmentData>> {
    const response = await fetch('/data/latest.json');
    const data = await response.json();
    
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: data.meta.version,
        market: 'US',
        lastUpdated: data.meta.lastUpdated,
      },
    };
  }

  // ---- 工具方法 ----

  setApiKey(key: string) {
    this.apiKey = key;
  }
}

// 創建全局實例
export const apiClient = new ApiClient();

// Hook 輔助函數
export function createApiClient(config?: ApiClientConfig) {
  return new ApiClient(config);
}
