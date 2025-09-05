import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { isDarkMode, toggleDarkMode } = useTheme();

  const handleToggle = () => {
    console.log('Theme toggle clicked, current mode:', isDarkMode ? 'dark' : 'light');
    toggleDarkMode();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      className="relative overflow-hidden transition-all duration-300 hover:scale-105"
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-5 h-5">
        <Sun 
          className={`absolute inset-0 h-5 w-5 transition-all duration-500 ${
            !isDarkMode 
              ? 'rotate-0 scale-100 opacity-100' 
              : 'rotate-90 scale-0 opacity-0'
          }`} 
        />
        <Moon 
          className={`absolute inset-0 h-5 w-5 transition-all duration-500 ${
            isDarkMode 
              ? 'rotate-0 scale-100 opacity-100' 
              : '-rotate-90 scale-0 opacity-0'
          }`} 
        />
      </div>
    </Button>
  );
}