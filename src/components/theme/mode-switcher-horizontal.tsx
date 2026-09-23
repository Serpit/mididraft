import { Button } from '@/components/ui/button';
import { websiteConfig } from '@/config/website';
import { messages } from '@/messages';
import { cn } from '@/lib/utils';
import { IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useTheme } from '@/components/theme/theme-provider';

const m = messages.common;

/**
 * Horizontal theme switcher (sun / moon / system) for mobile menu footer.
 */
export function ModeSwitcherHorizontal() {
  if (!websiteConfig.ui?.mode?.enableSwitch) {
    return null;
  }

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-border p-1">
        <div className="size-6 rounded-full bg-muted" />
        <div className="size-6 rounded-full bg-muted" />
        <div className="size-6 rounded-full bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-border p-1">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'size-6 rounded-full p-0',
          theme === 'light' && 'bg-muted text-foreground'
        )}
        onClick={() => setTheme('light')}
        aria-label={m.mode.light}
      >
        <IconSun className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'size-6 rounded-full p-0',
          theme === 'dark' && 'bg-muted text-foreground'
        )}
        onClick={() => setTheme('dark')}
        aria-label={m.mode.dark}
      >
        <IconMoon className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'size-6 rounded-full p-0',
          theme === 'system' && 'bg-muted text-foreground'
        )}
        onClick={() => setTheme('system')}
        aria-label={m.mode.system}
      >
        <IconDeviceDesktop className="size-4" />
      </Button>
    </div>
  );
}
