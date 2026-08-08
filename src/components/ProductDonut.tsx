import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { ProductTotal } from '../lib/analytics';
import { formatCurrency, formatPercent, formatQuantity } from '../lib/format';

type ProductDonutProps = { data: ProductTotal[] };
const COLORS = ['#1677ff', '#60a5fa', '#91bffc', '#b9edc6', '#cfd6e1', '#e7ebf0', '#aeb8c7'];

export function ProductDonut({ data }: ProductDonutProps) {
  const top = data.slice(0, 6);
  const remainder = data.slice(6).reduce((sum, item) => sum + item.amount, 0);
  const chartData = remainder > 0 ? [...top, { productName: '其他', amount: remainder, share: data.slice(6).reduce((sum, item) => sum + item.share, 0) }] : top;
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  const maxAmount = data[0]?.amount ?? 0;

  if (chartData.length === 0) return <div className="chart-empty">暂无产品构成</div>;

  return (
    <div className="product-mix-layout">
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
          <div className="donut-center"><strong>{data.length}</strong><span>产品项</span></div>
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
      <div className="product-detail-list">
        <div className="product-detail-head"><span>排名</span><span>产品与明细</span><span className="numeric">欠款金额</span><span>占比</span></div>
        {data.map((item, index) => (
          <div className="product-detail-row" key={item.productName}>
            <span className="product-rank">{String(index + 1).padStart(2, '0')}</span>
            <div className="product-detail-main"><strong title={item.productName}>{item.productName}</strong><span>{item.rowCount} 条明细 · 数量 {item.quantity === null ? '未统计' : formatQuantity(item.quantity)}</span></div>
            <strong className="product-detail-amount">{formatCurrency(item.amount)}</strong>
            <div className="product-detail-share"><span>{formatPercent(item.share)}</span><div className="product-detail-track"><span style={{ width: `${maxAmount === 0 ? 0 : (item.amount / maxAmount) * 100}%` }} /></div></div>
          </div>
        ))}
      </div>
    </div>
  );
}
