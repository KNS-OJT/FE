import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { api, http } from '@/lib/http';
import LoginPage from '@/pages/LoginPage';
import UsersPage from '@/pages/UsersPage';
import ChangePasswordPage from '@/pages/ChangePasswordPage';
import { AppLayout } from '@/components/AppLayout';
import { useAuthStore } from '@/auth/authStore';
import type { Role } from '@/auth/roles';

// Mọi request đi qua src/lib/http: mock để chắc chắn không có request mạng thật.
vi.mock('@/lib/http', () => ({
  http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), request: vi.fn() },
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

const renderAt = (el: React.ReactNode) => {
  const router = createMemoryRouter(
    [
      { path: '/', element: el },
      { path: '/login', element: <div>login</div> },
      { path: '/account/password', element: <div>trang-doi-mat-khau</div> },
    ],
    { initialEntries: ['/'] },
  );
  return render(
    <AntApp>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AntApp>,
  );
};
const loginAs = (role: Role) =>
  useAuthStore.getState().setSession({ accessToken: 't', expiresAt: Date.now() + 60_000, user: { userId: 1, username: 'manager1', fullName: 'Người Test', role } });
const networkCalls = () => [api.get, api.post, api.put, http.get, http.post, http.put, http.request].reduce((n, f) => n + vi.mocked(f).mock.calls.length, 0);

describe('Quên mật khẩu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearSession();
  });
  it('bấm "Quên mật khẩu?" mở modal hướng dẫn và không gửi request mạng nào', async () => {
    renderAt(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Quên mật khẩu?' }));
    expect(await screen.findByText(/không tự khôi phục mật khẩu qua email/)).toBeInTheDocument();
    expect(screen.getByText(/Liên hệ Quản lý để được đặt lại mật khẩu/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    expect(networkCalls()).toBe(0);
  });
});

describe('Form Tạo tài khoản', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearSession();
    vi.mocked(api.get).mockResolvedValue({
      items: [{ id: 2, username: 'bob', fullName: 'Bob', email: '', role: 'REQUESTER', active: true }],
      totalElements: 1,
    });
  });
  const openForm = async () => {
    loginAs('MANAGER');
    renderAt(<UsersPage />);
    fireEvent.click(await screen.findByRole('button', { name: /Tạo tài khoản/ }));
  };

  it('báo lỗi khi nhập lại mật khẩu không khớp và không gửi request tạo', async () => {
    await openForm();
    fireEvent.change(screen.getByLabelText('Tên đăng nhập'), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu ban đầu'), { target: { value: 'ngay mai troi nang' } });
    fireEvent.change(screen.getByLabelText('Nhập lại mật khẩu'), { target: { value: 'ngay mai troi mua' } });
    expect(await screen.findByText('Mật khẩu nhập lại không khớp')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tạo' }));
    await waitFor(() => expect(screen.getByText('Mật khẩu nhập lại không khớp')).toBeInTheDocument());
    expect(api.post).not.toHaveBeenCalled();
  });
  it('báo mật khẩu phổ biến và hiện thanh độ mạnh', async () => {
    await openForm();
    fireEvent.change(screen.getByLabelText('Mật khẩu ban đầu'), { target: { value: 'matkhau123' } });
    expect(await screen.findByText('Mật khẩu quá phổ biến, rất dễ bị đoán.')).toBeInTheDocument();
    expect(screen.getByText('Yếu')).toBeInTheDocument();
  });
  it('báo mật khẩu chứa tên đăng nhập', async () => {
    await openForm();
    fireEvent.change(screen.getByLabelText('Tên đăng nhập'), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu ban đầu'), { target: { value: 'newuser-2026' } });
    expect(await screen.findByText('Mật khẩu không được trùng hoặc chứa tên đăng nhập.')).toBeInTheDocument();
  });
  it('mỗi dòng có "Đặt lại mật khẩu" bị khóa', async () => {
    loginAs('MANAGER');
    renderAt(<UsersPage />);
    const btn = await screen.findByRole('button', { name: 'Đặt lại mật khẩu' });
    expect(btn).toBeDisabled();
  });
  it('gửi body không chứa confirmPassword', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    await openForm();
    fireEvent.change(screen.getByLabelText('Tên đăng nhập'), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu ban đầu'), { target: { value: 'ngay mai troi nang' } });
    fireEvent.change(screen.getByLabelText('Nhập lại mật khẩu'), { target: { value: 'ngay mai troi nang' } });
    fireEvent.change(screen.getByLabelText('Họ tên'), { target: { value: 'Người Mới' } });
    fireEvent.mouseDown(screen.getByLabelText('Vai trò'));
    fireEvent.click(await screen.findByText('Người yêu cầu', { selector: '.ant-select-item-option-content' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tạo' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    const [url, body] = vi.mocked(api.post).mock.calls[0];
    expect(url).toBe('/users');
    expect(Object.keys(body as object).sort()).toEqual(['email', 'fullName', 'password', 'role', 'username']);
  });
});

describe('Đổi mật khẩu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearSession();
  });
  it('hiện banner chờ API và khóa nút lưu', () => {
    loginAs('REQUESTER');
    renderAt(<ChangePasswordPage />);
    expect(screen.getByText('Chờ API POST /api/auth/change-password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lưu mật khẩu' })).toBeDisabled();
  });
  it('báo lỗi khi mật khẩu mới trùng mật khẩu hiện tại hoặc nhập lại sai', async () => {
    loginAs('REQUESTER');
    renderAt(<ChangePasswordPage />);
    fireEvent.change(screen.getByLabelText('Mật khẩu hiện tại'), { target: { value: 'ngay mai troi nang' } });
    fireEvent.change(screen.getByLabelText('Mật khẩu mới'), { target: { value: 'ngay mai troi nang' } });
    expect(await screen.findByText('Mật khẩu mới phải khác mật khẩu hiện tại')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Mật khẩu mới'), { target: { value: 'mot mat khau moi dai' } });
    fireEvent.change(screen.getByLabelText('Nhập lại mật khẩu mới'), { target: { value: 'khac' } });
    expect(await screen.findByText('Mật khẩu nhập lại không khớp')).toBeInTheDocument();
    expect(networkCalls()).toBe(0);
  });
});

describe('Menu tài khoản ở header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearSession();
  });
  it('có "Đổi mật khẩu" và "Đăng xuất"; chọn "Đổi mật khẩu" chuyển tới /account/password', async () => {
    loginAs('REQUESTER');
    renderAt(<AppLayout />);
    fireEvent.click(screen.getByRole('button', { name: 'Menu tài khoản' }));
    expect(await screen.findByText('Đăng xuất')).toBeInTheDocument();
    fireEvent.click(await screen.findByText('Đổi mật khẩu'));
    expect(await screen.findByText('trang-doi-mat-khau')).toBeInTheDocument();
  });
});
