import type { FC } from 'react';

const ComingSoon: FC<{ title: string }> = ({ title }) => (
  <p style={{ textAlign: 'center', color: '#888' }}>
    Раздел "{title}" в разработке
  </p>
);

export default ComingSoon;
