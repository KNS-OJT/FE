/**
 * Kiểm kê & điều chỉnh tồn (IN18) — UC-04
 * Warehouse Staff lập, Manager (khác người lập) duyệt.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { App, Button, Card, Descriptions, Flex, Form, Input, InputNumber, Popconfirm, Select, Space, Spin, Table } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adjustmentsApi, type AdjustmentInput, type AdjustmentItem, type AdjustmentUpdateInput, type StockAdjustment } from '@/api/stockAdjustments';
import { useProductMap, useStockMap } from '@/api/lookups';
import { ProductSelect } from '@/components/ProductSelect';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { ReasonModal } from '@/components/ReasonModal';
import { ErrorAlert } from '@/components/States';
import { StatusTag } from '@/components/StatusTag';
import { usePaging } from '@/components/usePaging';
import { useAuth } from '@/auth/useAuth';
import { errMsg } from '@/lib/errors';
import { fmtDateTime, fmtNum } from '@/lib/format';

const STATUS_OPTIONS = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'DRAFT', label: 'Nháp' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'CANCELED', label: 'Đã hủy' },
];

const TYPE_LABELS: Record<string, string> = {
    OPENING: 'Tồn đầu kỳ',
    STOCKTAKE: 'Kiểm kê',
    CORRECTION: 'Sửa sai',
};

/* ───────────────────────── LIST ───────────────────────── */

export function AdjustmentListPage() {
    const nav = useNavigate();
    const { can } = useAuth();
    const { page, size, pagination } = usePaging();
    const [status, setStatus] = useState('');
    const list = useQuery({
        queryKey: ['adjustments', { page, size, status }],
        queryFn: () => adjustmentsApi.list({ page, size, status: status || undefined }),
    });
    return (
        <>
            <PageHeader
                title="Kiểm kê & điều chỉnh tồn"
                subtitle="Phiếu điều chỉnh tồn kho"
                extra={can('gr:manage') && <Button type="primary" onClick={() => nav('/adjustments/new')}>+ Tạo phiếu điều chỉnh</Button>}
            />
            <div className="toolbar">
                <Select value={status} onChange={setStatus} options={STATUS_OPTIONS} style={{ width: 200 }} placeholder="Trạng thái" />
            </div>
            {list.error && <ErrorAlert error={list.error} onRetry={() => list.refetch()} />}
            <Table<StockAdjustment>
                className="table-shell"
                rowKey="id"
                loading={list.isLoading}
                dataSource={list.data?.items ?? []}
                pagination={pagination(list.data?.totalElements ?? 0)}
                onRow={(r) => ({ onClick: () => nav(`/adjustments/${r.id}`), style: { cursor: 'pointer' } })}
                locale={{
                    emptyText: (
                        <EmptyState
                            title="Chưa có phiếu điều chỉnh"
                            hint="Phiếu điều chỉnh dùng để cập nhật tồn đầu kỳ, kiểm kê hoặc sửa sai."
                            actionLabel={can('gr:manage') ? 'Tạo phiếu điều chỉnh' : undefined}
                            onAction={() => nav('/adjustments/new')}
                        />
                    ),
                }}
                columns={[
                    { title: 'Mã phiếu', dataIndex: 'code' },
                    { title: 'Loại', dataIndex: 'type', render: (v) => TYPE_LABELS[v] || v },
                    { title: 'Lý do', dataIndex: 'reason', ellipsis: true },
                    { title: 'Trạng thái', dataIndex: 'status', render: (s) => <StatusTag status={s} /> },
                    { title: 'Ngày tạo', dataIndex: 'createdAt', render: fmtDateTime },
                ]}
            />
        </>
    );
}

/* ───────────────────────── FORM ───────────────────────── */

type FormValues = {
    type: string;
    reason: string;
    items: { productId?: number; countedQuantity?: number; note?: string }[];
};

export function AdjustmentFormPage() {
    const { id } = useParams();
    const editId = id ? Number(id) : undefined;
    const nav = useNavigate();
    const qc = useQueryClient();
    const { message } = App.useApp();
    const [form] = Form.useForm<FormValues>();
    const items = Form.useWatch('items', form) ?? [];
    const stock = useStockMap();
    const existing = useQuery({ queryKey: ['adjustments', editId], queryFn: () => adjustmentsApi.get(editId!), enabled: !!editId });

    useEffect(() => {
        if (existing.data) {
            form.setFieldsValue({
                type: existing.data.type,
                reason: existing.data.reason,
                items: existing.data.items.map((i: AdjustmentItem) => ({ productId: i.productId, countedQuantity: i.countedQuantity, note: i.note })),
            });
        } else if (!editId) {
            form.setFieldsValue({ type: 'STOCKTAKE', reason: '', items: [{}] });
        }
    }, [existing.data, editId, form]);

    const save = useMutation({
        mutationFn: async (v: FormValues) => {
            const cleanItems = v.items.map((i) => ({
                productId: i.productId!,
                countedQuantity: i.countedQuantity!,
                note: i.note,
            }));
            if (editId) {
                const body: AdjustmentUpdateInput = { reason: v.reason, items: cleanItems };
                return adjustmentsApi.update(editId, body);
            }
            const body: AdjustmentInput = { type: v.type as AdjustmentInput['type'], reason: v.reason, items: cleanItems };
            return adjustmentsApi.create(body);
        },
        onSuccess: (r) => {
            message.success('Đã lưu phiếu điều chỉnh (Nháp)');
            qc.invalidateQueries({ queryKey: ['adjustments'] });
            nav(`/adjustments/${r.id || editId}`, { replace: true });
        },
        onError: (e) => message.error(errMsg(e)),
    });

    if (editId && existing.isLoading) return <Spin />;
    if (existing.error) return <ErrorAlert error={existing.error} />;
    if (existing.data && existing.data.status !== 'DRAFT') return <div>Chỉ sửa được phiếu ở trạng thái Nháp.</div>;
    const chosen = items.map((i) => i?.productId).filter((x): x is number => !!x);

    return (
        <>
            <PageHeader
                back={editId ? `/adjustments/${editId}` : '/adjustments'}
                title={editId ? `Sửa ${existing.data?.code || `SA #${editId}`}` : 'Tạo phiếu điều chỉnh'}
            />
            <Form form={form} layout="vertical" onFinish={(v) => save.mutate(v)}>
                <Card title="Thông tin" style={{ marginBottom: 16 }}>
                    <Flex gap={16} wrap>
                        <Form.Item name="type" label="Loại điều chỉnh" rules={[{ required: true, message: 'Chọn loại' }]} style={{ flex: '0 1 260px' }}>
                            <Select disabled={!!editId} options={[
                                { value: 'OPENING', label: 'Tồn đầu kỳ' },
                                { value: 'STOCKTAKE', label: 'Kiểm kê' },
                                { value: 'CORRECTION', label: 'Sửa sai' },
                            ]} />
                        </Form.Item>
                    </Flex>
                    <Form.Item name="reason" label="Lý do" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập lý do' }, { max: 4000 }]}>
                        <Input.TextArea rows={2} maxLength={4000} showCount />
                    </Form.Item>
                </Card>
                <Card title="Sản phẩm" style={{ marginBottom: 16 }}>
                    <Form.List name="items" rules={[{ validator: async (_, v) => { if (!v?.length) throw new Error('Phiếu phải có ít nhất một dòng'); } }]}>
                        {(fields, { add, remove }, { errors }) => (
                            <>
                                {fields.map((f, idx) => {
                                    const pid = items[f.name]?.productId;
                                    const sysQty = pid ? stock.data?.get(pid)?.quantity : undefined;
                                    return (
                                        <Flex key={f.key} gap={12} align="flex-start" wrap>
                                            <Form.Item name={[f.name, 'productId']} label={idx === 0 ? 'Sản phẩm' : undefined} style={{ flex: '2 1 320px' }} rules={[{ required: true, message: 'Chọn sản phẩm' }]}>
                                                <ProductSelect exclude={chosen} />
                                            </Form.Item>
                                            <Form.Item
                                                name={[f.name, 'countedQuantity']}
                                                label={idx === 0 ? 'SL đếm thực tế' : undefined}
                                                style={{ flex: '0 1 160px' }}
                                                rules={[{ required: true, message: 'Nhập số lượng' }, { type: 'number', min: 0, message: 'Phải ≥ 0' }]}
                                            >
                                                <InputNumber min={0} style={{ width: '100%' }} />
                                            </Form.Item>
                                            <div style={{ minWidth: 100, marginTop: idx === 0 ? 36 : 6, color: '#888' }}>
                                                Hệ thống: {sysQty !== undefined ? fmtNum(sysQty) : '—'}
                                            </div>
                                            <Form.Item name={[f.name, 'note']} label={idx === 0 ? 'Ghi chú' : undefined} style={{ flex: '1 1 200px' }} rules={[{ max: 4000 }]}>
                                                <Input placeholder="Ghi chú (tùy chọn)" />
                                            </Form.Item>
                                            <Button aria-label="Xóa dòng" icon={<DeleteOutlined />} danger type="text" style={{ marginTop: idx === 0 ? 30 : 0 }} onClick={() => remove(f.name)} />
                                        </Flex>
                                    );
                                })}
                                <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add({})}>Thêm dòng</Button>
                                <Form.ErrorList errors={errors} />
                            </>
                        )}
                    </Form.List>
                </Card>
                <Flex justify="flex-end">
                    <Space>
                        <Button onClick={() => nav('/adjustments')}>Hủy bỏ</Button>
                        <Button type="primary" htmlType="submit" loading={save.isPending}>Lưu nháp</Button>
                    </Space>
                </Flex>
            </Form>
        </>
    );
}

/* ───────────────────────── DETAIL ───────────────────────── */

export function AdjustmentDetailPage() {
    const id = Number(useParams().id);
    const nav = useNavigate();
    const qc = useQueryClient();
    const { message } = App.useApp();
    const { user, can } = useAuth();
    const products = useProductMap();
    const stock = useStockMap();
    const [cancelOpen, setCancelOpen] = useState(false);
    const q = useQuery({ queryKey: ['adjustments', id], queryFn: () => adjustmentsApi.get(id) });

    const refresh = () => {
        qc.invalidateQueries({ queryKey: ['adjustments'] });
        qc.invalidateQueries({ queryKey: ['stock'] });
        qc.invalidateQueries({ queryKey: ['lookup', 'stock'] });
    };

    const approve = useMutation({
        mutationFn: () => adjustmentsApi.approve(id),
        onSuccess: () => { message.success('Đã phê duyệt phiếu điều chỉnh'); refresh(); },
        onError: (e) => message.error(errMsg(e)),
    });

    if (q.isLoading) return <Spin />;
    if (q.error || !q.data) return <ErrorAlert error={q.error} onRetry={() => q.refetch()} />;
    const adj = q.data;
    const isCreator = adj.createdBy === user?.userId;
    const canApprove = can('adjustment:approve') && !isCreator && adj.status === 'DRAFT';

    return (
        <>
            <PageHeader
                back="/adjustments"
                title={adj.code || `SA #${adj.id}`}
                tags={<StatusTag status={adj.status} />}
                extra={[
                    adj.status === 'DRAFT' && isCreator && (
                        <Button key="edit" onClick={() => nav(`/adjustments/${id}/edit`)}>Sửa</Button>
                    ),
                    adj.status === 'DRAFT' && (
                        <Button key="cancel" danger onClick={() => setCancelOpen(true)}>Hủy phiếu</Button>
                    ),
                    canApprove && (
                        <Popconfirm
                            key="approve"
                            title="Phê duyệt phiếu điều chỉnh?"
                            description="Tồn kho sẽ được điều chỉnh về số lượng thực tế."
                            okText="Phê duyệt"
                            cancelText="Không"
                            onConfirm={() => approve.mutateAsync()}
                        >
                            <Button type="primary" loading={approve.isPending}>Phê duyệt</Button>
                        </Popconfirm>
                    ),
                ].filter(Boolean)}
            />
            <Card title="Thông tin" style={{ marginBottom: 16 }}>
                <Descriptions column={{ xs: 1, md: 2 }} items={[
                    { key: 't', label: 'Loại', children: TYPE_LABELS[adj.type] || adj.type },
                    { key: 'r', label: 'Lý do', children: adj.reason },
                    { key: 'ca', label: 'Ngày tạo', children: fmtDateTime(adj.createdAt) },
                    { key: 'cf', label: 'Ngày duyệt', children: fmtDateTime(adj.confirmedAt) },
                    { key: 'cr', label: 'Lý do hủy', children: adj.cancelReason || '—' },
                ]} />
            </Card>
            <Card title="Dòng hàng">
                <Table<AdjustmentItem>
                    rowKey="id"
                    dataSource={adj.items}
                    pagination={false}
                    columns={[
                        { title: 'SKU', key: 'sku', render: (_, r) => <span className="sku">{products.data?.get(r.productId)?.sku ?? `#${r.productId}`}</span> },
                        { title: 'Sản phẩm', key: 'name', render: (_, r) => products.data?.get(r.productId)?.name ?? '—' },
                        { title: 'SL đếm thực tế', dataIndex: 'countedQuantity', align: 'right', render: fmtNum },
                        { title: 'Tồn hệ thống', key: 'sys', align: 'right', render: (_, r) => fmtNum(stock.data?.get(r.productId)?.quantity) },
                        { title: 'Ghi chú', dataIndex: 'note', ellipsis: true },
                    ]}
                />
            </Card>
            <ReasonModal
                open={cancelOpen}
                title={`Hủy ${adj.code || `SA #${adj.id}`}`}
                okText="Xác nhận hủy"
                onCancel={() => setCancelOpen(false)}
                onSubmit={async (reason) => {
                    try {
                        await adjustmentsApi.cancel(id, reason);
                        message.success('Đã hủy phiếu điều chỉnh');
                        setCancelOpen(false);
                        refresh();
                    } catch (e) {
                        message.error(errMsg(e));
                    }
                }}
            />
        </>
    );
}
