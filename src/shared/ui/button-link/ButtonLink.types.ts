import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from 'react';
import type { LinkProps } from 'react-router-dom';

export type TButtonLinkStyleProps = {
  variant?: 'primary_' | 'secondary';
  color?: 'brand_' | 'neutral';
  iconPosition?: 'left_' | 'right';
  icon?: ReactNode;
};

export type TButtonLinkButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  keyof TButtonLinkStyleProps
> &
  TButtonLinkStyleProps & {
    to?: never;
    href?: never;
  };

export type TButtonLinkAnchorProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  keyof TButtonLinkStyleProps | 'href'
> &
  TButtonLinkStyleProps & {
    href: string;
    to?: never;
  };

export type TButtonLinkRouterProps = Omit<
  LinkProps,
  keyof TButtonLinkStyleProps
> &
  TButtonLinkStyleProps & {
    href?: never;
  };

export type TButtonLinkProps =
  TButtonLinkButtonProps | TButtonLinkAnchorProps | TButtonLinkRouterProps;
