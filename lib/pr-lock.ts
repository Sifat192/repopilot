import {randomUUID} from 'crypto';

// A short-lived cross-instance lock prevents concurrent publish requests
// from both passing the duplicate-PR check.
export async function acquirePublishLock(repository:string):Promise<(()=>Promise<void>)|null>{
  const base=process.env.UPSTASH_REDIS_REST_URL;
  const token=process.env.UPSTASH_REDIS_REST_TOKEN;
  if(!base||!token)throw new Error('Publishing protection is not configured.');
  const endpoint=base.replace(/\/$/,'');
  const key='repopilot:publish-lock:'+repository.toLowerCase();
  const owner=randomUUID();
  const command=async(args:(string|number)[])=>{
    const response=await fetch(endpoint,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(args),cache:'no-store',signal:AbortSignal.timeout(5000)});
    if(!response.ok)throw new Error('Publishing protection temporarily unavailable.');
    const data=await response.json();
    if(data.error)throw new Error('Publishing protection temporarily unavailable.');
    return data.result;
  };
  const acquired=await command(['SET',key,owner,'NX','EX',120]);
  if(acquired!=='OK')return null;
  return async()=>{
    // Only remove our own lock; another request may own it after expiry.
    const script="if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end";
    await command(['EVAL',script,1,key,owner]);
  };
}
