// ============================================================
// BẢNG DANH MỤC TOÀN BỘ ENDPOINT API (CENTRALIZED ENDPOINTS)
// Dự án P03: Inventory & Purchase Request Management System
// Bạn có thể sửa trực tiếp các path ở đây nếu Backend thay đổi.
// ============================================================

export const API_ENDPOINTS = {
  // 1. Xác thực & Quản trị người dùng (IN01)
  AUTH: {
    LOGIN: '/auth/login', // POST
  },
  USERS: {
    LIST: '/users', // GET: ?page=1&size=20
    CREATE: '/users', // POST
    LOCK: (id: number | string) => `/users/${id}/lock`, // POST: Khóa/mở khóa tài khoản
    UPDATE_ROLE: (id: number | string) => `/users/${id}/role`, // PUT: Thay đổi vai trò
  },

  // 2. Danh mục sản phẩm & Nhóm hàng (IN02, IN15)
  CATEGORIES: {
    LIST: '/categories', // GET: ?size=100
    CREATE: '/categories', // POST
    UPDATE: (id: number | string) => `/categories/${id}`, // PUT
  },
  PRODUCTS: {
    LIST: '/products', // GET: ?page=1&size=20&search=&categoryId=
    DETAIL: (id: number | string) => `/products/${id}`, // GET
    CREATE: '/products', // POST (SKU viết hoa duy nhất - BR-01)
    UPDATE: (id: number | string) => `/products/${id}`, // PUT
    UPDATE_MIN_STOCK: (id: number | string) => `/products/${id}/min-stock`, // PUT (IN05)
  },

  // 3. Quản lý Nhà cung cấp (IN03)
  SUPPLIERS: {
    LIST: '/suppliers', // GET: ?page=1&size=20
    DETAIL: (id: number | string) => `/suppliers/${id}`, // GET
    CREATE: '/suppliers', // POST
    UPDATE: (id: number | string) => `/suppliers/${id}`, // PUT (hoặc ngừng hợp tác)
  },

  // 4. Quản lý Đề nghị mua hàng - Purchase Request (IN06, IN07)
  PURCHASE_REQUESTS: {
    LIST: '/purchase-requests', // GET: ?page=1&size=20&status=
    DETAIL: (id: number | string) => `/purchase-requests/${id}`, // GET
    CREATE: '/purchase-requests', // POST: Tạo PR ở Draft
    UPDATE: (id: number | string) => `/purchase-requests/${id}`, // PUT: Sửa khi đang Draft
    SUBMIT: (id: number | string) => `/purchase-requests/${id}/submit`, // POST: Chuyển sang Submitted (BR-11)
    APPROVE: (id: number | string) => `/purchase-requests/${id}/approve`, // POST: Manager duyệt (BR-08 SoD)
    REJECT: (id: number | string) => `/purchase-requests/${id}/reject`, // POST: Manager từ chối (bắt buộc lý do BR-10)
    CANCEL: (id: number | string) => `/purchase-requests/${id}/cancel`, // POST: Hủy PR
  },

  // 5. Đơn đặt hàng - Purchase Order (IN08)
  PURCHASE_ORDERS: {
    LIST: '/purchase-orders', // GET: ?page=1&size=20
    DETAIL: (id: number | string) => `/purchase-orders/${id}`, // GET
    CREATE: '/purchase-orders', // POST: Lập PO từ PR Approved (BR-02, BR-19)
    CANCEL: (id: number | string) => `/purchase-orders/${id}/cancel`, // POST: Hủy PO
  },

  // 6. Nhập kho - Goods Receipt (IN09, IN10)
  GOODS_RECEIPTS: {
    LIST: '/goods-receipts', // GET: ?page=1&size=20
    DETAIL: (id: number | string) => `/goods-receipts/${id}`, // GET
    CREATE: '/goods-receipts', // POST: Lập phiếu nhận theo PO (IN09)
    CONFIRM: (id: number | string) => `/goods-receipts/${id}/confirm`, // POST: Warehouse xác nhận -> TĂNG TỒN (BR-04)
    CANCEL: (id: number | string) => `/goods-receipts/${id}/cancel`, // POST: Hủy phiếu
  },

  // 7. Xuất kho - Stock Issue (IN11, IN12)
  STOCK_ISSUES: {
    LIST: '/stock-issues', // GET: ?page=1&size=20&status=
    DETAIL: (id: number | string) => `/stock-issues/${id}`, // GET
    CREATE: '/stock-issues', // POST: Requester tạo yêu cầu xuất (IN11)
    CONFIRM: (id: number | string) => `/stock-issues/${id}/confirm`, // POST: Warehouse xác nhận -> TRỪ TỒN (BR-05, BR-23)
    REJECT: (id: number | string) => `/stock-issues/${id}/reject`, // POST: Từ chối yêu cầu
    CANCEL: (id: number | string) => `/stock-issues/${id}/cancel`, // POST: Hủy yêu cầu
  },

  // 8. Tồn kho, Cảnh báo & Sổ kho Ledger (IN04, IN05, IN13, IN14)
  STOCK: {
    BALANCES: '/stock/balances', // GET: Số dư tồn kho từng sản phẩm
    LOW: '/stock/low', // GET: Cảnh báo hàng dưới mức tồn tối thiểu
    LEDGER: '/stock/ledger', // GET: Lịch sử biến động kho IN / OUT (chỉ đọc BR-07)
  },

  // 9. Dashboard (IN16)
  DASHBOARD: {
    GET: '/dashboard', // GET: Thống kê số lượng hàng thiếu, PR chờ duyệt, PO chờ nhận...
  },
} as const

