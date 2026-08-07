# Status Feedback Placement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move non-error workbook load feedback out of the main content area while keeping error feedback prominent.

**Architecture:** `AppShell` will classify the current feedback state before rendering. Informational status is rendered as compact supporting text beside the import controls; errors remain in the existing page-level alert surface. The decision is isolated in a small pure helper so it can be regression-tested without a browser DOM harness.

**Tech Stack:** React 18, TypeScript, Vitest, CSS.

---

### Task 1: Define and test feedback placement

**Files:**
- Create: `src/lib/statusPresentation.test.ts`
- Create: `src/lib/statusPresentation.ts`

- [x] **Step 1: Write the failing test**

```ts
import { describe, expect, test } from 'vitest';
import { getStatusPresentation } from './statusPresentation';

describe('status presentation', () => {
  test('renders a successful import as compact topbar feedback', () => {
    expect(getStatusPresentation('已载入 4 张账单', '')).toBe('inline');
  });

  test('keeps an error in the page-level alert surface', () => {
    expect(getStatusPresentation('已载入 4 张账单', '文件解析失败')).toBe('banner');
  });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/lib/statusPresentation.test.ts`

Expected: FAIL because `statusPresentation.ts` does not exist.

- [x] **Step 3: Implement the minimal classifier**

```ts
export type StatusPresentation = 'hidden' | 'inline' | 'banner';

export function getStatusPresentation(status: string, error: string): StatusPresentation {
  if (error) return 'banner';
  return status ? 'inline' : 'hidden';
}
```

- [x] **Step 4: Run the focused test to verify it passes**

Run: `npm test -- src/lib/statusPresentation.test.ts`

Expected: PASS with 2 tests passing.

### Task 2: Render the compact success feedback in the top bar

**Files:**
- Modify: `src/components/AppShell.tsx`
- Modify: `src/styles.css`

- [x] **Step 1: Use `getStatusPresentation` in `AppShell`**

Render the success text as an `aria-live="polite"` compact label adjacent to the import label. Render the existing `status-banner` only for errors.

- [x] **Step 2: Add compact topbar feedback styling**

Use muted text, a small indicator, constrained width, and responsive wrapping. Do not add a filled background or a wide page-level strip.

- [x] **Step 3: Verify the application**

Run: `npm test -- src/lib/statusPresentation.test.ts`

Run: `npm run build`

Open: `http://127.0.0.1:4174/`

Expected: successful import feedback is subtle beside the topbar import control; errors remain highly visible in the page content.
