import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Header from './header';
import { navPages, CABINET_PATH } from '@/app/router/routes';
import { useAuth } from '@/features/auth/api/useAuth';

vi.stubGlobal(
  'ResizeObserver',
  vi.fn(() => ({ observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() })),
);

vi.mock('@/shared/assets/images/logo.svg?react', () => ({
  default: (props: Record<string, unknown>) => <svg data-testid="logo" {...props} />,
}));
vi.mock('@/shared/assets/images/header/profile.svg?react', () => ({
  default: (props: Record<string, unknown>) => <svg data-testid="profile-icon" {...props} />,
}));
vi.mock('@/shared/assets/images/header/auth.svg?react', () => ({
  default: (props: Record<string, unknown>) => <svg data-testid="auth-icon" {...props} />,
}));
vi.mock('@/shared/ui/theme-toggle/ThemeToggle', () => ({
  default: ({ className }: { className?: string }) => (
    <button data-testid="theme-toggle-button" className={className} />
  ),
}));

vi.mock('@/features/auth/modal/modal', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="auth-modal">
        <button data-testid="close-modal" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
}));

vi.mock('@/features/auth/api/useAuth', () => ({ useAuth: vi.fn() }));

const renderHeader = () =>
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  );

describe('Header', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ isAuth: false } as ReturnType<typeof useAuth>);
  });

  it('рендерит логотип и все навигационные ссылки', () => {
    renderHeader();

    expect(screen.getByTestId('logo')).toBeInTheDocument();
    navPages.forEach(({ navText }) => {
      expect(screen.getByRole('link', { name: new RegExp(navText, 'i') })).toBeInTheDocument();
    });
  });

  it('навигационные ссылки ведут на правильные страницы', () => {
    renderHeader();

    navPages.forEach(({ path, navText }) => {
      expect(screen.getByRole('link', { name: new RegExp(navText, 'i') })).toHaveAttribute(
        'href',
        path,
      );
    });
  });

  describe('Авторизация', () => {
    it('показывает кнопку входа для неавторизованного пользователя', () => {
      renderHeader();

      expect(screen.getByTestId('auth-button')).toBeInTheDocument();
      expect(screen.queryByTestId('profile-icon')).not.toBeInTheDocument();
    });

    it('показывает ссылку на кабинет для авторизованного пользователя', () => {
      vi.mocked(useAuth).mockReturnValue({ isAuth: true } as ReturnType<typeof useAuth>);
      renderHeader();

      expect(screen.getByTestId('profile-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('auth-button')).not.toBeInTheDocument();
    });

    it('ссылка профиля ведёт в личный кабинет', () => {
      vi.mocked(useAuth).mockReturnValue({ isAuth: true } as ReturnType<typeof useAuth>);
      renderHeader();

      expect(screen.getByTestId('profile-icon').closest('a')).toHaveAttribute('href', CABINET_PATH);
    });
  });

  describe('Модальное окно', () => {
    it('открывается при клике на кнопку входа', async () => {
      renderHeader();

      await userEvent.click(screen.getByTestId('auth-button'));

      expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
    });

    it('закрывается при вызове onClose', async () => {
      renderHeader();

      await userEvent.click(screen.getByTestId('auth-button'));
      await userEvent.click(screen.getByTestId('close-modal'));

      expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument();
    });

    it('не рендерится для авторизованного пользователя', () => {
      vi.mocked(useAuth).mockReturnValue({ isAuth: true } as ReturnType<typeof useAuth>);
      renderHeader();

      expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument();
    });

    it('открывает модалку и закрывает меню при клике на кнопку входа из открытого меню', async () => {
      renderHeader();

      await userEvent.click(screen.getByTestId('burger-button'));
      expect(screen.getByTestId('burger-button')).toHaveAttribute('aria-expanded', 'true');

      await userEvent.click(screen.getByTestId('auth-button'));

      expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
      expect(screen.getByTestId('burger-button')).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Бургер-меню', () => {
    const getBurger = () => screen.getByTestId('burger-button');

    it('закрыто по умолчанию', () => {
      renderHeader();

      expect(getBurger()).toHaveAttribute('aria-expanded', 'false');
    });

    it('открывается по клику', async () => {
      renderHeader();

      await userEvent.click(getBurger());

      expect(getBurger()).toHaveAttribute('aria-expanded', 'true');
    });

    it('закрывается повторным кликом', async () => {
      renderHeader();

      await userEvent.click(getBurger());
      await userEvent.click(getBurger());

      expect(getBurger()).toHaveAttribute('aria-expanded', 'false');
    });

    it('закрывается при нажатии Escape', async () => {
      renderHeader();

      await userEvent.click(getBurger());
      await userEvent.keyboard('{Escape}');

      expect(getBurger()).toHaveAttribute('aria-expanded', 'false');
    });

    it('закрывается при клике на навигационную ссылку', async () => {
      renderHeader();

      await userEvent.click(getBurger());
      await userEvent.click(
        screen.getByRole('link', { name: new RegExp(navPages[0].navText, 'i') }),
      );

      expect(getBurger()).toHaveAttribute('aria-expanded', 'false');
    });

    it('блокирует скролл страницы при открытии', async () => {
      renderHeader();

      await userEvent.click(getBurger());

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('восстанавливает скролл при закрытии', async () => {
      renderHeader();

      await userEvent.click(getBurger());
      await userEvent.click(getBurger());

      expect(document.body.style.overflow).toBe('');
    });
  });
});
