import { theme } from 'antd';
import type { ThemeConfig } from 'antd';

export const getAntdTheme = (isDark: boolean): ThemeConfig => {
  const styles = getComputedStyle(document.documentElement);
  const color = (name: string) => styles.getPropertyValue(`--${name}`).trim();
  const background = color(
    isDark ? 'backgrounds-neutral-inverted' : 'backgrounds-neutral-primary',
  );

  return {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: color('interactive-brand-primary'),
      colorBgBase: background,
      colorBgContainer: background,
      colorBgElevated: color(
        isDark ? 'labels-neutral-primary' : 'backgrounds-neutral-primary',
      ),
      colorTextBase: color(
        isDark ? 'labels-neutral-inverted-primary' : 'labels-neutral-primary',
      ),
    },
    components: {
      Calendar: {
        fullBg: 'transparent',
        fullPanelBg: 'transparent',
        fontSize: 16,
      },
    },
  };
};
