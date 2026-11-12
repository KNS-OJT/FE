// ============================================================
// EmptyState – consistent empty data display
// ============================================================
import { Empty, Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'

interface EmptyStateProps {
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ description = 'Không có dữ liệu', actionLabel, onAction }: EmptyStateProps) {
  return (
    <Empty description={description} className="py-12">
      {actionLabel && onAction && (
        <Button type="primary" icon={<PlusOutlined />} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Empty>
  )
}

