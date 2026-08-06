# 燃点欠款项目可视化设计

## 目标

构建一个浏览器端欠款分析工具：打开后加载标准 Excel 工作簿中的有效 Sheet，支持账单切换、总览与排行榜两个视图、月度趋势、产品结构、分组明细、Excel 导入与错误提示。

## 现有输入文件观察

标准输入文件为 `工作簿1.xlsx夏建强.xlsx`，包含 `Sheet1`、`Sheet2`、`Sheet3`。Sheet1 和 Sheet2 有有效明细，Sheet3 为空。

- Sheet1 的供应商、欠款人和年份分布在第 2、3、6 行；明细从第 7 行附近开始。
- Sheet2 的供应商、年份和欠款人分布在第 1、2 行；明细从第 4 行开始。
- 明细行包含日期、产品、单位、数量、单价、金额；部分日期为空，需要继承最近的有效日期。
- 明细之后包含月份金额、合计金额、历史余欠、付款抵扣和最终余欠余额等汇总行。
- Sheet3 没有可解析明细，不进入账单切换器。

## 架构

采用 Vite + React + TypeScript 单页应用。`src/lib/workbook.ts` 只负责把 Excel 工作簿解析为统一账单模型；`src/lib/analytics.ts` 只负责从账单模型派生趋势、产品聚合、排行与质量提示；React 组件负责视图和交互状态。

正式应用默认把用户提供的工作簿复制到 `public/` 作为初始数据源，并在浏览器中通过 SheetJS 解析。用户上传新文件时，旧账单保留，新文件中的有效 Sheet 追加到账单列表，解析完成后切换到新文件的第一个有效 Sheet。

## 数据模型与解析规则

```ts
type DebtRow = {
  date: string | null;
  productName: string;
  unit: string | null;
  quantity: number | null;
  unitPrice: number | null;
  totalDebt: number;
};

type DebtSummary = {
  month: string;
  amount: number;
  label: string;
};

type DebtLedger = {
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
```

解析时不依赖固定起始行：扫描所有行，优先识别包含供应商、客户欠款、年份的元数据文本；识别一行是否为明细时，要求产品名存在且数量、单价、金额至少能解析出数字。日期数字按 Excel 日期序列转换为 ISO 日期，空日期继承上一条有效日期。包含“月份金额”“合计金额”“余欠”“付款”“汇公账”等关键词的行进入汇总，不进入明细合计。

明细总额为所有 `DebtRow.totalDebt` 的加总；底部的“余欠余额”单独作为 `balance` 显示。负数付款累计到 `payments`，在摘要中以负数金额显示，不从明细总额中重复扣除。

## 视觉与布局

页面使用近白背景 `#F7F8FA`、深墨文字、苹果蓝作为主要强调色，青绿色仅用于数据正常状态。顶部为固定毛玻璃导航，包含品牌、总览/排行榜分段控件、账单切换器和导入 Excel 按钮。

总览页首屏为宽布局：左侧显示公司、年份、欠款人和总欠款，右侧显示明细笔数、产品种类、余欠余额。下方是月度趋势和产品构成双栏图表，随后是按月份 Accordion 分组的明细表。表格数字列右对齐，并在移动端提供横向滚动。

排行榜页使用纵向列表展示按产品聚合后的欠款金额，金额降序排列；前三名有金、银、铜色的轻量标记，进度条按最大产品金额归一化。页面不使用装饰性大卡片堆叠，重复信息只保留在真正需要分组的组件中。

## 交互与状态

- 默认加载真实工作簿中的两个有效 Sheet，默认选择最新年份 Sheet2。
- 切换账单或视图时，导航保持稳定，只替换内容区域并执行淡入上浮动画。
- 总额从 0 动画到目标值；图表、表格组、排行项在进入视口时淡入。
- 点击月份组展开或折叠明细；切换月份时保留其他组状态。
- Excel 导入期间显示处理状态；成功后追加账单并自动切换；失败时保留原数据并显示错误提示。
- 日期无法解析的行进入“未标注日期”分组；缺失单位显示短横线；金额为 0 的明细保留。
- 空 Sheet 或有效字段不足的 Sheet 被过滤，并在导入结果中提示被忽略的 Sheet 名称。

## 组件边界

- `App`: 页面级状态、账单选择、视图选择、文件导入。
- `components/AppShell`: 固定导航、账单切换器、页面容器。
- `components/OverviewView`: 统计摘要、图表、分组明细。
- `components/LeaderboardView`: 产品聚合排行。
- `components/TrendChart`、`ProductDonut`、`DebtTable`: 各自只负责单一可视化或表格职责。
- `components/AnimatedNumber`、`Reveal`: 数字与进入动画复用组件。
- `lib/workbook.ts`: SheetJS 输入解析和规范化。
- `lib/analytics.ts`: 账单聚合与格式化前的数据计算。

## 错误处理与验收

错误提示必须说明文件或 Sheet 名称及原因，不能只展示空状态。需要验证：

1. 真实工作簿解析出两个有效 Sheet，Sheet1 和 Sheet2 的明细与汇总数据可区分。
2. Sheet2 初始总额、产品排行、月份趋势均基于明细数据重新计算。
3. 顶部账单切换器、总览/排行切换、月份展开折叠均可操作。
4. 上传包含多个 Sheet 的新工作簿后，账单列表和所有派生数据更新。
5. 桌面与窄屏下无明显溢出，浏览器控制台无运行时错误。

## 范围约束

首版只做浏览器本地解析与内存状态，不做登录、后端存储、权限、多人协作或数据库持久化。
