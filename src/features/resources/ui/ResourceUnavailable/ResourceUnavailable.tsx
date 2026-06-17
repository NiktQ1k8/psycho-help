import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App } from 'antd';

interface IResourceUnavailableProps {
  text: string;
  to: string;
}

export const ResourceUnavailable = ({
  text,
  to,
}: IResourceUnavailableProps) => {
  const navigate = useNavigate();
  const { key } = useLocation();
  const { message } = App.useApp();

  useEffect(() => {
    void message.warning({ content: text, key: `resource-unavailable:${key}` });
    void navigate(to, { replace: true });
  }, [key, message, navigate, text, to]);

  return null;
};
