import React from 'react';
import { useOutletContext } from 'react-router-dom';
import StageMode from '../components/modes/StageMode';

interface OutletContext {
  theme: 'light' | 'dark';
}

const StagePage: React.FC = () => {
  const { theme } = useOutletContext<OutletContext>();
  return <StageMode theme={theme} />;
};

export default StagePage;