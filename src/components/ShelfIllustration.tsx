import { palette } from '@/theme';

/** Kệ hàng với các thùng xếp chồng — hình nhận diện của màn đăng nhập (4 màu của bảng màu). */
export function ShelfIllustration() {
  const shelf = 'rgba(170,205,220,0.28)';
  return (
    <svg viewBox="0 0 420 320" width="100%" style={{ maxWidth: 420 }} role="img" aria-label="Kệ hàng với các thùng hàng nhiều màu">
      {/* khung kệ */}
      <rect x="20" y="20" width="6" height="290" rx="3" fill={shelf} />
      <rect x="394" y="20" width="6" height="290" rx="3" fill={shelf} />
      <rect x="20" y="148" width="380" height="8" rx="4" fill={shelf} />
      <rect x="20" y="296" width="380" height="8" rx="4" fill={shelf} />
      {/* tầng trên */}
      <rect x="44" y="64" width="96" height="84" rx="10" fill={palette.steel} />
      <rect x="150" y="96" width="70" height="52" rx="9" fill={palette.sand} />
      <rect x="230" y="40" width="74" height="108" rx="10" fill={palette.peri} />
      <rect x="314" y="104" width="62" height="44" rx="8" fill={palette.sky} />
      {/* tầng dưới */}
      <rect x="44" y="236" width="64" height="60" rx="9" fill={palette.sky} />
      <rect x="116" y="196" width="104" height="100" rx="10" fill={palette.sand} />
      <rect x="230" y="222" width="80" height="74" rx="10" fill={palette.steel} />
      <rect x="318" y="174" width="58" height="122" rx="10" fill={palette.peri} />
      {/* nhãn trên thùng */}
      <rect x="64" y="84" width="36" height="8" rx="4" fill="rgba(255,255,255,.55)" />
      <rect x="136" y="216" width="40" height="8" rx="4" fill="rgba(30,42,54,.18)" />
      <rect x="250" y="242" width="32" height="8" rx="4" fill="rgba(255,255,255,.55)" />
    </svg>
  );
}
