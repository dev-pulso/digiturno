import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useClock } from '@/hooks/use-clock';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { HugeiconsIcon } from '@hugeicons/react';
import { ChevronLeftIcon } from '@hugeicons/core-free-icons';

interface TopBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backPath?: string;
  showLive?: boolean;
}

export function TopBar({ title, subtitle, showBack, backPath = '/', showLive = true }: TopBarProps) {
  const navigate = useNavigate();
  const { formatted } = useClock();

  return (
    <header className="flex items-center justify-between px-7 py-4 bg-card border-b border-border shrink-0">
      <div className="flex items-center gap-3">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(backPath)}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            <HugeiconsIcon icon={ChevronLeftIcon} className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h1 className="font-display font-bold text-base">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        {showLive && (
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
            EN VIVO
          </div>
        )}
        <ThemeToggle />
        <span className="font-mono text-xs text-muted-foreground">{formatted}</span>
      </div>
    </header>
  );
}
