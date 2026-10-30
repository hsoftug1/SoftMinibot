import {NextRequest,NextResponse} from 'next/server';
import {supabaseServer} from '../../../lib/supabase/server';
export async function GET(request:NextRequest){
 const code=request.nextUrl.searchParams.get('code');
 const origin=request.nextUrl.origin;
 if(!code)return NextResponse.redirect(new URL('/login?error=missing_code',origin));
 const supabase=await supabaseServer();
 const {error}=await supabase.auth.exchangeCodeForSession(code);
 return NextResponse.redirect(new URL(error?'/login?error=verification_failed':'/dashboard',origin));
}
