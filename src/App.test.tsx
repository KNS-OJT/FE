import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import { env } from '@/config/env'
import { http } from '@/lib/http'
import { useAuthStore } from '@/auth/store'

describe('frontend setup', () => {
  it('renders the login page when not authenticated', async () => {
    useAuthStore.getState().logout()
    render(<App />)

    // Should display the login page heading
    expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeInTheDocument()

    // HTTP configuration
    expect(http.defaults.baseURL).toBe(env.VITE_API_BASE_URL)
    expect(http.defaults.withCredentials).toBe(true)
  })
})
