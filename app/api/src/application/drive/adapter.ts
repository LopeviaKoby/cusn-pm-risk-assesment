export type DriveFolder={id:string;name:string;parents:string[];mimeType:string;trashed:boolean;appProperties:Record<string,string>};
export interface DriveAdapter {
 get(id:string):Promise<DriveFolder>;
 find(parentId:string,projectId:string,key:string):Promise<DriveFolder[]>;
 create(parentId:string,name:string,projectId:string,key:string):Promise<DriveFolder>;
}
export class DriveFailure extends Error {
 constructor(readonly code:string,readonly transient=false){super(code);}
}