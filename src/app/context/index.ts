import { createContext, useContext } from 'react';

export interface IAppContext {
  isAppLoading: boolean;
}

export const AppContext = createContext<IAppContext | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      'useAppContext должен использоваться внутри AppContextProvider',
    );
  }

  return context;
};
