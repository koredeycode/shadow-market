import { Paper, styled } from '@mui/material';

// Accessible focus styles for interactive elements
export const FocusablePaper = styled(Paper)(({ theme }) => ({
  transition: theme.transitions.create(['box-shadow', 'transform'], {
    duration: theme.transitions.duration.short,
  }),
  '&:focus-visible': {
    outline: `3px solid ${theme.palette.primary.main}`,
    outlineOffset: '2px',
  },
  '&:focus:not(:focus-visible)': {
    outline: 'none',
  },
}));

// Skip to main content link (accessibility)
export const SkipLink = styled('a')(({ theme }) => ({
  position: 'absolute',
  top: -40,
  left: 0,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(1, 2),
  textDecoration: 'none',
  borderRadius: theme.shape.borderRadius,
  zIndex: 9999,
  '&:focus': {
    top: theme.spacing(1),
  },
}));

// Visually hidden text for screen readers
export const VisuallyHidden = styled('span')({
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
});
