import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';
import { ComputerIcon, Moon02Icon, Sun01Icon } from '@hugeicons/core-free-icons';

const iconBase =
  'absolute inset-0 h-4 w-4 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]';
const active = 'opacity-100 rotate-0 scale-100';
const inactive = 'opacity-0 rotate-90 scale-50';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const label =
    theme === 'light'
      ? 'Tema claro'
      : 'Tema oscuro';
      // : theme === 'dark'
      //   ? 'Tema oscuro'
      //   : 'Tema del sistema';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={label}
      aria-label={label}
      className="relative h-9 w-9"
    >
      <span className="relative flex h-4 w-4 items-center justify-center">
        <HugeiconsIcon
          icon={Sun01Icon}
          className={cn(iconBase, theme === 'light' ? active : inactive)}
        />
        <HugeiconsIcon
          icon={Moon02Icon}
          className={cn(
            iconBase,
            theme === 'dark' ? active : inactive,
            theme === 'dark' ? 'rotate-0' : '-rotate-90'
          )}
        />
        {/* <HugeiconsIcon
          icon={ComputerIcon}
          className={cn(
            iconBase,
            theme === 'system' ? active : inactive,
            theme === 'system' ? 'rotate-0' : 'rotate-90'
          )}
        /> */}
      </span>
    </Button>
  );
}
