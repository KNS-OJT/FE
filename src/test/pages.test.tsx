import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import LoginPage from '@/pages/LoginPage';
import { AppLayout } from '@/components/AppLayout';
import { useAuthStore } from '@/auth/authStore';
import type { Role } from '@/auth/roles';

const renderAt = (el: React.ReactNode) => {
  const router = createMemoryRouter([{ path: '/', element: el }, { path: '/login', element: <div>login</div> }], { initialEntries: ['/'] });
  return render(<AntApp><QueryClientProvider client={new QueryClient()}><RouterProvider router={router} /></QueryClientProvider></AntApp>);
};
const loginAs = (role: Role) =>
  useAuthStore.getState().setSession({ accessToken: 't', expiresAt: Date.now() + 60_000, user: { userId: 1, username: 'u', fullName: 'Người Test', role } });

describe('Màn hình', () => {
  beforeEach(() => useAuthStore.getState().clearSession());
  it('trang đăng nhập có đủ ô nhập', () => {
    renderAt(<LoginPage />);
    expect(screen.getByLabelText('Tên đăng nhập')).toBeInTheDocument();
    expect(screen.getByLabelText('Mật khẩu')).toBeInTheDocument();
  });
  it('menu Requester không có PO, Người dùng, Sổ kho', () => {
    loginAs('REQUESTER');
    renderAt(<AppLayout />);
    expect(screen.getByText('Đề nghị mua')).toBeInTheDocument();
    expect(screen.queryByText('Đơn đặt hàng')).not.toBeInTheDocument();
    expect(screen.queryByText('Người dùng')).not.toBeInTheDocument();
    expect(screen.queryByText('Sổ kho')).not.toBeInTheDocument();
  });
  it('menu Manager có Người dùng', () => {
    loginAs('MANAGER');
    renderAt(<AppLayout />);
    expect(screen.getByText('Người dùng')).toBeInTheDocument();
    expect(screen.getByText('Đơn đặt hàng')).toBeInTheDocument();
  });
});
