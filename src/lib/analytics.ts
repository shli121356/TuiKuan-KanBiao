import type { DebtLedger, DebtRow } from '../types';

export type MonthlyPoint = {
  key: string;
  label: string;
  amount: number;
};

export type ProductTotal = {
  productName: string;
  amount: number;
  share: number;
};

export type RankedProduct = ProductTotal & {
  progress: number;
};

export type DebtGroup = {
  key: string;
  label: string;
  total: number;
  rows: DebtRow[];
};

export function getLedgerTotal(ledger: DebtLedger): number {
  return ledger.rows.reduce((sum, row) => sum + row.totalDebt, 0);
}

export function getMonthlyTrend(ledger: DebtLedger): MonthlyPoint[] {
  const totals = new Map<string, number>();
  ledger.rows.forEach((row) => {
    const key = row.date?.slice(0, 7) ?? 'unknown';
    totals.set(key, (totals.get(key) ?? 0) + row.totalDebt);
  });

  return [...totals.entries()]
    .sort(([first], [second]) => {
      if (first === 'unknown') return 1;
      if (second === 'unknown') return -1;
      return first.localeCompare(second);
    })
    .map(([key, amount]) => ({
      key,
      label: key === 'unknown' ? '未标注日期' : key,
      amount,
    }));
}

export function getProductTotals(ledger: DebtLedger): ProductTotal[] {
  const totals = new Map<string, number>();
  ledger.rows.forEach((row) => {
    totals.set(row.productName, (totals.get(row.productName) ?? 0) + row.totalDebt);
  });

  const ledgerTotal = getLedgerTotal(ledger);
  return [...totals.entries()]
    .map(([productName, amount]) => ({
      productName,
      amount,
      share: ledgerTotal === 0 ? 0 : amount / ledgerTotal,
    }))
    .sort((first, second) => second.amount - first.amount);
}

export function getRankedProducts(ledger: DebtLedger): RankedProduct[] {
  const totals = getProductTotals(ledger);
  const maxAmount = totals[0]?.amount ?? 0;
  return totals.map((item) => ({
    ...item,
    progress: maxAmount === 0 ? 0 : item.amount / maxAmount,
  }));
}

export function getGroupedRows(ledger: DebtLedger): DebtGroup[] {
  const groups = new Map<string, DebtGroup>();
  ledger.rows.forEach((row) => {
    const key = row.date?.slice(0, 7) ?? 'unknown';
    const existing = groups.get(key);
    if (existing) {
      existing.rows.push(row);
      existing.total += row.totalDebt;
      return;
    }
    groups.set(key, {
      key,
      label: key === 'unknown' ? '未标注日期' : `${key.slice(0, 4)}年${key.slice(5)}月`,
      total: row.totalDebt,
      rows: [row],
    });
  });

  return [...groups.values()].sort((first, second) => {
    if (first.key === 'unknown') return 1;
    if (second.key === 'unknown') return -1;
    return first.key.localeCompare(second.key);
  });
}

export function getProductCount(ledger: DebtLedger): number {
  return new Set(ledger.rows.map((row) => row.productName)).size;
}

export function getQualitySummary(ledger: DebtLedger): string[] {
  return [...ledger.warnings];
}
