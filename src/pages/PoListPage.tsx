import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Alert, Button, Select, Table } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { poApi, type PurchaseOrder } from '@/api/po';
import { useSupplierMap } from '@/api/lookups';
import { PageHeader } from '@/components/PageHeader';
import { ErrorAlert } from '@/components/States';
import { StatusTag } from '@/components/StatusTag';
import { usePaging } from '@/components/usePaging';
import { useAuth } from '@/auth/useAuth';
import { PO_STATUSES, STATUS } from '@/constants/status';
import { fmtDate, fmtDateTime } from '@/lib/format';

export default function PoListPage() {
  const nav = useNavigate();
  const { can, user } = useAuth();
  const [sp, setSp] = useSearchParams();
  const [status, setStatus] = useState<string | undefined>(sp.get('status') ?? undefined);
  const { page, size, setPage, pagination } = usePaging();
  const suppliers = useSupplierMap(can('supplier:view'));
  const list = useQuery({ queryKey: ['po', { status, page, size }], queryFn: () => poApi.list({ status, page, size }) });

  return (
    <>
      <PageHeader title="Đơn đặt hàng (PO)" extra={can('po:manage') && <Button type="primary" onClick={() => nav('/po/new')}>+ Tạo PO từ PR</Button>} />
      {user?.role === 'WAREHOUSE_STAFF' && <Alert type="info" showIcon style={{ marginBottom: 16 }} message="Nhân viên kho chỉ thấy PO đã đặt hàng hoặc đang nhận một phần." />}
      <div className="toolbar">
        <Select allowClear placeholder="Trạng thái" style={{ width: 200 }} value={status}
          onChange={(v) => { setStatus(v); setPage(0); setSp(v ? { status: v } : {}, { replace: true }); }}
          options={PO_STATUSES.map((s) => ({ value: s, label: STATUS[s]?.label }))} />
      </div>
      {list.error && <ErrorAlert error={list.error} onRetry={() => list.refetch()} />}
      <Table<PurchaseOrder>
        className="table-shell"
        rowKey="id"
        loading={list.isLoading}
        dataSource={list.data?.items ?? []}
        pagination={pagination(list.data?.totalElements ?? 0)}
        scroll={{ x: 900 }}
        onRow={(r) => ({ onClick: () => nav(`/po/${r.id}`), style: { cursor: 'pointer' } })}
        locale={{ emptyText: 'Chưa có đơn đặt hàng' }}
        columns={[
          { title: 'Mã PO', dataIndex: 'code', render: (v, r) => <a href={`/po/${r.id}`} onClick={(e) => e.preventDefault()}>{v || `PO #${r.id}`}</a> },
          { title: 'PR tham chiếu', key: 'pr', render: (_, r) => r.prCode || `PR #${r.purchaseRequestId}` },
          { title: 'Nhà cung cấp', key: 'sup', render: (_, r) => r.supplierName || suppliers.data?.get(r.supplierId)?.name || `Nhà cung cấp #${r.supplierId}` },
          { title: 'Ngày đặt', dataIndex: 'orderDate', render: fmtDate },
          { title: 'Ngày giao dự kiến', dataIndex: 'expectedDeliveryDate', render: fmtDate },
          { title: 'Trạng thái', dataIndex: 'status', render: (s) => <StatusTag status={s} /> },
          { title: 'Ngày tạo', dataIndex: 'createdAt', render: fmtDateTime },
        ]}
      />
    </>
  );
}
