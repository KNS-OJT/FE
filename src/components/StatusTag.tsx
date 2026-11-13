import { STATUS } from '@/constants/status';

const TONES = {
  neutral: { bg: '#EEF2F5', fg: '#4A5866', dot: '#8A97A3' },
  waiting: { bg: '#F3E3D0', fg: '#7A4E1D', dot: '#C08A4A' },
  ok: { bg: '#E2F1E8', fg: '#1D6B43', dot: '#2E9E62' },
  bad: { bg: '#FBE4E1', fg: '#A3271C', dot: '#D9534A' },
  sky: { bg: '#DCEBF2', fg: '#2E5E80', dot: '#5E8FB3' },
  peri: { bg: '#ECECFF', fg: '#4C4FC0', dot: '#8C8FF5' },
} as const;
export type Tone = keyof typeof TONES;

export function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const t = TONES[tone];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 10px', borderRadius: 999, background: t.bg, color: t.fg, fontSize: 12.5, fontWeight: 500, lineHeight: '20px', whiteSpace: 'nowrap' }}>
      <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 999, background: t.dot }} />
      {children}
    </span>
  );
}

export function StatusTag({ status }: { status: string }) {
  const m = STATUS[status];
  return <Pill tone={m?.tone ?? 'neutral'}>{m?.label ?? (status || '—')}</Pill>;
}
