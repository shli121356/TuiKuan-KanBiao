import * as XLSX from 'xlsx';
import defaultWorkbookUrl from '../assets/default-workbook.xlsm?url';
import zhuGaoyunWorkbookUrl from '../assets/ledger-zhu-gao-yun.xlsm?url';
import zhaoWeiHuaWorkbookUrl from '../assets/ledger-zhao-wei-hua.xlsm?url';
import type { DebtLedger, DebtRow, DebtSummary, ParseResult } from '../types';

type CellValue = unknown;

const SUMMARY_PATTERN = /(月份金额|合计金额|余欠|付款|汇公账|税点)/;

function toText(value: CellValue): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function toNumber(value: CellValue): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;

  const cleaned = value.trim().replace(/[￥¥,\s]/g, '');
  if (!cleaned) return null;
  const normalized = cleaned.startsWith('(') && cleaned.endsWith(')')
    ? `-${cleaned.slice(1, -1)}`
    : cleaned;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function excelSerialToIso(value: number): string | null {
  if (!Number.isFinite(value) || value < 1) return null;
  const date = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function normalizeDate(value: CellValue): string | null {
  if (typeof value === 'number') return excelSerialToIso(value);
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const text = toText(value);
  if (!text) return null;

  const chineseDate = text.match(/(20\d{2})年\s*(\d{1,2})月\s*(\d{1,2})日?/);
  const normalized = chineseDate
    ? `${chineseDate[1]}-${chineseDate[2]}-${chineseDate[3]}`
    : text.replace(/[./]/g, '-');
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function rowText(row: CellValue[]): string {
  return row.map(toText).filter(Boolean).join(' ');
}

function stripLabel(text: string, pattern: RegExp): string {
  return text.replace(pattern, '').replace(/^[\s.…。:：\-]+/, '').trim();
}

function findMetadata(rows: CellValue[][], pattern: RegExp): string {
  for (const row of rows) {
    for (const value of row) {
      const text = toText(value);
      if (pattern.test(text)) return stripLabel(text, pattern);
    }
  }
  return '';
}

function findYear(rows: CellValue[][]): string {
  for (const row of rows.slice(0, 16)) {
    for (const value of row) {
      const text = toText(value);
      const match = text.match(/^\s*(20\d{2})年?\s*$/);
      if (match) return match[1];
    }
  }
  for (const row of rows) {
    const match = rowText(row).match(/(20\d{2})年/);
    if (match) return match[1];
  }
  return '未标注年份';
}

function getSummaryMonth(label: string): string | null {
  const match = label.match(/(\d{1,2})月份金额/);
  return match ? match[1].padStart(2, '0') : null;
}

function isDetailRow(row: CellValue[]): boolean {
  const productName = toText(row[1]);
  const totalDebt = toNumber(row[5]);
  return Boolean(productName) && totalDebt !== null && !SUMMARY_PATTERN.test(rowText(row));
}

function getSummaryAmount(row: CellValue[]): number | null {
  for (let index = row.length - 1; index >= 0; index -= 1) {
    const amount = toNumber(row[index]);
    if (amount !== null) return amount;
  }
  return null;
}

export function parseSheetRows(rows: unknown[][], sheetName: string, sourceFile: string): DebtLedger | null {
  const companyName = findMetadata(rows, /供货商/);
  const debtorName = findMetadata(rows, /客户欠款/);
  const year = findYear(rows);
  const parsedRows: DebtRow[] = [];
  const summaries: DebtSummary[] = [];
  const warnings: string[] = [];
  let lastDate: string | null = null;
  let balance: number | null = null;
  let payments = 0;

  rows.forEach((rawRow, rowIndex) => {
    const row = rawRow ?? [];
    const text = rowText(row);
    if (isDetailRow(row)) {
      const nextDate = normalizeDate(row[0]);
      if (nextDate) lastDate = nextDate;
      parsedRows.push({
        id: `${sheetName}-${rowIndex + 1}`,
        date: lastDate,
        productName: toText(row[1]),
        unit: toText(row[2]) || null,
        quantity: toNumber(row[3]),
        unitPrice: toNumber(row[4]),
        totalDebt: toNumber(row[5]) ?? 0,
      });
      return;
    }

    if (!SUMMARY_PATTERN.test(text)) return;
    const label = row.map(toText).find((value) => SUMMARY_PATTERN.test(value)) ?? text;
    const amount = getSummaryAmount(row);
    if (amount === null) return;
    summaries.push({ label, amount, month: getSummaryMonth(label) });
    if (/付款|汇公账/.test(label)) payments += amount;
    if (/余欠|截至/.test(label)) balance = amount;
  });

  if (parsedRows.length === 0) return null;
  if (!companyName) warnings.push('未识别供应商名称');
  if (!debtorName) warnings.push('未识别欠款人姓名');
  if (!parsedRows.some((row) => row.date)) warnings.push('存在无法识别日期的明细');

  return {
    id: `${sourceFile}-${sheetName}`,
    sourceFile,
    sheetName,
    companyName: companyName || '未标注公司',
    year,
    debtorName: debtorName || '未标注欠款人',
    rows: parsedRows,
    summaries,
    balance,
    payments,
    warnings,
  };
}

export function parseWorkbook(buffer: ArrayBuffer, sourceFile: string): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const ledgers: DebtLedger[] = [];
  const ignoredSheets: string[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
      header: 1,
      raw: true,
      defval: null,
    });
    const ledger = parseSheetRows(rows, sheetName, sourceFile);
    if (ledger) ledgers.push(ledger);
    else ignoredSheets.push(sheetName);
  });

  return { ledgers, ignoredSheets };
}

export function combineParseResults(results: ParseResult[]): ParseResult {
  return {
    ledgers: results.flatMap((result) => result.ledgers),
    ignoredSheets: [...new Set(results.flatMap((result) => result.ignoredSheets))],
  };
}

function hashText(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function ledgerFingerprint(ledger: DebtLedger): string {
  return JSON.stringify({
    sourceFile: ledger.sourceFile,
    sourceFolder: ledger.sourceFolder,
    sheetName: ledger.sheetName,
    companyName: ledger.companyName,
    year: ledger.year,
    debtorName: ledger.debtorName,
    rows: ledger.rows.map(({ date, productName, unit, quantity, unitPrice, totalDebt }) => ({
      date,
      productName,
      unit,
      quantity,
      unitPrice,
      totalDebt,
    })),
    summaries: ledger.summaries,
    balance: ledger.balance,
    payments: ledger.payments,
  });
}

export function getLedgerIdentity(ledger: DebtLedger): string {
  return `${ledger.sourceFile}::${ledger.sheetName}::${hashText(ledgerFingerprint(ledger))}`;
}

export function appendUniqueLedgers(existing: DebtLedger[], incoming: DebtLedger[]) {
  const known = new Set(existing.map(ledgerFingerprint));
  const added: DebtLedger[] = [];

  incoming.forEach((ledger) => {
    const fingerprint = ledgerFingerprint(ledger);
    if (known.has(fingerprint)) return;
    known.add(fingerprint);
    added.push(ledger);
  });

  return {
    added,
    duplicateCount: incoming.length - added.length,
  };
}

const BUNDLED_WORKBOOKS = [
  { url: defaultWorkbookUrl, sourceFile: '工作簿1.xlsx夏建强.xlsx' },
  { url: zhuGaoyunWorkbookUrl, sourceFile: '工作簿1.xlsx朱高云.xlsx' },
  { url: zhaoWeiHuaWorkbookUrl, sourceFile: '工作簿2.xlsx赵卫华.xlsx' },
] as const;

async function loadWorkbookAsset(url: string, sourceFile: string): Promise<ParseResult> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('默认工作簿加载失败');
  return parseWorkbook(await response.arrayBuffer(), sourceFile);
}

export async function loadDefaultWorkbooks(): Promise<ParseResult> {
  return combineParseResults(await Promise.all(BUNDLED_WORKBOOKS.map((workbook) => loadWorkbookAsset(workbook.url, workbook.sourceFile))));
}

export async function loadDefaultWorkbook(): Promise<ParseResult> {
  return loadDefaultWorkbooks();
}
