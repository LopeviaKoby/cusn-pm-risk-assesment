import { date, number, percent } from "@/demo/view-models";
import { TableRegion } from "./primitives";
type Series = { label: string; className: "planned" | "actual"; values: number[] };
function smoothPath(points: { x: number; y: number }[]): string {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`;
  let path = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index]!;
    const end = points[index + 1]!;
    const dx = end.x - start.x;
    path += ` C ${start.x + dx * 0.4} ${start.y}, ${start.x + dx * 0.6} ${end.y}, ${end.x} ${end.y}`;
  }
  return path;
}
export function SeriesChart({ dates, series, maximum = 1, label, curved = false }: { dates: string[]; series: Series[]; maximum?: number; label: string; curved?: boolean }) {
  if (!dates.length) return <p className="muted">No hay series registradas.</p>;
  const times = dates.map(value => Date.parse(value));
  const min = Math.min(...times), max = Math.max(...times);
  const width = maximum === 1 ? 620 : 340;
  const x = (index: number) => max === min ? width / 2 : 56 + ((times[index]! - min) / (max - min)) * (width - 120);
  const y = (value: number) => 216 - (value / maximum) * 168;
  const format = (value: number) => maximum === 1 ? percent(value) : number(value);
  const ticks = maximum === 1 ? [0, 0.25, 0.5, 0.75, 1] : [0, 5, 10, 15, 20, 25];
  return <><div className="legend chart-legend">{series.map(item => <span key={item.label}><i className={`${item.className}-key`} />{item.label}</span>)}</div><div className="chart-region"><TableRegion label={label} overflowHint="Desplázate horizontalmente para ver la serie completa.">
    <svg className={maximum === 1 ? "series-chart" : "series-chart risk-series"} viewBox={`0 0 ${width} 278`} role="img" aria-label={label}>
      {ticks.map(tick => <g key={tick}><line className="chart-gridline" x1="56" x2={width - 64} y1={y(tick)} y2={y(tick)} /><text x="44" y={y(tick) + 4} textAnchor="end">{format(tick)}</text></g>)}
      {dates.map((value, index) => <text key={`${value}-${index}`} x={x(index)} y="251" textAnchor="middle">{new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(value))}</text>)}
      {series.map(item => <g key={item.label} className={`series-${item.className}`}>{curved ? <path className="series-line" d={smoothPath(item.values.map((value, index) => ({ x: x(index), y: y(value) })))} /> : <polyline points={item.values.map((value, index) => `${x(index)},${y(value)}`).join(" ")} />}{item.values.map((value, index) => <g key={dates[index]}><circle cx={x(index)} cy={y(value)} r="3" /><text className="point-label" x={x(index)} y={y(value) + (item.className === "planned" ? -12 : 20)} textAnchor="middle">{format(value)}</text><title>{date(dates[index])}: {item.label} {format(value)}</title></g>)}</g>)}
    </svg>
  </TableRegion></div></>;
}
