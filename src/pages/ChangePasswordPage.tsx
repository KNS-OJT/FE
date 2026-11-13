import { Button, Card, Form, Input } from 'antd';
import { useAuth } from '@/auth/useAuth';
import { PageHeader } from '@/components/PageHeader';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';
import { PendingApiBanner } from '@/components/States';
import { validatePassword } from '@/lib/password';

type Values = { currentPassword: string; newPassword: string; confirmPassword: string };

/**
 * Đổi mật khẩu (mọi vai trò). BE chưa có API nên nút Lưu bị khóa: giao diện và luật kiểm tra đã sẵn sàng.
 * Khi BE có `POST /api/auth/change-password`, nối ở đây (body chỉ gồm mật khẩu hiện tại và mật khẩu mới).
 */
export default function ChangePasswordPage() {
  const { user } = useAuth();
  const [form] = Form.useForm<Values>();
  const watchedNew = Form.useWatch('newPassword', form);

  return (
    <>
      <PageHeader title="Đổi mật khẩu" subtitle="Đặt mật khẩu mới cho tài khoản của bạn." />
      <PendingApiBanner text="Chờ API POST /api/auth/change-password" />
      <Card style={{ maxWidth: 480 }}>
        <Form form={form} layout="vertical" autoComplete="off" requiredMark={false}>
          <Form.Item name="currentPassword" label="Mật khẩu hiện tại" rules={[{ required: true, message: 'Nhập mật khẩu hiện tại' }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            dependencies={['currentPassword']}
            rules={[
              { required: true, message: 'Nhập mật khẩu mới' },
              ({ getFieldValue }) => ({
                validator: (_, v: string | undefined) =>
                  v && v === getFieldValue('currentPassword') ? Promise.reject(new Error('Mật khẩu mới phải khác mật khẩu hiện tại')) : validatePassword(v, user?.username),
              }),
            ]}
            extra={<PasswordStrengthMeter value={watchedNew} />}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Nhập lại mật khẩu mới"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Nhập lại mật khẩu mới' },
              ({ getFieldValue }) => ({
                validator: (_, v: string | undefined) => (!v || v === getFieldValue('newPassword') ? Promise.resolve() : Promise.reject(new Error('Mật khẩu nhập lại không khớp'))),
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" disabled title="Backend chưa có API">Lưu mật khẩu</Button>
        </Form>
      </Card>
    </>
  );
}
