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
