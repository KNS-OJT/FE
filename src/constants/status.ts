import type { Tone } from '@/components/StatusTag';

export const STATUS: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: 'Nháp', tone: 'neutral' },
  SUBMITTED: { label: 'Chờ duyệt', tone: 'waiting' },
  APPROVED: { label: 'Đã duyệt', tone: 'ok' },
  REJECTED: { label: 'Bị từ chối', tone: 'bad' },
  CANCELED: { label: 'Đã hủy', tone: 'neutral' },
  ORDERED: { label: 'Đã đặt hàng', tone: 'sky' },
  PARTIALLY_RECEIVED: { label: 'Nhận một phần', tone: 'peri' },
  RECEIVED: { label: 'Đã nhận đủ', tone: 'ok' },
  CONFIRMED: { label: 'Đã xác nhận', tone: 'ok' },
};
export const TX_TYPE: Record<string, { label: string; tone: Tone; sign: 1 | -1 }> = {
  IN: { label: 'Nhập kho', tone: 'ok', sign: 1 },
  OUT: { label: 'Xuất kho', tone: 'waiting', sign: -1 },
  ADJUST_IN: { label: 'Điều chỉnh tăng', tone: 'peri', sign: 1 },
  ADJUST_OUT: { label: 'Điều chỉnh giảm', tone: 'bad', sign: -1 },
};
export const PR_STATUSES = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELED'];
export const PO_STATUSES = ['DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELED'];
