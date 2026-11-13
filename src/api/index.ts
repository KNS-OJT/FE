// =======================================================================
// 🎯 NƠI ĐIỀN LINK API & CẤU HÌNH DUY NHẤT CỦA TOÀN BỘ HỆ THỐNG (P03)
// =======================================================================
// BẠN CHỈ CẦN CHỈNH Ở ĐÚNG KHUNG DƯỚI ĐÂY:
//
// 1. Link API Backend thật (đọc trực tiếp từ file .env):
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8080/api'

// 2. Chế độ Mock Data giả (đọc trực tiếp từ VITE_USE_MOCK trong file .env):
//    - true  : Đang dùng Mock data giả (tạm thời để test giao diện, không cần Backend)
//    - false : Hoàn thiện Backend -> chỉ cần đổi trong .env là xong!
export const USE_MOCK: boolean = import.meta.env.VITE_USE_MOCK !== 'false'

// =======================================================================
import axios from 'axios'
import { API_ENDPOINTS } from './endpoints'
import * as mock from '@/lib/mock-data'
import { useAuthStore } from '@/auth/store'
import type {
  User,
  Category,
  Product,
  Supplier,
  StockBalance,
  PurchaseRequest,
  PurchaseOrder,
  GoodsReceipt,
  StockIssue,
  StockTransaction,
  DashboardData,
  PaginatedResponse,
  LoginRequest,
  LoginResponse,
  CreateUserRequest,
  ProductFormData,
  CategoryFormData,
  SupplierFormData,
  PRFormData,
  POFormData,
  GRFormData,
  SIFormData,
} from '@/types'

export { API_ENDPOINTS }

// -------------------------------------------------------------
// Axios client cấu hình theo API_BASE_URL duy nhất ở trên
// -------------------------------------------------------------
export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

// Tự động đính kèm Bearer JWT Token vào mọi request
http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Bắt lỗi 401 Unauthorized để tự động logout
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

/**
 * Hàm điều phối gọi API thật hoặc Mock Data theo biến USE_MOCK duy nhất ở trên
 */
async function callApi<T>(apiFn: () => Promise<T>, mockFn: () => Promise<T>): Promise<T> {
  if (USE_MOCK) {
    return await mockFn()
  }
  return await apiFn()
}

// ============================================================
// 1. AUTH API — Đăng nhập & Xác thực
// ============================================================
export const authApi = {
  /**
   * Đăng nhập tài khoản, trả về JWT Token và User Info
   * Endpoint: POST /api/auth/login
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return callApi(
      async () => {
        const res = await http.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials)
        return res.data
      },
      () => mock.mockLogin(credentials.username, credentials.password),
    )
  },
}

// ============================================================
// 2. USER API (IN01) — Quản lý người dùng & phân quyền
// ============================================================
export const userApi = {
  /**
   * Lấy danh sách tài khoản phân trang
   * Endpoint: GET /api/users
   */
  getUsers: async (page = 1, size = 20): Promise<PaginatedResponse<User>> => {
    return callApi(
      async () => {
        const res = await http.get<PaginatedResponse<User>>(API_ENDPOINTS.USERS.LIST, {
          params: { page, size },
        })
        return res.data
      },
      () => mock.mockGetUsers(page, size),
    )
  },

  /**
   * Tạo tài khoản mới gán 1 trong 4 vai trò (chỉ Manager)
   * Endpoint: POST /api/users
   */
  createUser: async (data: CreateUserRequest): Promise<User> => {
    return callApi(
      async () => {
        const res = await http.post<User>(API_ENDPOINTS.USERS.CREATE, data)
        return res.data
      },
      () => mock.mockCreateUser(data),
    )
  },

  /**
   * Khóa hoặc mở khóa tài khoản
   * Endpoint: POST /api/users/{id}/lock
   */
  lockUser: async (userId: number): Promise<User> => {
    return callApi(
      async () => {
        const res = await http.post<User>(API_ENDPOINTS.USERS.LOCK(userId))
        return res.data
      },
      () => mock.mockLockUser(userId),
    )
  },
}

// ============================================================
// 3. CATEGORY API (IN02) — Nhóm hàng linh kiện
// ============================================================
export const categoryApi = {
  /**
   * Lấy danh mục nhóm hàng linh kiện
   * Endpoint: GET /api/categories
   */
  getCategories: async (page = 1, size = 100): Promise<PaginatedResponse<Category>> => {
    return callApi(
      async () => {
        const res = await http.get<PaginatedResponse<Category>>(API_ENDPOINTS.CATEGORIES.LIST, {
          params: { page, size },
        })
        return res.data
      },
      () => mock.mockGetCategories(page, size),
    )
  },

  /**
   * Thêm nhóm hàng mới
   * Endpoint: POST /api/categories
   */
  createCategory: async (data: CategoryFormData): Promise<Category> => {
    return callApi(
      async () => {
        const res = await http.post<Category>(API_ENDPOINTS.CATEGORIES.CREATE, data)
        return res.data
      },
      () => mock.mockCreateCategory(data),
    )
  },

  /**
   * Cập nhật nhóm hàng
   * Endpoint: PUT /api/categories/{id}
   */
  updateCategory: async (id: number, data: Partial<CategoryFormData> & { isActive?: boolean }): Promise<Category> => {
    return callApi(
      async () => {
        const res = await http.put<Category>(API_ENDPOINTS.CATEGORIES.UPDATE(id), data)
        return res.data
      },
      async () => ({
        categoryId: id,
        categoryName: data.categoryName ?? '',
        description: data.description ?? null,
        isActive: data.isActive ?? true,
      }),
    )
  },
}

// ============================================================
// 4. PRODUCT API (IN02, IN05, IN15) — Sản phẩm linh kiện & Ngưỡng tồn
// ============================================================
export const productApi = {
  /**
   * Lấy danh sách sản phẩm phân trang, tìm kiếm SKU/tên, lọc theo danh mục
   * Endpoint: GET /api/products
   */
  getProducts: async (
    page = 1,
    size = 20,
    search?: string,
    categoryId?: number,
  ): Promise<PaginatedResponse<Product>> => {
    return callApi(
      async () => {
        const res = await http.get<PaginatedResponse<Product>>(API_ENDPOINTS.PRODUCTS.LIST, {
          params: { page, size, search, categoryId },
        })
        return res.data
      },
      () => mock.mockGetProducts(page, size, search, categoryId),
    )
  },

  /**
   * Thêm sản phẩm mới với SKU duy nhất viết hoa (BR-01)
   * Endpoint: POST /api/products
   */
  createProduct: async (data: ProductFormData): Promise<Product> => {
    return callApi(
      async () => {
        const res = await http.post<Product>(API_ENDPOINTS.PRODUCTS.CREATE, {
          ...data,
          sku: data.sku.toUpperCase(),
        })
        return res.data
      },
      () => mock.mockCreateProduct(data),
    )
  },

  /**
   * Cập nhật thông tin sản phẩm / ngừng kinh doanh
   * Endpoint: PUT /api/products/{id}
   */
  updateProduct: async (id: number, data: Partial<ProductFormData> & { isActive?: boolean }): Promise<Product> => {
    return callApi(
      async () => {
        const res = await http.put<Product>(API_ENDPOINTS.PRODUCTS.UPDATE(id), data)
        return res.data
      },
      async () => ({
        productId: id,
        sku: data.sku ?? 'SKU',
        productName: data.productName ?? '',
        categoryId: data.categoryId ?? 1,
        categoryName: 'Linh kiện',
        unit: data.unit ?? 'cái',
        isActive: data.isActive ?? true,
        createdAt: new Date().toISOString(),
      }),
    )
  },

  /**
   * Cập nhật mức tồn kho an toàn tối thiểu Minimum Stock (IN05)
   * Endpoint: PUT /api/products/{id}/min-stock
   */
  updateMinStock: async (id: number, minimumStock: number): Promise<{ success: boolean }> => {
    return callApi(
      async () => {
        const res = await http.put<{ success: boolean }>(API_ENDPOINTS.PRODUCTS.UPDATE_MIN_STOCK(id), {
          minimumStock,
        })
        return res.data
      },
      async () => {
        const item = mock.mockStockBalances.find((b) => b.productId === id)
        if (item) item.minimumStock = minimumStock
        return { success: true }
      },
    )
  },
}

// ============================================================
// 5. SUPPLIER API (IN03) — Quản lý Nhà cung cấp
// ============================================================
export const supplierApi = {
  /**
   * Lấy danh sách nhà cung cấp
   * Endpoint: GET /api/suppliers
   */
  getSuppliers: async (page = 1, size = 100): Promise<PaginatedResponse<Supplier>> => {
    return callApi(
      async () => {
        const res = await http.get<PaginatedResponse<Supplier>>(API_ENDPOINTS.SUPPLIERS.LIST, {
          params: { page, size },
        })
        return res.data
      },
      () => mock.mockGetSuppliers(page, size),
    )
  },

  /**
   * Thêm nhà cung cấp mới
   * Endpoint: POST /api/suppliers
   */
  createSupplier: async (data: SupplierFormData): Promise<Supplier> => {
    return callApi(
      async () => {
        const res = await http.post<Supplier>(API_ENDPOINTS.SUPPLIERS.CREATE, data)
        return res.data
      },
      () => mock.mockCreateSupplier(data),
    )
  },

  /**
   * Sửa nhà cung cấp / ngừng hợp tác
   * Endpoint: PUT /api/suppliers/{id}
   */
  updateSupplier: async (id: number, data: Partial<SupplierFormData> & { isActive?: boolean }): Promise<Supplier> => {
    return callApi(
      async () => {
        const res = await http.put<Supplier>(API_ENDPOINTS.SUPPLIERS.UPDATE(id), data)
        return res.data
      },
      async () => ({
        supplierId: id,
        supplierName: data.supplierName ?? '',
        contactPerson: data.contactPerson ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        address: data.address ?? null,
        isActive: data.isActive ?? true,
      }),
    )
  },
}

// ============================================================
// 6. PURCHASE REQUEST API (IN06, IN07) — Đề nghị mua hàng
// ============================================================
export const purchaseRequestApi = {
  /**
   * Lấy danh sách PR (có thể lọc theo trạng thái DRAFT, SUBMITTED, APPROVED...)
   * Endpoint: GET /api/purchase-requests
   */
  getPurchaseRequests: async (page = 1, size = 20, status?: string): Promise<PaginatedResponse<PurchaseRequest>> => {
    return callApi(
      async () => {
        const res = await http.get<PaginatedResponse<PurchaseRequest>>(API_ENDPOINTS.PURCHASE_REQUESTS.LIST, {
          params: { page, size, status: status || undefined },
        })
        return res.data
      },
      () => mock.mockGetPurchaseRequests(page, size, status),
    )
  },

  /**
   * Lấy chi tiết một PR theo ID
   * Endpoint: GET /api/purchase-requests/{id}
   */
  getPurchaseRequestById: async (id: number): Promise<PurchaseRequest> => {
    return callApi(
      async () => {
        const res = await http.get<PurchaseRequest>(API_ENDPOINTS.PURCHASE_REQUESTS.DETAIL(id))
        return res.data
      },
      () => mock.mockGetPurchaseRequest(id),
    )
  },

  /**
   * Tạo PR mới (Draft hoặc gửi luôn Submitted)
   * Endpoint: POST /api/purchase-requests
   */
  createPurchaseRequest: async (data: PRFormData & { submit?: boolean }): Promise<PurchaseRequest> => {
    return callApi(
      async () => {
        const res = await http.post<PurchaseRequest>(API_ENDPOINTS.PURCHASE_REQUESTS.CREATE, data)
        if (data.submit) {
          await http.post(API_ENDPOINTS.PURCHASE_REQUESTS.SUBMIT(res.data.purchaseRequestId))
          res.data.status = 'SUBMITTED'
          res.data.submittedAt = new Date().toISOString()
        }
        return res.data
      },
      async () => {
        const pr = await mock.mockCreatePR(data)
        if (data.submit) {
          pr.status = 'SUBMITTED'
          pr.submittedAt = new Date().toISOString()
        }
        return pr
      },
    )
  },

  /**
   * Gửi PR để chuyển trạng thái sang Submitted (Khóa chỉnh sửa - BR-11)
   * Endpoint: POST /api/purchase-requests/{id}/submit
   */
  submitPurchaseRequest: async (id: number): Promise<PurchaseRequest> => {
    return callApi(
      async () => {
        const res = await http.post<PurchaseRequest>(API_ENDPOINTS.PURCHASE_REQUESTS.SUBMIT(id))
        return res.data
      },
      async () => {
        const pr = await mock.mockGetPurchaseRequest(id)
        pr.status = 'SUBMITTED'
        pr.submittedAt = new Date().toISOString()
        return pr
      },
    )
  },

  /**
   * Manager phê duyệt PR (Chống tự duyệt SoD - BR-08)
   * Endpoint: POST /api/purchase-requests/{id}/approve
   */
  approvePurchaseRequest: async (id: number): Promise<PurchaseRequest> => {
    return callApi(
      async () => {
        const res = await http.post<PurchaseRequest>(API_ENDPOINTS.PURCHASE_REQUESTS.APPROVE(id))
        return res.data
      },
      async () => {
        const pr = await mock.mockGetPurchaseRequest(id)
        const currentUser = useAuthStore.getState().user
        pr.status = 'APPROVED'
        pr.reviewedAt = new Date().toISOString()
        pr.reviewedBy = currentUser?.userId ?? 1
        pr.reviewerName = currentUser?.fullName ?? 'Nguyễn Văn Admin'
        return pr
      },
    )
  },

  /**
   * Manager từ chối PR (Bắt buộc kèm lý do - BR-10)
   * Endpoint: POST /api/purchase-requests/{id}/reject
   */
  rejectPurchaseRequest: async (id: number, reason: string): Promise<PurchaseRequest> => {
    return callApi(
      async () => {
        const res = await http.post<PurchaseRequest>(API_ENDPOINTS.PURCHASE_REQUESTS.REJECT(id), { reason })
        return res.data
      },
      async () => {
        const pr = await mock.mockGetPurchaseRequest(id)
        const currentUser = useAuthStore.getState().user
        pr.status = 'REJECTED'
        pr.reviewedAt = new Date().toISOString()
        pr.reviewedBy = currentUser?.userId ?? 1
        pr.reviewerName = currentUser?.fullName ?? 'Nguyễn Văn Admin'
        pr.reviewReason = reason
        return pr
      },
    )
  },

  /**
   * Hủy PR
   * Endpoint: POST /api/purchase-requests/{id}/cancel
   */
  cancelPurchaseRequest: async (id: number): Promise<PurchaseRequest> => {
    return callApi(
      async () => {
        const res = await http.post<PurchaseRequest>(API_ENDPOINTS.PURCHASE_REQUESTS.CANCEL(id))
        return res.data
      },
      async () => {
        const pr = await mock.mockGetPurchaseRequest(id)
        pr.status = 'CANCELED'
        return pr
      },
    )
  },
}

// ============================================================
// 7. PURCHASE ORDER API (IN08) — Đơn đặt hàng
// ============================================================
export const purchaseOrderApi = {
  /**
   * Lấy danh sách PO
   * Endpoint: GET /api/purchase-orders
   */
  getPurchaseOrders: async (page = 1, size = 20): Promise<PaginatedResponse<PurchaseOrder>> => {
    return callApi(
      async () => {
        const res = await http.get<PaginatedResponse<PurchaseOrder>>(API_ENDPOINTS.PURCHASE_ORDERS.LIST, {
          params: { page, size },
        })
        return res.data
      },
      () => mock.mockGetPurchaseOrders(page, size),
    )
  },

  /**
   * Lấy chi tiết đơn đặt hàng PO
   * Endpoint: GET /api/purchase-orders/{id}
   */
  getPurchaseOrderById: async (id: number): Promise<PurchaseOrder> => {
    return callApi(
      async () => {
        const res = await http.get<PurchaseOrder>(API_ENDPOINTS.PURCHASE_ORDERS.DETAIL(id))
        return res.data
      },
      () => mock.mockGetPurchaseOrder(id),
    )
  },

  /**
   * Purchasing Staff tạo PO từ PR đã Approved (BR-02, BR-19)
   * Endpoint: POST /api/purchase-orders
   */
  createPurchaseOrder: async (data: POFormData): Promise<PurchaseOrder> => {
    return callApi(
      async () => {
        const res = await http.post<PurchaseOrder>(API_ENDPOINTS.PURCHASE_ORDERS.CREATE, data)
        return res.data
      },
      () => mock.mockCreatePO(data),
    )
  },
}

// ============================================================
// 8. GOODS RECEIPT API (IN09, IN10) — Nhập kho
// ============================================================
export const goodsReceiptApi = {
  /**
   * Lấy danh sách phiếu nhập kho
   * Endpoint: GET /api/goods-receipts
   */
  getGoodsReceipts: async (page = 1, size = 20): Promise<PaginatedResponse<GoodsReceipt>> => {
    return callApi(
      async () => {
        const res = await http.get<PaginatedResponse<GoodsReceipt>>(API_ENDPOINTS.GOODS_RECEIPTS.LIST, {
          params: { page, size },
        })
        return res.data
      },
      () => mock.mockGetGoodsReceipts(page, size),
    )
  },

  /**
   * Lấy chi tiết phiếu nhập kho
   * Endpoint: GET /api/goods-receipts/{id}
   */
  getGoodsReceiptById: async (id: number): Promise<GoodsReceipt> => {
    return callApi(
      async () => {
        const res = await http.get<GoodsReceipt>(API_ENDPOINTS.GOODS_RECEIPTS.DETAIL(id))
        return res.data
      },
      () => mock.mockGetGoodsReceipt(id),
    )
  },

  /**
   * Warehouse Staff lập phiếu nhận hàng đối chiếu theo PO (IN09)
   * Endpoint: POST /api/goods-receipts
   */
  createGoodsReceipt: async (data: GRFormData): Promise<GoodsReceipt> => {
    return callApi(
      async () => {
        const res = await http.post<GoodsReceipt>(API_ENDPOINTS.GOODS_RECEIPTS.CREATE, data)
        return res.data
      },
      () => mock.mockCreateGR(data),
    )
  },

  /**
   * Xác nhận nhập kho: TĂNG TỒN KHO & GHI LEDGER (BR-04, Transaction an toàn)
   * Endpoint: POST /api/goods-receipts/{id}/confirm
   */
  confirmGoodsReceipt: async (id: number): Promise<GoodsReceipt> => {
    return callApi(
      async () => {
        const res = await http.post<GoodsReceipt>(API_ENDPOINTS.GOODS_RECEIPTS.CONFIRM(id))
        return res.data
      },
      async () => {
        const gr = await mock.mockGetGoodsReceipt(id)
        gr.status = 'CONFIRMED'
        gr.confirmedAt = new Date().toISOString()
        gr.confirmerName = 'Trần Thị Kho'
        return gr
      },
    )
  },
}

// ============================================================
// 9. STOCK ISSUE API (IN11, IN12) — Xuất kho
// ============================================================
export const stockIssueApi = {
  /**
   * Lấy danh sách yêu cầu xuất kho
   * Endpoint: GET /api/stock-issues
   */
  getStockIssues: async (page = 1, size = 20, status?: string): Promise<PaginatedResponse<StockIssue>> => {
    return callApi(
      async () => {
        const res = await http.get<PaginatedResponse<StockIssue>>(API_ENDPOINTS.STOCK_ISSUES.LIST, {
          params: { page, size, status: status || undefined },
        })
        return res.data
      },
      () => mock.mockGetStockIssues(page, size),
    )
  },

  /**
   * Chi tiết yêu cầu xuất kho
   * Endpoint: GET /api/stock-issues/{id}
   */
  getStockIssueById: async (id: number): Promise<StockIssue> => {
    return callApi(
      async () => {
        const res = await http.get<StockIssue>(API_ENDPOINTS.STOCK_ISSUES.DETAIL(id))
        return res.data
      },
      () => mock.mockGetStockIssue(id),
    )
  },

  /**
   * Requester tạo yêu cầu xuất kho (IN11)
   * Endpoint: POST /api/stock-issues
   */
  createStockIssue: async (data: SIFormData): Promise<StockIssue> => {
    return callApi(
      async () => {
        const res = await http.post<StockIssue>(API_ENDPOINTS.STOCK_ISSUES.CREATE, data)
        return res.data
      },
      () => mock.mockCreateSI(data),
    )
  },

  /**
   * Warehouse Staff xác nhận xuất kho: TRỪ TỒN KHO & GHI LEDGER (BR-04, BR-23)
   * Endpoint: POST /api/stock-issues/{id}/confirm
   */
  confirmStockIssue: async (id: number): Promise<StockIssue> => {
    return callApi(
      async () => {
        const res = await http.post<StockIssue>(API_ENDPOINTS.STOCK_ISSUES.CONFIRM(id))
        return res.data
      },
      async () => {
        const si = await mock.mockGetStockIssue(id)
        si.status = 'CONFIRMED'
        si.confirmedAt = new Date().toISOString()
        si.confirmerName = 'Trần Thị Kho'
        return si
      },
    )
  },

  /**
   * Từ chối yêu cầu xuất kho kèm lý do
   * Endpoint: POST /api/stock-issues/{id}/reject
   */
  rejectStockIssue: async (id: number, reason: string): Promise<StockIssue> => {
    return callApi(
      async () => {
        const res = await http.post<StockIssue>(API_ENDPOINTS.STOCK_ISSUES.REJECT(id), { reason })
        return res.data
      },
      async () => {
        const si = await mock.mockGetStockIssue(id)
        si.status = 'CANCELED'
        si.cancelReason = reason
        return si
      },
    )
  },

  /**
   * Hủy yêu cầu xuất kho
   * Endpoint: POST /api/stock-issues/{id}/cancel
   */
  cancelStockIssue: async (id: number): Promise<StockIssue> => {
    return callApi(
      async () => {
        const res = await http.post<StockIssue>(API_ENDPOINTS.STOCK_ISSUES.CANCEL(id))
        return res.data
      },
      async () => {
        const si = await mock.mockGetStockIssue(id)
        si.status = 'CANCELED'
        return si
      },
    )
  },
}

// ============================================================
// 10. STOCK API (IN04, IN13, IN14) — Tồn kho, Cảnh báo & Sổ kho
// ============================================================
export const stockApi = {
  /**
   * Lấy số lượng tồn kho từng sản phẩm (IN04)
   * Endpoint: GET /api/stock/balances
   */
  getStockBalances: async (page = 1, size = 20, search?: string): Promise<PaginatedResponse<StockBalance>> => {
    return callApi(
      async () => {
        const res = await http.get<PaginatedResponse<StockBalance>>(API_ENDPOINTS.STOCK.BALANCES, {
          params: { page, size, search },
        })
        return res.data
      },
      () => mock.mockGetStockBalances(page, size),
    )
  },

  /**
   * Lấy danh sách sản phẩm tồn dưới mức tối thiểu (IN14)
   * Endpoint: GET /api/stock/low
   */
  getLowStockProducts: async (): Promise<StockBalance[]> => {
    return callApi(
      async () => {
        const res = await http.get<StockBalance[]>(API_ENDPOINTS.STOCK.LOW)
        return res.data
      },
      () => mock.mockGetLowStockProducts(),
    )
  },

  /**
   * Tra cứu Sổ kho - Stock Ledger (IN13 - Chỉ đọc, không sửa/xóa BR-07)
   * Endpoint: GET /api/stock/ledger
   */
  getStockLedger: async (params?: {
    page?: number
    size?: number
    type?: string
    search?: string
  }): Promise<PaginatedResponse<StockTransaction>> => {
    return callApi(
      async () => {
        const res = await http.get<PaginatedResponse<StockTransaction>>(API_ENDPOINTS.STOCK.LEDGER, {
          params: {
            page: params?.page ?? 1,
            size: params?.size ?? 20,
            type: params?.type,
            search: params?.search,
          },
        })
        return res.data
      },
      () => mock.mockGetStockTransactions(params?.page ?? 1, params?.size ?? 20),
    )
  },
}

// ============================================================
// 11. DASHBOARD API (IN16) — Tổng quan hệ thống
// ============================================================
export const dashboardApi = {
  /**
   * Lấy thông tin Dashboard tổng hợp
   * Endpoint: GET /api/dashboard
   */
  getDashboard: async (): Promise<DashboardData> => {
    return callApi(
      async () => {
        const res = await http.get<DashboardData>(API_ENDPOINTS.DASHBOARD.GET)
        return res.data
      },
      () => mock.mockGetDashboard(),
    )
  },
}
