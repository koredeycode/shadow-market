import { Theme } from '@mui/material';

/**
 * Responsive design utilities for ShadowMarket
 * These breakpoints match Material-UI defaults:
 * - xs: 0px
 * - sm: 600px
 * - md: 900px
 * - lg: 1200px
 * - xl: 1536px
 */

/**
 * Responsive spacing helper
 * Usage: responsiveSpacing({ xs: 2, sm: 3, md: 4 })
 */
export const responsiveSpacing = (values: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number }) => ({
  xs: values.xs ?? 2,
  sm: values.sm ?? values.xs ?? 3,
  md: values.md ?? values.sm ?? values.xs ?? 4,
  lg: values.lg ?? values.md ?? values.sm ?? values.xs ?? 5,
  xl: values.xl ?? values.lg ?? values.md ?? values.sm ?? values.xs ?? 6,
});

/**
 * Responsive font sizes
 */
export const responsiveFontSizes = {
  h1: {
    xs: '2rem',
    sm: '2.5rem',
    md: '3rem',
    lg: '3.5rem',
  },
  h2: {
    xs: '1.75rem',
    sm: '2rem',
    md: '2.5rem',
  },
  h3: {
    xs: '1.5rem',
    sm: '1.75rem',
    md: '2rem',
  },
  h4: {
    xs: '1.25rem',
    sm: '1.5rem',
  },
  body1: {
    xs: '0.875rem',
    sm: '1rem',
  },
};

/**
 * Container padding for responsive layouts
 */
export const containerPadding = (theme: Theme) => ({
  px: {
    xs: theme.spacing(2),
    sm: theme.spacing(3),
    md: theme.spacing(4),
    lg: theme.spacing(6),
  },
  py: {
    xs: theme.spacing(3),
    sm: theme.spacing(4),
    md: theme.spacing(6),
  },
});

/**
 * Grid column configuration for responsive layouts
 */
export const gridColumns = {
  // Market cards grid
  marketCards: {
    xs: 12, // 1 column on mobile
    sm: 6, // 2 columns on tablet
    md: 4, // 3 columns on desktop
    lg: 4,
  },
  // Stats cards
  statsCards: {
    xs: 12,
    sm: 6,
    md: 3,
  },
  // Two-column layout
  twoColumn: {
    xs: 12,
    md: 6,
  },
  // Sidebar layout
  sidebar: {
    xs: 12,
    md: 3,
  },
  mainContent: {
    xs: 12,
    md: 9,
  },
};

/**
 * Hide on mobile/desktop helpers
 */
export const hideOnMobile = {
  display: { xs: 'none', sm: 'block' },
};

export const hideOnDesktop = {
  display: { xs: 'block', sm: 'none' },
};

/**
 * Responsive table display
 */
export const responsiveTable = {
  // Hide table on mobile, show cards
  table: {
    display: { xs: 'none', md: 'table' },
  },
  cards: {
    display: { xs: 'block', md: 'none' },
  },
};
