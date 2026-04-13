// API 響應類型定義

import type { NewsEvent, Market } from '../types';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: {
    timestamp: string;
    version: string;
    market?: Market;
    lastUpdated?: string;
    count?: number;
    filters?: Record<string, any>;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    retryAfter?: number;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

// ---- 請求參數類型 ----

export interface GetPathsParams {
  market?: Market;
}

export interface GetNewsParams {
  market?: Market;
  limit?: number;
  severity?: 'critical' | 'medium' | 'positive';
  tag?: string;
  path?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetSwitchesParams {
  market?: Market;
}

// ---- 寫入 API 類型 ----

export interface UpdatePathsData {
  nodes?: Record<string, any>;
  switches?: Record<string, any>;
  alert?: any;
  thresholdAlert?: any;
  version?: string;
}

export interface UpdateNewsData {
  news: NewsEvent[];
}

// ---- API 客戶端配置 ----

export interface ApiClientConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
}
