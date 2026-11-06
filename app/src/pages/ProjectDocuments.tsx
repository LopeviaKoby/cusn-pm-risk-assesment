import {useEffect, useState} from 'react';
import {Button} from '@/components/atoms/catalog';
import {DriveTree} from '@/components/organisms/drive-tree';
import {getDrive, type DriveStatus} from '@/data/project-modules';
import {projectError} from '@/data/projects';
export default function ProjectDocuments({projectId}: {projectId: string}) {
  const [data, setData] = useState<DriveStatus | null>(null), [error, setError] = useState(''), [attempt, setAttempt] = useState(0), [polling, setPolling] = useState(false);
  useEffect(() => {const controller = new AbortController(); let timer: ReturnType<typeof setTimeout>; let count = 0; setData(null); setError('');
    async function load() {try {const status = await getDrive(projectId, controller.signal); if (controller.signal.aborted) return; setData(status); count++; const more = ['PENDIENTE', 'EN_PROCESO'].includes(status.estado) && count < 12; setPolling(more); if (more) timer = setTimeout(() => {void load();}, 5000);} catch (cause) {if (!controller.signal.aborted) {setError(projectError(cause)); setPolling(false);}}}
    void load(); return () => {controller.abort(); clearTimeout(timer);};
  }, [projectId, attempt]);
  return <section className="pmo-section"><header><h2>Documentos</h2><Button onClick={() => setAttempt(value => value + 1)}>Actualizar carpetas</Button></header>{error && <p role="alert">{error}</p>}{!data && !error && <p role="status">Consultando referencias documentales…</p>}{data && <DriveTree data={data}/>}<p className="pmo-help">{polling ? 'Actualización automática acotada mientras el proceso esté pendiente.' : 'Puedes consultar nuevamente con Actualizar carpetas.'} La ejecución de la provisión pertenece al backend; esta vista no la inicia ni simula.</p></section>;
}
