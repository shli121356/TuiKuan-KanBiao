import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { ProductTotal } from '../lib/analytics';
import { formatCurrency, formatPercent } from '../lib/format';

type ProductDonutProps = { data: ProductTotal[] };
const COLORS = ['#1677ff', '#60a5fa', '#91bffc', '#b9edc6', '#cfd6e1', '#e7ebf0', '#aeb8c7'];

export function ProductDonut({ data }: ProductDonutProps) {
  const top = data.slice(0, 6);
  const remainder = data.slice(6).reduce((sum, item) => sum + item.amount, 0);
  const chartData = remainder > 0 ? [...top, { productName: '其他', amount: remainder, share: data.slice(6).reduce((sum, item) => sum + item.share, 0) }] : top;
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  if (chartData.length === 0) return <div className="chart-empty">暂无产品构成</div>;

  return (
    <div className="donut-layout">
      <div className="donut-chart-wrap">
        <ResponsiveContainer height={220} width="100%">
          <PieChart>
            <Pie animationBegin={80} animationDuration={650} data={chartData} dataKey="amount" innerRadius="64%" nameKey="productName" outerRadius="86%" paddingAngle={2} stroke="none">
              {chartData.map((item, index) => <Cell fill={COLORS[index % COLORS.length]} key={item.productName} />)}
            </Pie>
            <Tooltip contentStyle={{ border: '1px solid #e6e9ee', borderRadius: 12, boxShadow: '0 12px 30px rgba(27, 42, 71, .12)', fontSize: 12 }} formatter={(value) => [formatCurrency(Number(value ?? 0)), '欠款']} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center"><strong>{chartData.length}</strong><span>产品项</span></div>
      </div>
      <div className="legend-list">
        {chartData.map((item, index) => (
          <div className="legend-item" key={item.productName}>
            <span className="legend-dot" style={{ background: COLORS[index % COLORS.length] }} />
            <span className="legend-name" title={item.productName}>{item.productName}</span>
            <span className="legend-value">{formatPercent(total === 0 ? 0 : item.amount / total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
