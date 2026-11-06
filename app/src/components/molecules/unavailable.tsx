import type { ReactNode } from 'react';
import { LuChartNoAxesCombined } from 'react-icons/lu';
import { Icon } from '@/components/atoms/catalog';

export function Unavailable({ title, children }: { title: string; children: ReactNode }) {
  return <div className="pmo-unavailable"><Icon glyph={LuChartNoAxesCombined} size="lg" /><h3>{title}</h3><p>{children}</p></div>;
}
