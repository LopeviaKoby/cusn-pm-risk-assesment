import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ProgressPoint } from './progress-chart';

export default function ProgressPlot({ points }: { points: readonly ProgressPoint[] }) {
  return <div className="pmo-progress-plot" role="figure" aria-label="Avance planificado y real por período. Datos disponibles en la tabla inferior.">
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <LineChart data={[...points]} margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="periodo" stroke="var(--muted-foreground)" tickLine={false} />
        <YAxis domain={[0, 100]} unit="%" width={52} stroke="var(--muted-foreground)" tickLine={false} />
        <Tooltip contentStyle={{ background: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--border)', borderRadius: 'var(--radius-md)' }} formatter={value => `${value}%`} />
        <Legend />
        <Line type="linear" dataKey="planificado" name="Planificado" stroke="var(--chart-planned)" strokeWidth={2} strokeDasharray="6 4" dot={false} connectNulls={false} isAnimationActive={false} />
        <Line type="linear" dataKey="real" name="Real" stroke="var(--chart-real)" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>;
}
