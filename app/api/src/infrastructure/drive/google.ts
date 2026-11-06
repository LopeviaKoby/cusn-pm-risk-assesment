import {drive,auth} from 'googleapis/build/src/apis/drive';
import {readFileSync} from 'node:fs';
import {DriveFailure,type DriveAdapter,type DriveFolder} from '../../application/drive/adapter';
const fields='id,name,parents,mimeType,trashed,appProperties';
export function driveError(error:unknown){
 const e=error as {response?:{status?:number;data?:{error?:{errors?:{reason?:string}[]}}};code?:string};
 const status=e.response?.status,reason=e.response?.data?.error?.errors?.[0]?.reason;
 if(status===404)return new DriveFailure('NOT_FOUND');
 if(reason==='storageQuotaExceeded')return new DriveFailure('QUOTA_EXCEEDED');
 if(status===429||reason==='userRateLimitExceeded'||reason==='rateLimitExceeded'||(status!==undefined&&status>=500))return new DriveFailure('TRANSIENT_DRIVE',true);
 if(status===403)return new DriveFailure('PERMISSION_DENIED');
 if(status===401)return new DriveFailure('AUTH_REJECTED');
 return new DriveFailure('REMOTE_UNCERTAIN',true);
}
export function createGoogleDriveAdapter(keyFile:string):DriveAdapter{
 const credentials=JSON.parse(readFileSync(keyFile,'utf8')) as {type?:string;client_email?:string;private_key?:string};
 if(credentials.type!=='service_account'||!credentials.client_email||!credentials.private_key)throw new DriveFailure('INVALID_SA_CONFIG');
 const api=drive({version:'v3',auth:new auth.JWT({email:credentials.client_email,key:credentials.private_key,scopes:['https://www.googleapis.com/auth/drive']})});
 const normalize=(f:{id?:string|null;name?:string|null;parents?:string[]|null;mimeType?:string|null;trashed?:boolean|null;appProperties?:Record<string,string>|null}):DriveFolder=>({id:f.id??'',name:f.name??'',parents:f.parents??[],mimeType:f.mimeType??'',trashed:f.trashed??false,appProperties:f.appProperties??{}});
 const escape=(v:string)=>v.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
 async function read<T>(fn:()=>Promise<T>):Promise<T>{
  for(let i=0;;i++){try{return await fn();}catch(e){const failure=driveError(e);if(!failure.transient||i===2)throw failure;await new Promise(r=>setTimeout(r,500*2**i+Math.floor(Math.random()*200)));}}
 }
 return {
  get:async id=>normalize((await read(()=>api.files.get({fileId:id,fields,supportsAllDrives:true},{retry:false,timeout:20000}))).data),
  find:async(parentId,jobId,key)=>{
   const found:DriveFolder[]=[];let pageToken:string|undefined;
   do{
    const result=await read(()=>api.files.list({q:`'${escape(parentId)}' in parents and trashed=false and mimeType='application/vnd.google-apps.folder' and appProperties has { key='pmoJob' and value='${escape(jobId)}' } and appProperties has { key='pmoNode' and value='${escape(key)}' }`,fields:`nextPageToken,files(${fields})`,pageSize:1000,pageToken,supportsAllDrives:true,includeItemsFromAllDrives:true},{retry:false,timeout:20000}));
    found.push(...(result.data.files??[]).map(normalize));pageToken=result.data.nextPageToken??undefined;
   }while(pageToken);
   return found;
  },
  create:async(parentId,name,jobId,key)=>{
   try{return normalize((await api.files.create({supportsAllDrives:true,fields,requestBody:{name,mimeType:'application/vnd.google-apps.folder',parents:[parentId],appProperties:{pmoJob:jobId,pmoNode:key}}},{retry:false,timeout:20000})).data);}catch(e){throw driveError(e);}
  },
 };
}