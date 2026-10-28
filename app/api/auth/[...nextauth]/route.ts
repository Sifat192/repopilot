import NextAuth, {type NextAuthOptions} from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';

const providers: NextAuthOptions['providers'] = [];
if(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET)
  providers.push(GoogleProvider({clientId:process.env.GOOGLE_CLIENT_ID,clientSecret:process.env.GOOGLE_CLIENT_SECRET}));
if(process.env.GITHUB_CLIENT_ID&&process.env.GITHUB_CLIENT_SECRET)
  providers.push(GitHubProvider({
    clientId:process.env.GITHUB_CLIENT_ID,
    clientSecret:process.env.GITHUB_CLIENT_SECRET,
    authorization:{params:{scope:'read:user user:email public_repo'}}
  }));

const authOptions:NextAuthOptions={
  providers,
  session:{strategy:'jwt'},
  pages:{signIn:'/signin'},
  secret:process.env.NEXTAUTH_SECRET,
  callbacks:{
    async jwt({token,account}){
      if(account){
        token.loginProvider=account.provider;
        if(account.provider==='github'&&account.access_token){
          token.githubAccessToken=account.access_token;
        }else{
          delete token.githubAccessToken;
        }
      }
      return token;
    },
    async session({session,token}){
      return {...session,githubConnected:typeof token.githubAccessToken==='string',loginProvider:token.loginProvider};
    }
  }
};
const handler=NextAuth(authOptions);
export {handler as GET,handler as POST};
