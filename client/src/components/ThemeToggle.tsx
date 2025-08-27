import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  try {
    const { theme, toggleTheme } = useTheme();

    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="hover-scale animate-fade-in"
        data-testid="button-theme-toggle"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? (
          <Moon className="h-5 w-5 animate-bounce-gentle" />
        ) : (
          <Sun className="h-5 w-5 animate-bounce-gentle text-yellow-500" />
        )}
      </Button>
    );
  } catch (error) {
    // Fallback if ThemeProvider is not available
    return (
      <Button
        variant="ghost"
        size="icon"
        className="hover-scale animate-fade-in"
        data-testid="button-theme-toggle"
        title="Theme toggle (loading...)"
        disabled
      >
        <Moon className="h-5 w-5" />
      </Button>
    );
  }
}