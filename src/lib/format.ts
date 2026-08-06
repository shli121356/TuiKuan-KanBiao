const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 });

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatCompactCurrency(value: number): string {
  const absolute = Math.abs(value);
  if (absolute >= 100000000) return `${value < 0 ? '-' : ''}¥${(absolute / 100000000).toFixed(2)} 亿`;
  if (absolute >= 10000) return `${value < 0 ? '-' : ''}¥${(absolute / 10000).toFixed(2)} 万`;
  return formatCurrency(value);
}

export function formatDate(value: string | null): string {
  if (!value) return '未标注日期';
  return value.replace(/-/g, '.');
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatQuantity(value: number | null): string {
  return value === null ? '—' : numberFormatter.format(value);
}
