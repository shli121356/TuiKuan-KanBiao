import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppShell } from './components/AppShell';
import { OverviewView } from './components/OverviewView';
import { LeaderboardView } from './components/LeaderboardView';
import type { DashboardView, DebtLedger } from './types';
import { combineParseResults, loadDefaultWorkbooks, parseWorkbook } from './lib/workbook';

function sortLedgers(ledgers: DebtLedger[]): DebtLedger[] {
  return [...ledgers].sort((first, second) => Number(second.year) - Number(first.year));
}

export default function App() {
  const [ledgers, setLedgers] = useState<DebtLedger[]>([]);
  const [activeLedgerId, setActiveLedgerId] = useState('');
  const [view, setView] = useState<DashboardView>('overview');
  const [status, setStatus] = useState('正在读取账表文件夹…');
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    loadDefaultWorkbooks()
      .then((result) => {
        if (!alive) return;
        const sorted = sortLedgers(result.ledgers);
        setLedgers(sorted);
        setActiveLedgerId(sorted[0]?.id ?? '');
        setStatus(result.ignoredSheets.length > 0 ? `已重置并载入 ${sorted.length} 张账单，忽略空表 ${result.ignoredSheets.join('、')}` : `已重置并载入 ${sorted.length} 张账单`);
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

  const activeLedger = useMemo(() => ledgers.find((ledger) => ledger.id === activeLedgerId) ?? null, [activeLedgerId, ledgers]);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    setError('');
    setStatus(`正在解析 ${files.length} 个表格…`);
    try {
      const result = combineParseResults(await Promise.all(files.map(async (file) => parseWorkbook(await file.arrayBuffer(), file.name))));
      if (result.ledgers.length === 0) throw new Error('没有找到包含有效欠款明细的 Sheet');
      const stamp = Date.now();
      const uploaded = result.ledgers.map((ledger, index) => ({ ...ledger, id: `${ledger.id}-${stamp}-${index}` }));
      setLedgers((current) => sortLedgers([...current, ...uploaded]));
      setActiveLedgerId(uploaded[0].id);
      setStatus(result.ignoredSheets.length > 0 ? `已追加 ${files.length} 个表格，共 ${uploaded.length} 张账单，忽略空表 ${result.ignoredSheets.join('、')}` : `已追加 ${files.length} 个表格，共 ${uploaded.length} 张账单`);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : '文件解析失败');
      setStatus('');
    }
  };

  return (
    <AppShell
      activeLedgerId={activeLedgerId}
      ledgers={ledgers}
      onLedgerChange={setActiveLedgerId}
      onUpload={handleUpload}
      onViewChange={setView}
      status={status}
      error={error}
      view={view}
    >
      <AnimatePresence mode="wait">
        <motion.div key={`${activeLedgerId}-${view}`} animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 8 }} transition={{ duration: 0.32 }}>
          {activeLedger ? (
            view === 'overview' ? <OverviewView ledger={activeLedger} /> : <LeaderboardView ledger={activeLedger} />
          ) : (
            <div className="empty-state"><span className="empty-state-icon">⌁</span><h1>正在准备账本</h1><p>稍等片刻，数据会在浏览器中完成解析。</p></div>
          )}
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}
