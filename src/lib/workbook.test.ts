import { describe, expect, test } from 'vitest';
import { parseSheetRows } from './workbook';

const rows: unknown[][] = [
  ['供货商。。。益润新材料有限公司'],
  ['客户欠款...夏建强'],
  [],
  ['2025年'],
  [45659, '7001-5里皮', '米', 20, 15, 300],
  [null, '黑色羊文13', '米', 12, 14.5, 174],
  [null, null, null, null, '1月份金额', 11252.25],
  [null, null, '7月30号汇公账', null, null, -51300],
  [null, null, '截至2026年7月30号余欠我方合计金额', null, null, 149661.75],
];

describe('parseSheetRows', () => {
  test('finds metadata, carries dates, and separates detail from summaries', () => {
    const ledger = parseSheetRows(rows, 'Sheet1', 'demo.xlsx');

    expect(ledger).not.toBeNull();
    expect(ledger?.companyName).toBe('益润新材料有限公司');
    expect(ledger?.debtorName).toBe('夏建强');
    expect(ledger?.year).toBe('2025');
    expect(ledger?.rows).toHaveLength(2);
    const parsedRows = ledger?.rows ?? [];
    expect(parsedRows[1]?.date).toBe('2025-01-02');
    expect((parsedRows[0]?.totalDebt ?? 0) + (parsedRows[1]?.totalDebt ?? 0)).toBe(474);
    expect(ledger?.summaries[0]).toMatchObject({ label: '1月份金额', amount: 11252.25, month: '01' });
    expect(ledger?.payments).toBe(-51300);
    expect(ledger?.balance).toBe(149661.75);
  });

  test('returns null for a sheet with no detail rows', () => {
    expect(parseSheetRows([['空表'], [], []], 'Sheet3', 'demo.xlsx')).toBeNull();
  });

});
