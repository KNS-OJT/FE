import type { ReactNode } from 'react';
import { Button, Flex, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';

export function PageHeader({ title, subtitle, extra, back, tags }: { title: ReactNode; subtitle?: ReactNode; extra?: ReactNode; back?: string; tags?: ReactNode }) {
  const nav = useNavigate();
  return (
    <Flex justify="space-between" align="flex-end" wrap gap={16} style={{ marginBottom: 20 }}>
      <Flex align="flex-start" gap={8}>
        {back && <Button type="text" shape="circle" icon={<ArrowLeftOutlined />} aria-label="Quay lại" onClick={() => nav(back)} style={{ marginTop: 2 }} />}
        <div>
          <Flex align="center" gap={10} wrap>
            <Typography.Title level={3} style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</Typography.Title>
            {tags}
          </Flex>
          {subtitle && <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4 }}>{subtitle}</Typography.Text>}
        </div>
      </Flex>
      {extra && <Flex gap={8} wrap>{extra}</Flex>}
    </Flex>
  );
}
