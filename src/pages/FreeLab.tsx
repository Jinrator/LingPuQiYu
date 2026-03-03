import React from 'react';
import { useOutletContext } from 'react-router-dom';
import FreeLab from '../components/modes/FreeLab';

interface OutletContext {
  theme: 'light' | 'dark';
}

const FreeLabPage: React.FC = () => {
  const { theme } = useOutletContext<OutletContext>();

  return (
    <div className="h-full">
      <FreeLab theme={theme} />
    </div>
  );
};

export default FreeLabPage;