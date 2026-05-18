/**
 * e-evkin Design System — "Health Government Blue"
 *
 * Centralized theme tokens for Ant Design v5 ConfigProvider.
 * All colors, spacing, border-radius, shadows, and transitions
 * are defined here so components stay consistent.
 */
import type { ThemeConfig } from 'antd';

// ── Brand palette ──────────────────────────────────────────
export const brand = {
  primary:     '#0E6BA8',   // Teal-blue — trustworthy, health-sector
  primaryLight:'#3D8DC5',
  primaryDark: '#094D7A',
  accent:      '#0891B2',   // Cyan accent for highlights

  success:     '#2E8B57',   // Sea green — calmer than default
  successLight:'#D4EDDA',
  warning:     '#E8961E',   // Warm amber
  warningLight:'#FFF3CD',
  error:       '#CF1322',   // Classic error red
  errorLight:  '#FFF1F0',

  // Semantic grays (Ant Design neutral palette)
  textPrimary:   '#1F2937',  // Near-black for headings
  textSecondary: '#6B7280',  // Mid-gray for labels
  textTertiary:  '#9CA3AF',  // Light gray for captions
  border:        '#E5E7EB',  // Subtle borders
  borderLight:   '#F3F4F6',  // Very subtle dividers
  bgLayout:      '#F9FAFB',  // Page background
  bgCard:        '#FFFFFF',  // Card surfaces
  bgElevated:    '#FFFFFF',  // Modals, popovers

  // Status-specific (for Tags — avoid overloading orange)
  statusTerkirim:   '#2E8B57',
  statusTersimpan:  '#0E6BA8',
  statusDitolak:    '#CF1322',
  statusMenunggu:   '#E8961E',
  statusVerified:   '#15803D',

  // Chart series colors
  chartAngkas:       '#7C3AED',   // Purple for anggaran kas
  chartRealisasi:    '#E8961E',   // Orange for realisasi fisik

  // Sumber anggaran tag colors
  tagBOK:  '#0E6BA8',
  tagPAD:  '#7C3AED',
  tagBLUD: '#D97706',
  tagJKN:  '#0891B2',
} as const;

// ── Layout constants ───────────────────────────────────────
export const layout = {
  siderWidth:          252,
  siderCollapsedWidth: 72,
  headerHeight:        64,
  contentPadding:      24,
  contentPaddingMobile:16,
  borderRadius:        6,
  borderRadiusSm:      4,
  borderRadiusLg:      8,
} as const;

// ── Breakpoints (single source of truth) ───────────────────
export const breakpoints = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  mobile: 768,   // Use this as THE mobile breakpoint everywhere
} as const;

// ── Shadows ────────────────────────────────────────────────
export const shadows = {
  sm:   '0 1px 2px rgba(0, 0, 0, 0.05)',
  md:   '0 2px 8px rgba(0, 0, 0, 0.08)',
  lg:   '0 4px 16px rgba(0, 0, 0, 0.10)',
  card: '0 1px 3px rgba(0, 0, 0, 0.06)',
  header: '0 1px 4px rgba(0, 0, 0, 0.06)',
  actionBar: '0 -2px 8px rgba(0, 0, 0, 0.05)',
} as const;

// ── Motion (consistent transition durations) ───────────────
export const motion = {
  fast:   '0.15s',
  normal: '0.25s',
  slow:   '0.4s',
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// ── Modal width constants ──────────────────────────────────
export const modalWidths = {
  sm:   480,
  md:   640,
  lg:   900,
  xl:   1100,
} as const;

// ── Pagination defaults ────────────────────────────────────
export const paginationDefaults = {
  pageSize: 10,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50'],
  showTotal: (total: number) => `Total ${total} data`,
} as const;

// ── Gradient helpers ───────────────────────────────────────
export const gradients = {
  primary:  `linear-gradient(135deg, ${brand.primary} 0%, ${brand.primaryDark} 100%)`,
  header:   `linear-gradient(135deg, ${brand.primary} 0%, #0C5C91 100%)`,
  login:    `linear-gradient(135deg, ${brand.primary} 0%, ${brand.primaryDark} 100%)`,
  progress: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.primaryDark} 100%)`,
  success:  `linear-gradient(90deg, ${brand.success} 0%, #3BA06B 100%)`,
} as const;

// ── Ant Design theme config ────────────────────────────────
export const evkinTheme: ThemeConfig = {
  token: {
    // Colors
    colorPrimary:     brand.primary,
    colorSuccess:     brand.success,
    colorWarning:     brand.warning,
    colorError:       brand.error,
    colorInfo:        brand.accent,

    // Typography
    fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize:     14,
    fontSizeSM:   12,
    fontSizeLG:   16,
    fontSizeXL:   20,
    lineHeight:   1.5714,

    // Shape
    borderRadius:    layout.borderRadius,
    borderRadiusSM:  layout.borderRadiusSm,
    borderRadiusLG:  layout.borderRadiusLg,

    // Spacing
    padding:     16,
    paddingSM:   12,
    paddingLG:   24,
    paddingXL:   32,
    margin:      16,
    marginSM:    12,
    marginLG:    24,
    marginXL:    32,

    // Surfaces
    colorBgLayout:    brand.bgLayout,
    colorBgContainer: brand.bgCard,
    colorBgElevated:  brand.bgElevated,

    // Borders
    colorBorder:      brand.border,
    colorBorderSecondary: brand.borderLight,

    // Text
    colorText:          brand.textPrimary,
    colorTextSecondary: brand.textSecondary,
    colorTextTertiary:  brand.textTertiary,

    // Shadows
    boxShadow:          shadows.md,
    boxShadowSecondary: shadows.sm,

    // Motion
    motionDurationFast: motion.fast,
    motionDurationMid:  motion.normal,
    motionDurationSlow: motion.slow,
    motionEaseInOut:    motion.easing,

    // Layout
    controlHeight:   36,
    controlHeightLG: 40,
    controlHeightSM: 28,
  },
  components: {
    Layout: {
      headerBg:     brand.bgCard,
      siderBg:      brand.primaryDark,
      bodyBg:       brand.bgLayout,
      headerHeight: layout.headerHeight,
    },
    Menu: {
      darkItemBg:           brand.primaryDark,
      darkSubMenuItemBg:    brand.primaryDark,
      darkItemSelectedBg:   brand.primary,
      darkItemHoverBg:      'rgba(255, 255, 255, 0.08)',
      darkItemColor:        'rgba(255, 255, 255, 0.75)',
      darkItemSelectedColor:'#ffffff',
    },
    Button: {
      borderRadius: layout.borderRadius,
    },
    Card: {
      borderRadiusLG: layout.borderRadiusLg,
    },
    Table: {
      headerBg:       '#F8FAFC',    // matches --c-subtle
      headerColor:    brand.textPrimary,
      rowHoverBg:     '#EFF6FF',    // matches --c-hover
      rowSelectedBg:  '#DBEAFE',    // matches --bg-selected
      rowSelectedHoverBg: '#BFDBFE', // matches --bg-selected-hover
      borderColor:    brand.borderLight,
    },
    Input: {
      borderRadius: layout.borderRadius,
    },
    Select: {
      borderRadius: layout.borderRadius,
    },
    Modal: {
      borderRadiusLG: layout.borderRadiusLg,
    },
    Notification: {
      borderRadiusLG: layout.borderRadiusLg,
    },
    Tag: {
      borderRadiusSM: layout.borderRadiusSm,
    },
  },
};

// ── Status tag color map (for antd <Tag color="xxx">) ──
export const statusTagColors: Record<string, string> = {
  terkirim:     brand.statusTerkirim,    // green
  tersimpan:    brand.statusTersimpan,   // blue
  ditolak:      brand.statusDitolak,     // red
  menunggu:     brand.statusMenunggu,    // amber
  diverifikasi: brand.statusVerified,    // dark green
  disetujui:    brand.statusVerified,    // dark green (approved)
  // 'draft' intentionally omitted — falls back to 'default'
};

// ── Dark brand palette — "Navy Dusk" ─────────────────
// Desaturated +25%, navy-tinted backgrounds, sidebar gelap
export const brandDark = {
  ...brand,
  primary:      '#4F90BF',
  primaryLight: '#6AA8CC',
  primaryDark:  '#3A78A8',
  accent:       '#3AAFC2',
  success:      '#4FA87C',
  warning:      '#C98B2C',
  error:        '#C4596A',

  textPrimary:   '#D4DCE8',
  textSecondary: '#8696A8',
  textTertiary:  '#5C6B7C',
  border:        '#253447',
  borderLight:   '#1A2A3C',
  bgLayout:      '#0D1421',
  bgCard:        '#162030',
  bgElevated:    '#253447',
} as const;

// ── Dark Ant Design theme config ──────────────────────
// NOTE: darkAlgorithm derives colorBgContainer from colorBgBase.
// We set colorBgBase so the algorithm produces correct dark surfaces.
export const evkinThemeDark: ThemeConfig = {
  token: {
    // Seed tokens (darkAlgorithm derives everything from these)
    colorPrimary:     brandDark.primary,
    colorSuccess:     brandDark.success,
    colorWarning:     brandDark.warning,
    colorError:       brandDark.error,
    colorInfo:        brandDark.accent,
    colorBgBase:      '#0D1421',   // Navy Dusk base → algorithm derives container/elevated/layout
    colorTextBase:    '#D4DCE8',   // Navy Dusk text base → algorithm derives text hierarchy

    // Typography (carry over from light theme)
    fontFamily: evkinTheme.token!.fontFamily,
    fontSize:     14,
    fontSizeSM:   12,
    fontSizeLG:   16,
    fontSizeXL:   20,
    lineHeight:   1.5714,

    // Shape
    borderRadius:    layout.borderRadius,
    borderRadiusSM:  layout.borderRadiusSm,
    borderRadiusLG:  layout.borderRadiusLg,

    // Spacing
    padding:     16,
    paddingSM:   12,
    paddingLG:   24,
    paddingXL:   32,
    margin:      16,
    marginSM:    12,
    marginLG:    24,
    marginXL:    32,

    // Shadows (deeper for navy-dark backgrounds)
    boxShadow:          '0 2px 8px rgba(0, 0, 0, 0.45)',
    boxShadowSecondary: '0 1px 2px rgba(0, 0, 0, 0.35)',

    // Motion
    motionDurationFast: motion.fast,
    motionDurationMid:  motion.normal,
    motionDurationSlow: motion.slow,
    motionEaseInOut:    motion.easing,

    // Layout
    controlHeight:   36,
    controlHeightLG: 40,
    controlHeightSM: 28,
  },
  components: {
    Layout: {
      headerBg:     brandDark.bgCard,
      siderBg:      brandDark.primaryDark,
      bodyBg:       brandDark.bgLayout,
      headerHeight: layout.headerHeight,
    },
    Menu: {
      darkItemBg:           brandDark.primaryDark,
      darkSubMenuItemBg:    brandDark.primaryDark,
      darkItemSelectedBg:   brandDark.primary,
      darkItemHoverBg:      'rgba(255, 255, 255, 0.08)',
      darkItemColor:        'rgba(255, 255, 255, 0.75)',
      darkItemSelectedColor:'#ffffff',
    },
    Button: {
      borderRadius: layout.borderRadius,
    },
    Card: {
      borderRadiusLG: layout.borderRadiusLg,
    },
    Table: {
      headerBg:       '#1A2A3C',
      headerColor:    brandDark.textPrimary,
      rowHoverBg:     'rgba(79, 144, 191, 0.12)',
      rowSelectedBg:  'rgba(79, 144, 191, 0.18)',
      rowSelectedHoverBg: 'rgba(79, 144, 191, 0.24)',
      borderColor:    brandDark.borderLight,
    },
    Input: {
      borderRadius: layout.borderRadius,
    },
    Select: {
      borderRadius: layout.borderRadius,
    },
    Modal: {
      borderRadiusLG: layout.borderRadiusLg,
    },
    Notification: {
      borderRadiusLG: layout.borderRadiusLg,
    },
    Tag: {
      borderRadiusSM: layout.borderRadiusSm,
    },
  },
};
