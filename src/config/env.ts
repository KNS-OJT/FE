/**
 * Tài khoản demo chỉ để điền nhanh TÊN ĐĂNG NHẬP khi chạy dev (không bao giờ có mật khẩu).
 * import.meta.env.DEV = false trong bản build production → danh sách luôn rỗng, khối demo không hiện.
 * Định dạng: VITE_DEMO_USERNAMES=manager01:MANAGER,manager02:MANAGER,wh01:WAREHOUSE_STAFF,...
 */
const parseDemoUsers = (raw: string | undefined) =>
  (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [username, role = ''] = s.split(':').map((x) => x.trim());
      return { username, role };
    })
    .filter((u) => /^[A-Za-z0-9._-]{3,100}$/.test(u.username));

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  appName: import.meta.env.VITE_APP_NAME || 'Kho & Mua hàng',
  /** Bật màn mô phỏng cho chức năng BE chưa có API (phiếu nhập kho). */
  demoMockMissing: import.meta.env.VITE_DEMO_MOCK_MISSING === 'true',
  demoUsers: import.meta.env.DEV ? parseDemoUsers(import.meta.env.VITE_DEMO_USERNAMES) : [],
} as const;
