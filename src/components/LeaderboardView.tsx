import { ArrowUpRight, PackageOpen, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import type { DebtLedger } from '../types';
import { getLedgerTotal, getRankedProducts } from '../lib/analytics';
import { formatCurrency, formatPercent } from '../lib/format';
import { Reveal } from './Reveal';

type LeaderboardViewProps = { ledger: DebtLedger };

export function LeaderboardView({ ledger }: LeaderboardViewProps) {
  const ranked = getRankedProducts(ledger);
  const total = getLedgerTotal(ledger);
  const leader = ranked[0];

  return (
    <div className="content-stack leaderboard-page">
      <Reveal className="ranking-hero">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" />Product debt / {ledger.sheetName}</div>
          <h1>产品欠款排行</h1>
          <p>按产品聚合明细金额，快速定位对当前账目影响最大的项目。</p>
        </div>
        <div className="leader-callout"><Sparkles size={17} /><span>最高项</span><strong>{leader?.productName ?? '暂无产品'}</strong><small>{leader ? `${formatCurrency(leader.amount)} · ${formatPercent(total === 0 ? 0 : leader.amount / total)} of total` : '—'}</small></div>
      </Reveal>

      <Reveal className="ranking-summary" delay={0.06}>
        <div><span>排行产品</span><strong>{ranked.length}</strong></div>
        <div><span>总明细欠款</span><strong>{formatCurrency(total)}</strong></div>
        <div><span>最大项占比</span><strong>{formatPercent(leader && total > 0 ? leader.amount / total : 0)}</strong></div>
      </Reveal>

      <div className="ranking-list" aria-label="产品欠款排行榜">
        {ranked.map((product, index) => {
          const rows = ledger.rows.filter((row) => row.productName === product.productName);
          return (
            <Reveal className={`rank-item rank-${index + 1}`} delay={0.05 + index * 0.035} key={product.productName}>
              <div className="rank-number">{String(index + 1).padStart(2, '0')}</div>
              <div className="rank-main">
                <div className="rank-topline"><div className="rank-name"><span className="rank-icon"><PackageOpen size={15} /></span><strong>{product.productName}</strong></div><div className="rank-amount"><strong>{formatCurrency(product.amount)}</strong><span>{formatPercent(product.share)}</span></div></div>
                <div className="rank-track"><motion.span animate={{ width: `${product.progress * 100}%` }} initial={{ width: 0 }} transition={{ delay: 0.25 + index * 0.04, duration: 0.66, ease: [0.22, 1, 0.36, 1] }} /></div>
                <div className="rank-bottomline"><span>{rows.length} 条明细 · {rows[0]?.unit ?? '未标注单位'}</span><span className="rank-action"><ArrowUpRight size={13} />查看明细</span></div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
