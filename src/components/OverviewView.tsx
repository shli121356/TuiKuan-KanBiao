import { AlertTriangle, ArrowDownRight, Boxes, CalendarDays, FileSpreadsheet, Wallet } from 'lucide-react';
import type { DebtLedger } from '../types';
import { getGroupedRows, getLedgerTotal, getProductCount, getProductTotals, getMonthlyTrend } from '../lib/analytics';
import { formatCompactCurrency, formatCurrency, formatPercent } from '../lib/format';
import { AnimatedNumber } from './AnimatedNumber';
import { DebtTable } from './DebtTable';
import { ProductDonut } from './ProductDonut';
import { Reveal } from './Reveal';
import { TrendChart } from './TrendChart';

type OverviewViewProps = { ledger: DebtLedger };

export function OverviewView({ ledger }: OverviewViewProps) {
  const total = getLedgerTotal(ledger);
  const monthly = getMonthlyTrend(ledger);
  const products = getProductTotals(ledger);
  const groups = getGroupedRows(ledger);

  return (
    <div className="content-stack">
      <Reveal className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" />账目总览 / {ledger.sheetName}</div>
          <h1>{ledger.companyName}</h1>
          <p className="hero-subtitle">{ledger.year} 年 · 欠款人 <strong>{ledger.debtorName}</strong></p>
          <div className="total-line"><span>当前明细总欠款</span><strong><AnimatedNumber formatter={formatCurrency} value={total} /></strong></div>
          {ledger.payments !== 0 && <div className="payment-note"><ArrowDownRight size={15} />已记录付款抵扣 {formatCurrency(ledger.payments)}</div>}
        </div>
        <div className="hero-index"><span>余额状态</span><strong>{ledger.balance === null ? '仅明细' : formatCompactCurrency(ledger.balance)}</strong><small>{ledger.balance === null ? '表格未提供余欠余额' : '表格底部余欠余额'}</small></div>
      </Reveal>

      <Reveal className="summary-strip" delay={0.05}>
        <div className="summary-item"><span className="summary-icon blue"><FileSpreadsheet size={16} /></span><div><strong>{ledger.rows.length}</strong><span>条明细</span></div></div>
        <div className="summary-item"><span className="summary-icon mint"><Boxes size={16} /></span><div><strong>{getProductCount(ledger)}</strong><span>种产品</span></div></div>
        <div className="summary-item"><span className="summary-icon amber"><CalendarDays size={16} /></span><div><strong>{monthly.length}</strong><span>个统计月份</span></div></div>
        <div className="summary-item"><span className="summary-icon violet"><Wallet size={16} /></span><div><strong>{ledger.balance === null ? '—' : formatCurrency(ledger.balance)}</strong><span>表格余欠</span></div></div>
      </Reveal>

      {ledger.warnings.length > 0 && <Reveal className="quality-notice" delay={0.08}><AlertTriangle size={17} /><span>{ledger.warnings.join('；')}</span></Reveal>}

      <div className="section-heading"><div><span className="section-kicker">Debt signals</span><h2>欠款结构</h2></div><span className="section-caption">根据明细金额重新汇总</span></div>
      <div className="visual-grid">
        <Reveal className="chart-panel" delay={0.1}><div className="panel-heading"><div><span className="panel-label">MONTHLY TREND</span><h3>月度欠款趋势</h3></div><span className="panel-value">{formatPercent(total === 0 ? 0 : (monthly[monthly.length - 1]?.amount ?? 0) / total)} <small>最近月份占比</small></span></div><TrendChart data={monthly} /></Reveal>
        <Reveal className="chart-panel" delay={0.16}><div className="panel-heading"><div><span className="panel-label">PRODUCT MIX</span><h3>产品欠款构成</h3></div><span className="panel-value">{products.length} <small>产品项</small></span></div><ProductDonut data={products} /></Reveal>
      </div>

      <Reveal className="table-section" delay={0.08}><div className="section-heading table-heading"><div><span className="section-kicker">Ledger details</span><h2>明细账本</h2></div><span className="section-caption">按月份整理 · {ledger.rows.length} 条记录</span></div><DebtTable groups={groups} /></Reveal>
    </div>
  );
}
