import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, Grid } from 'antd';
import { AppLayout } from '@/components/AppLayout';
import { useAuthStore } from '@/auth/authStore';

function renderLayout() {
  const router = createMemoryRouter([
    {
      element: <AppLayout />,
      children: [
        { path: '/', element: <div>Nội dung tổng quan</div> },
        { path: '/pr', element: <div>Nội dung PR</div> },
        { path: '/account/password', element: <div>Nội dung đổi mật khẩu</div> },
      ],
    },
  ], { initialEntries: ['/pr'] });
  const result = render(<AntApp><QueryClientProvider client={new QueryClient()}><RouterProvider router={router} /></QueryClientProvider></AntApp>);
  return { ...result, router };
}

describe('Bố cục thanh bên và vùng cuộn', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession({ accessToken: 't', expiresAt: Date.now() + 60_000, user: { userId: 1, username: 'manager1', fullName: 'Người Test', role: 'MANAGER' } });
  });
  afterEach(() => vi.restoreAllMocks());

  it('desktop thu gọn 248 → 72, bỏ tiêu đề nhóm và giữ dropdown tài khoản', () => {
    vi.spyOn(Grid, 'useBreakpoint').mockReturnValue({ lg: true, md: true, sm: true });
    const { container } = renderLayout();
    expect(container.querySelector('.ant-layout-sider')).toHaveStyle({ width: '248px' });
    expect(screen.getByText('Mua hàng')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Thu gọn thanh bên' }));
    expect(container.querySelector('.ant-layout-sider')).toHaveStyle({ width: '72px' });
    expect(screen.queryByText('Mua hàng')).not.toBeInTheDocument();
    expect(container.querySelector('.ant-menu-item-divider')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Menu tài khoản' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mở thanh bên' }));
    expect(container.querySelector('.ant-layout-sider')).toHaveStyle({ width: '248px' });
    expect(screen.getByText('Mua hàng')).toBeInTheDocument();
  });

  it('logo điều hướng bằng React, đưa vùng nội dung về đầu và giữ nguyên header', async () => {
    vi.spyOn(Grid, 'useBreakpoint').mockReturnValue({ lg: true });
    const { container, router } = renderLayout();
    const content = screen.getByText('Nội dung PR').closest('.ant-layout-content')!;
    const scrollArea = content.parentElement!;
    const header = container.querySelector('.ant-layout-header');
    expect(scrollArea).toHaveStyle({ overflowY: 'auto', overscrollBehavior: 'contain' });
    expect(scrollArea.contains(header)).toBe(false);
    scrollArea.scrollTop = 300;
    fireEvent.click(screen.getByRole('link', { name: /— Tổng quan/ }));
    await screen.findByText('Nội dung tổng quan');
    expect(router.state.location.pathname).toBe('/');
    expect(scrollArea.scrollTop).toBe(0);
    expect(container.querySelector('.ant-layout-header')).toBe(header);
  });

  it('mobile không có Sider, forceRender giữ menu theo quyền; đổi route đóng drawer và reset cuộn', async () => {
    vi.spyOn(Grid, 'useBreakpoint').mockReturnValue({ lg: false });
    const { container, router } = renderLayout();
    expect(container.querySelector('.ant-layout-sider')).not.toBeInTheDocument();
    expect(screen.getByText('Người dùng')).toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: 'Mở thanh bên' });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const scrollArea = screen.getByText('Nội dung PR').closest('.ant-layout-content')!.parentElement!;
    scrollArea.scrollTop = 150;
    // Điều hướng ngoài menu cũng phải đóng drawer (ví dụ Back hoặc dropdown).
    await act(async () => { await router.navigate('/account/password'); });
    await waitFor(() => expect(toggle).toHaveAttribute('aria-expanded', 'false'));
    expect(scrollArea.scrollTop).toBe(0);
    expect(screen.getByText('Nội dung đổi mật khẩu')).toBeInTheDocument();
  });
});
