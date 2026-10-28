'use client';
import {useEffect,useState} from 'react';
import {Monitor,Moon,Sun} from 'lucide-react';
type Theme='light'|'dark'|'system';
export default function ThemeToggle(){
 const[theme,setTheme]=useState<Theme>('system');
 useEffect(()=>{const saved=localStorage.getItem('repopilot-theme');setTheme(saved==='light'||saved==='dark'?saved:'system')},[]);
 useEffect(()=>{
  const media=window.matchMedia('(prefers-color-scheme: dark)');
  const apply=()=>{document.documentElement.dataset.theme=theme==='system'?(media.matches?'dark':'light'):theme;document.documentElement.style.colorScheme=theme==='system'?(media.matches?'dark':'light'):theme};
  apply();media.addEventListener('change',apply);return()=>media.removeEventListener('change',apply);
 },[theme]);
 function select(next:Theme){localStorage.setItem('repopilot-theme',next);setTheme(next)}
 return <div className="theme-toggle" role="group" aria-label="Color theme">
  <button type="button" title="Light theme" aria-label="Light theme" aria-pressed={theme==='light'} onClick={()=>select('light')}><Sun size={16}/></button>
  <button type="button" title="Dark theme" aria-label="Dark theme" aria-pressed={theme==='dark'} onClick={()=>select('dark')}><Moon size={16}/></button>
  <button type="button" title="System theme" aria-label="System theme" aria-pressed={theme==='system'} onClick={()=>select('system')}><Monitor size={16}/></button>
 </div>
}
