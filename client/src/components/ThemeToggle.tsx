import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  try {
    const { theme, toggleTheme } = useTheme();

    const handleToggle = () => {
      console.log('Theme toggle clicked, current theme:', theme); // Debug log
      toggleTheme();
    };

    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        className="hover-scale animate-fade-in text-white hover:bg-white/10"
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
    console.error('Theme context error:', error); // Debug log
    // Fallback if ThemeProvider is not available
    return (
      <Button
        variant="ghost"
        size="icon"
        className="hover-scale animate-fade-in text-white"
        data-testid="button-theme-toggle"
        title="Theme toggle (loading...)"
        disabled
      >
        <Moon className="h-5 w-5" />
      </Button>
    );
  }
}