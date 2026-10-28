import {createHash} from 'crypto';
import {NextResponse} from 'next/server';

// Redis-backed atomic fixed-window limit. Shared across Vercel instances.
// Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel.
const script=`local n=redis.call('INCR',KEYS[1])
if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end
return {n,redis.call('TTL',KEYS[1])}`;

export async function checkRateLimit(request:Request,action:'generate'|'publish',subject?:string):Promise<NextResponse|null>{
  const url=process.env.UPSTASH_REDIS_REST_URL;
  const token=process.env.UPSTASH_REDIS_REST_TOKEN;
  if(!url||!token){
    console.error('Rate limiter unavailable: missing Upstash Redis configuration');
    return NextResponse.json({error:'Service temporarily unavailable. Rate limiting is not configured.'},{status:503});
  }
  // Prefer a verified user identity for authenticated actions; never trust arbitrary forwarded chains.
  const ip=request.headers.get('x-real-ip')||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||
    'unknown';
  const identifier=subject||ip;
  const hash=createHash('sha256').update(identifier).digest('hex');
  const limit=action==='generate'?10:5;
  const windowSeconds=3600;
  const key=`repopilot:rl:${action}:${hash}`;
  try{
    const response=await fetch(`${url.replace(/\/$/,'')}`,{
      method:'POST',
      headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
      body:JSON.stringify(['EVAL',script,1,key,windowSeconds]),
      cache:'no-store',
      signal:AbortSignal.timeout(5000)
    });
    if(!response.ok)throw new Error(`Redis HTTP ${response.status}`);
    const data=await response.json();
    if(data.error||!Array.isArray(data.result))throw new Error('Invalid Redis response');
    const [count,ttl]=data.result.map(Number);
    if(!Number.isFinite(count)||!Number.isFinite(ttl))throw new Error('Invalid Redis counters');
    if(count>limit){
      const retry=Math.max(1,ttl);
      return NextResponse.json(
        {error:`Rate limit reached. Try again in about ${Math.ceil(retry/60)} minute(s).`},
        {status:429,headers:{'Retry-After':String(retry),'X-RateLimit-Limit':String(limit),'X-RateLimit-Remaining':'0'}}
      );
    }
    return null;
  }catch(error){
    console.error('Rate limiter request failed',error instanceof Error?error.message:error);
    return NextResponse.json({error:'Service temporarily unavailable. Please retry later.'},{status:503});
  }
}
