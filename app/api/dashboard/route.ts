import {NextRequest,NextResponse} from 'next/server';
import {getToken} from 'next-auth/jwt';
export const runtime='nodejs';
export async function GET(req:NextRequest){
  if(!process.env.NEXTAUTH_SECRET)return NextResponse.json({error:'Authentication unavailable'},{status:503});
  const session=await getToken({req,secret:process.env.NEXTAUTH_SECRET});
  if(!session)return NextResponse.json({error:'Sign in to view your dashboard'},{status:401});
  const token=session.githubAccessToken;
  if(typeof token!=='string'||!token)return NextResponse.json({connected:false,repositories:[]});
  try{
    const headers={Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
    const response=await fetch('https://api.github.com/user/repos?visibility=public&affiliation=owner,collaborator,organization_member&sort=pushed&per_page=30',{headers,cache:'no-store',signal:AbortSignal.timeout(10000)});
    if(!response.ok)return NextResponse.json({error:response.status===401?'Reconnect GitHub to view repositories.':'Could not load GitHub repositories.'},{status:response.status===401?401:502});
    const repos=await response.json();
    const publicRepos=Array.isArray(repos)?repos.filter((r:{private?:boolean})=>!r.private):[];
    // One batched GraphQL request checks README presence without burning AI quota.
    const safeRepos=publicRepos.filter((r:{full_name?:string})=>typeof r.full_name==='string'&&r.full_name.split('/').length===2).slice(0,30);
    const queries=safeRepos.map((r:{full_name:string},i:number)=>{
      const [owner,name]=r.full_name.split('/');
      return `r${i}:repository(owner:${JSON.stringify(owner)},name:${JSON.stringify(name)}){readme:object(expression:"HEAD:README.md"){__typename}}`;
    });
    const gh=async(url:string,init?:RequestInit)=>fetch(url,{...init,headers:{...headers,...(init?.headers||{})},cache:'no-store',signal:AbortSignal.timeout(12000)});
    const [profileRes,healthRes]=await Promise.all([
      gh('https://api.github.com/user'),
      queries.length?gh('https://api.github.com/graphql',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:`query{${queries.join(' ')}}`})}):Promise.resolve(null)
    ]);
    const profileData=profileRes.ok?await profileRes.json():null;
    const healthData=healthRes?.ok?await healthRes.json():null;
    const health=healthData?.errors?null:healthData?.data;
    const repositories=safeRepos.map((r:{id:number;full_name:string;html_url:string;description:string|null;language:string|null;stargazers_count:number;updated_at:string;permissions?:{push?:boolean};default_branch:string},i:number)=>({
      id:r.id,name:r.full_name,url:r.html_url,description:r.description,language:r.language,stars:r.stargazers_count,updatedAt:r.updated_at,canPublish:Boolean(r.permissions?.push),defaultBranch:r.default_branch,
      hasReadme:health?.[`r${i}`]?.readme?.__typename==='Blob'?true:health?.[`r${i}`]?false:null
    }));
    const profile=profileData&&typeof profileData.login==='string'?{login:profileData.login,name:profileData.name||null,avatarUrl:profileData.avatar_url||null,htmlUrl:profileData.html_url||null}:null;
    return NextResponse.json({connected:true,repositories,profile,healthAvailable:Boolean(health)},{headers:{'Cache-Control':'private, no-store'}});
  }catch{return NextResponse.json({error:'GitHub is temporarily unavailable. Please retry.'},{status:502})}
}
