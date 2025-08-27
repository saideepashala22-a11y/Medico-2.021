import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = () => {
    console.log('Theme toggle clicked, current theme:', theme);
    toggleTheme();
    
    // Force immediate visual feedback by manually applying styles
    setTimeout(() => {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      console.log('Forcing theme to:', newTheme);
      
      if (newTheme === 'dark') {
        document.body.style.backgroundColor = '#1a1a1a';
        document.body.style.color = '#ffffff';
      } else {
        document.body.style.backgroundColor = '';
        document.body.style.color = '';
      }
    }, 100);
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