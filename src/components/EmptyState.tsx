import { Button } from 'antd'
import { palette } from '@/theme'

/** Màn trống: nói rõ đang trống gì và mời hành động tiếp theo (nếu người dùng có quyền). */
export function EmptyState({
  title,
  hint,
  actionLabel,
  onAction,
}: {
  title: string
  hint?: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div
      style={{
        padding: '36px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        textAlign: 'center',
      }}
    >
      <svg
        width="56"
        height="44"
        viewBox="0 0 56 44"
        aria-hidden="true"
        style={{ marginBottom: 8 }}
      >
        <rect
          x="4"
          y="18"
          width="22"
          height="22"
          rx="5"
          fill="none"
          stroke={palette.steel}
          strokeWidth="2"
          strokeDasharray="4 3"
        />
        <rect
          x="30"
          y="18"
          width="22"
          height="22"
          rx="5"
          fill={palette.sky}
          opacity=".55"
        />
        <rect x="17" y="2" width="22" height="14" rx="4" fill={palette.sand} />
      </svg>
      <div style={{ fontWeight: 600, color: palette.ink }}>{title}</div>
      {hint && (
        <div style={{ color: palette.muted, maxWidth: 360 }}>{hint}</div>
      )}
      {actionLabel && onAction && (
        <Button type="primary" style={{ marginTop: 10 }} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
