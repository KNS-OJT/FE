// ============================================================
// Dashboard Page — IN16
// ============================================================
import { Card, Col, Row, Statistic, Table, Tag, Space, Button, Spin } from 'antd'
import {
  AlertOutlined,
  FileTextOutlined,
  InboxOutlined,
  ExportOutlined,
  ShoppingCartOutlined,
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import type { DashboardData, StockBalance, StockTransaction } from '@/types'
import { mockGetDashboard } from '@/lib/mock-data'
import { http } from '@/lib/http'
import { formatDateTime, formatNumber } from '@/utils'
import { TX_TYPE_LABELS, TX_TYPE_COLORS } from '@/constants'
import { PageHeader } from '@/components/common'
import type { ColumnsType } from 'antd/es/table'

export function DashboardPage() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      try {
        const res = await http.get('/dashboard')
        return res.data as DashboardData
      } catch {
        return await mockGetDashboard()
      }
    },
  })

  const lowStockCols: ColumnsType<StockBalance> = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 140, render: (v: string) => <span className="font-mono text-xs">{v}</span> },
    { title: 'Sản phẩm', dataIndex: 'productName', key: 'productName', ellipsis: true },
    { title: 'Đơn vị', dataIndex: 'unit', key: 'unit', width: 80 },
    { title: 'Tồn hiện tại', dataIndex: 'quantity', key: 'quantity', width: 120, align: 'right', render: (v: number) => formatNumber(v) },
    { title: 'Tồn tối thiểu', dataIndex: 'minimumStock', key: 'minimumStock', width: 120, align: 'right', render: (v: number) => formatNumber(v) },
    {
      title: 'Thiếu', key: 'shortage', width: 100, align: 'right',
      render: (_: unknown, r: StockBalance) => {
        const shortage = r.minimumStock - r.quantity
        return shortage > 0 ? <Tag color="red">−{formatNumber(shortage)}</Tag> : <Tag color="green">Đủ</Tag>
      },
    },
  ]

  const txCols: ColumnsType<StockTransaction> = [
    { title: 'Thời gian', dataIndex: 'createdAt', key: 'createdAt', width: 150, render: (v: string) => formatDateTime(v) },
    { title: 'Chứng từ', dataIndex: 'sourceCode', key: 'sourceCode', width: 160, render: (v: string) => <span className="font-mono text-xs">{v}</span> },
    { title: 'Sản phẩm', dataIndex: 'productName', key: 'productName', ellipsis: true },
    {
      title: 'Loại', dataIndex: 'transactionType', key: 'transactionType', width: 120,
      render: (v: string) => (
        <Tag icon={v === 'IN' || v === 'ADJUST_IN' ? <ArrowUpOutlined /> : <ArrowDownOutlined />} color={TX_TYPE_COLORS[v]}>
          {TX_TYPE_LABELS[v]}
        </Tag>
      ),
    },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', width: 100, align: 'right', render: (v: number) => formatNumber(v) },
    { title: 'Tồn sau GD', dataIndex: 'balanceAfter', key: 'balanceAfter', width: 110, align: 'right', render: (v: number) => formatNumber(v) },
  ]

  if (isLoading) {
    return <div className="flex justify-center items-center h-96"><Spin size="large" /></div>
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Tổng quan tồn kho và chứng từ chờ xử lý"
      />

      {/* Stat Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={12} md={6}>
          <Card hoverable className="cursor-pointer" onClick={() => navigate('/stock-alerts')}>
            <Statistic
              title="Sản phẩm tồn thấp"
              value={data?.lowStockCount ?? 0}
              prefix={<AlertOutlined className="text-red-500" />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card hoverable className="cursor-pointer" onClick={() => navigate('/purchase-requests?status=SUBMITTED')}>
            <Statistic
              title="PR chờ duyệt"
              value={data?.pendingPRCount ?? 0}
              prefix={<FileTextOutlined className="text-orange-500" />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card hoverable className="cursor-pointer" onClick={() => navigate('/purchase-orders')}>
            <Statistic
              title="PO chờ nhận hàng"
              value={data?.pendingPOCount ?? 0}
              prefix={<InboxOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card hoverable className="cursor-pointer" onClick={() => navigate('/stock-issues')}>
            <Statistic
              title="Phiếu xuất chờ xác nhận"
              value={data?.pendingStockIssueCount ?? 0}
              prefix={<ExportOutlined className="text-green-600" />}
              valueStyle={{ color: '#389e0d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card className="mb-6" size="small">
        <Space>
          <Button type="primary" icon={<ShoppingCartOutlined />} onClick={() => navigate('/purchase-requests/create')}>
            Tạo đề nghị mua hàng
          </Button>
          <Button icon={<ExportOutlined />} onClick={() => navigate('/stock-issues/create')}>
            Tạo yêu cầu xuất kho
          </Button>
          <Button icon={<PlusOutlined />} onClick={() => navigate('/products')}>
            Quản lý sản phẩm
          </Button>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        {/* Low Stock */}
        <Col xs={24} lg={12}>
          <Card
            title={<span><AlertOutlined className="mr-2 text-red-500" />Sản phẩm tồn thấp</span>}
            extra={<Button type="link" size="small" onClick={() => navigate('/stock-alerts')}>Xem tất cả</Button>}
          >
            <Table<StockBalance>
              columns={lowStockCols}
              dataSource={data?.lowStockProducts ?? []}
              rowKey="stockBalanceId"
              size="small"
              pagination={false}
              scroll={{ x: 600 }}
            />
          </Card>
        </Col>

        {/* Recent Transactions */}
        <Col xs={24} lg={12}>
          <Card
            title={<span><FileTextOutlined className="mr-2 text-blue-500" />Giao dịch gần đây</span>}
            extra={<Button type="link" size="small" onClick={() => navigate('/stock-ledger')}>Xem tất cả</Button>}
          >
            <Table<StockTransaction>
              columns={txCols}
              dataSource={data?.recentTransactions ?? []}
              rowKey="stockTransactionId"
              size="small"
              pagination={false}
              scroll={{ x: 700 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

