import { Alert, Button, Result } from 'antd';
import { errMsg } from '@/lib/errors';

export function ErrorAlert({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <Alert
      type="error"
      showIcon
      style={{ marginBottom: 16 }}
      message={errMsg(error)}
      action={onRetry ? <Button size="small" onClick={onRetry}>Thử lại</Button> : undefined}
    />
  );
}

export function PendingApiBanner({ text }: { text: string }) {
  return <Alert type="warning" showIcon style={{ marginBottom: 16 }} message="Chức năng chờ Backend" description={text} />;
}

export function ForbiddenPage() {
  return <Result status="403" title="403" subTitle="Bạn không có quyền truy cập trang này." extra={<Button type="primary" href="/">Về Dashboard</Button>} />;
}
export function NotFoundPage() {
  return <Result status="404" title="404" subTitle="Trang không tồn tại." extra={<Button type="primary" href="/">Về Dashboard</Button>} />;
}
