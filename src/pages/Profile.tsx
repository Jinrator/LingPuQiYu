import React from 'react';
import { useOutletContext } from 'react-router-dom';
import UserProfile from '../components/layout/UserProfile';

interface OutletContext {
  theme: 'light' | 'dark';
  onLogout: () => void;
}

const ProfilePage: React.FC = () => {
  const { theme, onLogout } = useOutletContext<OutletContext>();
  return <UserProfile theme={theme} onLogout={onLogout} />;
};

export default ProfilePage;