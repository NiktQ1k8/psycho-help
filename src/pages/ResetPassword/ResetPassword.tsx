import { useNavigate, useSearchParams } from 'react-router-dom';
import ModalWindow from '@/features/auth/modal/modal';
import { SLUG } from '@/shared/config/slug';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  return (
    <ModalWindow
      initialView="change"
      isOpen
      resetToken={params.get('token') || ''}
      onClose={() => navigate(SLUG.MAIN, { replace: true })}
    />
  );
};

export default ResetPassword;
