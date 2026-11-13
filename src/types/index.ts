// ============================================================
// Shared Types for P03 Inventory & Purchase Request Management
// ============================================================

// ---- Enums ----
export type Role = 'REQUESTER' | 'WAREHOUSE_STAFF' | 'PURCHASING_STAFF' | 'MANAGER'

export type PRStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELED'
export type POStatus = 'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELED'
export type GRStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELED'
export type SIStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELED'
export type SAStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELED'
export type AdjustmentType = 'OPENING' | 'STOCKTAKE' | 'CORRECTION'
export type TransactionType = 'IN' | 'OUT' | 'ADJUST_IN' | 'ADJUST_OUT'

// ---- Common ----
export interface PaginatedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface ApiError {
  status: number
  code: string
  message: string
  requestId: string
}

// ---- User & Auth ----
export interface User {
  userId: number
  username: string
  fullName: string
  email: string
  roleName: Role
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface CreateUserRequest {
  username: string
  password: string
  fullName: string
  email: string
  roleId: number
}

// ---- Category ----
export interface Category {
  categoryId: number
  categoryName: string
  description: string | null
  isActive: boolean
}

export interface CategoryFormData {
  categoryName: string
  description?: string
}

// ---- Product ----
export interface Product {
  productId: number
  sku: string
  productName: string
  categoryId: number
  categoryName: string
  unit: string
  isActive: boolean
  createdAt: string
}

export interface ProductFormData {
  sku: string
  productName: string
  categoryId: number
  unit: string
}

// ---- Supplier ----
export interface Supplier {
  supplierId: number
  supplierName: string
  contactPerson: string | null
  phone: string | null
  email: string | null
  address: string | null
  isActive: boolean
}

export interface SupplierFormData {
  supplierName: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
}

// ---- Stock Balance ----
export interface StockBalance {
  stockBalanceId: number
  productId: number
  sku: string
  productName: string
  unit: string
  categoryName: string
  quantity: number
  minimumStock: number
  updatedAt: string
}

// ---- Purchase Request ----
export interface PurchaseRequestItem {
  purchaseRequestItemId: number
  productId: number
  sku: string
  productName: string
  unit: string
  quantity: number
  note: string | null
}

export interface PurchaseRequest {
  purchaseRequestId: number
  requestCode: string
  requesterId: number
  requesterName: string
  reason: string | null
  status: PRStatus
  submittedAt: string | null
  reviewedBy: number | null
  reviewerName: string | null
  reviewedAt: string | null
  reviewReason: string | null
  cancelReason: string | null
  createdAt: string
  items: PurchaseRequestItem[]
  hasPO: boolean
}

export interface PRItemFormData {
  productId: number
  quantity: number
  note?: string
}

export interface PRFormData {
  reason?: string
  items: PRItemFormData[]
}

// ---- Purchase Order ----
export interface PurchaseOrderItem {
  purchaseOrderItemId: number
  purchaseRequestItemId: number
  productId: number
  sku: string
  productName: string
  unit: string
  quantity: number
  receivedQuantity: number
  remainingQuantity: number
}

export interface PurchaseOrder {
  purchaseOrderId: number
  orderCode: string
  purchaseRequestId: number
  requestCode: string
  supplierId: number
  supplierName: string
  createdBy: number
  creatorName: string
  orderDate: string | null
  expectedDeliveryDate: string | null
  status: POStatus
  note: string | null
  cancelReason: string | null
  createdAt: string
  items: PurchaseOrderItem[]
}

export interface POFormData {
  purchaseRequestId: number
  supplierId: number
  expectedDeliveryDate?: string
  note?: string
  items: { purchaseRequestItemId: number; quantity: number }[]
}

// ---- Goods Receipt ----
export interface GoodsReceiptItem {
  goodsReceiptItemId: number
  purchaseOrderItemId: number
  productId: number
  sku: string
  productName: string
  unit: string
  receivedQuantity: number
}

export interface GoodsReceipt {
  goodsReceiptId: number
  receiptCode: string
  purchaseOrderId: number
  orderCode: string
  receivedBy: number
  receiverName: string
  confirmedBy: number | null
  confirmerName: string | null
  receivedAt: string | null
  confirmedAt: string | null
  status: GRStatus
  documentReference: string | null
  note: string | null
  cancelReason: string | null
  createdAt: string
  items: GoodsReceiptItem[]
}

export interface GRFormData {
  purchaseOrderId: number
  documentReference?: string
  note?: string
  items: { purchaseOrderItemId: number; receivedQuantity: number }[]
}

// ---- Stock Issue ----
export interface StockIssueItem {
  stockIssueItemId: number
  productId: number
  sku: string
  productName: string
  unit: string
  quantity: number
}

export interface StockIssue {
  stockIssueId: number
  issueCode: string
  requestedBy: number
  requesterName: string
  confirmedBy: number | null
  confirmerName: string | null
  status: SIStatus
  requestedAt: string | null
  confirmedAt: string | null
  reason: string | null
  note: string | null
  cancelReason: string | null
  items: StockIssueItem[]
}

export interface SIFormData {
  reason: string
  note?: string
  items: { productId: number; quantity: number }[]
}

// ---- Stock Adjustment ----
export interface StockAdjustmentItem {
  stockAdjustmentItemId: number
  productId: number
  sku: string
  productName: string
  unit: string
  countedQuantity: number
  systemQuantity: number | null
  note: string | null
}

export interface StockAdjustment {
  stockAdjustmentId: number
  adjustmentCode: string
  adjustmentType: AdjustmentType
  createdBy: number
  creatorName: string
  confirmedBy: number | null
  confirmerName: string | null
  status: SAStatus
  reason: string | null
  cancelReason: string | null
  createdAt: string
  confirmedAt: string | null
  items: StockAdjustmentItem[]
}

// ---- Stock Transaction (Ledger) ----
export interface StockTransaction {
  stockTransactionId: number
  productId: number
  sku: string
  productName: string
  transactionType: TransactionType
  quantity: number
  balanceAfter: number
  sourceCode: string
  createdBy: number
  creatorName: string
  createdAt: string
}

// ---- Dashboard ----
export interface DashboardData {
  lowStockCount: number
  pendingPRCount: number
  pendingPOCount: number
  pendingStockIssueCount: number
  recentTransactions: StockTransaction[]
  lowStockProducts: StockBalance[]
}

