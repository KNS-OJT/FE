import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/http';
import { poApi } from '@/api/po';

vi.mock('@/lib/http', () => ({ api: { post: vi.fn(), put: vi.fn() } }));

// Fixture theo PoResponse.Item: prItemId là ID dòng PR, khác productId.
const response = {
  id: 90, orderCode: 'PO-90', purchaseRequestId: 7, supplierId: 3,
  supplierName: 'NCC', status: 'DRAFT',
  items: [{ id: 91, prItemId: 42, productId: 5, quantity: 2.5 }],
};
const input = {
  purchaseRequestId: 7, supplierId: 3, expectedDeliveryDate: '2026-12-01',
  items: [{ prItemId: 42, quantity: 2.5, productId: 5, purchaseRequestItemId: 42 }],
  // Dữ liệu nội bộ/cũ không được lọt vào DTO có kiểm tra trường lạ.
  prId: 7, note: 'Ghi chú cũ', status: 'ORDERED',
};

describe('PO request contract (PoCreateRequest / PoUpdateRequest)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.post).mockResolvedValue(response);
    vi.mocked(api.put).mockResolvedValue(response);
  });

  it('tạo PO chỉ gửi các trường BE chấp nhận, giữ đúng ID dòng và số lượng lẻ', async () => {
    const po = await poApi.create(input);
    expect(api.post).toHaveBeenCalledExactlyOnceWith('/po', {
      purchaseRequestId: 7, supplierId: 3, expectedDeliveryDate: '2026-12-01',
      items: [{ prItemId: 42, quantity: 2.5 }],
    });
    expect(po.items[0]).toMatchObject({ purchaseRequestItemId: 42, productId: 5, quantity: 2.5 });
    expect(po.id).toBe(90);
  });

  it('sửa PO không gửi purchaseRequestId hoặc các trường thừa', async () => {
    await poApi.update(90, input);
    expect(api.put).toHaveBeenCalledExactlyOnceWith('/po/90', {
      supplierId: 3, expectedDeliveryDate: '2026-12-01',
      items: [{ prItemId: 42, quantity: 2.5 }],
    });
    expect(api.post).not.toHaveBeenCalled();
  });

  it('tạo và sửa không chọn ngày giao thì gửi null', async () => {
    const withoutDate = { supplierId: 3, items: [{ prItemId: 42, quantity: 1 }] };
    await poApi.create({ purchaseRequestId: 7, ...withoutDate });
    await poApi.update(90, withoutDate);
    expect(api.post).toHaveBeenCalledWith('/po', { purchaseRequestId: 7, ...withoutDate, expectedDeliveryDate: null });
    expect(api.put).toHaveBeenCalledWith('/po/90', { ...withoutDate, expectedDeliveryDate: null });
  });

  it('phát hành dùng endpoint riêng và không gửi status trong body', async () => {
    await poApi.order(90);
    expect(api.post).toHaveBeenCalledExactlyOnceWith('/po/90/order');
  });
});
