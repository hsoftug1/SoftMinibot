'use server';
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
import {supabaseServer} from '../../lib/supabase/server';
export async function createBot(formData:FormData){
 const supabase=await supabaseServer();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect('/login');
 const name=String(formData.get('name')||'').trim();if(name.length<2||name.length>80)throw new Error('Invalid bot name');
 const {data:membership,error:memberError}=await supabase.from('tenant_members').select('tenant_id').eq('user_id',user.id).eq('role','owner').limit(1).single();
 if(memberError||!membership)throw new Error('No workspace available');
 const {error}=await supabase.from('bot_instances').insert({tenant_id:membership.tenant_id,display_name:name});
 if(error)throw new Error('Could not create bot');revalidatePath('/dashboard');
}
export async function requestPairing(formData:FormData){
 const supabase=await supabaseServer();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect('/login');
 const botId=String(formData.get('botId')||'');
 const {data:bot}=await supabase.from('bot_instances').select('id,tenant_id,status').eq('id',botId).single();
 if(!bot||bot.status==='connected')throw new Error('Bot unavailable');
 const {data:membership}=await supabase.from('tenant_members').select('role').eq('tenant_id',bot.tenant_id).eq('user_id',user.id).in('role',['owner','admin']).single();
 if(!membership)throw new Error('Not authorized');
 const {data:existing}=await supabase.from('pairing_requests').select('id').eq('bot_instance_id',botId).eq('status','pending').gt('expires_at',new Date().toISOString()).limit(1);
 if(existing?.length)throw new Error('Pairing request already pending');
 const {error}=await supabase.from('pairing_requests').insert({tenant_id:bot.tenant_id,bot_instance_id:bot.id,expires_at:new Date(Date.now()+180000).toISOString()});
 if(error)throw new Error('Unable to request pairing');revalidatePath('/dashboard');
}
export async function signOut(){const s=await supabaseServer();await s.auth.signOut();redirect('/login');}
