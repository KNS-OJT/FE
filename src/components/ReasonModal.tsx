import { useState } from 'react';
import { validated } from '@/lib/validate';
import { Form, Input, Modal } from 'antd';

/** Hộp nhập lý do bắt buộc (từ chối PR – BR-10, hủy chứng từ – BR-16). */
export function ReasonModal({ open, title, okText = 'Xác nhận', danger = true, onCancel, onSubmit }: {
  open: boolean;
  title: string;
  okText?: string;
  danger?: boolean;
  onCancel: () => void;
  onSubmit: (reason: string) => Promise<unknown>;
}) {
  const [form] = Form.useForm<{ reason: string }>();
  const [loading, setLoading] = useState(false);
  return (
    <Modal
      open={open}
      title={title}
      okText={okText}
      cancelText="Hủy"
      okButtonProps={{ danger, loading }}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      destroyOnHidden
      onOk={async () => {
        const v = await validated(form);
        if (!v) return;
        const { reason } = v;
        setLoading(true);
        try {
          await onSubmit(reason.trim());
          form.resetFields();
        } finally {
          setLoading(false);
        }
      }}
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item name="reason" label="Lý do" rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập lý do' }, { max: 500 }]}>
          <Input.TextArea rows={4} maxLength={500} showCount autoFocus />
        </Form.Item>
      </Form>
    </Modal>
  );
}
