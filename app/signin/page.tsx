'use client';
import {useEffect,useState} from 'react';
import {getProviders,signIn} from 'next-auth/react';
import {Github,ArrowLeft,ShieldCheck,Terminal} from 'lucide-react';
import Link from 'next/link';

type Provider={id:string;name:string;type:string;signinUrl:string;callbackUrl:string};
export default function SignInPage(){
  const[providers,setProviders]=useState<Record<string,Provider>|null>(null);
  const[error,setError]=useState('');
  useEffect(()=>{getProviders().then(p=>setProviders(p as Record<string,Provider>||{})).catch(()=>setError('Could not load sign-in providers. Try again.'))},[]);
  return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#0b1110',color:'#edf7ee',padding:24,fontFamily:'system-ui,sans-serif'}}>
    <section style={{width:'100%',maxWidth:420,padding:32,border:'1px solid #294037',borderRadius:20,background:'#121c18'}}>
      <Link href="/" style={{color:'#b7edc6',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8}}><ArrowLeft size={16}/> Back to RepoPilot</Link>
      <div style={{display:'flex',alignItems:'center',gap:10,marginTop:32}}><Terminal color="#a8f0b9"/><strong style={{fontSize:23}}>repopilot.</strong></div>
      <h1 style={{fontSize:28,margin:'22px 0 8px'}}>Welcome back</h1>
      <p style={{color:'#b0c0b6',lineHeight:1.6,marginBottom:28}}>Sign in to RepoPilot using your preferred account.</p>
      {providers===null&&!error&&<p>Loading sign-in options…</p>}
      {providers?.google&&<button onClick={()=>signIn('google',{callbackUrl:'/'})} style={{width:'100%',padding:'14px 18px',marginBottom:12,borderRadius:10,border:'1px solid #53675c',background:'#f8fbf9',color:'#1b2520',fontSize:15,fontWeight:650,cursor:'pointer'}}>Continue with Google</button>}
      {providers?.github&&<button onClick={()=>signIn('github',{callbackUrl:'/'})} style={{width:'100%',padding:'14px 18px',marginBottom:12,borderRadius:10,border:'1px solid #53675c',background:'#1e3027',color:'#fff',fontSize:15,fontWeight:650,cursor:'pointer',display:'flex',justifyContent:'center',alignItems:'center',gap:10}}><Github size={19}/> Continue with GitHub</button>}
      {providers&&Object.keys(providers).length===0&&<p style={{color:'#ffb8a8'}}>No sign-in providers configured. Add OAuth credentials in Vercel.</p>}
      {error&&<p style={{color:'#ffb8a8'}}>{error}</p>}
      <p style={{display:'flex',alignItems:'flex-start',gap:8,fontSize:12,lineHeight:1.6,color:'#b0c0b6',marginTop:24}}><ShieldCheck size={16}/> GitHub authorization is required separately to create pull requests. Google sign-in alone cannot publish to GitHub.</p>
    </section>
  </main>;
}
