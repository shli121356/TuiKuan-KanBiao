import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppShell } from './components/AppShell';
import { OverviewView } from './components/OverviewView';
import { LeaderboardView } from './components/LeaderboardView';
import { UploadedFilesView } from './components/UploadedFilesView';
import type { DashboardView, DebtLedger } from './types';
import { appendUniqueLedgers, combineParseResults, getLedgerIdentity, loadDefaultWorkbooks, parseWorkbook } from './lib/workbook';

function sortLedgers(ledgers: DebtLedger[]): DebtLedger[] {
  return [...ledgers].sort((first, second) => Number(second.year) - Number(first.year));
}

type UploadFileEntry = {
  file: File;
  sourceFolder: string;
  sourceUrl: string;
};

function getSourceFolder(file: File): string {
  const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath ?? '';
  const pathParts = relativePath.split(/[\\/]/).filter(Boolean);
  return pathParts.length > 1 ? pathParts[pathParts.length - 2] ?? '' : '';
}

export default function App() {
  const [bundledLedgers, setBundledLedgers] = useState<DebtLedger[]>([]);
  const [importedLedgers, setImportedLedgers] = useState<DebtLedger[]>([]);
  const [activeLedgerId, setActiveLedgerId] = useState('');
  const [view, setView] = useState<DashboardView>('overview');
  const [returnToUploads, setReturnToUploads] = useState(false);
  const [status, setStatus] = useState('正在读取账表文件夹…');
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    loadDefaultWorkbooks()
      .then((result) => {
        if (!alive) return;
        const sorted = sortLedgers(result.ledgers.map((ledger) => ({ ...ledger, id: getLedgerIdentity(ledger) })));
        setBundledLedgers(sorted);
        setActiveLedgerId(sorted[0]?.id ?? '');
        setStatus(result.ignoredSheets.length > 0 ? `内置 ${sorted.length} 张 · 空表 ${result.ignoredSheets.length} 个` : `内置 ${sorted.length} 张账单`);
      })
      .catch((reason: unknown) => {
        if (!alive) return;
        setError(reason instanceof Error ? reason.message : '默认工作簿读取失败');
        setStatus('');
      });
    return () => {
      alive = false;
    };
  }, []);

  const ledgers = useMemo(() => sortLedgers([...bundledLedgers, ...importedLedgers]), [bundledLedgers, importedLedgers]);
  const activeLedger = useMemo(() => ledgers.find((ledger) => ledger.id === activeLedgerId) ?? null, [activeLedgerId, ledgers]);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    setError('');
    setStatus(`解析中 · ${files.length} 个文件`);
    const uploadEntries: UploadFileEntry[] = files.map((file) => ({
      file,
      sourceFolder: getSourceFolder(file),
      sourceUrl: URL.createObjectURL(file),
    }));
    try {
      const parsedUploads = await Promise.all(uploadEntries.map(async ({ file, sourceFolder, sourceUrl }) => ({
        result: await parseWorkbook(await file.arrayBuffer(), file.name),
        sourceFile: file.name,
        sourceFolder,
        sourceUrl,
      })));
      const result = combineParseResults(parsedUploads.map(({ result: parsedResult }) => parsedResult));
      if (result.ledgers.length === 0) throw new Error('没有找到包含有效欠款明细的 Sheet');
      const incoming = parsedUploads.flatMap(({ result: parsedResult, sourceFile, sourceFolder, sourceUrl }) => parsedResult.ledgers.map((ledger) => {
        const enrichedLedger = { ...ledger, sourceFile, sourceFolder: sourceFolder || undefined, sourceUrl };
        return { ...enrichedLedger, id: getLedgerIdentity(enrichedLedger) };
      }));
      const { added, duplicateCount } = appendUniqueLedgers([...bundledLedgers, ...importedLedgers], incoming);
      const addedSourceUrls = new Set(added.map((ledger) => ledger.sourceUrl).filter(Boolean));
      uploadEntries.forEach(({ sourceUrl }) => {
        if (!addedSourceUrls.has(sourceUrl)) URL.revokeObjectURL(sourceUrl);
      });
      setImportedLedgers((current) => sortLedgers([...current, ...added]));
      if (added[0]) setActiveLedgerId(added[0].id);
      setStatus(`新增 ${added.length} 张 · 重复 ${duplicateCount} 张 · 空表 ${result.ignoredSheets.length} 个`);
    } catch (reason: unknown) {
      uploadEntries.forEach(({ sourceUrl }) => URL.revokeObjectURL(sourceUrl));
      setError(reason instanceof Error ? reason.message : '文件解析失败');
      setStatus('');
    }
  };

  const handleClearImported = () => {
    const clearedCount = importedLedgers.length;
    if (clearedCount === 0) return;
    importedLedgers.forEach((ledger) => {
      if (ledger.sourceUrl) URL.revokeObjectURL(ledger.sourceUrl);
    });
    setImportedLedgers([]);
    if (!bundledLedgers.some((ledger) => ledger.id === activeLedgerId)) {
      setActiveLedgerId(bundledLedgers[0]?.id ?? '');
    }
    setStatus(`已清除 ${clearedCount} 张导入账单`);
    setError('');
  };

  const handleOpenUploadedLedger = (ledgerId: string) => {
    setActiveLedgerId(ledgerId);
    setReturnToUploads(true);
    setView('overview');
  };

  const handleViewChange = (nextView: DashboardView) => {
    if (nextView !== 'overview') setReturnToUploads(false);
    setView(nextView);
  };

  const handleReturnToUploads = () => {
    setReturnToUploads(false);
    setView('uploads');
  };

  const handleOpenExcel = (ledger: DebtLedger) => {
    if (!ledger.sourceUrl) {
      setError('原始 Excel 文件链接不可用，请重新导入该表格');
      return;
    }
    window.open(ledger.sourceUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <AppShell
      canReturnToUploads={returnToUploads && view === 'overview'}
      error={error}
      onBackToUploads={handleReturnToUploads}
      onViewChange={handleViewChange}
      view={view}
    >
      <AnimatePresence mode="wait">
        <motion.div key={`${activeLedgerId}-${view}`} animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 8 }} transition={{ duration: 0.32 }}>
          {view === 'uploads' ? (
            <UploadedFilesView activeLedger={activeLedger} canClearImported={importedLedgers.length > 0} error={error} ledgers={importedLedgers} onClearImported={handleClearImported} onOpenExcel={handleOpenExcel} onOpenLedger={handleOpenUploadedLedger} onUpload={handleUpload} status={status} />
          ) : activeLedger ? (
            view === 'overview' ? <OverviewView ledger={activeLedger} /> : <LeaderboardView ledger={activeLedger} />
          ) : (
            <div className="empty-state"><span className="empty-state-icon">⌁</span><h1>正在准备账本</h1><p>稍等片刻，数据会在浏览器中完成解析。</p></div>
          )}
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}
