import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Theme {
  id: string;
  name: string;
  displayName: string;
  colors: {
    primary: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    background: string;
    backgroundDark: string;
    card: string;
    cardDark: string;
    text: string;
    textDark: string;
    border: string;
    borderDark: string;
  };
}

export const themes: Theme[] = [
  {
    id: 'medical',
    name: 'medical',
    displayName: 'Medical Blue',
    colors: {
      primary: '59 130 246', // blue-500
      primaryDark: '37 99 235', // blue-600
      secondary: '239 246 255', // blue-50
      accent: '34 197 94', // green-500
      background: '255 255 255',
      backgroundDark: '15 23 42', // slate-900
      card: '248 250 252', // slate-50
      cardDark: '30 41 59', // slate-800
      text: '15 23 42', // slate-900
      textDark: '248 250 252', // slate-50
      border: '226 232 240', // slate-200
      borderDark: '51 65 85', // slate-700
    }
  },
  {
    id: 'amazon',
    name: 'amazon',
    displayName: 'Amazon Style',
    colors: {
      primary: '255 153 0', // amazon orange
      primaryDark: '232 119 34', // darker orange
      secondary: '35 47 62', // amazon dark blue
      accent: '255 214 10', // amazon yellow
      background: '255 255 255',
      backgroundDark: '35 47 62',
      card: '250 250 250',
      cardDark: '55 71 79',
      text: '17 17 17',
      textDark: '255 255 255',
      border: '221 221 221',
      borderDark: '85 85 85',
    }
  },
  {
    id: 'flipkart',
    name: 'flipkart',
    displayName: 'Flipkart Style',
    colors: {
      primary: '47 116 253', // flipkart blue
      primaryDark: '24 88 242',
      secondary: '255 214 10', // flipkart yellow
      accent: '255 99 71', // coral accent
      background: '255 255 255',
      backgroundDark: '22 28 45',
      card: '248 250 252',
      cardDark: '30 41 59',
      text: '26 32 46',
      textDark: '248 250 252',
      border: '226 232 240',
      borderDark: '51 65 85',
    }
  },
  {
    id: 'apollo',
    name: 'apollo',
    displayName: 'Apollo Health',
    colors: {
      primary: '34 197 94', // green-500 apollo green
      primaryDark: '22 163 74', // green-600
      secondary: '240 253 244', // green-50
      accent: '59 130 246', // blue-500
      background: '255 255 255',
      backgroundDark: '20 83 45', // green-900
      card: '247 254 231', // green-50
      cardDark: '22 101 52', // green-800
      text: '20 83 45', // green-900
      textDark: '240 253 244', // green-50
      border: '187 247 208', // green-200
      borderDark: '34 197 94', // green-500
    }
  },
  {
    id: 'modern',
    name: 'modern',
    displayName: 'Modern Dark',
    colors: {
      primary: '139 92 246', // purple-500
      primaryDark: '124 58 237', // purple-600
      secondary: '245 243 255', // purple-50
      accent: '236 72 153', // pink-500
      background: '255 255 255',
      backgroundDark: '17 24 39', // gray-900
      card: '249 250 251', // gray-50
      cardDark: '31 41 55', // gray-800
      text: '17 24 39', // gray-900
      textDark: '249 250 251', // gray-50
      border: '229 231 235', // gray-200
      borderDark: '75 85 99', // gray-600
    }
  }
];

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]); // Default to medical
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('hospital-theme');
    const savedDarkMode = localStorage.getItem('hospital-dark-mode');
    
    if (savedTheme) {
      const theme = themes.find(t => t.id === savedTheme);
      if (theme) {
        setCurrentTheme(theme);
      }
    }
    
    if (savedDarkMode) {
      setIsDarkMode(savedDarkMode === 'true');
    }
  }, []);

  // Apply theme colors to CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    const colors = currentTheme.colors;
    
    // Apply theme colors as CSS custom properties
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-dark', colors.primaryDark);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-background', isDarkMode ? colors.backgroundDark : colors.background);
    root.style.setProperty('--color-card', isDarkMode ? colors.cardDark : colors.card);
    root.style.setProperty('--color-text', isDarkMode ? colors.textDark : colors.text);
    root.style.setProperty('--color-border', isDarkMode ? colors.borderDark : colors.border);

    // Toggle dark class
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [currentTheme, isDarkMode]);

  const setTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      localStorage.setItem('hospital-theme', themeId);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('hospital-dark-mode', newDarkMode.toString());
  };

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      setTheme,
      isDarkMode,
      toggleDarkMode
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}