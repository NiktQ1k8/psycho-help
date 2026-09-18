import type { FC, SVGProps } from 'react';

export type social = {
  icon: FC<SVGProps<SVGSVGElement>>;
  link: string;
};

export type location = {
  address: string;
  auditorium: string;
  letters: string;
};
