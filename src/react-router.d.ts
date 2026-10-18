import type { NavigateOptions, To } from 'react-router';
import 'react-router';

// BrowserRouter and MemoryRouter navigate synchronously (unlike data routers).
declare module 'react-router' {
  interface NavigateFunction {
    (to: To, options?: NavigateOptions): void;
    (delta: number): void;
  }
}
