import { useContext } from 'react';
import { ThemeContext } from '@/components/theme/theme-context';
import type { Theme } from '@/components/theme/theme-context';

export type { Theme };

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
