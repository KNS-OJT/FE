import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { api } from '@/lib/http';
import PoFormPage from '@/pages/PoFormPage';

vi.mock('@/lib/http', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));

const po = {
  id: 90, orderCode: 'PO-90', purchaseRequestId: 7, supplierId: 3, status: 'DRAFT',
  items: [{ id: 91, prItemId: 42, productId: 5, quantity: 2.5 }],
};

function renderEdit() {
  const router = createMemoryRouter([
    { path: '/po/:id/edit', element: <PoFormPage /> },
    { path: '/po/:id', element: <div>Chi tiết PO đã lưu</div> },
  ], { initialEntries: ['/po/90/edit'] });
  return render(<AntApp><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><RouterProvider router={router} /></QueryClientProvider></AntApp>);
}

describe('PO form với contract BE', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockImplementation(async (url) => {
      if (url === '/po/90') return po;
      if (url === '/pr/7') return {
        id: 7, status: 'APPROVED', items: [
          { id: 42, productId: 5, productName: 'Sản phẩm A', quantity: 10 },
          { id: 43, productId: 6, productName: 'Sản phẩm B', quantity: 20 },
        ],
      };
      if (url === '/suppliers') return [{ id: 3, name: 'NCC', active: true }];
      if (url === '/products') return [];
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.mocked(api.put).mockResolvedValue(po);
  });

  it('sửa nháp giữ số lượng hiện tại, không thêm dòng đã bỏ và gửi đúng DTO', async () => {
    renderEdit();
    await screen.findByText('Sản phẩm A');
    expect(screen.queryByLabelText('Ghi chú')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Lưu nháp' }));
    await waitFor(() => expect(api.put).toHaveBeenCalledExactlyOnceWith('/po/90', {
      supplierId: 3, expectedDeliveryDate: null, items: [{ prItemId: 42, quantity: 2.5 }],
    }));
    expect(await screen.findByText('Chi tiết PO đã lưu')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('không cho lưu khi tải PR thất bại', async () => {
    vi.mocked(api.get).mockImplementation(async (url) => {
      if (url === '/pr/7') throw { status: 500, message: 'Không tải được PR' };
      if (url === '/po/90') return po;
      return [];
    });
    renderEdit();
    expect(await screen.findByText('Không tải được PR')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lưu nháp' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Lưu & đặt hàng' })).toBeDisabled();
    expect(api.put).not.toHaveBeenCalled();
    expect(api.post).not.toHaveBeenCalled();
  });
});
