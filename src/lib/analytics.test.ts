import { describe, expect, test } from 'vitest';
import type { DebtLedger } from '../types';
import { getGroupedRows, getLedgerTotal, getMonthlyTrend, getProductCount, getProductTotals, getRankedProducts, getTrend } from './analytics';

const ledger: DebtLedger = {
  id: 'fixture',
  sourceFile: 'fixture.xlsx',
  sheetName: 'Sheet1',
  companyName: '益润新材料有限公司',
  year: '2025',
  debtorName: '夏建强',
  rows: [
    { id: '1', date: '2025-01-02', productName: '7001-5里皮', unit: '米', quantity: 20, unitPrice: 15, totalDebt: 300 },
    { id: '2', date: '2025-01-02', productName: '黑色羊文13', unit: '米', quantity: 12, unitPrice: 14.5, totalDebt: 174 },
    { id: '3', date: '2025-02-01', productName: '7001-5里皮', unit: '米', quantity: 4, unitPrice: 12.5, totalDebt: 50 },
  ],
  summaries: [],
  balance: 1000,
  payments: -100,
  warnings: [],
};

describe('debt analytics', () => {
  test('sums only detail rows for the ledger total', () => {
    expect(getLedgerTotal(ledger)).toBe(524);
  });

  test('groups detail debt by calendar month in chronological order', () => {
    expect(getMonthlyTrend(ledger)).toEqual([
      { key: '2025-01', label: '2025-01', amount: 474 },
      { key: '2025-02', label: '2025-02', amount: 50 },
    ]);
  });

  test('supports daily trend points for the default detailed view', () => {
    expect(getTrend(ledger, 'day')).toEqual([
      { key: '2025-01-02', label: '01.02', amount: 474 },
      { key: '2025-02-01', label: '02.01', amount: 50 },
    ]);
    expect(getTrend(ledger, 'month')).toEqual(getMonthlyTrend(ledger));
  });

  test('aggregates products and returns ranked progress values', () => {
    expect(getProductTotals(ledger)).toEqual([
      { productName: '7001-5里皮', amount: 350, share: 350 / 524 },
      { productName: '黑色羊文13', amount: 174, share: 174 / 524 },
    ]);
    expect(getRankedProducts(ledger)[0]).toMatchObject({ productName: '7001-5里皮', amount: 350, progress: 1 });
  });

  test('groups rows by month and exposes product count', () => {
    expect(getGroupedRows(ledger).map((group) => [group.key, group.rows.length, group.total])).toEqual([
      ['2025-01', 2, 474],
      ['2025-02', 1, 50],
    ]);
    expect(getProductCount(ledger)).toBe(2);
  });
});
