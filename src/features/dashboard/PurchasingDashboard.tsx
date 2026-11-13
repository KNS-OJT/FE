// ============================================================
// Purchasing Dashboard — IN16 tailored for PURCHASING_STAFF role
// Scope: P1 (Create PO from Approved PR, Manage Suppliers & PO Tracking)
// ============================================================
import { Card, Col, Row, Statistic, Table, Tag, Button, Progress, Badge } from 'antd'
import {
  ShoppingCartOutlined,
  ShopOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  RightOutlined,
  PhoneOutlined,
  MailOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { purchaseRequestApi, purchaseOrderApi, supplierApi } from '@/api'
import { formatDateTime, formatDate } from '@/utils'
import { PO_STATUS_COLORS, PO_STATUS_LABELS } from '@/constants'
import type { PurchaseRequest, PurchaseOrder, Supplier } from '@/types'
import type { ColumnsType } from 'antd/es/table'

export function PurchasingDashboard() {
  const navigate = useNavigate()

  // 1. Approved PRs ready for PO creation (BR-02/BR-19)
  const { data: approvedPRsData, isLoading: prsLoading } = useQuery({
    queryKey: ['purchasing', 'approved-prs'],
    queryFn: async () => {
      const res = await purchaseRequestApi.getPurchaseRequests(1, 50, 'APPROVED')
      return res.content.filter((pr) => !pr.hasPO)
    },
  })

  // 2. All POs
  const { data: posData, isLoading: posLoading } = useQuery({
    queryKey: ['purchasing', 'all-pos'],
    queryFn: async () => {
      const res = await purchaseOrderApi.getPurchaseOrders(1, 50)
      return res.content
    },
  })

  // 3. Suppliers list
  const { data: suppliersData, isLoading: suppliersLoading } = useQuery({
    queryKey: ['purchasing', 'suppliers'],
    queryFn: async () => {
      return await supplierApi.getSuppliers()
    },
  })

  const readyPRs = approvedPRsData ?? []
  const allPOs = posData ?? []
  const orderedPOs = allPOs.filter((po) => po.status === 'ORDERED')
  const partialPOs = allPOs.filter((po) => po.status === 'PARTIALLY_RECEIVED')
  const suppliers = suppliersData?.content ?? []
  const activeSuppliers = suppliers.filter((s) => s.isActive)

  // Columns for PRs waiting for PO
  const prCols: ColumnsType<PurchaseRequest> = [
    {
      title: 'Mã PR',
      dataIndex: 'requestCode',
      key: 'requestCode',
      width: 140,
      render: (code: string, r) => (
        <a
          onClick={() => navigate(`/purchase-requests/${r.purchaseRequestId}`)}
          className="font-mono text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
        >
          {code}
        </a>
      ),
    },
    {
      title: 'Người yêu cầu',
      dataIndex: 'requesterName',
      key: 'requesterName',
      width: 140,
      render: (v: string) => <span className="text-xs">{v}</span>,
    },
    {
      title: 'Người duyệt',
      dataIndex: 'reviewerName',
      key: 'reviewerName',
      width: 140,
      render: (v: string | null) => <span className="text-xs text-green-700 font-medium">{v ?? 'Manager'}</span>,
    },
    {
      title: 'Số mặt hàng',
      key: 'itemsCount',
      width: 100,
      align: 'center',
      render: (_, r) => <Tag color="blue">{r.items?.length ?? 0} linh kiện</Tag>,
    },
    {
      title: 'Ngày duyệt',
      dataIndex: 'reviewedAt',
      key: 'reviewedAt',
      width: 130,
      render: (v: string | null) => <span className="text-xs text-gray-500">{v ? formatDateTime(v) : '—'}</span>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 130,
      render: (_, r) => (
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={() => navigate(`/purchase-orders/create?prId=${r.purchaseRequestId}`)}
          className="bg-orange-500 hover:bg-orange-600 border-orange-500"
        >
          Lập PO
        </Button>
      ),
    },
  ]

  // Columns for PO tracking
  const poCols: ColumnsType<PurchaseOrder> = [
    {
      title: 'Mã PO',
      dataIndex: 'orderCode',
      key: 'orderCode',
      width: 140,
      render: (code: string, r) => (
        <a
          onClick={() => navigate(`/purchase-orders/${r.purchaseOrderId}`)}
          className="font-mono text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
        >
          {code}
        </a>
      ),
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: 'supplierName',
      key: 'supplierName',
      ellipsis: true,
    },
    {
      title: 'Hẹn giao',
      dataIndex: 'expectedDeliveryDate',
      key: 'expectedDeliveryDate',
      width: 110,
      render: (v: string | null) => (v ? <span className="text-xs">{formatDate(v)}</span> : '—'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => (
        <Tag color={PO_STATUS_COLORS[status]}>{PO_STATUS_LABELS[status] ?? status}</Tag>
      ),
    },
    {
      title: 'Tiến độ nhận',
      key: 'progress',
      width: 130,
      render: (_, r) => {
        const totalQty = r.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0
        const receivedQty = r.items?.reduce((sum, item) => sum + item.receivedQuantity, 0) ?? 0
        const pct = totalQty > 0 ? Math.round((receivedQty / totalQty) * 100) : 0
        return (
          <div className="w-24">
            <Progress
              percent={pct}
              size="small"
              status={pct === 100 ? 'success' : pct > 0 ? 'active' : 'normal'}
            />
          </div>
        )
      },
    },
  ]

  // Columns for Suppliers mini table
  const supplierCols: ColumnsType<Supplier> = [
    {
      title: 'Nhà cung cấp',
      dataIndex: 'supplierName',
      key: 'supplierName',
      ellipsis: true,
      render: (v: string, r) => (
        <div>
          <div className="font-medium text-xs text-gray-800">{v}</div>
          <div className="text-[11px] text-gray-400">{r.contactPerson}</div>
        </div>
      ),
    },
    {
      title: 'Liên hệ',
      key: 'contact',
      width: 160,
      render: (_, r) => (
        <div className="text-[11px] space-y-0.5">
          <div className="text-gray-600 flex items-center gap-1">
            <PhoneOutlined className="text-gray-400" /> {r.phone ?? '—'}
          </div>
          <div className="text-gray-500 truncate flex items-center gap-1">
            <MailOutlined className="text-gray-400" /> {r.email ?? '—'}
          </div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'default'} className="text-[10px]">
          {v ? 'Hợp tác' : 'Tạm ngưng'}
        </Tag>
      ),
    },
  ]

  return (
    <div>
      {/* 4 Stat Cards for Purchasing */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={12} md={6}>
          <Card
            hoverable
            className="cursor-pointer border-t-2 border-orange-500"
            onClick={() => navigate('/purchase-orders/create')}
          >
            <Statistic
              title={
                <span className="flex items-center gap-1 font-medium">
                  PR đã duyệt – Chờ lập PO
                  {readyPRs.length > 0 && <Badge count={readyPRs.length} style={{ backgroundColor: '#d46b08' }} size="small" />}
                </span>
              }
              value={readyPRs.length}
              prefix={<ShoppingCartOutlined className="text-orange-500" />}
              valueStyle={{ color: '#d46b08', fontWeight: 700 }}
              suffix={<span className="text-xs text-gray-400 font-normal">cần đặt hàng</span>}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={6}>
          <Card
            hoverable
            className="cursor-pointer border-t-2 border-blue-500"
            onClick={() => navigate('/purchase-orders')}
          >
            <Statistic
              title="Đơn PO đang chờ NCC giao"
              value={orderedPOs.length}
              prefix={<ClockCircleOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1677ff', fontWeight: 600 }}
              suffix={<span className="text-xs text-gray-400 font-normal">đã phát hành</span>}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={6}>
          <Card
            hoverable
            className="cursor-pointer border-t-2 border-purple-500"
            onClick={() => navigate('/purchase-orders')}
          >
            <Statistic
              title="Đơn PO đang nhận dở dang"
              value={partialPOs.length}
              prefix={<CheckCircleOutlined className="text-purple-500" />}
              valueStyle={{ color: '#722ed1', fontWeight: 600 }}
              suffix={<span className="text-xs text-gray-400 font-normal">nhận nhiều đợt</span>}
            />
          </Card>
        </Col>

        <Col xs={12} sm={12} md={6}>
          <Card
            hoverable
            className="cursor-pointer border-t-2 border-green-500"
            onClick={() => navigate('/suppliers')}
          >
            <Statistic
              title="Nhà cung cấp đang hợp tác"
              value={activeSuppliers.length}
              prefix={<ShopOutlined className="text-green-500" />}
              valueStyle={{ color: '#389e0d', fontWeight: 600 }}
              suffix={<span className="text-xs text-gray-400 font-normal">đối tác máy tính</span>}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Action Bar */}
      <Card size="small" className="mb-6 bg-orange-50/40 border-orange-100">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-orange-950">Thao tác thu mua & quản lý NCC:</span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/purchase-orders/create')}
              className="bg-orange-500 hover:bg-orange-600 border-orange-500 font-medium"
            >
              Lập Đơn đặt hàng (PO) mới
            </Button>
            <Button
              icon={<ShopOutlined />}
              onClick={() => navigate('/suppliers')}
            >
              Danh bạ Nhà cung cấp
            </Button>
            <Button
              icon={<ShoppingCartOutlined />}
              onClick={() => navigate('/purchase-requests?status=APPROVED')}
            >
              Xem tất cả PR đã duyệt
            </Button>
            <Button
              icon={<ClockCircleOutlined />}
              onClick={() => navigate('/purchase-orders')}
            >
              Theo dõi tiến độ đơn hàng
            </Button>
          </div>
          <Tag color="orange" className="py-1 px-2">
            BR-02: Mỗi PO bắt buộc tham chiếu một PR đã phê duyệt
          </Tag>
        </div>
      </Card>

      {/* Work Area */}
      <Row gutter={[16, 16]}>
        {/* Left Col: Approved PRs ready for PO */}
        <Col xs={24} lg={13}>
          <Card
            title={
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">
                  <ShoppingCartOutlined className="mr-2 text-orange-500" />
                  PR đã duyệt – Chờ lập đơn đặt hàng PO (Action Queue)
                </span>
                <Badge count={readyPRs.length} style={{ backgroundColor: '#d46b08' }} />
              </div>
            }
            extra={
              <Button type="link" size="small" onClick={() => navigate('/purchase-requests?status=APPROVED')}>
                Xem tất cả <RightOutlined />
              </Button>
            }
          >
            <Table<PurchaseRequest>
              columns={prCols}
              dataSource={readyPRs}
              rowKey="purchaseRequestId"
              size="small"
              loading={prsLoading}
              pagination={{ pageSize: 4, size: 'small' }}
              scroll={{ x: 620 }}
              locale={{ emptyText: 'Hiện không có PR nào đã duyệt đang chờ tạo PO' }}
            />
          </Card>
        </Col>

        {/* Right Col: Ongoing POs Tracking */}
        <Col xs={24} lg={11}>
          <Card
            title={
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">
                  <ClockCircleOutlined className="mr-2 text-blue-500" />
                  Tiến độ các đơn PO đang thực hiện
                </span>
                <span className="text-xs text-gray-400">
                  {allPOs.length} đơn đặt hàng
                </span>
              </div>
            }
            extra={
              <Button type="link" size="small" onClick={() => navigate('/purchase-orders')}>
                Xem tất cả <RightOutlined />
              </Button>
            }
          >
            <Table<PurchaseOrder>
              columns={poCols}
              dataSource={allPOs}
              rowKey="purchaseOrderId"
              size="small"
              loading={posLoading}
              pagination={{ pageSize: 4, size: 'small' }}
              scroll={{ x: 500 }}
            />
          </Card>
        </Col>

        {/* Bottom: Suppliers Directory */}
        <Col xs={24}>
          <Card
            title={
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">
                  <ShopOutlined className="mr-2 text-green-500" />
                  Danh bạ Nhà cung cấp linh kiện máy tính hợp tác
                </span>
                <span className="text-xs text-gray-400">
                  Liên hệ báo giá và đặt hàng
                </span>
              </div>
            }
            extra={
              <Button type="link" size="small" onClick={() => navigate('/suppliers')}>
                Quản lý Nhà cung cấp <RightOutlined />
              </Button>
            }
          >
            <Table<Supplier>
              columns={supplierCols}
              dataSource={suppliers}
              rowKey="supplierId"
              size="small"
              loading={suppliersLoading}
              pagination={{ pageSize: 4, size: 'small' }}
              scroll={{ x: 450 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
