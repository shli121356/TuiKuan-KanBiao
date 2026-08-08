import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MonthlyPoint } from '../lib/analytics';
import { formatCurrency } from '../lib/format';

type TrendChartProps = { data: MonthlyPoint[] };

export function TrendChart({ data }: TrendChartProps) {
  if (data.length === 0) return <div className="chart-empty">暂无可用的月度明细</div>;

  const total = data.reduce((sum, point) => sum + point.amount, 0);
  const peak = data.reduce((highest, point) => point.amount > highest.amount ? point : highest, data[0]);
  const tickInterval = data.length > 12 ? Math.ceil(data.length / 10) - 1 : 0;

  return (
    <div className="chart-wrap trend-chart">
      <ResponsiveContainer height={248} width="100%">
        <BarChart barCategoryGap="24%" data={data} margin={{ top: 16, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#edf0f4" vertical={false} />
          <XAxis axisLine={false} dataKey="label" interval={tickInterval} tick={{ fill: '#8b919b', fontSize: 11 }} tickLine={false} />
          <YAxis axisLine={false} tick={{ fill: '#a0a5ad', fontSize: 10 }} tickFormatter={(value) => `¥${Number(value).toLocaleString('zh-CN')}`} tickLine={false} width={56} />
          <Tooltip
            contentStyle={{ border: '1px solid #e6e9ee', borderRadius: 12, boxShadow: '0 12px 30px rgba(27, 42, 71, .12)', fontSize: 12 }}
            formatter={(value) => [formatCurrency(Number(value ?? 0)), '欠款']}
            labelStyle={{ color: '#7b808a', marginBottom: 4 }}
          />
          <Bar dataKey="amount" fill="#1677ff" isAnimationActive={true} maxBarSize={34} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="trend-stats">
        <div><span>统计合计</span><strong>{formatCurrency(total)}</strong></div>
        <div><span>最高单期</span><strong>{formatCurrency(peak.amount)}</strong><small>{peak.label}</small></div>
        <div><span>数据点</span><strong>{data.length}</strong><small>个日期 / 月份</small></div>
      </div>
    </div>
  );
}
