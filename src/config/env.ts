export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  appName: import.meta.env.VITE_APP_NAME || 'Kho & Mua hàng',
  /** Bật màn mô phỏng cho chức năng BE chưa có API (phiếu nhập kho). */
  demoMockMissing: import.meta.env.VITE_DEMO_MOCK_MISSING === 'true',
} as const;
