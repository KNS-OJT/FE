import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createStore } from 'zustand/vanilla'
import App from '@/App'
import { env } from '@/config/env'
import { http } from '@/lib/http'

describe('frontend setup', () => {
  it('renders the app through Router, Query and Ant Design providers', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: env.VITE_APP_NAME }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Setup ready' })).toHaveClass(
      'ant-btn-primary',
    )
    expect(http.defaults.baseURL).toBe(env.VITE_API_BASE_URL)
    expect(http.defaults.withCredentials).toBe(true)
    expect(createStore(() => ({ ready: true })).getState().ready).toBe(true)
  })
})
