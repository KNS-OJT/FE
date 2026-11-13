// ============================================================
// PageHeader – reusable page title + breadcrumbs + actions
// ============================================================
import { Breadcrumb, Space, Typography } from 'antd'
import { Link } from 'react-router'

const { Title } = Typography

interface BreadcrumbItem {
  label: string
  path?: string
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
  extra?: React.ReactNode
}

export function PageHeader({ title, subtitle, breadcrumbs, extra }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb
          className="mb-2"
          items={breadcrumbs.map((b) => ({
            title: b.path ? <Link to={b.path}>{b.label}</Link> : b.label,
          }))}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <Title level={3} className="!mb-0">
            {title}
          </Title>
          {subtitle && (
            <Typography.Text type="secondary">{subtitle}</Typography.Text>
          )}
        </div>
        {extra && <Space>{extra}</Space>}
      </div>
    </div>
  )
}

