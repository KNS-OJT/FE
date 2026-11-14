import { useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { Alert, Button, Form, Grid, Input, Modal, Typography, type InputRef } from 'antd';
import { login } from '@/api/auth';
import { useAuth } from '@/auth/useAuth';
import { ROLE_LABELS, isRole } from '@/auth/roles';
import { env } from '@/config/env';
import { toApiError } from '@/lib/errors';
import { safeRedirect } from '@/lib/safeRedirect';
import { BrandMark } from '@/components/BrandMark';
import { ShelfIllustration } from '@/components/ShelfIllustration';
import { palette } from '@/theme';

/** Quy trình thật của P03 (SRS P1–P3) — là một chuỗi nên mới đánh số. Mỗi bước mang một màu của bảng màu. */
const FLOW = [
  {
    title: 'Đề nghị mua',
    desc: 'Nhân viên lập và gửi PR',
    color: palette.steel,
    ink: palette.ink,
  },
  {
    title: 'Phê duyệt',
    desc: 'Quản lý khác người lập duyệt',
    color: palette.peri,
    ink: palette.ink,
  },
  {
    title: 'Đặt hàng',
    desc: 'Mua hàng lập PO từ PR đã duyệt',
    color: palette.sky,
    ink: palette.ink,
  },
  {
    title: 'Nhập & xuất kho',
    desc: 'Kho xác nhận, sổ kho ghi lại',
    color: palette.sand,
    ink: palette.ink,
  },
];

export default function LoginPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const screens = Grid.useBreakpoint();
  const [form] = Form.useForm<{ username: string; password: string }>();
  const passwordRef = useRef<InputRef>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const to = safeRedirect((loc.state as { from?: unknown } | null)?.from);

  if (user) return <Navigate to={to} replace />;

  const brand = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <BrandMark size={30} />
      <span style={{ fontWeight: 700, fontSize: 17 }}>{env.appName}</span>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#fff' }}>
      {screens.lg && (
        <aside
          style={{
            flex: '1 1 54%',
            background: palette.ink,
            color: '#fff',
            padding: '40px 56px 44px',
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
          }}
        >
          {brand}
          <div
            style={{
              flex: 1,
              display: 'grid',
              placeItems: 'center',
              minHeight: 260,
            }}
          >
            <ShelfIllustration />
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 32,
                fontWeight: 700,
                lineHeight: 1.22,
                letterSpacing: '-0.02em',
                maxWidth: 480,
              }}
            >
              Mỗi thùng hàng đều có chứng từ đi kèm.
            </h1>
            <ol
              style={{
                listStyle: 'none',
                padding: 0,
                margin: '26px 0 0',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: 10,
              }}
            >
              {FLOW.map((s, i) => (
                <li
                  key={s.title}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: 12,
                    padding: '14px 14px 16px',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'inline-grid',
                      placeItems: 'center',
                      width: 26,
                      height: 26,
                      borderRadius: 7,
                      background: s.color,
                      color: s.ink,
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    {i + 1}
                  </span>
                  <div style={{ marginTop: 10, fontWeight: 600, fontSize: 14 }}>{s.title}</div>
                  <div
                    style={{
                      marginTop: 2,
                      color: '#AFC0CE',
                      fontSize: 12.5,
                      lineHeight: 1.45,
                    }}
                  >
                    {s.desc}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      )}

      <main
        style={{
          flex: '1 1 46%',
          display: 'grid',
          placeItems: 'center',
          padding: '32px 24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 380 }}>
          {!screens.lg && <div style={{ marginBottom: 36 }}>{brand}</div>}
          <Typography.Title
            level={2}
            style={{
              margin: 0,
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            Đăng nhập
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ margin: '6px 0 28px' }}>
            Dùng tài khoản do Quản lý cấp cho bạn.
          </Typography.Paragraph>

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
                // Thông báo chung: không cho biết sai tên đăng nhập hay sai mật khẩu, tài khoản bị khóa cũng vậy.
                setError(err.status === 0 || err.status === 429 || err.status >= 500 ? err.message : 'Tên đăng nhập hoặc mật khẩu không đúng.');
                form.setFieldValue('password', '');
              } finally {
                setLoading(false);
              }
            }}
          >
            <Form.Item
              name="username"
              label="Tên đăng nhập"
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: 'Nhập tên đăng nhập',
                },
                { max: 100 },
              ]}
            >
              <Input autoComplete="username" autoFocus />
            </Form.Item>
            <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Nhập mật khẩu' }, { max: 72 }]} style={{ marginBottom: 8 }}>
              <Input.Password ref={passwordRef} autoComplete="current-password" />
            </Form.Item>
            <div style={{ textAlign: 'right', marginBottom: 20 }}>
              <Button type="link" style={{ padding: 0, height: 'auto' }} onClick={() => setForgotOpen(true)}>
                Quên mật khẩu?
              </Button>
            </div>
            <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 48, fontSize: 15 }}>
              Đăng nhập
            </Button>
          </Form>

          {/* import.meta.env.DEV là hằng lúc build → cả khối bị loại khỏi bản production, không chỉ bị ẩn. */}
          {import.meta.env.DEV && env.demoUsers.length > 0 && (
            <section
              aria-label="Tài khoản demo"
              style={{
                marginTop: 28,
                padding: 16,
                borderRadius: 12,
                background: palette.bg,
                border: `1px dashed ${palette.steel}`,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>Tài khoản demo</div>
              <div
                style={{
                  color: palette.muted,
                  fontSize: 12.5,
                  marginBottom: 10,
                }}
              >
                Chỉ hiện khi chạy dev. Bấm để điền tên đăng nhập, mật khẩu vẫn tự nhập.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {env.demoUsers.map((u) => (
                  <button
                    key={u.username}
                    type="button"
                    className="plain-btn demo-chip"
                    onClick={() => {
                      form.setFieldsValue({
                        username: u.username,
                        password: '',
                      });
                      passwordRef.current?.focus();
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{u.username}</span>
                    {isRole(u.role) && <span style={{ color: palette.muted }}>{ROLE_LABELS[u.role]}</span>}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Không gọi API, không có ô nhập email: để không ai dò được tài khoản nào tồn tại. */}
      <Modal
        open={forgotOpen}
        title="Quên mật khẩu?"
        onCancel={() => setForgotOpen(false)}
        footer={
          <Button type="primary" onClick={() => setForgotOpen(false)}>
            Đã hiểu
          </Button>
        }
      >
        <p style={{ marginTop: 8, lineHeight: 1.6 }}>Hệ thống nội bộ không tự khôi phục mật khẩu qua email. Liên hệ Quản lý để được đặt lại mật khẩu, sau đó đổi mật khẩu ngay khi đăng nhập.</p>
      </Modal>
    </div>
  );
}
