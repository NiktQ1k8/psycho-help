export type TAuthModalView = 'log' | 'reg' | 'forgot' | 'change';

export type TAuthModalProps = {
  setWindow: (view: TAuthModalView) => void;
  isOpen: boolean;
  setModalOpen: (open: boolean) => void;
};
