import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { Tooltip } from '@/components/ui/tooltip';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only show the toggle after hydration to avoid SSR issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until client-side
  if (!mounted) return null;

  const handleToggle = () => {
    console.log("Theme toggle button clicked");
    toggleTheme();
  };

  return (
    <Tooltip content={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}>
      <div className="inline-flex items-center justify-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggle}
          className="relative"
          aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
        >
          {theme === 'light' ? (
            <Sun className="h-5 w-5 transition-all" />
          ) : (
            <Moon className="h-5 w-5 transition-all" />
          )}
          <span className="sr-only">
            {theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
          </span>
        </Button>
      </div>
    </Tooltip>
  );
}
