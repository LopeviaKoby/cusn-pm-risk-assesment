import {useState} from 'react';
import {TextInput, TextLink, Badge} from '@/components/atoms/catalog';
import type {DriveFolder, DriveStatus} from '@/data/project-modules';
const labels: Record<DriveStatus['estado'], string> = {NO_SOLICITADO: 'No solicitado', PENDIENTE: 'Pendiente', EN_PROCESO: 'En proceso', COMPLETADO: 'Completado', ERROR: 'Error'};
export function DriveTree({data}: {data: DriveStatus}) {
  const [query, setQuery] = useState('');
  const folders = data.carpetas;
  const byId = new Map(folders.map(folder => [folder.driveId, folder]));
  const roots = folders.filter(folder => !byId.has(folder.parentDriveId));
  function safeLink(value: string) {try {const url = new URL(value); return url.protocol === 'https:' && url.hostname === 'drive.google.com' ? url.href : undefined;} catch {return undefined;}}
  function render(folder: DriveFolder, ancestors: Set<string>): React.JSX.Element | null {
    if (ancestors.has(folder.driveId)) return null;
    const trail = new Set([...ancestors, folder.driveId]);
    const children = folders.filter(child => child.parentDriveId === folder.driveId).map(child => render(child, trail)).filter(child => child !== null);
    const matches = folder.ruta.toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es'));
    if (!matches && !children.length) return null;
    const name = folder.ruta.split('/').filter(Boolean).at(-1) ?? folder.ruta;
    const href = safeLink(folder.webViewLink);
    return <li key={folder.driveId}>{children.length ? <details open><summary>{name}</summary>{href && <TextLink href={href} target="_blank" rel="noopener noreferrer">Abrir {name} en Drive</TextLink>}<ul>{children}</ul></details> : href ? <TextLink href={href} target="_blank" rel="noopener noreferrer">{name}</TextLink> : <span>{name}</span>}<small>Clave {folder.clave} · Verificado {folder.checkedAt}</small></li>;
  }
  return <div className="pmo-drive-tree"><p><Badge>{labels[data.estado]}</Badge> · {folders.length} carpetas observadas · {data.intentos} intentos</p><p>Última actualización: {data.updatedAt ?? 'Sin registro'}</p>{data.errorCodigo && <p role="alert">No se completó la provisión. Código: {/^[A-Z0-9_]{1,80}$/.test(data.errorCodigo) ? data.errorCodigo : 'ERROR_PROVISIONAMIENTO'}</p>}<label>Buscar carpetas cargadas<TextInput value={query} onChange={event => setQuery(event.target.value)}/></label><ul aria-label="Carpetas persistidas de Google Drive">{roots.map(root => render(root, new Set()))}</ul>{!folders.length && <p>No hay carpetas persistidas para mostrar.</p>}<p className="pmo-help">Solo referencias de carpetas. Abrir un enlace requiere tus propios permisos en Google Drive. No hay subida ni edición de archivos.</p></div>;
}
