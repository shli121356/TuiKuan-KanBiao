import { describe, expect, test } from 'vitest';
import { formatCurrency } from './format';

describe('currency formatting', () => {
  test('keeps exact spreadsheet decimals visible', () => {
    expect(formatCurrency(149661.75)).toBe('¥149,661.75');
    expect(formatCurrency(0.125)).toBe('¥0.125');
  });
});
