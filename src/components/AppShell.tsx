import type { ChangeEvent, ReactNode } from 'react';
import { ChevronDown, FileUp, LayoutDashboard, Trophy } from 'lucide-react';
import type { DashboardView, DebtLedger } from '../types';

type AppShellProps = {
  ledgers: DebtLedger[];
  activeLedgerId: string;
  view: DashboardView;
  status: string;
  error: string;
  onLedgerChange: (id: string) => void;
  onViewChange: (view: DashboardView) => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  children: ReactNode;
};

export function AppShell({
  ledgers,
  activeLedgerId,
  view,
  status,
  error,
  onLedgerChange,
  onViewChange,
  onUpload,
  children,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-lockup" aria-label="燃点欠款项目可视化">
            <span className="brand-mark">燃</span>
            <span className="brand-copy">
              <strong>燃点</strong>
              <small>欠款项目可视化</small>
            </span>
          </div>

          <nav className="view-switcher" aria-label="页面视图">
            <button className={view === 'overview' ? 'is-active' : ''} onClick={() => onViewChange('overview')} type="button">
              <LayoutDashboard size={15} strokeWidth={2.2} />
              <span>总览</span>
            </button>
            <button className={view === 'leaderboard' ? 'is-active' : ''} onClick={() => onViewChange('leaderboard')} type="button">
              <Trophy size={15} strokeWidth={2.2} />
              <span>欠款排行</span>
            </button>
          </nav>

          <div className="topbar-actions">
            <label className="upload-button" title="导入 Excel 工作簿">
              <FileUp size={16} strokeWidth={2.2} />
              <span>导入表格</span>
              <input accept=".xlsx,.xls,.xlsm" onChange={onUpload} type="file" />
            </label>
            <label className="ledger-picker">
              <span className="picker-label">当前账单</span>
              <span className="sr-only">选择账单</span>
              <select value={activeLedgerId} onChange={(event) => onLedgerChange(event.target.value)}>
                {ledgers.map((ledger) => (
                  <option key={ledger.id} value={ledger.id}>
                    {ledger.year} · {ledger.debtorName} · {ledger.sheetName}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} aria-hidden="true" />
            </label>
          </div>
        </div>
      </header>

      <main className="page-frame">
        {(status || error) && (
          <div className={`status-banner ${error ? 'is-error' : ''}`} role="status">
            <span className="status-dot" />
            <span>{error || status}</span>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
