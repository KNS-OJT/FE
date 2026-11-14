import { palette } from '@/theme';

/** Dấu hiệu nhận diện: các thùng hàng xếp chồng, 4 màu của bảng màu. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <rect x="2" y="15" width="11" height="11" rx="2.5" fill={palette.steel} />
      <rect x="15" y="15" width="11" height="11" rx="2.5" fill={palette.sky} />
      <rect x="8.5" y="2" width="11" height="11" rx="2.5" fill={palette.peri} />
      <rect x="21" y="7" width="5" height="6" rx="1.5" fill={palette.sand} />
    </svg>
  );
}
