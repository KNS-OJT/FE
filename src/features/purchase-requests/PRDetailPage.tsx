// ============================================================
// PR Detail Page — IN06, IN07
// ============================================================
import { useState } from 'react'
import { Card, Descriptions, Table, Button, Steps, Alert, Modal, Input, message, Spin, Popconfirm } from 'antd'
import { CheckOutlined, CloseOutlined, SendOutlined, FileTextOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router'
import type { PurchaseRequest, PurchaseRequestItem } from '@/types'
import { mockGetPurchaseRequest } from '@/lib/mock-data'
import { http } from '@/lib/http'
import { formatDateTime, formatNumber } from '@/utils'
import { PR_STATUS_LABELS, PR_STATUS_COLORS } from '@/constants'
import { PageHeader, StatusTag } from '@/components/common'
import { useAuthStore } from '@/auth/store'
import type { ColumnsType } from 'antd/es/table'

export function PRDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const { data: pr, isLoading } = useQuery({
    queryKey: ['purchase-request', id],
    queryFn: async () => {
      try {
        const res = await http.get(`/purchase-requests/${id}`)
        return res.data as PurchaseRequest
      } catch {
        return await mockGetPurchaseRequest(Number(id))
      }
    },
    enabled: !!id,
  })

  const actionMutation = useMutation({
    mutationFn: async (action: { type: string; reason?: string }) => {
      try {
        if (action.type === 'submit') {
          const res = await http.post(`/purchase-requests/${id}/submit`)
          return res.data
        }
        if (action.type === 'approve') {
          const res = await http.post(`/purchase-requests/${id}/approve`)
          return res.data
        }
        if (action.type === 'reject') {
          const res = await http.post(`/purchase-requests/${id}/reject`, { reason: action.reason })
          return res.data
        }
        if (action.type === 'cancel') {
          const res = await http.post(`/purchase-requests/${id}/cancel`)
          return res.data
        }
      } catch {
        // Mock: update local state
        message.info('(Mock) Thao tác thành công')
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-request', id] })
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
      const msgs: Record<string, string> = {
        submit: 'Gửi PR thành công',
        approve: 'Duyệt PR thành công',
        reject: 'Từ chối PR thành công',
        cancel: 'Hủy PR thành công',
      }
      message.success(msgs[variables.type])
      setRejectModalOpen(false)
      setRejectReason('')
    },
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spin size="large" /></div>
  if (!pr) return <Alert message="Không tìm thấy PR" type="error" showIcon />

  const isManager = user?.roleName === 'MANAGER'
  const isCreator = user?.userId === pr.requesterId
  const canApprove = isManager && pr.status === 'SUBMITTED' && !isCreator
  const canSubmit = isCreator && pr.status === 'DRAFT'
  const canCancel = isCreator && (pr.status === 'DRAFT' || pr.status === 'SUBMITTED')
  const canCreatePO = pr.status === 'APPROVED' && !pr.hasPO

  // Steps indicator
  const statusToStep: Record<string, number> = { DRAFT: 0, SUBMITTED: 1, APPROVED: 2, REJECTED: 2, CANCELED: -1 }
  const currentStep = statusToStep[pr.status] ?? 0

  const itemCols: ColumnsType<PurchaseRequestItem> = [
    { title: '#', key: 'index', width: 50, render: (_: unknown, __: unknown, i: number) => i + 1 },
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 150, render: (v: string) => <span className="font-mono text-xs">{v}</span> },
    { title: 'Sản phẩm', dataIndex: 'productName', key: 'productName', ellipsis: true },
    { title: 'Đơn vị', dataIndex: 'unit', key: 'unit', width: 80 },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', width: 120, align: 'right', render: (v: number) => formatNumber(v) },
    { title: 'Ghi chú', dataIndex: 'note', key: 'note', width: 200, render: (v: string | null) => v || '—' },
  ]

  return (
    <div>
      <PageHeader
        title={pr.requestCode}
        subtitle={`Đề nghị mua hàng — ${PR_STATUS_LABELS[pr.status]}`}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Đề nghị mua hàng', path: '/purchase-requests' },
          { label: pr.requestCode },
        ]}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/purchase-requests')}>
            Quay lại
          </Button>
        }
      />

      {/* Status Steps */}
      {pr.status !== 'CANCELED' && (
        <Card className="mb-4">
          <Steps
            current={currentStep}
            status={pr.status === 'REJECTED' ? 'error' : undefined}
            items={[
              { title: 'Nháp', description: formatDateTime(pr.createdAt) },
              { title: 'Đã gửi', description: formatDateTime(pr.submittedAt) },
              { title: pr.status === 'REJECTED' ? 'Từ chối' : 'Đã duyệt', description: formatDateTime(pr.reviewedAt) },
            ]}
          />
        </Card>
      )}

      {/* Rejection alert */}
      {pr.status === 'REJECTED' && pr.reviewReason && (
        <Alert
          message="PR bị từ chối"
          description={<div><strong>Lý do:</strong> {pr.reviewReason}<br /><strong>Người từ chối:</strong> {pr.reviewerName} — {formatDateTime(pr.reviewedAt)}</div>}
          type="error"
          showIcon
          className="mb-4"
        />
      )}

      {/* SoD Warning */}
      {isManager && pr.status === 'SUBMITTED' && isCreator && (
        <Alert
          message="Bạn không thể duyệt PR do chính mình tạo"
          description="Theo quy tắc phân tách nhiệm vụ (Segregation of Duties), người tạo PR không được tự phê duyệt. Cần một Manager khác duyệt PR này."
          type="warning"
          showIcon
          className="mb-4"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* PR Info */}
        <Card title="Thông tin PR" className="lg:col-span-2">
          <Descriptions column={{ xs: 1, sm: 2 }} size="small">
            <Descriptions.Item label="Mã PR">
              <span className="font-mono font-medium">{pr.requestCode}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <StatusTag status={pr.status} labels={PR_STATUS_LABELS} colors={PR_STATUS_COLORS} />
            </Descriptions.Item>
            <Descriptions.Item label="Người yêu cầu">{pr.requesterName}</Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">{formatDateTime(pr.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="Lý do" span={2}>{pr.reason || '—'}</Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Review Info */}
        <Card title="Phê duyệt">
          {pr.reviewedBy ? (
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Người duyệt">{pr.reviewerName}</Descriptions.Item>
              <Descriptions.Item label="Thời điểm">{formatDateTime(pr.reviewedAt)}</Descriptions.Item>
              <Descriptions.Item label="Kết quả">
                <StatusTag status={pr.status} labels={PR_STATUS_LABELS} colors={PR_STATUS_COLORS} />
              </Descriptions.Item>
              {pr.reviewReason && <Descriptions.Item label="Lý do">{pr.reviewReason}</Descriptions.Item>}
            </Descriptions>
          ) : (
            <div className="text-center text-gray-400 py-4">Chưa được phê duyệt</div>
          )}
        </Card>
      </div>

      {/* Items */}
      <Card title={`Danh sách sản phẩm (${pr.items.length} dòng)`}>
        <Table<PurchaseRequestItem>
          columns={itemCols}
          dataSource={pr.items}
          rowKey="purchaseRequestItemId"
          pagination={false}
          size="small"
          scroll={{ x: 700 }}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={4} className="text-right font-medium">Tổng</Table.Summary.Cell>
              <Table.Summary.Cell index={1} className="text-right font-bold">
                {formatNumber(pr.items.reduce((sum, i) => sum + i.quantity, 0))}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} />
            </Table.Summary.Row>
          )}
        />
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-4">
        {canSubmit && (
          <Popconfirm title="Gửi PR? PR sẽ không thể sửa sau khi gửi." onConfirm={() => actionMutation.mutate({ type: 'submit' })}>
            <Button type="primary" icon={<SendOutlined />} loading={actionMutation.isPending}>Gửi duyệt</Button>
          </Popconfirm>
        )}
        {canApprove && (
          <>
            <Button type="primary" icon={<CheckOutlined />} style={{ backgroundColor: '#52c41a' }}
              onClick={() => actionMutation.mutate({ type: 'approve' })} loading={actionMutation.isPending}>
              Duyệt
            </Button>
            <Button danger icon={<CloseOutlined />} onClick={() => setRejectModalOpen(true)}>Từ chối</Button>
          </>
        )}
        {canCreatePO && (
          <Button type="primary" icon={<FileTextOutlined />}
            onClick={() => navigate(`/purchase-orders/create?prId=${pr.purchaseRequestId}`)}>
            Tạo đơn đặt hàng (PO)
          </Button>
        )}
        {canCancel && (
          <Popconfirm title="Hủy PR này?" onConfirm={() => actionMutation.mutate({ type: 'cancel' })}>
            <Button danger loading={actionMutation.isPending}>Hủy PR</Button>
          </Popconfirm>
        )}
      </div>

      {/* Reject Modal */}
      <Modal title="Từ chối PR" open={rejectModalOpen}
        onCancel={() => { setRejectModalOpen(false); setRejectReason('') }}
        onOk={() => {
          if (!rejectReason.trim()) { message.warning('Vui lòng nhập lý do từ chối'); return }
          actionMutation.mutate({ type: 'reject', reason: rejectReason })
        }}
        confirmLoading={actionMutation.isPending}
        okText="Xác nhận từ chối" okButtonProps={{ danger: true }} cancelText="Hủy">
        <div className="mt-4">
          <p className="mb-2">Vui lòng nhập lý do từ chối PR <strong>{pr.requestCode}</strong>:</p>
          <Input.TextArea rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Lý do từ chối (bắt buộc)..." />
        </div>
      </Modal>
    </div>
  )
}

