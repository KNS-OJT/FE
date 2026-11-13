import '@ant-design/v5-patch-for-react-19'
import { StyleProvider } from '@ant-design/cssinjs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider, App as AntApp } from 'antd'
import viVN from 'antd/locale/vi_VN'
import type { PropsWithChildren } from 'react'
import { useState } from 'react'
import { BrowserRouter } from 'react-router'

const theme = {
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 8,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Layout: {
      siderBg: '#ffffff',
      headerBg: '#ffffff',
    },
    Menu: {
      itemBorderRadius: 8,
      itemMarginInline: 8,
    },
    Table: {
      headerBg: '#fafafa',
    },
  },
}

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )
  return (
    <StyleProvider layer>
      <ConfigProvider theme={theme} locale={viVN}>
        <AntApp>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>{children}</BrowserRouter>
          </QueryClientProvider>
        </AntApp>
      </ConfigProvider>
    </StyleProvider>
  )
}
