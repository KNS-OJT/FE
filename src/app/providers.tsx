import '@ant-design/v5-patch-for-react-19'
import { StyleProvider } from '@ant-design/cssinjs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import type { PropsWithChildren } from 'react'
import { useState } from 'react'
import { BrowserRouter } from 'react-router'

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <StyleProvider layer>
      <ConfigProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>{children}</BrowserRouter>
        </QueryClientProvider>
      </ConfigProvider>
    </StyleProvider>
  )
}
