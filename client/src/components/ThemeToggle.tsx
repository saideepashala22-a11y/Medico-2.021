import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = () => {
    console.log('Theme toggle clicked, current theme:', theme);
    toggleTheme();
    
    // Force immediate visual feedback by manually applying styles to everything
    setTimeout(() => {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      console.log('Forcing theme to:', newTheme);
      
      const root = document.documentElement;
      const body = document.body;
      
      if (newTheme === 'dark') {
        // Force dark mode on everything
        root.style.backgroundColor = '#1a1a1a';
        root.style.color = '#ffffff';
        body.style.backgroundColor = '#1a1a1a';
        body.style.color = '#ffffff';
        
        // Force all white backgrounds to dark
        const whiteElements = document.querySelectorAll('.bg-white, .bg-gray-50, .bg-gray-100');
        whiteElements.forEach(el => {
          (el as HTMLElement).style.backgroundColor = '#2a2a2a';
          (el as HTMLElement).style.color = '#ffffff';
        });
        
        // Force all text to white
        const textElements = document.querySelectorAll('.text-black, .text-gray-900, .text-gray-800');
        textElements.forEach(el => {
          (el as HTMLElement).style.color = '#ffffff';
        });
        
      } else {
        // Reset to light mode
        root.style.backgroundColor = '';
        root.style.color = '';
        body.style.backgroundColor = '';
        body.style.color = '';
        
        // Reset all forced styles
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
          (el as HTMLElement).style.backgroundColor = '';
          (el as HTMLElement).style.color = '';
        });
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