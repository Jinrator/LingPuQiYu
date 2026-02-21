import React from 'react';
import { useOutletContext } from 'react-router-dom';
import AdventureMode from '../components/modes/AdventureMode';

interface OutletContext {
  theme: 'light' | 'dark';
}

const AdventurePage: React.FC = () => {
  const { theme } = useOutletContext<OutletContext>();
  return <AdventureMode theme={theme} />;
};

export default AdventurePage;