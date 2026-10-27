import './style.css';
export const metadata={title:'RepoPilot — Docs that keep up with your code',description:'AI-powered GitHub documentation generation and updates'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}