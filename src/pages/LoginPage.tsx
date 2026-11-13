import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { Alert, Button, Form, Grid, Input, Modal, Typography } from 'antd';
import { login } from '@/api/auth';
import { useAuth } from '@/auth/useAuth';
import { env } from '@/config/env';
import { toApiError } from '@/lib/errors';
import { safeRedirect } from '@/lib/safeRedirect';
import { BrandMark } from '@/components/BrandMark';
import { ShelfIllustration } from '@/components/ShelfIllustration';
import { palette } from '@/theme';

export default function LoginPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const screens = Grid.useBreakpoint();
  const [form] = Form.useForm<{ username: string; password: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const to = safeRedirect((loc.state as { from?: unknown } | null)?.from);

  if (user) return <Navigate to={to} replace />;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#fff' }}>
      {screens.lg && (
        <aside style={{ flex: '1 1 55%', background: palette.ink, color: '#fff', padding: '40px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BrandMark size={30} />
            <span style={{ fontWeight: 700, fontSize: 17 }}>{env.appName}</span>
          </div>
          <div style={{ display: 'grid', placeItems: 'center', padding: '24px 0' }}>
            <ShelfIllustration />
          </div>
          <div style={{ maxWidth: 440 }}>
            <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.015em' }}>Mỗi thùng hàng đều có chứng từ đi kèm.</div>
            <p style={{ color: '#B9C9D6', margin: '12px 0 0', lineHeight: 1.6 }}>
              Đề nghị mua, đặt hàng, nhập xuất và tồn kho trong một quy trình thống nhất, có duyệt và có dấu vết.
            </p>
          </div>
        </aside>
      )}
      <main style={{ flex: '1 1 45%', display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          {!screens.lg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
              <BrandMark size={30} />
              <span style={{ fontWeight: 700, fontSize: 17 }}>{env.appName}</span>
            </div>
          )}
          <Typography.Title level={2} style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.015em' }}>Đăng nhập</Typography.Title>
          <Typography.Paragraph type="secondary" style={{ margin: '6px 0 28px' }}>Dùng tài khoản do Quản lý cấp cho bạn.</Typography.Paragraph>
          {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 20 }} />}
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            size="large"
            onFinish={async (v) => {
              setError(null);
              setLoading(true);
              try {
                await login(v.username, v.password);
                nav(to, { replace: true });
              } catch (e) {
                const err = toApiError(e);
                // Thông báo chung: không tiết lộ sai tên đăng nhập hay sai mật khẩu, tài khoản bị khóa cũng vậy.
                setError(err.status === 0 || err.status === 429 || err.status >= 500 ? err.message : 'Tên đăng nhập hoặc mật khẩu không đúng.');
                form.setFieldValue('password', '');
              } finally {
                setLoading(false);
              }
            }}
          >
            <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true, whitespace: true, message: 'Nhập tên đăng nhập' }, { max: 100 }]}>
              <Input autoComplete="username" autoFocus />
            </Form.Item>
            <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Nhập mật khẩu' }, { max: 72 }]}>
              <Input.Password autoComplete="current-password" />
            </Form.Item>
            <div style={{ textAlign: 'right', marginTop: -8 }}>
              <Button type="link" size="small" style={{ padding: 0 }} onClick={() => setForgotOpen(true)}>Quên mật khẩu?</Button>
            </div>
            <Button type="primary" htmlType="submit" block loading={loading} style={{ marginTop: 8, height: 46 }}>
              Đăng nhập
            </Button>
          </Form>
          {/* Không gọi API, không có ô nhập email: để không ai dò được tài khoản nào tồn tại. */}
          <Modal open={forgotOpen} title="Quên mật khẩu" onCancel={() => setForgotOpen(false)} footer={<Button type="primary" onClick={() => setForgotOpen(false)}>Đã hiểu</Button>}>
            <p style={{ margin: 0 }}>
              Hệ thống nội bộ không tự khôi phục mật khẩu qua email. Liên hệ Quản lý để được đặt lại mật khẩu, sau đó đổi mật khẩu ngay khi đăng nhập.
            </p>
          </Modal>
        </div>
      </main>
    </div>
  );
}
