// constants/colors.js - AgriSphere Design System
// Refined color palette with elegant gradients and modern tones

export const COLORS = {
  // Primary palette - Deep teal green (modern agriculture feel)
  primary: '#0B8457',
  primaryLight: '#2EC4B6',
  primaryDark: '#065A3B',
  primarySoft: 'rgba(11, 132, 87, 0.12)',
  primaryFaded: 'rgba(11, 132, 87, 0.06)',

  // Accent - Warm amber/gold
  accent: '#F4A261',
  accentLight: '#FFD6A5',
  accentDark: '#E07A2F',

  // Ink / Dark tones (for headers and dark gradients)
  inkDark: '#0F2027',
  inkSoft: '#1B3A4B',
  inkMid: '#274C5B',

  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F5F7FA',
  backgroundTertiary: '#EEF2F6',
  backgroundWarm: '#FDF8F3',

  // Text hierarchy
  textPrimary: '#1A2332',
  textSecondary: '#5A6B7F',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  // Semantic colors
  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.12)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.12)',
  error: '#EF4444',
  errorLight: 'rgba(239, 68, 68, 0.12)',
  info: '#3B82F6',
  infoLight: 'rgba(59, 130, 246, 0.12)',

  // Surfaces
  white: '#FFFFFF',
  black: '#000000',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  divider: '#F0F0F0',

  // Card & shadow
  cardBackground: '#FFFFFF',
  cardShadow: 'rgba(15, 32, 39, 0.08)',

  // Gradient presets (arrays for LinearGradient)
  gradients: {
    header: ['#0F2027', '#1B3A4B'],
    headerAccent: ['#0F2027', '#274C5B'],
    hero: ['#0B8457', '#2EC4B6'],
    heroSoft: ['rgba(11, 132, 87, 0.15)', 'rgba(46, 196, 182, 0.05)'],
    card: ['#FFFFFF', '#F5F7FA'],
    warm: ['#FDF8F3', '#FFFFFF'],
    overlay: ['rgba(15, 32, 39, 0.8)', 'rgba(27, 58, 75, 0.6)'],
    tab: ['rgba(11, 132, 87, 0.08)', 'transparent'],
  },

  // Crop type palette (for tags/categories)
  crops: {
    grain: '#F59E0B',
    vegetable: '#10B981',
    fruit: '#EF4444',
    legume: '#8B5CF6',
    root: '#F97316',
    cereal: '#FBBF24',
    herb: '#06B6D4',
    flower: '#EC4899',
    vine: '#84CC16',
    tree: '#22C55E',
  },

  // Status colors
  status: {
    online: '#10B981',
    offline: '#94A3B8',
    busy: '#F59E0B',
    error: '#EF4444',
  },

  // IoT device colors
  device: {
    connected: '#10B981',
    disconnected: '#94A3B8',
    warning: '#F59E0B',
  },
};

// Shadow presets
export const SHADOWS = {
  small: {
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  large: {
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
};

export default COLORS;
