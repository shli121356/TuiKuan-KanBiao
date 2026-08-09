import type { ReactNode } from 'react';
import { ArrowLeft, FolderOpen, LayoutDashboard, Trophy } from 'lucide-react';
import type { DashboardView } from '../types';

type AppShellProps = {
  canReturnToUploads: boolean;
  view: DashboardView;
  error: string;
  onBackToUploads: () => void;
  onViewChange: (view: DashboardView) => void;
  children: ReactNode;
};

export function AppShell({
  canReturnToUploads,
  view,
  error,
  onBackToUploads,
  onViewChange,
  children,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          {canReturnToUploads && (
            <button aria-label="返回上传文件" className="topbar-back-button" onClick={onBackToUploads} type="button">
              <ArrowLeft size={16} />
              <span>返回上传文件</span>
            </button>
          )}
          <div className="brand-lockup" aria-label="燃点欠款项目可视化">
            <span className="brand-mark">燃</span>
            <span className="brand-copy">
              <strong>燃点</strong>
              <small>欠款项目可视化</small>
            </span>
          </div>

          <nav className="view-switcher" aria-label="页面视图">
            <button className={view === 'uploads' ? 'is-active' : ''} onClick={() => onViewChange('uploads')} type="button">
              <FolderOpen size={15} strokeWidth={2.2} />
              <span>上传文件</span>
            </button>
            <button className={view === 'overview' ? 'is-active' : ''} onClick={() => onViewChange('overview')} type="button">
              <LayoutDashboard size={15} strokeWidth={2.2} />
              <span>总览</span>
            </button>
            <button className={view === 'leaderboard' ? 'is-active' : ''} onClick={() => onViewChange('leaderboard')} type="button">
              <Trophy size={15} strokeWidth={2.2} />
              <span>欠款排行</span>
            </button>
          </nav>

        </div>
      </header>

      <main className="page-frame">
        {error && (
          <div className="status-banner is-error" role="status">
            <span className="status-dot" />
            <span>{error}</span>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
