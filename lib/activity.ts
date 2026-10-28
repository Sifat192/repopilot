import {getToken} from 'next-auth/jwt';
import type {NextRequest} from 'next/server';

export type ActivityKind='generation'|'pull_request';
export type ActivityMode='create'|'update';
const endpoint=()=>process.env.SUPABASE_URL?.replace(/\/$/,'');
const key=()=>process.env.SUPABASE_SERVICE_ROLE_KEY;
export const activityConfigured=()=>Boolean(endpoint()&&key());

export async function activityUser(req:NextRequest):Promise<string|null>{
  if(!process.env.NEXTAUTH_SECRET)return null;
  const jwt=await getToken({req,secret:process.env.NEXTAUTH_SECRET});
  if(!jwt?.sub||!jwt.loginProvider)return null;
  return String(jwt.loginProvider)+':'+String(jwt.sub);
}

async function call(path:string,init:RequestInit){
  const base=endpoint(),secret=key();
  if(!base||!secret)throw Error('Activity database not configured');
  const response=await fetch(base+'/rest/v1/'+path,{...init,headers:{apikey:secret,Authorization:'Bearer '+secret,'Content-Type':'application/json',...(init.headers||{})},cache:'no-store',signal:AbortSignal.timeout(6000)});
  if(!response.ok)throw Error('Activity database request failed ('+response.status+')');
  return response;
}
export async function recordActivity(userId:string|null,kind:ActivityKind,mode:ActivityMode,repo:string,prUrl?:string){
  if(!userId||!activityConfigured())return;
  try{await call('repopilot_activity',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({user_id:userId,kind,mode,repository:repo,pr_url:prUrl||null})});}
  catch(e){console.error('Activity recording failed',e instanceof Error?e.message:'unknown error');}
}
export async function readActivity(userId:string){
  const params=new URLSearchParams({user_id:'eq.'+userId,select:'id,kind,mode,repository,pr_url,created_at',order:'created_at.desc',limit:'100'});
  const response=await call('repopilot_activity?'+params.toString(),{method:'GET'});
  return response.json();
}
