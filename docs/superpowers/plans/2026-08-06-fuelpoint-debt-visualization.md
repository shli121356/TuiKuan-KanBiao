# 燃点欠款项目可视化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished React dashboard that parses the supplied debt workbook in the browser, supports multi-Sheet switching, overview/ranking views, grouped details, Excel upload, and responsive interaction.

**Architecture:** Use a Vite React TypeScript single-page app. Keep workbook parsing in `src/lib/workbook.ts`, derived calculations in `src/lib/analytics.ts`, and UI state in `src/App.tsx`; UI pieces are split into focused components under `src/components/`. The initial workbook is copied to `public/` and loaded on startup, while user uploads append valid ledgers in memory.

**Tech Stack:** Vite, React, TypeScript, SheetJS (`xlsx`), Recharts, Motion (`framer-motion`), Lucide React, Vitest, CSS modules via one focused stylesheet.

---

## File Map

- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/vite-env.d.ts` for the Vite application shell and scripts.
- Create: `public/工作簿1.xlsx夏建强.xlsx` as the default workbook copied from the supplied Desktop file.
- Create: `src/types.ts` for `DebtRow`, `DebtSummary`, `DebtLedger`, parser result and view types.
- Create: `src/lib/workbook.ts` for SheetJS parsing, Excel date conversion, metadata detection, detail/summary classification, and workbook loading.
- Create: `src/lib/analytics.ts` for total calculations, monthly series, product aggregation, ranking, and grouping.
- Create: `src/lib/format.ts` for currency, date, percentage, and compact number formatting.
- Create: `src/components/AppShell.tsx` for sticky glass navigation, global bill selector, view switcher, upload control, and status banner.
- Create: `src/components/AnimatedNumber.tsx` and `src/components/Reveal.tsx` for reusable number and entrance motion.
- Create: `src/components/OverviewView.tsx` for hero summary, trend/product charts, and grouped detail table.
- Create: `src/components/TrendChart.tsx`, `src/components/ProductDonut.tsx`, and `src/components/DebtTable.tsx` for focused visual/data components.
- Create: `src/components/LeaderboardView.tsx` for product debt ranking with progress bars.
- Create: `src/App.tsx`, `src/main.tsx`, `src/styles.css` for app composition, bootstrap, and responsive Apple-inspired styling.
- Create: `src/lib/workbook.test.ts`, `src/lib/analytics.test.ts` for parser and calculation regression coverage.

## Task 1: Scaffold and dependency baseline

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/vite-env.d.ts`

- [ ] **Step 1: Add the application manifest and scripts**

Create `package.json` with React/Vite runtime dependencies and Vitest scripts:

```json
{
  "name": "fuelpoint-debt-visualization",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "preview": "vite preview"
  },
  "dependencies": {
    "framer-motion": "^11.18.2",
    "lucide-react": "^0.468.0",
    "recharts": "^2.15.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.7.2",
    "vite": "^6.0.5",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Configure TypeScript and Vite**

Use strict TypeScript with DOM types in `tsconfig.json`, a Node config for Vite, and a React plugin in `vite.config.ts`:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({ plugins: [react()] });
```

- [ ] **Step 3: Add the HTML entrypoint and Vite types**

`index.html` must set UTF-8, viewport, title `燃点欠款项目可视化`, and `<div id="root"></div><script type="module" src="/src/main.tsx"></script>`. `src/vite-env.d.ts` must contain `/// <reference types="vite/client" />`.

- [ ] **Step 4: Install dependencies and verify the empty scaffold**

Run `pnpm install` and then `pnpm exec tsc --noEmit`.

Expected: dependency installation exits 0 and TypeScript reports no errors after the entry files exist.

- [ ] **Step 5: Commit the scaffold**

```powershell
git add package.json tsconfig.json tsconfig.node.json vite.config.ts index.html src/vite-env.d.ts pnpm-lock.yaml
git commit -m "chore: scaffold debt visualization app"
```

## Task 2: Model and parser tests first

**Files:**
- Create: `src/types.ts`
- Create: `src/lib/workbook.test.ts`

- [ ] **Step 1: Define the domain types**

Add these exported types in `src/types.ts`:

```ts
export type DebtRow = {
  id: string;
  date: string | null;
  productName: string;
  unit: string | null;
  quantity: number | null;
  unitPrice: number | null;
  totalDebt: number;
};

export type DebtSummary = { label: string; amount: number; month: string | null };

export type DebtLedger = {
  id: string;
  sourceFile: string;
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

export type ParseResult = { ledgers: DebtLedger[]; ignoredSheets: string[] };
export type DashboardView = 'overview' | 'leaderboard';
```

- [ ] **Step 2: Write failing parser tests against representative workbook rows**

Test `parseSheetRows(rows, sheetName, sourceFile)` with a Sheet1-shaped fixture and a Sheet2-shaped fixture. Assert that metadata is found despite different row offsets, blank dates inherit the previous date, detail rows exclude summary rows, negative payment summaries are preserved, and empty sheets return `null`.

Use a fixture with these exact cases:

```ts
const rows = [
  ['供货商。。。益润新材料有限公司'],
  ['客户欠款...夏建强'],
  [],
  ['2025年'],
  [45659, '7001-5里皮', '米', 20, 15, 300],
  [null, '黑色羊文13', '米', 12, 14.5, 174],
  [null, null, null, null, '1月份金额', 11252.25],
  [null, null, '7月30号汇公账', null, null, -51300],
  [null, null, '截至2026年7月30号余欠我方合计金额', null, null, 149661.75]
];
```

- [ ] **Step 3: Run the targeted tests and verify they fail for missing parser exports**

Run `pnpm vitest run src/lib/workbook.test.ts`.

Expected: FAIL because `src/lib/workbook.ts` has not been implemented.

## Task 3: Implement workbook parsing and default file loading

**Files:**
- Modify: `src/types.ts`
- Create: `src/lib/workbook.ts`
- Modify: `src/lib/workbook.test.ts`
- Create: `public/工作簿1.xlsx夏建强.xlsx`

- [ ] **Step 1: Implement primitive helpers and metadata detection**

Implement `toText`, `toNumber`, `excelSerialToIso`, `findYear`, `findCompanyName`, and `findDebtorName`. Metadata detection should search every non-empty cell and use `/\d{4}年?/` for years, `/供货商/` for company text, and `/客户欠款/` for debtor text; strip the label and punctuation, retaining the business name.

- [ ] **Step 2: Implement detail and summary classification**

Implement `parseSheetRows` with the following rules:

```ts
const summaryText = /(月份金额|合计金额|余欠|付款|汇公账|税点)/;
const hasDetailNumbers = [row[3], row[4], row[5]].some(value => toNumber(value) !== null);
const isDetail = Boolean(toText(row[1])) && hasDetailNumbers && !summaryText.test(row.map(toText).join(' '));
```

For each detail row, carry forward the last valid date, create a stable row id from sheet name and source row index, and preserve null unit/quantity/unitPrice. For summary rows, derive month from `1月份金额` style labels, record `amount`, set `payments` for negative payment rows, and set `balance` when the label includes `余欠` or `截至`.

- [ ] **Step 3: Implement workbook parsing and load helpers**

Export:

```ts
export function parseSheetRows(rows: unknown[][], sheetName: string, sourceFile: string): DebtLedger | null;
export function parseWorkbook(buffer: ArrayBuffer, sourceFile: string): ParseResult;
export async function loadDefaultWorkbook(): Promise<ParseResult>;
```

`parseWorkbook` must iterate `workbook.SheetNames`, call `sheet_to_json(sheet, { header: 1, raw: true, defval: null })`, filter null ledgers, and return ignored Sheet names. `loadDefaultWorkbook` fetches `/工作簿1.xlsx夏建强.xlsx` and passes the buffer to `parseWorkbook`.

- [ ] **Step 4: Copy the supplied workbook into public**

Run:

```powershell
Copy-Item -LiteralPath 'C:\Users\Administrator\Desktop\欠款整理\工作簿1.xlsx夏建强.xlsx' -Destination 'public\工作簿1.xlsx夏建强.xlsx'
```

- [ ] **Step 5: Run parser tests and a real-file smoke check**

Run `pnpm vitest run src/lib/workbook.test.ts` and a Node/Python-independent browser build smoke check through the app loader after Task 7.

Expected: fixture tests pass; the real workbook produces two ledgers and ignores `Sheet3`.

- [ ] **Step 6: Commit the parser**

```powershell
git add src/types.ts src/lib/workbook.ts src/lib/workbook.test.ts public/工作簿1.xlsx夏建强.xlsx
git commit -m "feat: parse debt workbook sheets"
```

## Task 4: Analytics and formatting with regression coverage

**Files:**
- Create: `src/lib/analytics.ts`
- Create: `src/lib/format.ts`
- Create: `src/lib/analytics.test.ts`

- [ ] **Step 1: Write failing analytics tests**

Define a ledger fixture with two dates, duplicate products, a negative payment, and a balance. Assert:

```ts
getLedgerTotal(ledger) === 474;
getMonthlyTrend(ledger) returns one point per month with summed detail amounts;
getProductTotals(ledger)[0] has the largest aggregated product amount;
getGroupedRows(ledger) groups rows by YYYY-MM and preserves row order;
```

- [ ] **Step 2: Implement deterministic analytics functions**

Export `getLedgerTotal`, `getMonthlyTrend`, `getProductTotals`, `getRankedProducts`, `getGroupedRows`, `getProductCount`, and `getQualitySummary`. Product totals aggregate exact `productName` strings and sort descending. Monthly trend uses `row.date?.slice(0, 7)` and puts null dates in `未标注日期`. Ranking progress uses `amount / maxAmount`.

- [ ] **Step 3: Implement formatting helpers**

Export `formatCurrency(value)`, `formatCompactCurrency(value)`, `formatDate(value)`, `formatPercent(value)`, and `formatQuantity(value)`. Use `Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 2 })` for exact amounts and keep negative signs visible.

- [ ] **Step 4: Run analytics tests and TypeScript**

Run `pnpm vitest run src/lib/analytics.test.ts` and `pnpm exec tsc --noEmit`.

Expected: all analytics assertions pass and TypeScript reports no errors.

- [ ] **Step 5: Commit analytics**

```powershell
git add src/lib/analytics.ts src/lib/format.ts src/lib/analytics.test.ts
git commit -m "feat: add debt analytics"
```

## Task 5: Build the application shell and reusable motion

**Files:**
- Create: `src/components/AppShell.tsx`
- Create: `src/components/AnimatedNumber.tsx`
- Create: `src/components/Reveal.tsx`
- Create: `src/App.tsx`
- Create: `src/main.tsx`

- [ ] **Step 1: Implement the shell contract**

`AppShell` accepts `ledgers`, `activeLedgerId`, `view`, `onLedgerChange`, `onViewChange`, `onUpload`, and `children`. Render a sticky frosted header, a native accessible file input visually replaced by an icon button with `accept=".xlsx,.xls"`, a two-option segmented view control, and an inline status/error region with `role="status"`.

- [ ] **Step 2: Implement motion helpers**

`AnimatedNumber` should animate from its previous value to `value` using `requestAnimationFrame` over 700ms and render formatted text. `Reveal` should use `motion.div` with hidden `{ opacity: 0, y: 18 }`, visible `{ opacity: 1, y: 0 }`, viewport `{ once: true, amount: 0.15 }`, and a 0.42s ease-out transition.

- [ ] **Step 3: Implement App loading and upload flow**

On mount call `loadDefaultWorkbook()`, select the ledger with the greatest numeric year, and expose loading/error state. On file change read `await file.arrayBuffer()`, call `parseWorkbook`, append valid ledgers, select the first new ledger, and display ignored Sheet names in a status message. Preserve existing ledgers if upload parsing fails.

- [ ] **Step 4: Implement main bootstrap**

`src/main.tsx` must import `createRoot`, `App`, and `./styles.css`, then render `<App />` into `#root` under `React.StrictMode`.

## Task 6: Implement overview visuals and grouped details

**Files:**
- Create: `src/components/OverviewView.tsx`
- Create: `src/components/TrendChart.tsx`
- Create: `src/components/ProductDonut.tsx`
- Create: `src/components/DebtTable.tsx`

- [ ] **Step 1: Implement overview summary**

`OverviewView` receives the active `DebtLedger`. Render a hero with company, debtor, year, `AnimatedNumber(getLedgerTotal(ledger))`, detail row count, product count, and balance when available. Show payments as a separate negative adjustment line when non-zero.

- [ ] **Step 2: Implement the trend chart**

`TrendChart` uses `ResponsiveContainer`, `AreaChart`, `defs` with a light blue fill, `XAxis` without a visible axis line, `YAxis` with currency tick formatter, `Tooltip`, and one `Area` with `type="monotone"`, `stroke="#1677FF"`, and `fillOpacity={1}`. It must render a useful empty state for no trend points.

- [ ] **Step 3: Implement the product donut**

`ProductDonut` uses `PieChart`, `Pie`, `Cell`, `Tooltip`, and a centered total label. Limit displayed slices to the top 6 products and combine the remainder as `其他`; render a right-side legend with names, amounts, and percentages.

- [ ] **Step 4: Implement grouped accordion details**

`DebtTable` receives grouped rows and group totals. Each group button has `aria-expanded` and toggles only its own group. Render date, product, unit, quantity, unit price, and debt amount with numeric columns right-aligned. Use `AnimatePresence` and `motion.tbody` for expansion.

- [ ] **Step 5: Compose overview and run the build check**

Compose the chart and table sections in `OverviewView`, then run `pnpm exec tsc --noEmit` and `pnpm build`.

Expected: build exits 0 and the overview components compile without implicit-any errors.

## Task 7: Implement leaderboard and complete styling

**Files:**
- Create: `src/components/LeaderboardView.tsx`
- Create: `src/styles.css`
- Modify: `src/App.tsx`

- [ ] **Step 1: Implement ranked products**

`LeaderboardView` calls `getRankedProducts(ledger)` and renders each item with rank, product name, formatted amount, unit context, and a background progress bar. Use `Reveal` with index-based delay and gold/silver/bronze styles only for ranks 1-3.

- [ ] **Step 2: Add the responsive visual system**

Define CSS variables for `--paper: #f7f8fa`, `--ink: #16181d`, `--muted: #7b808a`, `--blue: #1677ff`, `--mint: #b9edc6`, `--line: #e6e9ee`, radii up to 18px, and shadows. Add styles for the frosted header, segmented control, wide hero, summary strip, chart panels, data table, rank bars, status badges, and file upload control. Use `@media (max-width: 760px)` to stack layout, keep typography within containers, and set table overflow to `auto`.

- [ ] **Step 3: Add page transitions and reduced-motion fallback**

Wrap view content in `AnimatePresence mode="wait"` keyed by `view`; add `@media (prefers-reduced-motion: reduce)` to disable transitions and animation durations while leaving state changes functional.

- [ ] **Step 4: Run tests and build**

Run `pnpm test` and `pnpm build`.

Expected: all tests pass and production build exits 0.

- [ ] **Step 5: Commit the first working UI**

```powershell
git add src/App.tsx src/main.tsx src/styles.css src/components
git commit -m "feat: build debt dashboard and leaderboard"
```

## Task 8: Browser verification and polish

**Files:**
- Modify only files that fail verification; keep changes scoped to the failing behavior.

- [ ] **Step 1: Start the dev server**

Run `pnpm dev --host 127.0.0.1 --port 4173` and open the printed URL with browser control.

- [ ] **Step 2: Verify the real workbook content**

Check that the initial page shows Sheet2 metadata `益润新材料有限公司`, `夏建强`, `2026年`; switch to Sheet1 and confirm its year is `2025年`. Confirm the initial ledger has 31 detail rows and the displayed detail total is computed from rows, not the bottom balance.

- [ ] **Step 3: Verify interaction paths**

Click the leaderboard view, confirm products are descending by aggregate debt; switch back to overview; expand and collapse at least two month groups; use the file input to import the same workbook again and confirm the new ledgers appear without a blank page.

- [ ] **Step 4: Verify responsive layout and console**

Capture desktop at 1440x1000 and mobile at 390x844. Confirm no horizontal overflow outside the table scroller, no overlapping text, chart canvas/SVG is nonblank, and browser console has no runtime errors.

- [ ] **Step 5: Run final verification commands**

Run `pnpm test`, `pnpm build`, and `git status --short`.

Expected: tests and build exit 0; only intentional project files are modified.

- [ ] **Step 6: Commit verification fixes if any**

```powershell
git add src public package.json pnpm-lock.yaml
git commit -m "fix: polish debt dashboard verification issues"
```
