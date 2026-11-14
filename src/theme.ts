import type { ThemeConfig } from 'antd';

/**
 * Bảng màu P03. 4 màu gốc do nhóm chọn + các sắc độ đậm/nhạt suy ra để chữ đạt tương phản WCAG AA.
 * - steel  #81A6C6 → primary đậm #3D6B91 (nút, link: 5.7:1 với chữ trắng)
 * - sky    #AACDDC → nền app #EEF3F6, sidebar #E4EEF3, nhãn "Đã đặt hàng"
 * - sand   #F3E3D0 → chỉ dùng cho thứ đang CHỜ XỬ LÝ (nhãn Đã gửi, dòng tồn thấp)
 * - peri   #9FA1FF → điểm nhấn: focus ring, huy hiệu đếm, nhãn "Nhận một phần"
 */
export const palette = {
  steel: '#81A6C6',
  sky: '#AACDDC',
  sand: '#F3E3D0',
  peri: '#9FA1FF',
  primary: '#3D6B91',
  primaryHover: '#335C7E',
  ink: '#1E2A36',
  muted: '#5B6B7A',
  bg: '#EEF3F6',
  sidebar: '#E4EEF3',
  line: '#DCE5EB',
  lineSoft: '#E8EEF2',
  sandSoft: '#FBF3EA',
  success: '#1D7A4A',
  danger: '#B42318',
} as const;

export const theme: ThemeConfig = {
  token: {
    colorPrimary: palette.primary,
    colorInfo: palette.primary,
    colorLink: palette.primary,
    colorSuccess: palette.success,
    colorWarning: '#B26B12',
    colorError: palette.danger,
    colorText: palette.ink,
    colorTextSecondary: palette.muted,
    colorTextTertiary: '#6B7A88',
    colorBgLayout: palette.bg,
    colorBorder: '#CFDAE2',
    colorBorderSecondary: palette.lineSoft,
    fontFamily: "'Be Vietnam Pro', system-ui, -apple-system, 'Segoe UI', sans-serif",
    fontSize: 14,
    borderRadius: 8,
    borderRadiusLG: 12,
    controlHeight: 38,
    boxShadow: '0 8px 24px rgba(30, 42, 54, 0.10)',
    boxShadowSecondary: '0 8px 24px rgba(30, 42, 54, 0.10)',
  },
  components: {
    Layout: { siderBg: palette.sidebar, headerBg: '#ffffff', bodyBg: palette.bg, headerHeight: 60, headerPadding: '0 28px' },
    Menu: {
      itemBg: 'transparent',
      subMenuItemBg: 'transparent',
      itemColor: '#33475A',
      itemHoverBg: 'rgba(255,255,255,0.55)',
      itemHoverColor: palette.ink,
      itemSelectedBg: '#ffffff',
      itemSelectedColor: palette.primary,
      itemActiveBg: '#ffffff',
      groupTitleColor: '#6B7A88',
      groupTitleFontSize: 12,
      itemHeight: 38,
      itemMarginInline: 12,
      itemBorderRadius: 8,
      iconSize: 16,
    },
    Table: { headerBg: '#F5F8FA', headerColor: palette.muted, headerSplitColor: 'transparent', rowHoverBg: '#F6F9FB', borderColor: palette.lineSoft, cellPaddingBlock: 13 },
    Card: { headerFontSize: 15, paddingLG: 20 },
    Button: { fontWeight: 500, primaryShadow: 'none', defaultShadow: 'none', dangerShadow: 'none' },
    Tabs: { itemSelectedColor: palette.primary, inkBarColor: palette.primary, titleFontSize: 14 },
    Modal: { titleFontSize: 17 },
    Descriptions: { labelColor: palette.muted },
  },
};
