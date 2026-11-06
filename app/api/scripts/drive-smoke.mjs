import {google} from 'googleapis';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
if(!process.argv.includes('--allow-create-folder'))throw new Error('Requiere --allow-create-folder: una sola escritura remota.');
const root=process.env.DRIVE_ROOT_FOLDER_ID,keyFile=process.env.GOOGLE_APPLICATION_CREDENTIALS??process.env.DRIVE_SA;
if(!root||!keyFile)throw new Error('Configura DRIVE_ROOT_FOLDER_ID y GOOGLE_APPLICATION_CREDENTIALS.');
const credential=JSON.parse(readFileSync(resolve(keyFile),'utf8'));
if(credential.type!=='service_account')throw new Error('Solo Service Account sin suplantacion.');
const drive=google.drive({version:'v3',auth:new google.auth.JWT({email:credential.client_email,key:credential.private_key,scopes:['https://www.googleapis.com/auth/drive']})});
const evidence={at:new Date().toISOString(),status:'BLOQUEADO',driveType:null,canAddChildren:null,testId:null,httpStatus:null,reason:null,stage:'metadata'};
try {
 const rootFile=await drive.files.get({fileId:root,supportsAllDrives:true,fields:'id,name,mimeType,driveId,capabilities(canAddChildren),webViewLink'},{retry:false,timeout:20000});
 evidence.driveType=rootFile.data.driveId?'SHARED_DRIVE':'MY_DRIVE';evidence.canAddChildren=rootFile.data.capabilities?.canAddChildren??false;
 if(rootFile.data.mimeType!=='application/vnd.google-apps.folder')throw new Error('ROOT_NOT_FOLDER');
 evidence.stage='create';
 // No retry: uncertain writes must be reconciled before another attempt.
 const created=await drive.files.create({supportsAllDrives:true,requestBody:{name:`TEST_PMO_SA_${crypto.randomUUID()}`,mimeType:'application/vnd.google-apps.folder',parents:[root]},fields:'id'},{retry:false,timeout:20000});
 evidence.testId=created.data.id;evidence.httpStatus=created.status;evidence.stage='verify';
 const verified=await drive.files.get({fileId:created.data.id,supportsAllDrives:true,fields:'id,mimeType,parents'},{retry:false,timeout:20000});
 if(!verified.data.parents?.includes(root))throw new Error('PARENT_MISMATCH');
 evidence.status='EXITO';evidence.stage='verified';
} catch(error) {
 evidence.httpStatus=error.response?.status??null;evidence.reason=error.response?.data?.error?.errors?.[0]?.reason??(error.code==='ETIMEDOUT'?'TIMEOUT_UNCERTAIN':error.message==='ROOT_NOT_FOLDER'?'ROOT_NOT_FOLDER':'REQUEST_FAILED');
} finally {mkdirSync('.tools/drive-b0',{recursive:true});writeFileSync('.tools/drive-b0/result.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));}
process.exitCode=evidence.status==='EXITO'?0:2;