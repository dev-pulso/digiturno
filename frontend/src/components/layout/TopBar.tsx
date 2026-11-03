import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useClock } from '@/hooks/use-clock';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useAuth } from '@/features/auth/hooks/useAuth';
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
  const location = useLocation();
  const { formatted } = useClock();
  const { user } = useAuth();

  const adminLinks = [
    { label: 'Recepción', path: '/recepcion' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Personal', path: '/admin/personal' },
    { label: 'Consultorios', path: '/admin/areas' },
    { label: 'Exámenes', path: '/admin/examenes' },
    { label: 'Videos', path: '/admin/videos' },
  ];

  return (
    <header className="flex items-center justify-between px-7 py-3 bg-card border-b border-border shrink-0">
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

      {user?.rol === 'admin' && (
        <nav className="hidden lg:flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50 text-xs">
          {adminLinks.map((link) => {
            const active = location.pathname === link.path;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`px-2.5 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                  active
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>
      )}

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
