import { useTheme } from '@/shared/hooks/useTheme';
import Moon from '@/shared/assets/images/header/moon.svg?react';
import Sun from '@/shared/assets/images/header/sun.svg?react';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const { currentTheme, toggleTheme } = useTheme();

  return (
    <button
      className={className}
      onClick={toggleTheme}
      data-testid="theme-toggle-button"
      type="button"
      aria-label={
        currentTheme === 'light' ? 'Переключить на тёмную тему' : 'Переключить на светлую тему'
      }
    >
      {currentTheme === 'light' ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
    </button>
  );
};

export default ThemeToggle;
