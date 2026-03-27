import React from 'react';

/**
 * Visually hidden text for screen readers
 * Equivalent to Tailwind's sr-only class
 */
export const VisuallyHidden = ({ children }: { children: React.ReactNode }) => (
  <span className="sr-only">
    {children}
  </span>
);

/**
 * Skip to main content link (accessibility)
 * Positioned off-screen until focused
 */
export const SkipLink = () => (
  <a 
    href="#main-content"
    className="absolute -top-10 left-0 bg-electric-blue text-white p-2 rounded-sm z-[9999] transition-all focus:top-2"
  >
    Skip to main content
  </a>
);

/**
 * Tailwind-first focus utility (replaces FocusablePaper)
 */
export const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian";

export const interactiveSlate = `bg-slate-900/40 border border-white/10 rounded-sm transition-all hover:bg-slate-900/60 hover:border-white/20 ${focusRing}`;
