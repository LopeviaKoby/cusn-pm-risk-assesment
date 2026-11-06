import type {ReactNode} from 'react';
import {ApplicationHeader} from '@/components/organisms/application-header';
import {Link} from '@/navigation';
import '@/design-system/workspaces.css';
import '@/design-system/projects.css';
import '@/design-system/operations.css';
export function PortfolioLayout({children, onError, identifier}: {children: ReactNode; identifier?: string; onError: (cause: unknown) => void}) {return <div className="workspace-experience"><ApplicationHeader identifier={identifier} onError={onError}/><div className="workspace-frame"><aside><strong>PMO TIVIT</strong><nav aria-label="Navegación principal"><Link href="/workspace">Workspaces</Link><Link href="/portafolio" aria-current="page">Portafolio</Link></nav></aside><main id="contenido" className="workspace-home pmo-content">{children}</main></div></div>;}
