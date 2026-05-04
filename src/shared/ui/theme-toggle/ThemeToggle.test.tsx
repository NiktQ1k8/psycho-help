import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTheme } from '@/shared/hooks/useTheme';
import ThemeToggle from './ThemeToggle';

vi.mock('@/shared/assets/images/header/moon.svg?react', () => ({
  default: (props: Record<string, unknown>) => <svg data-testid="moon-icon" {...props} />,
}));
vi.mock('@/shared/assets/images/header/sun.svg?react', () => ({
  default: (props: Record<string, unknown>) => <svg data-testid="sun-icon" {...props} />,
}));

vi.mock('@/shared/hooks/useTheme', () => ({ useTheme: vi.fn() }));

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.mocked(useTheme).mockReturnValue({
      currentTheme: 'light',
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    });
  });

  it('показывает иконку луны в светлой теме', () => {
    render(<ThemeToggle />);

    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('sun-icon')).not.toBeInTheDocument();
  });

  it('показывает иконку солнца в тёмной теме', () => {
    vi.mocked(useTheme).mockReturnValue({
      currentTheme: 'dark',
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    });

    render(<ThemeToggle />);

    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('moon-icon')).not.toBeInTheDocument();
  });

  it('вызывает toggleTheme при клике', async () => {
    const toggleTheme = vi.fn();
    vi.mocked(useTheme).mockReturnValue({
      currentTheme: 'light',
      setTheme: vi.fn(),
      toggleTheme,
    });

    render(<ThemeToggle />);

    await userEvent.click(screen.getByTestId('theme-toggle-button'));

    expect(toggleTheme).toHaveBeenCalledOnce();
  });
});
