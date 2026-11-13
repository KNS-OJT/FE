// ============================================================
// Stock Issue Detail Page — IN11, IN12
// ============================================================
import { useState } from 'react'
import { Card, Descriptions, Table, Button, Spin, Alert, message, Popconfirm, Modal, Input } from 'antd'
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router'
import type { StockIssueItem } from '@/types'
import { stockIssueApi } from '@/api'
import { formatDateTime, formatNumber } from '@/utils'
import { SI_STATUS_LABELS, SI_STATUS_COLORS } from '@/constants'
import { PageHeader, StatusTag } from '@/components/common'
import { useAuthStore } from '@/auth/store'
import type { ColumnsType } from 'antd/es/table'

export function SIDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const { data: si, isLoading } = useQuery({
    queryKey: ['stock-issue', id],
    queryFn: () => stockIssueApi.getStockIssueById(Number(id)),
    enabled: !!id,
  })

  const actionMutation = useMutation({
    mutationFn: (action: { type: string; reason?: string }) => {
      const issueId = Number(id)
      if (action.type === 'confirm') return stockIssueApi.confirmStockIssue(issueId)
      if (action.type === 'reject') return stockIssueApi.rejectStockIssue(issueId, action.reason ?? '')
      return stockIssueApi.cancelStockIssue(issueId)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stock-issue', id] })
      queryClient.invalidateQueries({ queryKey: ['stock-issues'] })
      queryClient.invalidateQueries({ queryKey: ['stock-balances'] })
      queryClient.invalidateQueries({ queryKey: ['stock-ledger'] })
      const msgs: Record<string, string> = {
        confirm: 'Xác nhận xuất kho thành công — Tồn kho đã được trừ',
        reject: 'Từ chối xuất kho thành công',
        cancel: 'Hủy phiếu xuất kho thành công',
      }
      message.success(msgs[variables.type])
      setRejectModalOpen(false)
      setRejectReason('')
    },
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spin size="large" /></div>
  if (!si) return <Alert message="Không tìm thấy phiếu xuất" type="error" showIcon />

  const isWarehouse = user?.roleName === 'WAREHOUSE_STAFF' || user?.roleName === 'MANAGER'
  const isRequester = user?.userId === si.requestedBy
  const canConfirm = isWarehouse && si.status === 'DRAFT' && !isRequester // BR-23: requester cannot confirm own
  const canCancel = isRequester && si.status === 'DRAFT'

  const itemCols: ColumnsType<StockIssueItem> = [
    { title: '#', key: 'index', width: 50, render: (_: unknown, __: unknown, i: number) => i + 1 },
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 140, render: (v: string) => <span className="font-mono text-xs">{v}</span> },
    { title: 'Sản phẩm', dataIndex: 'productName', key: 'productName', ellipsis: true },
    { title: 'Đơn vị', dataIndex: 'unit', key: 'unit', width: 80 },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', width: 120, align: 'right' as const, render: (v: number) => <span className="font-medium text-red-600">{formatNumber(v)}</span> },
  ]

  return (
    <div>
      <PageHeader
        title={si.issueCode}
        subtitle={`Yêu cầu xuất kho — ${SI_STATUS_LABELS[si.status]}`}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Xuất kho', path: '/stock-issues' },
          { label: si.issueCode },
        ]}
        extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/stock-issues')}>Quay lại</Button>}
      />

      {/* SoD warning for requester who is also warehouse */}
      {isWarehouse && si.status === 'DRAFT' && isRequester && (
        <Alert
          message="Bạn không thể xác nhận phiếu xuất do chính mình tạo"
          description="Theo quy tắc phân tách nhiệm vụ (BR-23), người tạo yêu cầu xuất không được tự xác nhận."
          type="warning" showIcon className="mb-4"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card title="Thông tin phiếu xuất" className="lg:col-span-2">
          <Descriptions column={{ xs: 1, sm: 2 }} size="small">
            <Descriptions.Item label="Mã phiếu"><span className="font-mono font-medium">{si.issueCode}</span></Descriptions.Item>
            <Descriptions.Item label="Trạng thái"><StatusTag status={si.status} labels={SI_STATUS_LABELS} colors={SI_STATUS_COLORS} /></Descriptions.Item>
            <Descriptions.Item label="Người yêu cầu">{si.requesterName}</Descriptions.Item>
            <Descriptions.Item label="Ngày yêu cầu">{formatDateTime(si.requestedAt)}</Descriptions.Item>
            <Descriptions.Item label="Lý do" span={2}>{si.reason || '—'}</Descriptions.Item>
            {si.note && <Descriptions.Item label="Ghi chú" span={2}>{si.note}</Descriptions.Item>}
          </Descriptions>
        </Card>

        <Card title="Xác nhận">
          {si.confirmedBy ? (
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Người xác nhận">{si.confirmerName}</Descriptions.Item>
              <Descriptions.Item label="Thời điểm">{formatDateTime(si.confirmedAt)}</Descriptions.Item>
              <Descriptions.Item label="Kết quả"><StatusTag status={si.status} labels={SI_STATUS_LABELS} colors={SI_STATUS_COLORS} /></Descriptions.Item>
            </Descriptions>
          ) : (
            <div className="text-center text-gray-400 py-4">
              {si.status === 'DRAFT' ? 'Chờ Warehouse Staff xác nhận' : 'Đã hủy'}
            </div>
          )}
          {si.cancelReason && (
            <Alert message="Lý do hủy/từ chối" description={si.cancelReason} type="error" showIcon className="mt-3" />
          )}
        </Card>
      </div>

      <Card title={`Sản phẩm xuất (${si.items.length} dòng)`}>
        <Table<StockIssueItem>
          columns={itemCols} dataSource={si.items} rowKey="stockIssueItemId"
          pagination={false} size="small" scroll={{ x: 500 }}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={4} className="text-right font-medium">Tổng</Table.Summary.Cell>
              <Table.Summary.Cell index={1} className="text-right font-bold text-red-600">
                {formatNumber(si.items.reduce((sum, i) => sum + i.quantity, 0))}
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      </Card>

      <div className="flex justify-end gap-3 mt-4">
        {canConfirm && (
          <>
            <Popconfirm title="Xác nhận xuất kho? Tồn kho sẽ bị trừ." onConfirm={() => actionMutation.mutate({ type: 'confirm' })}>
              <Button type="primary" icon={<CheckCircleOutlined />} loading={actionMutation.isPending}>
                Xác nhận xuất kho
              </Button>
            </Popconfirm>
            <Button danger icon={<CloseCircleOutlined />} onClick={() => setRejectModalOpen(true)}>
              Từ chối
            </Button>
          </>
        )}
        {canCancel && (
          <Popconfirm title="Hủy yêu cầu xuất kho?" onConfirm={() => actionMutation.mutate({ type: 'cancel' })}>
            <Button danger loading={actionMutation.isPending}>Hủy yêu cầu</Button>
          </Popconfirm>
        )}
      </div>

      <Modal title="Từ chối yêu cầu xuất kho" open={rejectModalOpen}
        onCancel={() => { setRejectModalOpen(false); setRejectReason('') }}
        onOk={() => {
          if (!rejectReason.trim()) { message.warning('Vui lòng nhập lý do từ chối'); return }
          actionMutation.mutate({ type: 'reject', reason: rejectReason })
        }}
        confirmLoading={actionMutation.isPending}
        okText="Xác nhận từ chối" okButtonProps={{ danger: true }} cancelText="Hủy">
        <div className="mt-4">
          <p className="mb-2">Vui lòng nhập lý do từ chối:</p>
          <Input.TextArea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Lý do từ chối (bắt buộc)..." />
        </div>
      </Modal>
    </div>
  )
}

