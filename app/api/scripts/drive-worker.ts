import {sql,closeDatabase} from '../src/db';
import {config} from '../src/config';
import {createGoogleDriveAdapter} from '../src/infrastructure/drive/google';
import {provisionDrive} from '../src/application/drive/provision';
if(!config.driveProvisioningEnabled)throw new Error('Ejecutor desactivado: DRIVE_PROVISIONING_ENABLED debe ser true.');
const keyFile=Bun.env.GOOGLE_APPLICATION_CREDENTIALS??Bun.env.DRIVE_SA;
if(!keyFile)throw new Error('Ruta local de credencial SA requerida.');
const explicit=process.argv.find(v=>v.startsWith('--project='))?.slice(10);
if(explicit&&!/^[1-9][0-9]{0,18}$/.test(explicit))throw new Error('Identificador no valido.');
try{
 const [next]=explicit?[{id:explicit}]:await sql<{id:string}>`SELECT proyecto_id::text id FROM pmo_cusn.drive_provisionamiento WHERE estado='PENDIENTE' OR (estado='ERROR' AND next_attempt_at<=now() AND intentos<5) OR (estado='EN_PROCESO' AND lease_until<now()) ORDER BY created_at LIMIT 1`;
 if(!next)console.log('SIN_TRABAJOS');
 else{const result=await provisionDrive(sql,createGoogleDriveAdapter(keyFile),next.id,{retryError:process.argv.includes('--retry-error'),reverify:!!explicit});console.log(JSON.stringify({proyectoId:next.id,...result}));if(result.estado==='ERROR')process.exitCode=1;}
}catch{console.error('DRIVE_WORKER_FAILED');process.exitCode=1;}finally{await closeDatabase();}