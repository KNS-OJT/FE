// ============================================================
// Role labels and permissions constants
// ============================================================
import type { Role } from '@/types'

export const ROLE_LABELS: Record<Role, string> = {
  REQUESTER: 'Requester',
  WAREHOUSE_STAFF: 'Warehouse Staff',
  PURCHASING_STAFF: 'Purchasing Staff',
  MANAGER: 'Manager',
}

export const ROLE_COLORS: Record<Role, string> = {
  REQUESTER: 'blue',
  WAREHOUSE_STAFF: 'green',
  PURCHASING_STAFF: 'orange',
  MANAGER: 'red',
}

export const PR_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELED: 'Canceled',
}

export const PR_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'default',
  SUBMITTED: 'processing',
  APPROVED: 'success',
  REJECTED: 'error',
  CANCELED: 'warning',
}

export const PO_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  ORDERED: 'Ordered',
  PARTIALLY_RECEIVED: 'Partially Received',
  RECEIVED: 'Received',
  CANCELED: 'Canceled',
}

export const PO_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'default',
  ORDERED: 'processing',
  PARTIALLY_RECEIVED: 'warning',
  RECEIVED: 'success',
  CANCELED: 'error',
}

export const GR_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  CONFIRMED: 'Confirmed',
  CANCELED: 'Canceled',
}

export const GR_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'default',
  CONFIRMED: 'success',
  CANCELED: 'error',
}

export const SI_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  CONFIRMED: 'Confirmed',
  CANCELED: 'Canceled',
}

export const SI_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'default',
  CONFIRMED: 'success',
  CANCELED: 'error',
}

export const TX_TYPE_LABELS: Record<string, string> = {
  IN: 'Stock In',
  OUT: 'Stock Out',
  ADJUST_IN: 'Adjust In',
  ADJUST_OUT: 'Adjust Out',
}

export const TX_TYPE_COLORS: Record<string, string> = {
  IN: 'green',
  OUT: 'red',
  ADJUST_IN: 'cyan',
  ADJUST_OUT: 'orange',
}

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

