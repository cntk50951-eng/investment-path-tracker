// API 端點定義

import type { GetPathsParams, GetNewsParams, GetSwitchesParams } from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

function buildQueryString(params: Record<string, any>): string {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== null)
  );
  
  if (Object.keys(filtered).length === 0) return '';
  
  return '?' + new URLSearchParams(filtered).toString();
}

export const endpoints = {
  // ---- 讀取 API ----
  
  paths: (params?: GetPathsParams) => 
    `${BASE_URL}/paths${buildQueryString(params || {})}`,
  
  news: (params?: GetNewsParams) => 
    `${BASE_URL}/news${buildQueryString(params || {})}`,
  
  macros: () => 
    `${BASE_URL}/macros`,
  
  switches: (params?: GetSwitchesParams) => 
    `${BASE_URL}/switches${buildQueryString(params || {})}`,
  
  market: (market?: 'US' | 'HK') => 
    `${BASE_URL}/market${market ? `?market=${market}` : ''}`,
  
  // ---- 寫入 API（需要 API Key）----
  
  adminPaths: () => 
    `${BASE_URL}/admin/paths`,
  
  adminNews: () => 
    `${BASE_URL}/admin/news`,
};
