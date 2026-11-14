import { useState } from 'react';
import { MoreOutlined, SearchOutlined } from '@ant-design/icons';
import { Pill } from '@/components/StatusTag';
import { palette } from '@/theme';
import { applyFieldErrors, validated } from '@/lib/validate';
import { App, Button, Dropdown, Flex, Form, Input, InputNumber, Modal, Select, Switch, Table } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi, type Product, type ProductCreate } from '@/api/products';
import { categoriesApi } from '@/api/categories';
import { useStockMap } from '@/api/lookups';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { ErrorAlert } from '@/components/States';
import { usePaging } from '@/components/usePaging';
import { useDebounced } from '@/components/useDebounced';
import { useAuth } from '@/auth/useAuth';
import { errMsg, toApiError } from '@/lib/errors';
import { fmtDateTime, fmtNum } from '@/lib/format';

const SKU_RULE = /^[A-Z0-9._-]{1,50}$/;

export default function ProductsPage() {
  const { can } = useAuth();
  const canManage = can('product:manage');
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState<number>();
  const [activeOnly, setActiveOnly] = useState(true);
  const dq = useDebounced(q.trim());
  const { page, size, setPage, pagination } = usePaging();

  const list = useQuery({
    queryKey: ['products', { dq, categoryId, activeOnly, page, size }],
    queryFn: () => productsApi.list({ q: dq || undefined, categoryId, activeOnly: canManage ? activeOnly : true, page, size }),
  });
  const cats = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list });
  const stock = useStockMap(can('stock:minimum'));

  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [minFor, setMinFor] = useState<Product | null>(null);
  const [form] = Form.useForm<ProductCreate & { active: boolean }>();
  const [minForm] = Form.useForm<{ minimumStock: number }>();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['products'] });
    qc.invalidateQueries({ queryKey: ['lookup'] });
    qc.invalidateQueries({ queryKey: ['stock'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };
  const save = useMutation({
    mutationFn: (v: ProductCreate & { active: boolean }) =>
      editing && editing !== 'new' ? productsApi.update(editing.id, v) : productsApi.create(v),
    onSuccess: () => {
      message.success('Đã lưu sản phẩm');
      setEditing(null);
      invalidate();
    },
    onError: (e) => {
      const err = toApiError(e);
      if (applyFieldErrors(form, err)) return;
      if (err.status === 409) form.setFields([{ name: 'sku', errors: [err.code ? err.message : 'SKU đã tồn tại (kể cả sản phẩm đã ngừng kinh doanh).'] }]);
      else message.error(err.message);
    },
  });
  const toggle = useMutation({
    mutationFn: (p: Product) => productsApi.update(p.id, { sku: p.sku, name: p.name, categoryId: p.categoryId, unit: p.unit, active: !p.active }),
    onSuccess: invalidate,
    onError: (e) => message.error(errMsg(e)),
  });
  const setMin = useMutation({
    mutationFn: (v: { id: number; minimumStock: number }) => productsApi.setMinStock(v.id, v.minimumStock),
    onSuccess: () => {
      message.success('Đã cập nhật ngưỡng tồn tối thiểu');
      setMinFor(null);
      invalidate();
    },
    onError: (e) => message.error(errMsg(e)),
  });

  const openForm = (p: Product | 'new') => {
    setEditing(p);
    form.setFieldsValue(p === 'new' ? { sku: '', name: '', unit: '', categoryId: undefined, active: true } : { sku: p.sku, name: p.name, unit: p.unit, categoryId: p.categoryId, active: p.active });
  };

  return (
    <>
      <PageHeader title="Sản phẩm" extra={canManage && <Button type="primary" onClick={() => openForm('new')}>+ Thêm sản phẩm</Button>} />
      <div className="toolbar">
        <Flex gap={12} wrap align="center">
          <Input allowClear prefix={<SearchOutlined style={{ color: palette.muted }} />} placeholder="Tìm theo SKU hoặc tên" style={{ width: 280 }} value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
          <Select
            allowClear
            placeholder="Nhóm hàng"
            style={{ width: 220 }}
            value={categoryId}
            onChange={(v) => { setCategoryId(v); setPage(0); }}
            options={(cats.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
          />
          {canManage && (
            <Flex align="center" gap={8}>
              <Switch checked={activeOnly} onChange={(v) => { setActiveOnly(v); setPage(0); }} aria-label="Chỉ sản phẩm đang hoạt động" />
              <span>Chỉ sản phẩm đang hoạt động</span>
            </Flex>
          )}
        </Flex>
      </div>
      {list.error && <ErrorAlert error={list.error} onRetry={() => list.refetch()} />}
      <Table<Product>
        className="table-shell"
        rowKey="id"
        loading={list.isLoading}
        dataSource={list.data?.items ?? []}
        pagination={pagination(list.data?.totalElements ?? 0)}
        scroll={{ x: 1000 }}
        locale={{
          emptyText:
            dq || categoryId ? (
              <EmptyState title="Không có sản phẩm phù hợp" hint="Thử SKU hoặc tên khác, hoặc bỏ lọc nhóm hàng." />
            ) : (
              <EmptyState title="Chưa có sản phẩm" hint="Sản phẩm mới bắt đầu với tồn kho bằng 0." actionLabel={canManage ? 'Thêm sản phẩm' : undefined} onAction={() => openForm('new')} />
            ),
        }}
        columns={[
          { title: 'SKU', dataIndex: 'sku', width: 170, render: (v) => <span className="sku">{v}</span> },
          { title: 'Tên sản phẩm', dataIndex: 'name' },
          { title: 'Nhóm hàng', dataIndex: 'categoryName', render: (v, p) => v || cats.data?.find((c) => c.id === p.categoryId)?.name || '—' },
          { title: 'Đơn vị', dataIndex: 'unit', width: 90 },
          ...(can('stock:minimum')
            ? [{ title: 'Tồn / Tối thiểu', key: 'stk', align: 'right' as const, width: 150, render: (_: unknown, p: Product) => {
                const s = stock.data?.get(p.id);
                return s ? <span style={{ color: s.quantity < s.minimumStock ? palette.danger : undefined }}>{fmtNum(s.quantity)} / {fmtNum(s.minimumStock)}</span> : '—';
              } }]
            : []),
          { title: 'Trạng thái', dataIndex: 'active', width: 150, render: (a) => (a ? <Pill tone="ok">Đang hoạt động</Pill> : <Pill tone="neutral">Ngừng kinh doanh</Pill>) },
          { title: 'Ngày tạo', dataIndex: 'createdAt', width: 150, render: fmtDateTime },
          ...(canManage
            ? [{
                title: '', key: 'act', width: 140, fixed: 'right' as const, align: 'right' as const,
                render: (_: unknown, p: Product) => (
                  <Flex gap={4} justify="flex-end">
                    <Button size="small" onClick={() => openForm(p)}>Sửa</Button>
                    <Dropdown
                      trigger={['click']}
                      menu={{
                        items: [
                          { key: 'min', label: 'Đặt ngưỡng tồn tối thiểu' },
                          { key: 'toggle', label: p.active ? 'Ngừng kinh doanh' : 'Kinh doanh lại', danger: p.active },
                        ],
                        onClick: ({ key }) => {
                          if (key === 'min') { setMinFor(p); minForm.setFieldsValue({ minimumStock: stock.data?.get(p.id)?.minimumStock ?? 0 }); }
                          else toggle.mutate(p);
                        },
                      }}
                    >
                      <Button size="small" icon={<MoreOutlined />} aria-label={`Thao tác khác cho ${p.sku}`} loading={toggle.isPending && toggle.variables?.id === p.id} />
                    </Dropdown>
                  </Flex>
                ),
              }]
            : []),
        ]}
      />

      <Modal
        open={editing !== null}
        title={editing === 'new' ? 'Thêm sản phẩm' : 'Sửa sản phẩm'}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={save.isPending}
        onCancel={() => setEditing(null)}
        onOk={async () => { const v = await validated(form); if (v) save.mutate(v); }}
        forceRender
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="sku"
            label="SKU"
            extra="Chữ in hoa, số và . _ - ; tối đa 50 ký tự. SKU đã dùng trong chứng từ không đổi được."
            normalize={(v: string) => v?.toUpperCase()}
            rules={[{ required: true, message: 'Vui lòng nhập SKU' }, { pattern: SKU_RULE, message: 'SKU chỉ gồm chữ in hoa, số và . _ - (tối đa 50 ký tự)' }]}
          >
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên' }, { max: 200 }]}>
            <Input />
          </Form.Item>
          <Flex gap={16}>
            <Form.Item name="unit" label="Đơn vị tính" style={{ flex: 1 }} rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập đơn vị' }, { max: 30 }]}>
              <Input />
            </Form.Item>
            <Form.Item name="categoryId" label="Nhóm hàng" style={{ flex: 1 }} rules={[{ required: true, message: 'Vui lòng chọn nhóm' }]}>
              <Select options={(cats.data ?? []).filter((c) => c.active).map((c) => ({ value: c.id, label: c.name }))} />
            </Form.Item>
          </Flex>
          {editing !== 'new' && (
            <Form.Item name="active" label="Đang kinh doanh" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        open={!!minFor}
        title={`Ngưỡng tồn tối thiểu · ${minFor?.sku ?? ''}`}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={setMin.isPending}
        onCancel={() => setMinFor(null)}
        onOk={async () => {
          const v = await validated(minForm);
          if (v && minFor) setMin.mutate({ id: minFor.id, minimumStock: v.minimumStock });
        }}
        forceRender
      >
        <Form form={minForm} layout="vertical">
          <Form.Item name="minimumStock" label="Tồn tối thiểu" rules={[{ required: true, message: 'Vui lòng nhập' }, { type: 'number', min: 0, message: 'Phải từ 0 trở lên' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
