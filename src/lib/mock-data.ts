// ============================================================
// Mock data generator — returns realistic fake data.
// Each service function checks if API is available, falls back to mock.
// When backend is ready, just remove the mock fallback.
// ============================================================
import type {
  User, Category, Product, Supplier, StockBalance,
  PurchaseRequest, PurchaseOrder, GoodsReceipt, StockIssue,
  StockTransaction, DashboardData, PaginatedResponse,
} from '@/types'

// ----------- delay helper -----------
const delay = (ms = 300) => new Promise<void>((r) => setTimeout(r, ms))

// ----------- ID counters -----------
let nextUserId = 10
let nextCategoryId = 10
let nextProductId = 20
let nextSupplierId = 10
let nextPRId = 10
let nextPOId = 10
let nextGRId = 10
let nextSIId = 10
let nextTxId = 50

function nextPRCode() { return `PR-2026-${String(nextPRId++).padStart(5, '0')}` }
function nextPOCode() { return `PO-2026-${String(nextPOId++).padStart(5, '0')}` }
function nextGRCode() { return `GR-2026-${String(nextGRId++).padStart(5, '0')}` }
function nextSICode() { return `SI-2026-${String(nextSIId++).padStart(5, '0')}` }

// ----------- Seed data -----------
export const mockUsers: User[] = [
  { userId: 1, username: 'admin', fullName: 'Nguyễn Văn Admin', email: 'admin@p03.local', roleName: 'MANAGER', isActive: true, lastLoginAt: '2026-10-28T08:00:00Z', createdAt: '2026-01-01T00:00:00Z' },
  { userId: 2, username: 'warehouse1', fullName: 'Trần Thị Kho', email: 'kho@p03.local', roleName: 'WAREHOUSE_STAFF', isActive: true, lastLoginAt: '2026-10-27T09:30:00Z', createdAt: '2026-01-02T00:00:00Z' },
  { userId: 3, username: 'purchasing1', fullName: 'Lê Minh Mua', email: 'mua@p03.local', roleName: 'PURCHASING_STAFF', isActive: true, lastLoginAt: '2026-10-26T14:00:00Z', createdAt: '2026-01-03T00:00:00Z' },
  { userId: 4, username: 'requester1', fullName: 'Phạm Đức Yêu Cầu', email: 'yc@p03.local', roleName: 'REQUESTER', isActive: true, lastLoginAt: '2026-10-25T11:00:00Z', createdAt: '2026-01-04T00:00:00Z' },
  { userId: 5, username: 'manager2', fullName: 'Hoàng Thị Giám Đốc', email: 'gd@p03.local', roleName: 'MANAGER', isActive: true, lastLoginAt: '2026-10-24T07:45:00Z', createdAt: '2026-01-05T00:00:00Z' },
  { userId: 6, username: 'warehouse2', fullName: 'Võ Kho Hai', email: 'kho2@p03.local', roleName: 'WAREHOUSE_STAFF', isActive: false, lastLoginAt: null, createdAt: '2026-02-10T00:00:00Z' },
]

export const mockCategories: Category[] = [
  { categoryId: 1, categoryName: 'CPU / Processor', description: 'Bộ vi xử lý trung tâm', isActive: true },
  { categoryId: 2, categoryName: 'GPU / Graphics Card', description: 'Card đồ họa', isActive: true },
  { categoryId: 3, categoryName: 'RAM / Memory', description: 'Bộ nhớ trong', isActive: true },
  { categoryId: 4, categoryName: 'SSD / Storage', description: 'Ổ cứng thể rắn', isActive: true },
  { categoryId: 5, categoryName: 'Mainboard', description: 'Bo mạch chủ', isActive: true },
  { categoryId: 6, categoryName: 'PSU / Power Supply', description: 'Nguồn máy tính', isActive: true },
  { categoryId: 7, categoryName: 'Case / Chassis', description: 'Vỏ máy tính', isActive: true },
  { categoryId: 8, categoryName: 'Cooling / Fan', description: 'Tản nhiệt & quạt', isActive: true },
  { categoryId: 9, categoryName: 'Peripheral', description: 'Thiết bị ngoại vi', isActive: false },
]

export const mockProducts: Product[] = [
  { productId: 1, sku: 'CPU-I5-14400F', productName: 'Intel Core i5-14400F', categoryId: 1, categoryName: 'CPU / Processor', unit: 'cái', isActive: true, createdAt: '2026-01-10T00:00:00Z' },
  { productId: 2, sku: 'CPU-R5-7600X', productName: 'AMD Ryzen 5 7600X', categoryId: 1, categoryName: 'CPU / Processor', unit: 'cái', isActive: true, createdAt: '2026-01-10T00:00:00Z' },
  { productId: 3, sku: 'GPU-RTX4060', productName: 'NVIDIA RTX 4060 8GB', categoryId: 2, categoryName: 'GPU / Graphics Card', unit: 'cái', isActive: true, createdAt: '2026-01-11T00:00:00Z' },
  { productId: 4, sku: 'GPU-RX7600', productName: 'AMD Radeon RX 7600 8GB', categoryId: 2, categoryName: 'GPU / Graphics Card', unit: 'cái', isActive: true, createdAt: '2026-01-11T00:00:00Z' },
  { productId: 5, sku: 'RAM-DDR5-16G', productName: 'Kingston Fury Beast DDR5 16GB 5600MHz', categoryId: 3, categoryName: 'RAM / Memory', unit: 'thanh', isActive: true, createdAt: '2026-01-12T00:00:00Z' },
  { productId: 6, sku: 'RAM-DDR5-32G', productName: 'G.Skill Trident Z5 DDR5 32GB 6000MHz', categoryId: 3, categoryName: 'RAM / Memory', unit: 'thanh', isActive: true, createdAt: '2026-01-12T00:00:00Z' },
  { productId: 7, sku: 'SSD-NV-1TB', productName: 'Samsung 990 EVO Plus 1TB NVMe', categoryId: 4, categoryName: 'SSD / Storage', unit: 'cái', isActive: true, createdAt: '2026-01-13T00:00:00Z' },
  { productId: 8, sku: 'SSD-NV-2TB', productName: 'WD Black SN850X 2TB NVMe', categoryId: 4, categoryName: 'SSD / Storage', unit: 'cái', isActive: true, createdAt: '2026-01-13T00:00:00Z' },
  { productId: 9, sku: 'MB-B760M', productName: 'MSI MAG B760M Mortar WiFi', categoryId: 5, categoryName: 'Mainboard', unit: 'cái', isActive: true, createdAt: '2026-01-14T00:00:00Z' },
  { productId: 10, sku: 'MB-B650M', productName: 'Gigabyte B650M Aorus Elite AX', categoryId: 5, categoryName: 'Mainboard', unit: 'cái', isActive: true, createdAt: '2026-01-14T00:00:00Z' },
  { productId: 11, sku: 'PSU-750W', productName: 'Corsair RM750x 80+ Gold', categoryId: 6, categoryName: 'PSU / Power Supply', unit: 'cái', isActive: true, createdAt: '2026-01-15T00:00:00Z' },
  { productId: 12, sku: 'CASE-4000D', productName: 'Corsair 4000D Airflow', categoryId: 7, categoryName: 'Case / Chassis', unit: 'cái', isActive: true, createdAt: '2026-01-15T00:00:00Z' },
  { productId: 13, sku: 'COOL-AK620', productName: 'DeepCool AK620 Digital', categoryId: 8, categoryName: 'Cooling / Fan', unit: 'cái', isActive: true, createdAt: '2026-01-16T00:00:00Z' },
  { productId: 14, sku: 'CPU-I7-14700K', productName: 'Intel Core i7-14700K', categoryId: 1, categoryName: 'CPU / Processor', unit: 'cái', isActive: false, createdAt: '2026-02-01T00:00:00Z' },
]

export const mockSuppliers: Supplier[] = [
  { supplierId: 1, supplierName: 'Phong Vũ Trading', contactPerson: 'Nguyễn Phong', phone: '028-1234-5678', email: 'sales@phongvu.vn', address: '123 Nguyễn Thị Minh Khai, Q.1, TP.HCM', isActive: true },
  { supplierId: 2, supplierName: 'An Phát Computer', contactPerson: 'Trần An', phone: '028-9876-5432', email: 'order@anphat.com', address: '456 Lê Hồng Phong, Q.10, TP.HCM', isActive: true },
  { supplierId: 3, supplierName: 'Nguyên Kim Electronics', contactPerson: 'Lê Kim', phone: '028-5555-8888', email: 'b2b@nguyenkim.com', address: '789 Trần Hưng Đạo, Q.5, TP.HCM', isActive: true },
  { supplierId: 4, supplierName: 'Hà Nội Computer', contactPerson: 'Phạm Hà', phone: '024-3333-7777', email: 'wholesale@hnc.vn', address: '12 Thái Hà, Đống Đa, Hà Nội', isActive: false },
]

export const mockStockBalances: StockBalance[] = mockProducts.filter(p => p.isActive).map((p, i) => ({
  stockBalanceId: i + 1,
  productId: p.productId,
  sku: p.sku,
  productName: p.productName,
  unit: p.unit,
  categoryName: p.categoryName,
  quantity: [25, 15, 8, 12, 40, 5, 18, 3, 10, 7, 20, 14, 22][i] ?? 10,
  minimumStock: [10, 10, 5, 5, 15, 10, 8, 5, 5, 5, 8, 5, 8][i] ?? 5,
  updatedAt: '2026-10-28T10:00:00Z',
}))

export const mockPurchaseRequests: PurchaseRequest[] = [
  {
    purchaseRequestId: 1, requestCode: 'PR-2026-00001', requesterId: 4, requesterName: 'Phạm Đức Yêu Cầu',
    reason: 'RAM DDR5 sắp hết, cần bổ sung cho dàn máy mới', status: 'APPROVED',
    submittedAt: '2026-10-20T09:00:00Z', reviewedBy: 1, reviewerName: 'Nguyễn Văn Admin',
    reviewedAt: '2026-10-20T14:00:00Z', reviewReason: null, cancelReason: null,
    createdAt: '2026-10-19T16:00:00Z', hasPO: true,
    items: [
      { purchaseRequestItemId: 1, productId: 5, sku: 'RAM-DDR5-16G', productName: 'Kingston Fury Beast DDR5 16GB 5600MHz', unit: 'thanh', quantity: 20, note: null },
      { purchaseRequestItemId: 2, productId: 6, sku: 'RAM-DDR5-32G', productName: 'G.Skill Trident Z5 DDR5 32GB 6000MHz', unit: 'thanh', quantity: 10, note: 'Ưu tiên kit 2x16GB' },
    ],
  },
  {
    purchaseRequestId: 2, requestCode: 'PR-2026-00002', requesterId: 4, requesterName: 'Phạm Đức Yêu Cầu',
    reason: 'Bổ sung SSD cho kho', status: 'SUBMITTED',
    submittedAt: '2026-10-25T10:00:00Z', reviewedBy: null, reviewerName: null,
    reviewedAt: null, reviewReason: null, cancelReason: null,
    createdAt: '2026-10-25T09:30:00Z', hasPO: false,
    items: [
      { purchaseRequestItemId: 3, productId: 7, sku: 'SSD-NV-1TB', productName: 'Samsung 990 EVO Plus 1TB NVMe', unit: 'cái', quantity: 15, note: null },
    ],
  },
  {
    purchaseRequestId: 3, requestCode: 'PR-2026-00003', requesterId: 2, requesterName: 'Trần Thị Kho',
    reason: 'Cần thêm vỏ case và nguồn', status: 'REJECTED',
    submittedAt: '2026-10-22T08:00:00Z', reviewedBy: 1, reviewerName: 'Nguyễn Văn Admin',
    reviewedAt: '2026-10-22T16:00:00Z', reviewReason: 'Số lượng quá lớn, cần xem lại dự báo nhu cầu', cancelReason: null,
    createdAt: '2026-10-22T07:00:00Z', hasPO: false,
    items: [
      { purchaseRequestItemId: 4, productId: 11, sku: 'PSU-750W', productName: 'Corsair RM750x 80+ Gold', unit: 'cái', quantity: 50, note: null },
      { purchaseRequestItemId: 5, productId: 12, sku: 'CASE-4000D', productName: 'Corsair 4000D Airflow', unit: 'cái', quantity: 50, note: null },
    ],
  },
  {
    purchaseRequestId: 4, requestCode: 'PR-2026-00004', requesterId: 4, requesterName: 'Phạm Đức Yêu Cầu',
    reason: 'Bổ sung GPU RTX 4060', status: 'DRAFT',
    submittedAt: null, reviewedBy: null, reviewerName: null,
    reviewedAt: null, reviewReason: null, cancelReason: null,
    createdAt: '2026-10-28T08:00:00Z', hasPO: false,
    items: [
      { purchaseRequestItemId: 6, productId: 3, sku: 'GPU-RTX4060', productName: 'NVIDIA RTX 4060 8GB', unit: 'cái', quantity: 10, note: 'Phiên bản Dual Fan' },
    ],
  },
  {
    purchaseRequestId: 5, requestCode: 'PR-2026-00005', requesterId: 4, requesterName: 'Phạm Đức Yêu Cầu',
    reason: 'CPU Intel i5 tồn thấp', status: 'APPROVED',
    submittedAt: '2026-10-26T09:00:00Z', reviewedBy: 5, reviewerName: 'Hoàng Thị Giám Đốc',
    reviewedAt: '2026-10-26T11:00:00Z', reviewReason: null, cancelReason: null,
    createdAt: '2026-10-26T08:00:00Z', hasPO: false,
    items: [
      { purchaseRequestItemId: 7, productId: 1, sku: 'CPU-I5-14400F', productName: 'Intel Core i5-14400F', unit: 'cái', quantity: 20, note: null },
    ],
  },
]

export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    purchaseOrderId: 1, orderCode: 'PO-2026-00001', purchaseRequestId: 1, requestCode: 'PR-2026-00001',
    supplierId: 1, supplierName: 'Phong Vũ Trading', createdBy: 3, creatorName: 'Lê Minh Mua',
    orderDate: '2026-10-21T10:00:00Z', expectedDeliveryDate: '2026-11-05T00:00:00Z',
    status: 'PARTIALLY_RECEIVED', note: 'Đợt 1 giao trước 50%', cancelReason: null,
    createdAt: '2026-10-21T09:00:00Z',
    items: [
      { purchaseOrderItemId: 1, purchaseRequestItemId: 1, productId: 5, sku: 'RAM-DDR5-16G', productName: 'Kingston Fury Beast DDR5 16GB 5600MHz', unit: 'thanh', quantity: 20, receivedQuantity: 10, remainingQuantity: 10 },
      { purchaseOrderItemId: 2, purchaseRequestItemId: 2, productId: 6, sku: 'RAM-DDR5-32G', productName: 'G.Skill Trident Z5 DDR5 32GB 6000MHz', unit: 'thanh', quantity: 10, receivedQuantity: 0, remainingQuantity: 10 },
    ],
  },
  {
    purchaseOrderId: 2, orderCode: 'PO-2026-00002', purchaseRequestId: 2, requestCode: 'PR-2026-00002',
    supplierId: 2, supplierName: 'An Phát Computer', createdBy: 3, creatorName: 'Lê Minh Mua',
    orderDate: '2026-10-27T08:30:00Z', expectedDeliveryDate: '2026-11-10T00:00:00Z',
    status: 'ORDERED', note: 'Đặt SSD Samsung theo yêu cầu dự án', cancelReason: null,
    createdAt: '2026-10-27T08:00:00Z',
    items: [
      { purchaseOrderItemId: 3, purchaseRequestItemId: 3, productId: 7, sku: 'SSD-NV-1TB', productName: 'Samsung 990 EVO Plus 1TB NVMe', unit: 'cái', quantity: 15, receivedQuantity: 0, remainingQuantity: 15 },
    ],
  },
]

export const mockGoodsReceipts: GoodsReceipt[] = [
  {
    goodsReceiptId: 1, receiptCode: 'GR-2026-00001', purchaseOrderId: 1, orderCode: 'PO-2026-00001',
    receivedBy: 2, receiverName: 'Trần Thị Kho', confirmedBy: 2, confirmerName: 'Trần Thị Kho',
    receivedAt: '2026-10-25T14:00:00Z', confirmedAt: '2026-10-25T14:30:00Z',
    status: 'CONFIRMED', documentReference: 'INV-PV-2026-1234', note: 'Đợt 1 – 10 thanh RAM DDR5 16GB',
    cancelReason: null, createdAt: '2026-10-25T13:00:00Z',
    items: [
      { goodsReceiptItemId: 1, purchaseOrderItemId: 1, productId: 5, sku: 'RAM-DDR5-16G', productName: 'Kingston Fury Beast DDR5 16GB 5600MHz', unit: 'thanh', receivedQuantity: 10 },
    ],
  },
]

export const mockStockIssues: StockIssue[] = [
  {
    stockIssueId: 1, issueCode: 'SI-2026-00001', requestedBy: 4, requesterName: 'Phạm Đức Yêu Cầu',
    confirmedBy: 2, confirmerName: 'Trần Thị Kho', status: 'CONFIRMED',
    requestedAt: '2026-10-26T09:00:00Z', confirmedAt: '2026-10-26T10:00:00Z',
    reason: 'Cấp RAM cho dự án lắp máy văn phòng', note: null, cancelReason: null,
    items: [
      { stockIssueItemId: 1, productId: 5, sku: 'RAM-DDR5-16G', productName: 'Kingston Fury Beast DDR5 16GB 5600MHz', unit: 'thanh', quantity: 5 },
    ],
  },
  {
    stockIssueId: 2, issueCode: 'SI-2026-00002', requestedBy: 4, requesterName: 'Phạm Đức Yêu Cầu',
    confirmedBy: null, confirmerName: null, status: 'DRAFT',
    requestedAt: '2026-10-28T08:00:00Z', confirmedAt: null,
    reason: 'Xuất SSD cho phòng kỹ thuật', note: null, cancelReason: null,
    items: [
      { stockIssueItemId: 2, productId: 7, sku: 'SSD-NV-1TB', productName: 'Samsung 990 EVO Plus 1TB NVMe', unit: 'cái', quantity: 3 },
    ],
  },
]

export const mockStockTransactions: StockTransaction[] = [
  { stockTransactionId: 1, productId: 5, sku: 'RAM-DDR5-16G', productName: 'Kingston Fury Beast DDR5 16GB 5600MHz', transactionType: 'IN', quantity: 10, balanceAfter: 35, sourceCode: 'GR-2026-00001', createdBy: 2, creatorName: 'Trần Thị Kho', createdAt: '2026-10-25T14:30:00Z' },
  { stockTransactionId: 2, productId: 5, sku: 'RAM-DDR5-16G', productName: 'Kingston Fury Beast DDR5 16GB 5600MHz', transactionType: 'OUT', quantity: 5, balanceAfter: 30, sourceCode: 'SI-2026-00001', createdBy: 2, creatorName: 'Trần Thị Kho', createdAt: '2026-10-26T10:00:00Z' },
]

// ----------- Paginate helper -----------
function paginate<T>(data: T[], page: number, size: number): PaginatedResponse<T> {
  const start = (page - 1) * size
  return {
    content: data.slice(start, start + size),
    page,
    size,
    totalElements: data.length,
    totalPages: Math.ceil(data.length / size),
  }
}

// ============================================================
// Mock API functions — signature matches real API services
// ============================================================

// ----- Auth -----
export async function mockLogin(username: string, password?: string) {
  void password
  await delay()
  const user = mockUsers.find((u) => u.username === username && u.isActive)
  if (!user) throw { response: { status: 401, data: { code: 'INVALID_CREDENTIALS', message: 'Sai tên đăng nhập hoặc mật khẩu' } } }
  return { token: 'mock-jwt-token-' + user.userId, user }
}

// ----- Users -----
export async function mockGetUsers(page = 1, size = 20) {
  await delay()
  return paginate(mockUsers, page, size)
}

export async function mockCreateUser(data: { username: string; password: string; fullName: string; email: string; roleId: number }) {
  await delay()
  const roleMap: Record<number, User['roleName']> = { 1: 'REQUESTER', 2: 'WAREHOUSE_STAFF', 3: 'PURCHASING_STAFF', 4: 'MANAGER' }
  const user: User = {
    userId: nextUserId++, username: data.username, fullName: data.fullName, email: data.email,
    roleName: roleMap[data.roleId] ?? 'REQUESTER', isActive: true, lastLoginAt: null, createdAt: new Date().toISOString(),
  }
  mockUsers.push(user)
  return user
}

export async function mockLockUser(userId: number) {
  await delay()
  const user = mockUsers.find((u) => u.userId === userId)
  if (!user) throw { response: { status: 404, data: { code: 'NOT_FOUND', message: 'User not found' } } }
  user.isActive = !user.isActive
  return user
}

// ----- Categories -----
export async function mockGetCategories(page = 1, size = 20) {
  await delay()
  return paginate(mockCategories, page, size)
}

export async function mockCreateCategory(data: { categoryName: string; description?: string }) {
  await delay()
  const cat: Category = {
    categoryId: nextCategoryId++, categoryName: data.categoryName,
    description: data.description ?? null, isActive: true,
  }
  mockCategories.push(cat)
  return cat
}

// ----- Products -----
export async function mockGetProducts(page = 1, size = 20, search?: string, categoryId?: number) {
  await delay()
  let filtered = mockProducts
  if (categoryId) {
    filtered = filtered.filter((p) => p.categoryId === categoryId)
  }
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter((p) => p.sku.toLowerCase().includes(s) || p.productName.toLowerCase().includes(s))
  }
  return paginate(filtered, page, size)
}

export async function mockCreateProduct(data: { sku: string; productName: string; categoryId: number; unit: string }) {
  await delay()
  if (mockProducts.some((p) => p.sku === data.sku)) throw { response: { status: 409, data: { code: 'DUPLICATE_SKU', message: 'SKU đã tồn tại' } } }
  const cat = mockCategories.find((c) => c.categoryId === data.categoryId)
  const prod: Product = {
    productId: nextProductId++, sku: data.sku, productName: data.productName,
    categoryId: data.categoryId, categoryName: cat?.categoryName ?? '', unit: data.unit,
    isActive: true, createdAt: new Date().toISOString(),
  }
  mockProducts.push(prod)
  return prod
}

// ----- Suppliers -----
export async function mockGetSuppliers(page = 1, size = 20) {
  await delay()
  return paginate(mockSuppliers, page, size)
}

export async function mockCreateSupplier(data: { supplierName: string; contactPerson?: string; phone?: string; email?: string; address?: string }) {
  await delay()
  const sup: Supplier = {
    supplierId: nextSupplierId++, supplierName: data.supplierName,
    contactPerson: data.contactPerson ?? null, phone: data.phone ?? null,
    email: data.email ?? null, address: data.address ?? null, isActive: true,
  }
  mockSuppliers.push(sup)
  return sup
}

// ----- Stock -----
export async function mockGetStockBalances(page = 1, size = 20) {
  await delay()
  return paginate(mockStockBalances, page, size)
}

export async function mockGetLowStockProducts() {
  await delay()
  return mockStockBalances.filter((s) => s.quantity < s.minimumStock)
}

// ----- Purchase Requests -----
export async function mockGetPurchaseRequests(page = 1, size = 20, status?: string) {
  await delay()
  let filtered = mockPurchaseRequests
  if (status) filtered = filtered.filter((pr) => pr.status === status)
  return paginate(filtered, page, size)
}

export async function mockGetPurchaseRequest(id: number) {
  await delay()
  const pr = mockPurchaseRequests.find((p) => p.purchaseRequestId === id)
  if (!pr) throw { response: { status: 404, data: { code: 'NOT_FOUND', message: 'PR not found' } } }
  return pr
}

export async function mockCreatePR(data: { reason?: string; items: { productId: number; quantity: number; note?: string }[] }) {
  await delay()
  const pr: PurchaseRequest = {
    purchaseRequestId: nextPRId, requestCode: nextPRCode(), requesterId: 4, requesterName: 'Phạm Đức Yêu Cầu',
    reason: data.reason ?? null, status: 'DRAFT', submittedAt: null, reviewedBy: null, reviewerName: null,
    reviewedAt: null, reviewReason: null, cancelReason: null, createdAt: new Date().toISOString(), hasPO: false,
    items: data.items.map((item, i) => {
      const prod = mockProducts.find((p) => p.productId === item.productId)!
      return { purchaseRequestItemId: nextPRId * 100 + i, productId: item.productId, sku: prod.sku, productName: prod.productName, unit: prod.unit, quantity: item.quantity, note: item.note ?? null }
    }),
  }
  mockPurchaseRequests.push(pr)
  return pr
}

// ----- Purchase Orders -----
export async function mockGetPurchaseOrders(page = 1, size = 20) {
  await delay()
  return paginate(mockPurchaseOrders, page, size)
}

export async function mockGetPurchaseOrder(id: number) {
  await delay()
  const po = mockPurchaseOrders.find((p) => p.purchaseOrderId === id)
  if (!po) throw { response: { status: 404, data: { code: 'NOT_FOUND', message: 'PO not found' } } }
  return po
}

export async function mockCreatePO(data: { purchaseRequestId: number; supplierId: number; expectedDeliveryDate?: string; note?: string; items?: { purchaseRequestItemId: number; quantity: number }[] }) {
  await delay()
  const pr = mockPurchaseRequests.find((p) => p.purchaseRequestId === data.purchaseRequestId)
  const sup = mockSuppliers.find((s) => s.supplierId === data.supplierId)
  const po: PurchaseOrder = {
    purchaseOrderId: nextPOId,
    orderCode: nextPOCode(),
    purchaseRequestId: data.purchaseRequestId,
    requestCode: pr?.requestCode ?? '',
    supplierId: data.supplierId,
    supplierName: sup?.supplierName ?? '',
    createdBy: 3,
    creatorName: 'Lê Minh Mua',
    orderDate: new Date().toISOString(),
    expectedDeliveryDate: data.expectedDeliveryDate ?? null,
    status: 'ORDERED',
    note: data.note ?? null,
    cancelReason: null,
    createdAt: new Date().toISOString(),
    items: (data.items || []).map((item, idx) => {
      const prItem = pr?.items.find((i) => i.purchaseRequestItemId === item.purchaseRequestItemId)
      return {
        purchaseOrderItemId: nextPOId * 100 + idx,
        purchaseRequestItemId: item.purchaseRequestItemId,
        productId: prItem?.productId ?? 0,
        sku: prItem?.sku ?? '',
        productName: prItem?.productName ?? '',
        unit: prItem?.unit ?? 'cái',
        quantity: item.quantity,
        receivedQuantity: 0,
        remainingQuantity: item.quantity,
      }
    }),
  }
  if (pr) pr.hasPO = true
  mockPurchaseOrders.push(po)
  return po
}

// ----- Goods Receipts -----
export async function mockGetGoodsReceipts(page = 1, size = 20) {
  await delay()
  return paginate(mockGoodsReceipts, page, size)
}

export async function mockGetGoodsReceipt(id: number) {
  await delay()
  const gr = mockGoodsReceipts.find((g) => g.goodsReceiptId === id)
  if (!gr) throw { response: { status: 404, data: { code: 'NOT_FOUND', message: 'GR not found' } } }
  return gr
}

export async function mockCreateGR(data: { purchaseOrderId: number; documentReference?: string; note?: string; items: { purchaseOrderItemId: number; receivedQuantity: number }[] }) {
  await delay()
  const po = mockPurchaseOrders.find((p) => p.purchaseOrderId === data.purchaseOrderId)
  const gr: GoodsReceipt = {
    goodsReceiptId: nextGRId,
    receiptCode: nextGRCode(),
    purchaseOrderId: data.purchaseOrderId,
    orderCode: po?.orderCode ?? '',
    receivedBy: 2,
    receiverName: 'Trần Thị Kho',
    confirmedBy: null,
    confirmerName: null,
    receivedAt: new Date().toISOString(),
    confirmedAt: null,
    status: 'DRAFT',
    documentReference: data.documentReference ?? null,
    note: data.note ?? null,
    cancelReason: null,
    createdAt: new Date().toISOString(),
    items: data.items.map((item, idx) => {
      const poItem = po?.items.find((i) => i.purchaseOrderItemId === item.purchaseOrderItemId)
      return {
        goodsReceiptItemId: nextGRId * 100 + idx,
        purchaseOrderItemId: item.purchaseOrderItemId,
        productId: poItem?.productId ?? 0,
        sku: poItem?.sku ?? '',
        productName: poItem?.productName ?? '',
        unit: poItem?.unit ?? 'cái',
        receivedQuantity: item.receivedQuantity,
      }
    }),
  }
  mockGoodsReceipts.push(gr)
  return gr
}

// ----- Stock Issues -----
export async function mockGetStockIssues(page = 1, size = 20) {
  await delay()
  return paginate(mockStockIssues, page, size)
}

export async function mockGetStockIssue(id: number) {
  await delay()
  const si = mockStockIssues.find((s) => s.stockIssueId === id)
  if (!si) throw { response: { status: 404, data: { code: 'NOT_FOUND', message: 'SI not found' } } }
  return si
}

export async function mockCreateSI(data: { reason: string; note?: string; items: { productId: number; quantity: number }[] }) {
  await delay()
  const si: StockIssue = {
    stockIssueId: nextSIId,
    issueCode: nextSICode(),
    requestedBy: 4,
    requesterName: 'Phạm Đức Yêu Cầu',
    confirmedBy: null,
    confirmerName: null,
    status: 'DRAFT',
    requestedAt: new Date().toISOString(),
    confirmedAt: null,
    reason: data.reason,
    note: data.note ?? null,
    cancelReason: null,
    items: data.items.map((item, idx) => {
      const prod = mockProducts.find((p) => p.productId === item.productId)
      return {
        stockIssueItemId: nextSIId * 100 + idx,
        productId: item.productId,
        sku: prod?.sku ?? '',
        productName: prod?.productName ?? '',
        unit: prod?.unit ?? 'cái',
        quantity: item.quantity,
      }
    }),
  }
  mockStockIssues.push(si)
  return si
}

export function recordMockTransaction(tx: Omit<StockTransaction, 'stockTransactionId'>) {
  mockStockTransactions.unshift({
    ...tx,
    stockTransactionId: nextTxId++,
  })
}

// ----- Stock Transactions (Ledger) -----
export async function mockGetStockTransactions(page = 1, size = 20) {
  await delay()
  return paginate(mockStockTransactions, page, size)
}

// ----- Dashboard -----
export async function mockGetDashboard(): Promise<DashboardData> {
  await delay()
  return {
    lowStockCount: mockStockBalances.filter((s) => s.quantity < s.minimumStock).length,
    pendingPRCount: mockPurchaseRequests.filter((pr) => pr.status === 'SUBMITTED').length,
    pendingPOCount: mockPurchaseOrders.filter((po) => po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED').length,
    pendingStockIssueCount: mockStockIssues.filter((si) => si.status === 'DRAFT').length,
    recentTransactions: mockStockTransactions.slice(0, 10),
    lowStockProducts: mockStockBalances.filter((s) => s.quantity < s.minimumStock),
  }
}

