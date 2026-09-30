import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useMemo } from 'react';
import { prepareCumulativeInterestData } from '../../utils/chartData.js';
import { COLORS, CHART_MARGINS, yAxisFormatter, xAxisFormatter } from './chartTheme.js';
import { formatINR } from '../../utils/formatters.js';

export default function CumulativeInterestChart({ originalSchedule, prepaidSchedule, hasPrepayment }) {
  const data = useMemo(() => {
    return prepareCumulativeInterestData(originalSchedule, hasPrepayment ? prepaidSchedule : []);
  }, [originalSchedule, prepaidSchedule, hasPrepayment]);

  return (
    <div className="card p-6 flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-slate-100">Cumulative Interest Comparison</h2>
        <p className="text-xs text-slate-500 mt-0.5">Total interest paid over the life of the loan</p>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={CHART_MARGINS}>
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
            <Area
              type="monotone"
              dataKey="cumOriginal"
              name="Normal Total Interest"
              stroke={COLORS.interest}
              fillOpacity={0.1}
              fill={COLORS.interest}
              strokeWidth={3}
            />
            {hasPrepayment && (
              <Area
                type="monotone"
                dataKey="cumPrepaid"
                name="Prepaid Total Interest"
                stroke={COLORS.saved}
                fillOpacity={0.1}
                fill={COLORS.saved}
                strokeWidth={3}
                connectNulls={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
