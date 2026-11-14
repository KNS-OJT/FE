import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntApp } from 'antd'
import LoginPage from '@/pages/LoginPage'
import { EmptyState } from '@/components/EmptyState'
import { useAuthStore } from '@/auth/authStore'

// Mọi request đi qua src/lib/http: mock để chắc chắn không có request mạng thật.
vi.mock('@/lib/http', () => ({
  http: { get: vi.fn(), post: vi.fn(), put: vi.fn(), request: vi.fn() },
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))
vi.mock('@/config/env', () => ({
  env: {
    apiBaseUrl: '/api',
    appName: 'Kho & Mua hàng',
    demoMockMissing: false,
    demoUsers: [
      { username: 'mgr1', role: 'MANAGER' },
      { username: 'req1', role: 'REQUESTER' },
    ],
  },
}))

const renderLogin = () => {
  const router = createMemoryRouter([{ path: '/', element: <LoginPage /> }], {
    initialEntries: ['/'],
  })
  return render(
    <AntApp>
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AntApp>,
  )
}

const setViewport = (wide: boolean) =>
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: wide && query.includes('min-width'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })

describe('LoginPage v2', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
    setViewport(true)
  })

  it('màn rộng: có 4 bước quy trình và đủ form đăng nhập', () => {
    renderLogin()
    for (const step of [
      'Đề nghị mua',
      'Phê duyệt',
      'Đặt hàng',
      'Nhập & xuất kho',
    ]) {
      expect(screen.getByText(step)).toBeInTheDocument()
    }
    expect(screen.getByLabelText('Tên đăng nhập')).toBeInTheDocument()
    expect(screen.getByLabelText('Mật khẩu')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Đăng nhập' }),
    ).toBeInTheDocument()
  })

  it('màn hẹp: ẩn panel quy trình nhưng form vẫn đủ', () => {
    setViewport(false)
    renderLogin()
    expect(screen.queryByText('Phê duyệt')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Tên đăng nhập')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Đăng nhập' }),
    ).toBeInTheDocument()
  })

  it('bấm chip demo chỉ điền tên đăng nhập, xóa mật khẩu và focus vào ô mật khẩu', () => {
    renderLogin()
    const password = screen.getByLabelText('Mật khẩu') as HTMLInputElement
    fireEvent.change(password, { target: { value: 'dang-go-do' } })
    fireEvent.click(screen.getByRole('button', { name: /mgr1/ }))
    expect(
      (screen.getByLabelText('Tên đăng nhập') as HTMLInputElement).value,
    ).toBe('mgr1')
    expect(password.value).toBe('')
    expect(password).toHaveFocus()
  })
})

describe('EmptyState', () => {
  it('không có onAction/actionLabel thì không render nút', () => {
    render(<EmptyState title="Chưa có dữ liệu" hint="Gợi ý" />)
    expect(screen.getByText('Chưa có dữ liệu')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('chỉ có actionLabel (người dùng không có quyền) thì không render nút', () => {
    render(
      <EmptyState
        title="Chưa có dữ liệu"
        actionLabel={undefined}
        onAction={() => {}}
      />,
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('có cả actionLabel và onAction thì bấm nút gọi onAction', () => {
    const onAction = vi.fn()
    render(
      <EmptyState
        title="Chưa có dữ liệu"
        actionLabel="Tạo mới"
        onAction={onAction}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tạo mới' }))
    expect(onAction).toHaveBeenCalledTimes(1)
  })
})
