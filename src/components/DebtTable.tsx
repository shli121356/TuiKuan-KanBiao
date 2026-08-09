import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { DebtGroup } from '../lib/analytics';
import { formatCurrency, formatDate, formatQuantity } from '../lib/format';

type DebtTableProps = { groups: DebtGroup[] };

export function DebtTable({ groups }: DebtTableProps) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>(() => ({ [groups[0]?.key ?? '']: true }));

  return (
    <div className="debt-table-shell">
      <div className="table-scroll">
        <table className="debt-table">
          <thead><tr><th>日期</th><th>产品</th><th>单位</th><th className="numeric">数量</th><th className="numeric">单价</th><th className="numeric">欠款金额</th></tr></thead>
          {groups.map((group) => {
            const isOpen = expanded[group.key] ?? false;
            return (
              <tbody key={group.key}>
                <tr className="group-row">
                  <td colSpan={6}><button aria-expanded={isOpen} className="group-toggle" onClick={() => setExpanded((current) => ({ ...current, [group.key]: !isOpen }))} type="button"><span className="group-chevron" style={{ transform: `rotate(${isOpen ? 180 : 0}deg)` }}><ChevronDown size={15} /></span><span className="group-label">{group.label}</span><span className="group-count">{group.rows.length} 条明细</span><strong>{formatCurrency(group.total)}</strong></button></td>
                </tr>
                <AnimatePresence initial={false}>
                  {isOpen && group.rows.map((row) => (
                    <motion.tr animate={{ opacity: 1, y: 0 }} className="detail-row" exit={{ opacity: 0, y: -5 }} initial={{ opacity: 0, y: -5 }} key={row.id} transition={{ duration: 0.18 }}>
                      <td>{formatDate(row.date)}</td>
                      <td className="product-cell">{row.productName}</td>
                      <td>{row.unit ?? '—'}</td>
                      <td className="numeric">{formatQuantity(row.quantity)}</td>
                      <td className="numeric">{row.unitPrice === null ? '—' : formatCurrency(row.unitPrice)}</td>
                      <td className="numeric amount-cell">{formatCurrency(row.totalDebt)}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            );
          })}
        </table>
      </div>
    </div>
  );
}
