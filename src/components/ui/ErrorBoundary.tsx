import React from 'react';
import { RefreshCw } from 'lucide-react';
import { PALETTE } from '../../constants/palette';

interface Props {
  children: React.ReactNode;
  /** 出错时显示的辅助文案 */
  message?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
}

/**
 * 全局 Error Boundary
 * - 捕获 React 渲染错误，防止白屏
 * - 识别 chunk 加载失败（弱网），提供"刷新重试"
 * - 其他错误提供"重试"按钮（重置 state 重新渲染子树）
 */
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, isChunkError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const msg = error?.message || '';
    const isChunkError =
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Loading chunk') ||
      msg.includes('Loading CSS chunk') ||
      msg.includes('Importing a module script failed');
    return { hasError: true, error, isChunkError };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleRetry = () => {
    if (this.state.isChunkError) {
      // chunk 失败 → 强制刷新页面重新拉取资源
      window.location.reload();
    } else {
      // 普通错误 → 重置 boundary 重新渲染子树
      this.setState({ hasError: false, error: null, isChunkError: false });
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { isChunkError } = this.state;

    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F5F7FA] p-6">
        <div className="max-w-sm w-full text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: PALETTE.orange.bg }}
          >
            <span className="text-2xl">
              {isChunkError ? '📡' : '⚠️'}
            </span>
          </div>

          <h2 className="text-sm font-bold text-slate-800 mb-2">
            {isChunkError ? '页面资源加载失败' : '页面出了点问题'}
          </h2>

          <p className="text-xs font-medium text-slate-400 leading-relaxed mb-6">
            {isChunkError
              ? '网络连接不稳定，部分资源未能加载。请检查网络后重试。'
              : this.props.message || '遇到了意外错误，请尝试重试。'}
          </p>

          <button
            onClick={this.handleRetry}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: '#1e293b' }}
          >
            <RefreshCw size={15} />
            {isChunkError ? '刷新页面' : '重试'}
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
