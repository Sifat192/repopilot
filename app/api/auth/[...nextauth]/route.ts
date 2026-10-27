import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
const providers=[] as any[];
if(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET)providers.push(GoogleProvider({clientId:process.env.GOOGLE_CLIENT_ID,clientSecret:process.env.GOOGLE_CLIENT_SECRET}));
if(process.env.GITHUB_CLIENT_ID&&process.env.GITHUB_CLIENT_SECRET)providers.push(GitHubProvider({clientId:process.env.GITHUB_CLIENT_ID,clientSecret:process.env.GITHUB_CLIENT_SECRET}));
const handler=NextAuth({providers,session:{strategy:'jwt'},secret:process.env.NEXTAUTH_SECRET});
export {handler as GET,handler as POST};