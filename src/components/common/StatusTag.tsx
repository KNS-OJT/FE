// ============================================================
// StatusTag – generic colored tag for all entity statuses
// ============================================================
import { Tag } from 'antd'

interface StatusTagProps {
  status: string
  labels: Record<string, string>
  colors: Record<string, string>
}

export function StatusTag({ status, labels, colors }: StatusTagProps) {
  return (
    <Tag color={colors[status] ?? 'default'}>
      {labels[status] ?? status}
    </Tag>
  )
}

