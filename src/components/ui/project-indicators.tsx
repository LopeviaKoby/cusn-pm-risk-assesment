import { Badge } from "./primitives";
import { percent } from "@/demo/view-models";
import { projectStatusTone } from "@/demo/presentation";

export function Progress({ planned, actual }: { planned: number | null; actual: number | null }) {
  return <div className="progress-cell"><span>Plan {percent(planned)} · Real {percent(actual)}</span><div className="progress-track" aria-hidden="true"><i className="planned" style={{ width: `${(planned ?? 0) * 100}%` }} /><i className="actual" style={{ width: `${(actual ?? 0) * 100}%` }} /></div></div>;
}
export function Status({ value }: { value: string }) {
  return <Badge tone={projectStatusTone(value)}>{value}</Badge>;
}
