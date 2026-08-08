import { ArrowLeft, ArrowRight, ExternalLink, FileSpreadsheet, FolderOpen, LayoutDashboard, Trash2, UploadCloud, X } from 'lucide-react';
import { useEffect, useState, type ChangeEvent } from 'react';
import type { DebtLedger } from '../types';
import { getLedgerTotal, getProductCount } from '../lib/analytics';
import { formatCurrency } from '../lib/format';
import { Reveal } from './Reveal';

type UploadedFilesViewProps = {
  activeLedger: DebtLedger | null;
  canClearImported: boolean;
  error: string;
  ledgers: DebtLedger[];
  onClearImported: () => void;
  onOpenExcel: (ledger: DebtLedger) => void;
  onOpenLedger: (id: string) => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  status: string;
};

type UploadedFolderGroup = {
  key: string;
  folderName: string;
  companyNames: string[];
  ledgers: DebtLedger[];
  total: number;
  rowCount: number;
};

function groupUploadedLedgers(ledgers: DebtLedger[]): UploadedFolderGroup[] {
  const groups = new Map<string, UploadedFolderGroup>();

  ledgers.forEach((ledger) => {
    const folderName = ledger.sourceFolder || ledger.debtorName;
    const key = ledger.sourceFolder
      ? `folder::${ledger.sourceFolder}`
      : `ledger::${ledger.debtorName}::${ledger.companyName}`;
    const existing = groups.get(key);
    if (existing) {
      existing.ledgers.push(ledger);
      if (!existing.companyNames.includes(ledger.companyName)) existing.companyNames.push(ledger.companyName);
      existing.total += getLedgerTotal(ledger);
      existing.rowCount += ledger.rows.length;
      return;
    }
    groups.set(key, {
      key,
      folderName,
      companyNames: [ledger.companyName],
      ledgers: [ledger],
      total: getLedgerTotal(ledger),
      rowCount: ledger.rows.length,
    });
  });

  return [...groups.values()].sort((first, second) => {
    return first.folderName.localeCompare(second.folderName, 'zh-CN');
  });
}

export function UploadedFilesView({
  activeLedger,
  canClearImported,
  error,
  ledgers,
  onClearImported,
  onOpenExcel,
  onOpenLedger,
  onUpload,
  status,
}: UploadedFilesViewProps) {
  const groups = groupUploadedLedgers(ledgers);
  const totalRows = ledgers.reduce((sum, ledger) => sum + ledger.rows.length, 0);
  const [openFolderKey, setOpenFolderKey] = useState<string | null>(null);
  const [selectedLedgerId, setSelectedLedgerId] = useState<string | null>(null);
  const openFolder = groups.find((group) => group.key === openFolderKey) ?? null;
  const selectedLedger = openFolder?.ledgers.find((ledger) => ledger.id === selectedLedgerId) ?? null;

  useEffect(() => {
    if (!openFolderKey) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedLedgerId(null);
        setOpenFolderKey(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openFolderKey]);

  const closeFolder = () => {
    setSelectedLedgerId(null);
    setOpenFolderKey(null);
  };

  return (
    <div className="content-stack uploaded-files-page">
      <Reveal className="uploaded-files-hero">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" />UPLOAD LIBRARY</div>
          <h1>上传文件</h1>
          <p>按表格中的欠款人和公司归类，点击文件夹查看其中的表格。</p>
        </div>
        <div className="uploaded-files-summary">
          <div><strong>{groups.length}</strong><span>个文件夹</span></div>
          <div><strong>{ledgers.length}</strong><span>张账单</span></div>
          <div><strong>{totalRows}</strong><span>条明细</span></div>
        </div>
      </Reveal>

      <Reveal className="uploaded-files-toolbar">
        <div className={`uploaded-files-status${error ? ' is-error' : ''}`} aria-live="polite" role="status">
          <span className="status-dot" />
          <span>{error || status || '等待导入表格'}</span>
        </div>
        <div className="uploaded-files-actions">
          <label className="upload-button">
            <FolderOpen size={17} />
            <span>导入文件夹</span>
            <input accept=".csv,.xls,.xlsx,.xlsm" multiple onChange={onUpload} type="file" webkitdirectory="" />
          </label>
          <label className="upload-button is-secondary">
            <FileSpreadsheet size={17} />
            <span>导入表格</span>
            <input accept=".csv,.xls,.xlsx,.xlsm" multiple onChange={onUpload} type="file" />
          </label>
          <button className="clear-import-button" disabled={!canClearImported} onClick={onClearImported} type="button">
            <Trash2 size={16} />
            <span>清除导入</span>
          </button>
        </div>
      </Reveal>

      <Reveal aria-live="polite" className="current-ledger-readonly">
        <span className="current-ledger-icon"><FileSpreadsheet size={18} /></span>
        <div className="current-ledger-copy">
          <span>当前账单</span>
          {activeLedger ? (
            <strong>{activeLedger.year} · {activeLedger.debtorName} · {activeLedger.sheetName}</strong>
          ) : (
            <strong>暂未加载账单</strong>
          )}
        </div>
        {activeLedger && <small>{activeLedger.sourceFile} · {activeLedger.rows.length} 条明细</small>}
      </Reveal>

      {groups.length === 0 ? (
        <Reveal className="uploaded-files-empty">
          <span className="uploaded-files-empty-icon"><UploadCloud size={24} /></span>
          <h2>还没有上传文件</h2>
          <p>导入 Excel 后，文件夹会出现在这里。</p>
        </Reveal>
      ) : (
        <Reveal className="uploaded-folder-grid">
          {groups.map((group) => (
            <button
              aria-label={`打开文件夹 ${group.folderName} ${group.companyNames.join('、')}`}
              className="uploaded-folder-card"
              key={group.key}
              onClick={() => setOpenFolderKey(group.key)}
              type="button"
            >
              <span className="uploaded-folder-card-icon"><FolderOpen size={26} /></span>
              <span className="uploaded-folder-card-copy">
                <strong>{group.folderName}</strong>
                <small>{group.companyNames.join('、')}</small>
              </span>
              <span className="uploaded-folder-card-meta">{group.ledgers.length} 张表 · {group.rowCount} 条明细</span>
              <span className="uploaded-folder-card-footer">
                <strong>{formatCurrency(group.total)}</strong>
                <ArrowRight size={17} />
              </span>
            </button>
          ))}
        </Reveal>
      )}

      {openFolder && (
        <div className="uploaded-modal-backdrop" onMouseDown={closeFolder} role="presentation">
          <div aria-labelledby="uploaded-modal-title" aria-modal="true" className="uploaded-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog">
            {selectedLedger ? (
              <>
                <div className="uploaded-modal-header">
                  <button aria-label="返回文件夹中的表格" className="uploaded-modal-icon-button" onClick={() => setSelectedLedgerId(null)} type="button">
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <span className="uploaded-modal-kicker">表格操作</span>
                    <h2 id="uploaded-modal-title">{selectedLedger.sheetName}</h2>
                  </div>
                  <button aria-label="关闭弹框" className="uploaded-modal-icon-button" onClick={closeFolder} type="button">
                    <X size={18} />
                  </button>
                </div>
                <p className="uploaded-modal-caption">{selectedLedger.year} · {selectedLedger.debtorName} · {selectedLedger.companyName}</p>
                <div className="uploaded-sheet-actions">
                  <button className="uploaded-sheet-action" onClick={() => onOpenExcel(selectedLedger)} type="button">
                    <span className="uploaded-sheet-action-icon is-green"><ExternalLink size={21} /></span>
                    <span><strong>在 Excel 中打开</strong><small>打开这张表格的原始文件</small></span>
                    <ArrowRight size={17} />
                  </button>
                  <button className="uploaded-sheet-action" onClick={() => onOpenLedger(selectedLedger.id)} type="button">
                    <span className="uploaded-sheet-action-icon is-blue"><LayoutDashboard size={21} /></span>
                    <span><strong>打开总览</strong><small>查看欠款分析和明细</small></span>
                    <ArrowRight size={17} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="uploaded-modal-header">
                  <div className="uploaded-modal-folder-icon"><FolderOpen size={21} /></div>
                  <div>
                    <span className="uploaded-modal-kicker">文件夹</span>
                  <h2 id="uploaded-modal-title">{openFolder.folderName}</h2>
                  </div>
                  <button aria-label="关闭弹框" className="uploaded-modal-icon-button" onClick={closeFolder} type="button">
                    <X size={18} />
                  </button>
                </div>
                <p className="uploaded-modal-caption">{openFolder.companyNames.join('、')} · {openFolder.ledgers.length} 张表 · {openFolder.rowCount} 条明细</p>
                <div className="uploaded-modal-sheet-list">
                  {openFolder.ledgers.map((ledger) => (
                    <button aria-label={`打开表格 ${ledger.sheetName} 操作`} className="uploaded-modal-sheet-row" key={ledger.id} onClick={() => setSelectedLedgerId(ledger.id)} type="button">
                      <span className="uploaded-sheet-chip"><FileSpreadsheet size={15} />{ledger.sheetName}</span>
                      <span className="uploaded-sheet-copy"><strong>{ledger.year} 年 · {ledger.debtorName}</strong><small>{ledger.sourceFile} · {ledger.rows.length} 条明细 · {getProductCount(ledger)} 种产品</small></span>
                      <span className="uploaded-sheet-total">{formatCurrency(getLedgerTotal(ledger))}</span>
                      <ArrowRight className="uploaded-sheet-arrow" size={17} />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
