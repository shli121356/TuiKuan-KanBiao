import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MonthlyPoint } from '../lib/analytics';
import { formatCurrency } from '../lib/format';

type TrendChartProps = { data: MonthlyPoint[] };

export function TrendChart({ data }: TrendChartProps) {
  if (data.length === 0) return <div className="chart-empty">暂无可用的月度明细</div>;

  return (
    <div className="chart-wrap trend-chart">
      <ResponsiveContainer height={248} width="100%">
        <AreaChart data={data} margin={{ top: 16, right: 4, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="debt-trend-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#1677ff" stopOpacity={0.24} />
              <stop offset="100%" stopColor="#1677ff" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#edf0f4" vertical={false} />
          <XAxis axisLine={false} dataKey="label" tick={{ fill: '#8b919b', fontSize: 11 }} tickLine={false} />
          <YAxis axisLine={false} tick={{ fill: '#a0a5ad', fontSize: 10 }} tickFormatter={(value) => `¥${Number(value).toLocaleString('zh-CN')}`} tickLine={false} width={56} />
          <Tooltip
            contentStyle={{ border: '1px solid #e6e9ee', borderRadius: 12, boxShadow: '0 12px 30px rgba(27, 42, 71, .12)', fontSize: 12 }}
            formatter={(value) => [formatCurrency(Number(value ?? 0)), '欠款']}
            labelStyle={{ color: '#7b808a', marginBottom: 4 }}
          />
          <Area dataKey="amount" fill="url(#debt-trend-fill)" fillOpacity={1} isAnimationActive={true} stroke="#1677ff" strokeWidth={2.5} type="monotone" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
