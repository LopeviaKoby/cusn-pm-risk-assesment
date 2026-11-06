import type {ReactNode} from 'react';
import {Button} from '@/components/atoms/catalog';
export function ColumnMenu({label, kind = 'text', onSort, children}: {label: string; kind?: 'text' | 'date'; onSort?: (direction: 'asc' | 'desc') => void; children?: ReactNode}) {
  if (!onSort && !children) return <>{label}</>;
  return <details className="pmo-column-menu"><summary>{label}</summary><div>{onSort && <><Button variant="ghost" onClick={() => onSort('asc')}>{kind === 'date' ? 'Más antiguo → reciente' : 'A → Z'}</Button><Button variant="ghost" onClick={() => onSort('desc')}>{kind === 'date' ? 'Reciente → antiguo' : 'Z → A'}</Button></>}{children}</div></details>;
}
