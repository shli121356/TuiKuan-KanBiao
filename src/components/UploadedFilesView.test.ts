import { describe, expect, it } from 'vitest';
import { groupUploadedLedgers } from './UploadedFilesView';
import type { DebtLedger } from '../types';

function ledger(sourceFolder: string, companyName: string, sourceFile: string, sheetName = 'Sheet1'): DebtLedger {
  return {
    id: `${sourceFile}-${sheetName}`,
    sourceFile,
    sourceFolder,
    sheetName,
    companyName,
    year: '2026',
    debtorName: sourceFolder,
    rows: [{ id: '1', date: null, productName: '产品', unit: null, quantity: 1, unitPrice: 10, totalDebt: 10 }],
    summaries: [],
    balance: null,
    payments: 0,
    warnings: [],
  };
}

describe('groupUploadedLedgers', () => {
  it('sorts by person, company, and source file without merging files', () => {
    const groups = groupUploadedLedgers([
      ledger('夏建强', '益润新材料有限公司', 'b.xlsx'),
      ledger('夏建强', '益润新材料有限公司', 'a.xlsx', 'Sheet2'),
      ledger('夏建强', '另一家公司', 'c.xlsx'),
      ledger('朱高云', '益润新材料有限公司', 'd.xlsx'),
    ]);

    expect(groups.map((group) => `${group.folderName}/${group.companyName}/${group.sourceFile}`)).toEqual([
      '夏建强/另一家公司/c.xlsx',
      '夏建强/益润新材料有限公司/a.xlsx',
      '夏建强/益润新材料有限公司/b.xlsx',
      '朱高云/益润新材料有限公司/d.xlsx',
    ]);
    expect(groups[1]?.ledgers).toHaveLength(1);
    expect(groups[2]?.ledgers).toHaveLength(1);
  });
});
