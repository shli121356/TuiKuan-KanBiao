import { AlertTriangle, ArrowDownRight, Boxes, FileSpreadsheet, Wallet } from 'lucide-react';
import { useState } from 'react';
import type { DebtLedger } from '../types';
import { getGroupedRows, getLedgerTotal, getProductCount, getProductTotals, getTrend, type TrendGranularity } from '../lib/analytics';
import { formatCurrency, formatPercent } from '../lib/format';
import { AnimatedNumber } from './AnimatedNumber';
import { DebtTable } from './DebtTable';
import { ProductDonut } from './ProductDonut';
import { Reveal } from './Reveal';
import { TrendChart } from './TrendChart';

type OverviewViewProps = { ledger: DebtLedger };

function describeSummary(label: string): string {
  if (/月份金额/.test(label)) return '当月新增的明细欠款合计';
  if (/加上月余欠/.test(label)) return '叠加上期未结清余额后的阶段金额';
  if (/税点/.test(label)) return '原表记录的税点或费用调整';
  if (/付款|汇公账/.test(label)) return '已付款或已汇款的抵扣金额';
  if (/截至|余欠/.test(label)) return '截至指定日期的最终未结清余额';
  return '工作表中的原始汇总金额';
}

export function OverviewView({ ledger }: OverviewViewProps) {
  const [granularity, setGranularity] = useState<TrendGranularity>('day');
  const total = getLedgerTotal(ledger);
  const trend = getTrend(ledger, granularity);
  const products = getProductTotals(ledger);
  const groups = getGroupedRows(ledger);

  return (
    <div className="content-stack">
      <Reveal className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" />账目总览 / {ledger.sheetName}</div>
          <h1>{ledger.companyName}</h1>
          <p className="hero-subtitle">{ledger.year} 年 · 欠款人 <strong>{ledger.debtorName}</strong></p>
          <div className="total-line"><span className="metric-label"><strong>当前明细合计</strong><small>仅汇总明细金额，不含历史余欠</small></span><strong><AnimatedNumber formatter={formatCurrency} value={total} /></strong></div>
          {ledger.payments !== 0 && <div className="payment-note"><ArrowDownRight size={15} />已记录付款抵扣 {formatCurrency(ledger.payments)}</div>}
        </div>
        <div className="hero-index"><span>截至当前的最终余欠</span><strong>{ledger.balance === null ? '仅明细' : formatCurrency(ledger.balance)}</strong><small>{ledger.balance === null ? '表格未提供余欠余额' : '工作表底部原始余额，不参与明细合计'}</small></div>
      </Reveal>

      <Reveal className="summary-strip" delay={0.05}>
        <div className="summary-item"><span className="summary-icon blue"><FileSpreadsheet size={16} /></span><div><strong>{formatCurrency(total)}</strong><span>明细合计 · {ledger.rows.length} 条</span></div></div>
        <div className="summary-item"><span className="summary-icon violet"><Wallet size={16} /></span><div><strong>{ledger.balance === null ? '—' : formatCurrency(ledger.balance)}</strong><span>表格余欠余额</span></div></div>
        <div className="summary-item"><span className="summary-icon mint"><ArrowDownRight size={16} /></span><div><strong>{ledger.payments === 0 ? '—' : formatCurrency(ledger.payments)}</strong><span>已记录付款抵扣</span></div></div>
        <div className="summary-item"><span className="summary-icon amber"><Boxes size={16} /></span><div><strong>{ledger.rows.length} 条 / {getProductCount(ledger)} 种</strong><span>明细 / 产品结构</span></div></div>
      </Reveal>

      <Reveal className="settlement-panel" delay={0.07}>
        <div className="section-heading settlement-heading"><div><span className="section-kicker">Source calculation</span><h2>原表计算明细</h2></div><span className="section-caption">所有金额按工作表原值展示，未压缩、未四舍五入</span></div>
        <div className="settlement-list">
          {ledger.summaries.length > 0 ? ledger.summaries.map((summary, index) => (
            <div className="settlement-row" key={`${summary.label}-${index}`}>
              <div><strong>{summary.label}</strong><span>{describeSummary(summary.label)}</span></div>
              <strong className={summary.amount < 0 ? 'is-negative' : ''}>{formatCurrency(summary.amount)}</strong>
            </div>
          )) : <div className="settlement-empty">当前工作表没有单独的底部汇总行，页面仅展示明细合计。</div>}
        </div>
      </Reveal>

      {ledger.warnings.length > 0 && <Reveal className="quality-notice" delay={0.08}><AlertTriangle size={17} /><span>{ledger.warnings.join('；')}</span></Reveal>}

      <div className="section-heading"><div><span className="section-kicker">Debt signals</span><h2>欠款结构</h2></div><span className="section-caption">根据明细金额重新汇总</span></div>
      <div className="visual-grid">
        <Reveal className="chart-panel" delay={0.1}><div className="panel-heading"><div><span className="panel-label">{granularity === 'day' ? 'DAILY TREND' : 'MONTHLY TREND'}</span><h3>{granularity === 'day' ? '日度欠款趋势' : '月度欠款趋势'}</h3></div><div className="panel-tools"><div aria-label="趋势粒度" className="chart-mode" role="group"><button className={granularity === 'day' ? 'is-active' : ''} onClick={() => setGranularity('day')} type="button">日</button><button className={granularity === 'month' ? 'is-active' : ''} onClick={() => setGranularity('month')} type="button">月</button></div><span className="panel-value">{formatPercent(total === 0 ? 0 : (trend[trend.length - 1]?.amount ?? 0) / total)} <small>最近{granularity === 'day' ? '一笔' : '月份'}占比</small></span></div></div><TrendChart data={trend} /></Reveal>
        <Reveal className="chart-panel" delay={0.16}><div className="panel-heading"><div><span className="panel-label">PRODUCT MIX</span><h3>产品欠款构成</h3></div><span className="panel-value">{products.length} <small>产品项</small></span></div><ProductDonut data={products} /></Reveal>
      </div>

      <Reveal className="table-section" delay={0.08}><div className="section-heading table-heading"><div><span className="section-kicker">Ledger details</span><h2>明细账本</h2></div><span className="section-caption">按月份整理 · {ledger.rows.length} 条记录</span></div><DebtTable groups={groups} /></Reveal>
    </div>
  );
}
