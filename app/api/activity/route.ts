import {NextRequest,NextResponse} from 'next/server';
import {activityConfigured,activityUser,readActivity} from '../../../lib/activity';
export const runtime='nodejs';
export async function GET(request:NextRequest){
  const userId=await activityUser(request);
  if(!userId)return NextResponse.json({error:'Sign in to view activity history.'},{status:401});
  if(!activityConfigured())return NextResponse.json({configured:false,events:[],error:'Activity history requires Supabase configuration.'},{headers:{'Cache-Control':'private, no-store'}});
  try{
    const events=await readActivity(userId);
    return NextResponse.json({configured:true,events},{headers:{'Cache-Control':'private, no-store'}});
  }catch{return NextResponse.json({configured:true,events:[],error:'Activity history is temporarily unavailable.'},{status:503,headers:{'Cache-Control':'private, no-store'}})}
}
