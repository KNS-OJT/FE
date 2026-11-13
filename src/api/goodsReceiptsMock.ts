/**
 * MÔ PHỎNG phiếu nhập kho (IN09, IN10, IN17) — BE CHƯA có API.
 * Lưu tạm trong sessionStorage của tab, KHÔNG thay đổi tồn kho thật.
 * Khi BE có API: thay các hàm dưới đây bằng lời gọi http, giữ nguyên chữ ký hàm.
 */
import type { ApiError } from '@/lib/errors';

export type GrStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELED';
export interface GrItem {
  poItemId: number;
  productId: number;
  orderedQuantity: number;
  receivedQuantity: number;
}
export interface GoodsReceipt {
  id: number;
  code: string;
  poId: number;
  poCode: string;
  documentReference: string;
  note: string;
  status: GrStatus;
  createdAt: string;
  createdBy: string;
  confirmedAt: string;
  cancelReason: string;
  items: GrItem[];
}

const KEY = 'p03.demo.goodsReceipts';
const read = (): GoodsReceipt[] => {
  try {
    return JSON.parse(window.sessionStorage.getItem(KEY) || '[]') as GoodsReceipt[];
  } catch {
    return [];
  }
};
const write = (list: GoodsReceipt[]) => {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
};
const fail = (status: number, message: string, code?: string): never => {
  const e: ApiError = { status, message, code };
  throw e;
};
const wait = () => new Promise((r) => setTimeout(r, 250));

/** Tổng đã nhận (phiếu CONFIRMED) theo dòng PO. */
export function receivedByPoItem(poId: number): Map<number, number> {
  const m = new Map<number, number>();
  for (const gr of read()) {
    if (gr.poId !== poId || gr.status !== 'CONFIRMED') continue;
    for (const it of gr.items) m.set(it.poItemId, (m.get(it.poItemId) ?? 0) + it.receivedQuantity);
  }
  return m;
}

export const grMock = {
  async list(): Promise<GoodsReceipt[]> {
    await wait();
    return read().sort((a, b) => b.id - a.id);
  },
  async get(id: number): Promise<GoodsReceipt> {
    await wait();
    return read().find((g) => g.id === id) ?? fail(404, 'Không tìm thấy phiếu nhập.');
  },
  async create(input: Omit<GoodsReceipt, 'id' | 'code' | 'status' | 'createdAt' | 'confirmedAt' | 'cancelReason'>): Promise<GoodsReceipt> {
    await wait();
    const items = input.items.filter((i) => i.receivedQuantity > 0);
    if (!items.length) fail(400, 'Phiếu nhập phải có ít nhất một dòng với số lượng lớn hơn 0.');
    const done = receivedByPoItem(input.poId);
    for (const it of items) {
      if ((done.get(it.poItemId) ?? 0) + it.receivedQuantity > it.orderedQuantity)
        fail(409, 'Không được nhận vượt số lượng còn lại trên PO (BR-06).', 'OVER_RECEIVE');
    }
    const list = read();
    const id = (list.reduce((m, g) => Math.max(m, g.id), 0) || 0) + 1;
    const gr: GoodsReceipt = {
      ...input,
      items,
      id,
      code: `GR-${new Date().getFullYear()}-${String(id).padStart(5, '0')}`,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      confirmedAt: '',
      cancelReason: '',
    };
    write([...list, gr]);
    return gr;
  },
  async confirm(id: number): Promise<void> {
    await wait();
    const list = read();
    const gr = list.find((g) => g.id === id) ?? fail(404, 'Không tìm thấy phiếu nhập.');
    if (gr.status !== 'DRAFT') fail(409, 'Phiếu đã được xử lý, không xác nhận lại (chống cộng tồn hai lần).');
    const done = receivedByPoItem(gr.poId);
    for (const it of gr.items) {
      if ((done.get(it.poItemId) ?? 0) + it.receivedQuantity > it.orderedQuantity)
        fail(409, 'Không được nhận vượt số lượng còn lại trên PO (BR-06).', 'OVER_RECEIVE');
    }
    gr.status = 'CONFIRMED';
    gr.confirmedAt = new Date().toISOString();
    write(list);
  },
  async cancel(id: number, reason: string): Promise<void> {
    await wait();
    if (!reason.trim()) fail(400, 'Vui lòng nhập lý do hủy.');
    const list = read();
    const gr = list.find((g) => g.id === id) ?? fail(404, 'Không tìm thấy phiếu nhập.');
    if (gr.status !== 'DRAFT') fail(409, 'Chỉ hủy được phiếu Nháp.');
    gr.status = 'CANCELED';
    gr.cancelReason = reason.trim();
    write(list);
  },
};
