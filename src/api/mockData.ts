// Mock 數據適配器（過渡期使用）

import type { InvestmentData } from '../types';

let mockData: InvestmentData | null = null;

export async function loadMockData(): Promise<InvestmentData> {
  if (mockData) {
    return mockData;
  }

  const response = await fetch('/data/latest.json');
  const data = await response.json();
  mockData = data;
  
  return data;
}

export function getMockData(): InvestmentData | null {
  return mockData;
}

export function clearMockData() {
  mockData = null;
}

// 模擬 API 延遲
export function simulateDelay<T>(data: T, delayMs: number = 300): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delayMs);
  });
}
