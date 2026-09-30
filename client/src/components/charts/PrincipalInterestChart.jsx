import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useMemo } from 'react';
import { prepareEMIBreakdownData } from '../../utils/chartData.js';
import { COLORS, CHART_MARGINS, yAxisFormatter, xAxisFormatter } from './chartTheme.js';
import { formatINR } from '../../utils/formatters.js';

export default function PrincipalInterestChart({ schedule }) {
  const data = useMemo(() => {
    return prepareEMIBreakdownData(schedule, 24);
  }, [schedule]);

  return (
    <div className="card p-6 flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-slate-100">EMI Composition</h2>
        <p className="text-xs text-slate-500 mt-0.5">Principal vs Interest portion of your monthly payment</p>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={CHART_MARGINS}>
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
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar dataKey="principal" name="Principal" stackId="a" fill={COLORS.principal} radius={[0, 0, 4, 4]} />
            <Bar dataKey="interest" name="Interest" stackId="a" fill={COLORS.interest} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
