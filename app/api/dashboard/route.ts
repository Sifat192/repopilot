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
    return NextResponse.json({connected:true,repositories:Array.isArray(repos)?repos.filter((r:{private?:boolean})=>!r.private).map((r:{id:number;full_name:string;html_url:string;description:string|null;language:string|null;stargazers_count:number;updated_at:string;permissions?:{push?:boolean};default_branch:string})=>({id:r.id,name:r.full_name,url:r.html_url,description:r.description,language:r.language,stars:r.stargazers_count,updatedAt:r.updated_at,canPublish:Boolean(r.permissions?.push),defaultBranch:r.default_branch})):[]},{headers:{'Cache-Control':'private, no-store'}});
  }catch{return NextResponse.json({error:'GitHub is temporarily unavailable. Please retry.'},{status:502})}
}
