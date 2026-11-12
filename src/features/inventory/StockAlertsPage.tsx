// ============================================================
// Stock Alerts Page — IN14
// ============================================================
import { Table, Tag, Button, Card, Statistic, Row, Col } from 'antd'
import { AlertOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import type { StockBalance } from '@/types'
import { mockGetLowStockProducts } from '@/lib/mock-data'
import { http } from '@/lib/http'
import { formatNumber } from '@/utils'
import { PageHeader } from '@/components/common'
import type { ColumnsType } from 'antd/es/table'

export function StockAlertsPage() {
  const navigate = useNavigate()

  const { data: lowStockProducts, isLoading } = useQuery({
    queryKey: ['stock-alerts'],
    queryFn: async () => {
      try {
        const res = await http.get('/stock/low')
        return res.data as StockBalance[]
      } catch {
        return await mockGetLowStockProducts()
      }
    },
  })

  const columns: ColumnsType<StockBalance> = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 140, render: (v: string) => <span className="font-mono text-xs font-medium">{v}</span> },
    { title: 'Sản phẩm', dataIndex: 'productName', key: 'productName', ellipsis: true },
    { title: 'Nhóm hàng', dataIndex: 'categoryName', key: 'categoryName', width: 160 },
    { title: 'Đơn vị', dataIndex: 'unit', key: 'unit', width: 70 },
    {
      title: 'Tồn hiện tại', dataIndex: 'quantity', key: 'quantity', width: 120, align: 'right',
      render: (v: number) => <span className="text-red-600 font-bold">{formatNumber(v)}</span>,
    },
    {
      title: 'Tồn tối thiểu', dataIndex: 'minimumStock', key: 'minimumStock', width: 120, align: 'right',
      render: (v: number) => formatNumber(v),
    },
    {
      title: 'Thiếu', key: 'shortage', width: 100, align: 'right',
      render: (_: unknown, r: StockBalance) => {
        const shortage = r.minimumStock - r.quantity
        return <Tag color="red" className="font-bold">−{formatNumber(shortage)}</Tag>
      },
    },
    {
      title: 'Thao tác', key: 'actions', width: 120,
      render: () => (
        <Button type="link" size="small" icon={<ShoppingCartOutlined />}
          onClick={() => navigate('/purchase-requests/create')}>
          Tạo PR
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Cảnh báo tồn thấp"
        subtitle="Sản phẩm có tồn kho dưới mức tối thiểu — IN14"
        breadcrumbs={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Cảnh báo tồn thấp' }]}
      />

      <Row gutter={16} className="mb-4">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Sản phẩm tồn thấp"
              value={lowStockProducts?.length ?? 0}
              prefix={<AlertOutlined className="text-red-500" />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng số thiếu"
              value={lowStockProducts?.reduce((sum, p) => sum + Math.max(0, p.minimumStock - p.quantity), 0) ?? 0}
              valueStyle={{ color: '#fa8c16' }}
              suffix="đơn vị"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="flex items-center">
            <Button type="primary" icon={<ShoppingCartOutlined />} size="large"
              onClick={() => navigate('/purchase-requests/create')} block>
              Tạo đề nghị mua hàng
            </Button>
          </Card>
        </Col>
      </Row>

      <Card>
        <Table<StockBalance>
          columns={columns}
          dataSource={lowStockProducts ?? []}
          rowKey="stockBalanceId"
          loading={isLoading}
          scroll={{ x: 900 }}
          pagination={false}
          rowClassName={() => 'bg-red-50'}
          locale={{ emptyText: '🎉 Tất cả sản phẩm đều có tồn kho trên mức tối thiểu!' }}
        />
      </Card>
    </div>
  )
}

