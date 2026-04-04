import React from 'react';
import { WifiOff } from 'lucide-react';
import { PALETTE } from '../../constants/palette';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

/**
 * 离线提示条 — 检测到断网时在页面顶部显示
 */
const OfflineBanner: React.FC = () => {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white"
      style={{ background: PALETTE.orange.accent }}
    >
      <WifiOff size={14} />
      网络已断开，部分功能暂时不可用
    </div>
  );
};

export default OfflineBanner;
