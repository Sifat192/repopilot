import {activityUser,recordActivity} from '../../../lib/activity';
import {acquirePublishLock} from '../../../lib/pr-lock';
import {checkRateLimit} from '../../../lib/rate-limit';
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
class GitHubError extends Error{
  constructor(public status:number,message:string){super(message)}
}
async function api(token:string,path:string,init:RequestInit={}){
  const response=await fetch(github+path,{
    ...init,headers:{...headers(token),...(init.headers||{})},
    cache:'no-store',signal:AbortSignal.timeout(15000)
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new GitHubError(response.status,String(data.message||'GitHub request failed').slice(0,180));
  return data;
}
export async function POST(request:NextRequest){
  let createdBranch:{base:string;name:string;token:string}|null=null;
  let releaseLock:(()=>Promise<void>)|null=null;
  try{
    if(!process.env.NEXTAUTH_SECRET)
      return NextResponse.json({error:'GitHub sign-in is not configured.'},{status:503});
    const session=await getToken({req:request,secret:process.env.NEXTAUTH_SECRET});
    const token=session?.githubAccessToken;
    if(typeof token!=='string'||!token)
      return NextResponse.json({error:'Connect your GitHub account before publishing a pull request.'},{status:401});

    const limited=await checkRateLimit(request,'publish',String(session?.sub||''));
    if(limited)return limited;
    if(Number(request.headers.get('content-length')||0)>400000)return NextResponse.json({error:'Request is too large.'},{status:413});
    const rawBody=await request.text();
    if(Buffer.byteLength(rawBody,'utf8')>400000)return NextResponse.json({error:'Request is too large.'},{status:413});
    const body=(()=>{try{return JSON.parse(rawBody)}catch{return null}})();
    const {url,markdown,mode}=body||{};
    if(typeof url!=='string'||typeof markdown!=='string'||!['create','update'].includes(mode)||
      markdown.trim().length<10||markdown.length>250000)
      return NextResponse.json({error:'Invalid repository, mode or README content.'},{status:400});

    let parsed:URL;
    try{parsed=new URL(url)}catch{return NextResponse.json({error:'Invalid GitHub URL.'},{status:400})}
    const parts=parsed.pathname.split('/').filter(Boolean);
    if(parsed.protocol!=='https:'||parsed.hostname!=='github.com'||parts.length!==2||
      parsed.search||parsed.hash||parsed.username||parsed.password||parsed.port||!parts.every(p=>/^[A-Za-z0-9_.-]{1,100}$/.test(p)&&p!=='.'&&p!=='..'))
      return NextResponse.json({error:'Use a public https://github.com/owner/repo URL.'},{status:400});

    const [owner,repo]=parts;
    const base=`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
    const info=await api(token,base);
    if(info.private)return NextResponse.json({error:'Private repositories are not supported yet.'},{status:403});
    if(!info.permissions?.push)
      return NextResponse.json({error:'Your GitHub account needs write access to this repository to open a PR.'},{status:403});
    // A live GitHub identity check ensures the OAuth token is still valid.
    const identity=await api(token,'/user');
    if(!identity?.id)throw new GitHubError(401,'GitHub authorization is invalid or expired.');
    const defaultBranch=String(info.default_branch);
    if(!defaultBranch||defaultBranch==='undefined')
      throw new GitHubError(502,'Could not determine the default branch.');

    releaseLock=await acquirePublishLock(`${owner}/${repo}`);
    if(!releaseLock)
      return NextResponse.json({error:'A README publishing operation is already in progress for this repository. Please retry shortly.'},{status:409});

    // Inspect every open PR, not just the first page. Fail closed on very large lists.
    let duplicate:{html_url?:string}|undefined;
    for(let page=1;page<=20;page++){
      const openPRs=await api(token,`${base}/pulls?state=open&per_page=100&page=${page}`);
      if(!Array.isArray(openPRs))throw new GitHubError(502,'Invalid pull request list.');
      duplicate=openPRs.find((pr:{head?:{ref?:string;repo?:{full_name?:string}}})=>
        pr.head?.ref?.startsWith('repopilot/readme-')&&
        pr.head?.repo?.full_name?.toLowerCase()===`${owner}/${repo}`.toLowerCase());
      if(duplicate)break;
      if(openPRs.length<100)break;
      if(page===20)throw new GitHubError(503,'Too many open pull requests to safely check for duplicates.');
    }
    if(duplicate)
      return NextResponse.json({
        error:'A RepoPilot pull request is already open for this repository. Review or close it before creating another.',
        existingPrUrl:duplicate.html_url
      },{status:409});

    const existing=await fetch(github+`${base}/contents/README.md?ref=${encodeURIComponent(defaultBranch)}`,{
      headers:headers(token),cache:'no-store',signal:AbortSignal.timeout(15000)
    });
    let existingSha:string|undefined;
    if(existing.ok){
      const file=await existing.json();
      if(file.type!=='file'||typeof file.sha!=='string')
        throw new GitHubError(409,'README.md is not a regular file.');
      existingSha=file.sha;
      if(typeof file.content==='string'&&file.encoding==='base64'){
        const current=Buffer.from(file.content.replace(/\s/g,''),'base64').toString('utf8');
        if(current.replace(/\r\n/g,'\n').trim()===markdown.replace(/\r\n/g,'\n').trim())
          return NextResponse.json({error:'README.md already matches the generated content. No pull request is needed.'},{status:409});
      }
    }else if(existing.status!==404){
      const data=await existing.json().catch(()=>({}));
      throw new GitHubError(existing.status,String(data.message||'Unable to inspect README.md').slice(0,180));
    }

    const ref=await api(token,`${base}/git/ref/heads/${encodeURIComponent(defaultBranch)}`);
    const branch=`repopilot/readme-${randomUUID().slice(0,12)}`;
    await api(token,`${base}/git/refs`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ref:`refs/heads/${branch}`,sha:ref.object.sha})
    });
    createdBranch={base,name:branch,token};
    await api(token,`${base}/contents/README.md`,{
      method:'PUT',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        message:mode==='update'?'docs: update README with RepoPilot':'docs: generate README with RepoPilot',
        content:Buffer.from(markdown,'utf8').toString('base64'),
        branch,...(existingSha?{sha:existingSha}:{})
      })
    });
    const pr=await api(token,`${base}/pulls`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        title:mode==='update'?'docs: refresh README with RepoPilot':'docs: generate README with RepoPilot',
        head:branch,base:defaultBranch,
        body:'Generated with RepoPilot. Please review all AI-generated documentation before merging.',
        draft:true
      })
    });
    createdBranch=null;
    await recordActivity(await activityUser(request),'pull_request',mode,owner+'/'+repo,pr.html_url);
    return NextResponse.json({url:pr.html_url,number:pr.number});
  }catch(e){
    if(createdBranch){
      try{
        await api(createdBranch.token,`${createdBranch.base}/git/refs/heads/${createdBranch.name}`,{method:'DELETE'});
      }catch(cleanupError){
        console.error('Could not clean up RepoPilot branch',cleanupError instanceof Error?cleanupError.message:cleanupError);
      }
    }
    console.error('Pull request publishing failed',{status:e instanceof GitHubError?e.status:'unexpected',type:e instanceof Error?e.name:'unknown'});
    if(e instanceof GitHubError){
      const status=e.status===401?401:e.status===403?403:e.status===404?404:e.status===409||e.status===422?409:e.status===429?429:502;
      const safeMessage=status===401?'GitHub authorization expired. Please reconnect your account.':status===403?'GitHub denied permission for this action.':status===404?'Repository or GitHub resource not found.':status===409?'GitHub reported a conflict. Check for an existing PR or changed README.':status===429?'GitHub rate limit reached. Please retry later.':'GitHub request failed. Please retry later.';
      return NextResponse.json({error:safeMessage},{status});
    }
    return NextResponse.json({error:'Could not publish the pull request. Please retry.'},{status:502});
  }finally{
    if(releaseLock){try{await releaseLock()}catch(e){console.error('Publish lock release failed',e instanceof Error?e.message:e)}}
  }
}