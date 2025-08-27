import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = () => {
    console.log('Theme toggle clicked, current theme:', theme);
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
}