// ============================================================
// Login Page
// ============================================================
import { useState } from 'react'
import { Form, Input, Button, Card, Typography, message, Alert } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useAuthStore } from '@/auth/store'
import { authApi } from '@/api'

const { Title, Text, Paragraph } = Typography

interface LoginForm {
  username: string
  password: string
}

export function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const handleLogin = async (values: LoginForm) => {
    setLoading(true)
    setError(null)
    try {
      const result = await authApi.login(values)
      setAuth(result.token, result.user)
      message.success(`Xin chào, ${result.user.fullName}!`)
      navigate('/dashboard')
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } }
      setError(apiErr?.response?.data?.message ?? 'Sai tên đăng nhập hoặc mật khẩu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side – branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16"
        style={{ background: 'linear-gradient(135deg, #0958d9 0%, #1677ff 50%, #4096ff 100%)' }}
      >
        <div className="max-w-lg">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
              P3
            </div>
            <div>
              <Title level={3} className="!text-white !mb-0">Inventory & PR</Title>
              <Text className="!text-white/70 text-base">Management System</Text>
            </div>
          </div>
          <Title level={2} className="!text-white !mb-4">
            Quản lý tồn kho & đề nghị mua hàng
          </Title>
          <Paragraph className="!text-white/80 text-lg leading-relaxed">
            Hệ thống quản lý toàn diện: theo dõi sản phẩm, tồn kho, đề nghị mua hàng,
            đơn đặt hàng, nhập xuất kho với quy trình phê duyệt chặt chẽ.
          </Paragraph>
          <div className="grid grid-cols-2 gap-4 mt-10">
            {[
              { num: '4', label: 'Vai trò phân quyền' },
              { num: '18', label: 'Chức năng nghiệp vụ' },
              { num: '100%', label: 'Truy vết giao dịch' },
              { num: '24/7', label: 'Cảnh báo tồn thấp' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold text-white">{stat.num}</div>
                <div className="text-sm text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side – form */}
      <div className="flex-1 flex items-center justify-center px-8 bg-gray-50">
        <Card className="w-full max-w-md shadow-lg border-0" styles={{ body: { padding: 40 } }}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold lg:hidden"
              style={{ background: 'linear-gradient(135deg, #1677ff, #0958d9)' }}>
              P3
            </div>
            <Title level={3} className="!mb-1">Đăng nhập</Title>
            <Text type="secondary">Nhập thông tin tài khoản để tiếp tục</Text>
          </div>

          {error && (
            <Alert message={error} type="error" showIcon closable className="mb-6"
              onClose={() => setError(null)} />
          )}

          <Form<LoginForm>
            layout="vertical"
            onFinish={handleLogin}
            autoComplete="off"
            size="large"
            initialValues={{ username: 'admin', password: 'password' }}
          >
            <Form.Item
              name="username"
              label="Tên đăng nhập"
              rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="admin" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="••••••" />
            </Form.Item>

            <Form.Item className="!mb-4">
              <Button type="primary" htmlType="submit" block loading={loading}
                className="!h-11 !text-base !font-medium">
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <Text type="secondary" className="text-xs block mb-2 font-medium">
              Tài khoản demo:
            </Text>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {[
                { user: 'admin', role: 'Manager' },
                { user: 'warehouse1', role: 'Warehouse' },
                { user: 'purchasing1', role: 'Purchasing' },
                { user: 'requester1', role: 'Requester' },
              ].map((acc) => (
                <div key={acc.user} className="text-gray-600">
                  <span className="font-mono font-medium text-blue-600">{acc.user}</span>
                  <span className="text-gray-400 ml-1">({acc.role})</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

