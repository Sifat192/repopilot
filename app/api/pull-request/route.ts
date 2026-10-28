import {NextRequest,NextResponse} from 'next/server';
import {getToken} from 'next-auth/jwt';
import {randomUUID} from 'crypto';

export const runtime='nodejs';
const github='https://api.github.com';
const headers=(token:string)=>({
  Accept:'application/vnd.github+json',
  Authorization:`Bearer ${token}`,
  'X-GitHub-Api-Version':'2022-11-28',
  'User-Agent':'RepoPilot'
});
async function api(token:string,path:string,init:RequestInit={}){
  const response=await fetch(github+path,{...init,headers:{...headers(token),...(init.headers||{})},cache:'no-store',signal:AbortSignal.timeout(15000)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(`GitHub request failed (${response.status}): ${String(data.message||'Please retry').slice(0,180)}`);
  return data;
}
export async function POST(request:NextRequest){
  try{
    if(!process.env.NEXTAUTH_SECRET)return NextResponse.json({error:'GitHub sign-in is not configured.'},{status:503});
    const session=await getToken({req:request,secret:process.env.NEXTAUTH_SECRET});
    const token=session?.githubAccessToken;
    if(typeof token!=='string')return NextResponse.json({error:'Sign in with GitHub to publish a pull request.'},{status:401});
    const body=await request.json();
    const {url,markdown,mode}=body;
    if(typeof url!=='string'||typeof markdown!=='string'||!['create','update'].includes(mode)||markdown.trim().length<10||markdown.length>250000)
      return NextResponse.json({error:'Invalid repository, mode or README content.'},{status:400});
    let parsed:URL;
    try{parsed=new URL(url)}catch{return NextResponse.json({error:'Invalid GitHub URL.'},{status:400})}
    const parts=parsed.pathname.split('/').filter(Boolean);
    if(parsed.protocol!=='https:'||parsed.hostname!=='github.com'||parts.length!==2||!parts.every(p=>/^[\w.-]+$/.test(p)))
      return NextResponse.json({error:'Use a public https://github.com/owner/repo URL.'},{status:400});
    const [owner,repo]=parts;
    const base=`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
    const info=await api(token,base);
    if(info.private)return NextResponse.json({error:'Private repositories are not supported yet.'},{status:403});
    if(!info.permissions?.push)return NextResponse.json({error:'Your GitHub account needs write access to this repository to open a PR.'},{status:403});
    const defaultBranch=String(info.default_branch);
    const ref=await api(token,`${base}/git/ref/heads/${encodeURIComponent(defaultBranch)}`);
    const branch=`repopilot/readme-${randomUUID().slice(0,12)}`;
    await api(token,`${base}/git/refs`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ref:`refs/heads/${branch}`,sha:ref.object.sha})});
    let existingSha:string|undefined;
    try{
      const current=await fetch(github+`${base}/contents/README.md?ref=${encodeURIComponent(defaultBranch)}`,{headers:headers(token),cache:'no-store',signal:AbortSignal.timeout(15000)});
      if(current.status===200){const file=await current.json();existingSha=file.sha;}
      else if(current.status!==404)throw new Error(`Cannot inspect README.md (HTTP ${current.status}).`);
    }catch(e){throw e;}
    const content=Buffer.from(markdown,'utf8').toString('base64');
    await api(token,`${base}/contents/README.md`,{
      method:'PUT',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({message:mode==='update'?'docs: update README with RepoPilot':'docs: generate README with RepoPilot',content,branch,...(existingSha?{sha:existingSha}:{})})
    });
    const pr=await api(token,`${base}/pulls`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({title:mode==='update'?'docs: refresh README with RepoPilot':'docs: generate README with RepoPilot',head:branch,base:defaultBranch,body:'Generated with RepoPilot. Please review all AI-generated documentation before merging.',draft:true})
    });
    return NextResponse.json({url:pr.html_url,number:pr.number});
  }catch(e){
    console.error('Pull request publishing failed',e instanceof Error?e.message:e);
    return NextResponse.json({error:e instanceof Error?e.message:'Unable to create pull request.'},{status:502});
  }
}
