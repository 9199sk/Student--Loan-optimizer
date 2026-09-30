import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useMemo } from 'react';
import { prepareBalanceData } from '../../utils/chartData.js';
import { COLORS, CHART_MARGINS, yAxisFormatter, xAxisFormatter } from './chartTheme.js';
import { formatINR } from '../../utils/formatters.js';

export default function RemainingBalanceChart({ originalSchedule, prepaidSchedule, hasPrepayment }) {
  const data = useMemo(() => {
    return prepareBalanceData(originalSchedule, hasPrepayment ? prepaidSchedule : []);
  }, [originalSchedule, prepaidSchedule, hasPrepayment]);

  return (
    <div className="card p-6 flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-slate-100">Remaining Balance Over Time</h2>
        <p className="text-xs text-slate-500 mt-0.5">Compare normal repayment vs with prepayments</p>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={CHART_MARGINS}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} opacity={COLORS.gridOpacity} vertical={false} />
            <XAxis 
              dataKey="month" 
              stroke={COLORS.tick} 
              tickFormatter={xAxisFormatter} 
              tick={{ fill: COLORS.tick, fontSize: 12 }} 
              tickMargin={8}
            />
            <YAxis 
              stroke={COLORS.tick} 
              tickFormatter={yAxisFormatter} 
              tick={{ fill: COLORS.tick, fontSize: 12 }} 
              width={50}
            />
            <Tooltip
              contentStyle={{ backgroundColor: COLORS.tooltipBg, borderColor: COLORS.tooltipBorder, borderRadius: '8px' }}
              itemStyle={{ fontSize: 14 }}
              labelStyle={{ color: COLORS.tick, marginBottom: 4 }}
              formatter={(value) => formatINR(value)}
              labelFormatter={(label) => `Month ${label}`}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Line
              type="monotone"
              dataKey="normal"
              name="Normal Loan"
              stroke={COLORS.normal}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
            />
            {hasPrepayment && (
              <Line
                type="monotone"
                dataKey="prepaid"
                name="With Prepayment"
                stroke={COLORS.prepaid}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
