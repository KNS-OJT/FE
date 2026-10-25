import { Button, Typography } from 'antd'
import { env } from '@/config/env'
import { AppProviders } from '@/app/providers'

export default function App() {
  return (
    <AppProviders>
      <main className="p-4">
        <Typography.Title level={1}>{env.VITE_APP_NAME}</Typography.Title>
        <Typography.Paragraph>
          Frontend environment is ready.
        </Typography.Paragraph>
        <Button type="primary">Setup ready</Button>
      </main>
    </AppProviders>
  )
}
