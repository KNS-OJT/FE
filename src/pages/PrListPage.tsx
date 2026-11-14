import { useState } from 'react';
import { palette } from '@/theme';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router';
import { Button, Flex, Input, Select, Table, Tabs } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { prApi, type PurchaseRequest } from '@/api/pr';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { ErrorAlert } from '@/components/States';
import { StatusTag } from '@/components/StatusTag';
import { usePaging } from '@/components/usePaging';
import { useDebounced } from '@/components/useDebounced';
import { useAuth } from '@/auth/useAuth';
import { PR_STATUSES, STATUS } from '@/constants/status';
import { fmtDateTime } from '@/lib/format';

export default function PrListPage() {
  const nav = useNavigate();
  const { user, can } = useAuth();
  const isManager = user?.role === 'MANAGER';
  const [sp, setSp] = useSearchParams();
  const [status, setStatus] = useState<string | undefined>(sp.get('status') ?? undefined);
  const [q, setQ] = useState('');
  const dq = useDebounced(q.trim());
  const { page, size, setPage, pagination } = usePaging();
  const tab = isManager && status === 'SUBMITTED' ? 'pending' : 'all';

  const list = useQuery({
    queryKey: ['pr', { status, dq, page, size }],
    queryFn: () => prApi.list({ status, q: dq || undefined, page, size }),
  });
  const changeStatus = (s?: string) => {
    setStatus(s);
    setPage(0);
    setSp(s ? { status: s } : {}, { replace: true });
  };

  return (
    <>
      <PageHeader
        title="Đề nghị mua hàng (PR)"
        subtitle={user?.role === 'REQUESTER' ? 'Bạn chỉ thấy PR do mình tạo' : undefined}
        extra={can('pr:create') && <Button type="primary" onClick={() => nav('/pr/new')}>+ Tạo PR</Button>}
      />
      {isManager && (
        <Tabs activeKey={tab} onChange={(k) => changeStatus(k === 'pending' ? 'SUBMITTED' : undefined)}
          items={[{ key: 'pending', label: 'Chờ tôi duyệt' }, { key: 'all', label: 'Tất cả' }]} />
      )}
      <div className="toolbar">
        <Flex gap={12} wrap>
          <Input allowClear prefix={<SearchOutlined style={{ color: palette.muted }} />} placeholder="Tìm theo mã PR, lý do" style={{ width: 280 }} value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
          {tab !== 'pending' && (
            <Select allowClear placeholder="Trạng thái" style={{ width: 180 }} value={status} onChange={changeStatus}
              options={PR_STATUSES.map((s) => ({ value: s, label: STATUS[s]?.label }))} />
          )}
        </Flex>
      </div>
      {list.error && <ErrorAlert error={list.error} onRetry={() => list.refetch()} />}
      <Table<PurchaseRequest>
        className="table-shell"
        rowKey="id"
        loading={list.isLoading}
        dataSource={list.data?.items ?? []}
        pagination={pagination(list.data?.totalElements ?? 0)}
        scroll={{ x: 900 }}
        onRow={(r) => ({ onClick: () => nav(`/pr/${r.id}`), style: { cursor: 'pointer' } })}
        locale={{
          emptyText:
            dq || (status && tab !== 'pending') ? (
              <EmptyState title="Không có kết quả phù hợp" hint="Thử từ khóa khác hoặc bỏ bộ lọc trạng thái." />
            ) : tab === 'pending' ? (
              <EmptyState title="Không có đề nghị nào chờ bạn duyệt" hint="Đề nghị mua được gửi sẽ xuất hiện ở đây." />
            ) : (
              <EmptyState title="Chưa có đề nghị mua" hint="Đề nghị mua được tạo sẽ hiện ở đây." actionLabel={can('pr:create') ? 'Tạo đề nghị mua' : undefined} onAction={() => nav('/pr/new')} />
            ),
        }}
        columns={[
          { title: 'Mã PR', dataIndex: 'code', render: (v, r) => <a href={`/pr/${r.id}`} onClick={(e) => e.preventDefault()}>{v || `PR #${r.id}`}</a> },
          { title: 'Người yêu cầu', dataIndex: 'requesterName', render: (v, r) => v || `#${r.requesterId}` },
          { title: 'Lý do', dataIndex: 'reason', ellipsis: true },
          { title: 'Trạng thái', dataIndex: 'status', width: 130, render: (s) => <StatusTag status={s} /> },
          { title: 'Ngày tạo', dataIndex: 'createdAt', width: 150, render: fmtDateTime },
          { title: 'Ngày gửi', dataIndex: 'submittedAt', width: 150, render: fmtDateTime },
        ]}
      />
    </>
  );
}
