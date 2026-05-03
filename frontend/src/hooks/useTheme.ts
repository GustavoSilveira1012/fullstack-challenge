import { useEffect } from 'react';
import { useUIStore } from '@store/uiStore';

export const useTheme = () => {
  const { theme, setTheme } = useUIStore();

  useEffect(() => {
    const htmlElement = document.documentElement;
    if (theme === 'dark') {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  return { theme, setTheme };
};
