'use client';
import ThemeToggle from '../theme-toggle';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {getProviders,getSession,signIn} from 'next-auth/react';
import {Github,ArrowLeft,ShieldCheck,Terminal} from 'lucide-react';
import Link from 'next/link';

type Provider={id:string;name:string;type:string;signinUrl:string;callbackUrl:string};
export default function SignInPage(){
  const router=useRouter();
  const[signingIn,setSigningIn]=useState(false);
  const[providers,setProviders]=useState<Record<string,Provider>|null>(null);
  const[error,setError]=useState('');
  useEffect(()=>{let active=true;getSession().then(session=>{if(active&&session)router.replace('/?signed_in=1')}).catch(()=>{});getProviders().then(p=>{if(active)setProviders(p as Record<string,Provider>||{})}).catch(()=>{if(active)setError('Could not load sign-in providers. Try again.')});return()=>{active=false}},[router]);
  async function startSignIn(provider:'google'|'github'){setSigningIn(true);setError('');try{await signIn(provider,{callbackUrl:'/?signed_in=1'})}catch{setSigningIn(false);setError('Could not start sign-in. Please retry.')}}
  return <main className="signin-main" style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#0b1110',color:'#edf7ee',padding:24,fontFamily:'system-ui,sans-serif'}}>
    <section className="signin-panel" style={{width:'100%',maxWidth:420,padding:32,border:'1px solid #294037',borderRadius:20,background:'#121c18'}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><Link href="/" style={{color:'#b7edc6',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8}}><ArrowLeft size={16}/> Back to RepoPilot</Link><ThemeToggle/></div>
      <div style={{display:'flex',alignItems:'center',gap:10,marginTop:32}}><Terminal color="#a8f0b9"/><strong style={{fontSize:23}}>repopilot.</strong></div>
      <h1 style={{fontSize:28,margin:'22px 0 8px'}}>Welcome back</h1>
      <p style={{color:'#b0c0b6',lineHeight:1.6,marginBottom:28}}>Sign in to RepoPilot using your preferred account.</p>
      {signingIn&&<p role="status">Redirecting to your sign-in provider…</p>}
      {providers===null&&!error&&<p>Loading sign-in options…</p>}
      {providers?.google&&<button disabled={signingIn} onClick={()=>void startSignIn('google')} style={{width:'100%',padding:'14px 18px',marginBottom:12,borderRadius:10,border:'1px solid #53675c',background:'#f8fbf9',color:'#1b2520',fontSize:15,fontWeight:650,cursor:'pointer'}}>Continue with Google</button>}
      {providers?.github&&<button disabled={signingIn} onClick={()=>void startSignIn('github')} style={{width:'100%',padding:'14px 18px',marginBottom:12,borderRadius:10,border:'1px solid #53675c',background:'#1e3027',color:'#fff',fontSize:15,fontWeight:650,cursor:'pointer',display:'flex',justifyContent:'center',alignItems:'center',gap:10}}><Github size={19}/> Continue with GitHub</button>}
      {providers&&Object.keys(providers).length===0&&<p style={{color:'#ffb8a8'}}>No sign-in providers configured. Add OAuth credentials in Vercel.</p>}
      {error&&<p style={{color:'#ffb8a8'}}>{error}</p>}
      <p style={{display:'flex',alignItems:'flex-start',gap:8,fontSize:12,lineHeight:1.6,color:'#b0c0b6',marginTop:24}}><ShieldCheck size={16}/> GitHub authorization is required separately to create pull requests. Google sign-in alone cannot publish to GitHub.</p>
    </section>
  </main>;
}
