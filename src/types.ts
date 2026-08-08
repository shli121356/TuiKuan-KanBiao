export type DebtRow = {
  id: string;
  date: string | null;
  productName: string;
  unit: string | null;
  quantity: number | null;
  unitPrice: number | null;
  totalDebt: number;
};

export type DebtSummary = {
  label: string;
  amount: number;
  month: string | null;
};

export type DebtLedger = {
  id: string;
  sourceFile: string;
  sourceFolder?: string;
  sourceUrl?: string;
  sheetName: string;
  companyName: string;
  year: string;
  debtorName: string;
  rows: DebtRow[];
  summaries: DebtSummary[];
  balance: number | null;
  payments: number;
  warnings: string[];
};

export type ParseResult = {
  ledgers: DebtLedger[];
  ignoredSheets: string[];
};

export type DashboardView = 'overview' | 'leaderboard' | 'uploads';
