import { theme as appTheme, palette } from '@/theme';
import { STRENGTH_LABELS, passwordStrength } from '@/lib/password';

// Màu lấy từ src/theme.ts: Yếu = danger, Trung bình = warning, Khá = primary, Mạnh = success.
// (Khá dùng primary thay vì steel vì chữ steel trên nền trắng không đạt tương phản AA.)
const LEVEL_COLORS = [palette.danger, String(appTheme.token?.colorWarning), palette.primary, palette.success];

/** Thanh độ mạnh 4 nấc. Chỉ để hiển thị; luật bắt buộc nằm ở `passwordProblems`. */
export function PasswordStrengthMeter({ value }: { value?: string }) {
  if (!value) return null;
  const level = passwordStrength(value);
  return (
    <div role="status" aria-live="polite" style={{ marginTop: 6 }}>
      <div aria-hidden="true" style={{ display: 'flex', gap: 4 }}>
        {STRENGTH_LABELS.map((label, i) => (
          <span key={label} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= level ? LEVEL_COLORS[level] : palette.line }} />
        ))}
      </div>
      <span style={{ display: 'block', marginTop: 4, fontSize: 12.5, color: palette.muted }}>
        Độ mạnh: <strong style={{ color: LEVEL_COLORS[level] }}>{STRENGTH_LABELS[level]}</strong>
      </span>
    </div>
  );
}
