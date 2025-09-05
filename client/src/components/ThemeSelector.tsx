import React, { useState } from 'react';
import { Palette, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme, themes } from '@/contexts/ThemeContext';

export function ThemeSelector() {
  const { currentTheme, setTheme, isDarkMode, toggleDarkMode } = useTheme();
  const [open, setOpen] = useState(false);

  const handleThemeSelect = (themeId: string) => {
    setTheme(themeId);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 border-2 shadow-lg"
          data-testid="button-theme-selector"
        >
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">Themes</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Choose Theme
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span className="text-sm font-medium">Dark Mode</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="p-2"
              data-testid="button-dark-mode-toggle"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>

          {/* Theme Options */}
          <div className="grid grid-cols-1 gap-3">
            {themes.map((theme) => (
              <Card
                key={theme.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  currentTheme.id === theme.id
                    ? 'ring-2 shadow-lg'
                    : 'hover:ring-1 hover:ring-gray-300'
                }`}
                onClick={() => handleThemeSelect(theme.id)}
                style={{
                  borderColor: currentTheme.id === theme.id ? `rgb(${theme.colors.primary})` : undefined
                }}
                data-testid={`card-theme-${theme.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{theme.displayName}</h3>
                      <div className="flex items-center gap-1 mt-2">
                        {/* Color preview circles */}
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-600"
                          style={{ backgroundColor: `rgb(${theme.colors.primary})` }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-600"
                          style={{ backgroundColor: `rgb(${theme.colors.accent})` }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-600"
                          style={{ backgroundColor: `rgb(${theme.colors.secondary})` }}
                        />
                      </div>
                    </div>
                    {currentTheme.id === theme.id && (
                      <div className="w-2 h-2 rounded-full bg-current" style={{ color: `rgb(${theme.colors.primary})` }} />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}