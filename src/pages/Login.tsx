import React from 'react';
import { useOutletContext } from 'react-router-dom';
import AuthPage from '../components/layout/AuthPage';

interface OutletContext {
  theme: 'light' | 'dark';
}

const LoginPage: React.FC = () => {
  const { theme } = useOutletContext<OutletContext>();
  return <AuthPage theme={theme} />;
};

export default LoginPage;