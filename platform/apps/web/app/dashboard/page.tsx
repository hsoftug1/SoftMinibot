import {supabaseServer} from '../../lib/supabase/server';
import {createBot,requestPairing,signOut,updateAntiDelete} from './actions';
export default async function Dashboard(){
 const supabase=await supabaseServer();const {data:{user}}=await supabase.auth.getUser();
 const {data:memberships}=await supabase.from('tenant_members').select('tenant_id,role').eq('user_id',user!.id);
 const tenantIds=(memberships||[]).map(m=>m.tenant_id);
 const {data:bots}=tenantIds.length?await supabase.from('bot_instances').select('id,tenant_id,display_name,status').in('tenant_id',tenantIds).order('created_at',{ascending:false}):{data:[]};
 const {data:privacy}=tenantIds.length?await supabase.from('bot_privacy_settings').select('bot_instance_id,anti_delete_enabled,retention_hours').in('tenant_id',tenantIds):{data:[]};
 const {data:pending}=tenantIds.length?await supabase.from('pairing_requests').select('bot_instance_id,expires_at,status').in('tenant_id',tenantIds).eq('status','pending').gt('expires_at',new Date().toISOString()):{data:[]};
 return <><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16}}><div><h1>My dashboard</h1><p className="muted">Signed in as {user?.email}</p></div><form action={signOut}><button className="btn secondary">Sign out</button></form></div><section className="card"><h2>Create a bot</h2><form action={createBot}><label>Bot name<input name="name" required minLength={2} maxLength={80} placeholder="My SoftMinibot"/></label><button className="btn">Create bot</button></form></section><h2>Your bots</h2><section className="grid">{bots?.map(bot=><div className="card" key={bot.id}><h2>{bot.display_name}</h2><p className="muted">Status: {bot.status}</p>{pending?.some(p=>p.bot_instance_id===bot.id)?<p className="pill">Pairing requested — awaiting worker</p>:bot.status==='connected'?<p className="success">Connected</p>:<form action={requestPairing}><input type="hidden" name="botId" value={bot.id}/><button className="btn">Request pairing</button></form>}<form action={updateAntiDelete} style={{marginTop:16,display:'grid',gap:10}}>
 <input type="hidden" name="botId" value={bot.id}/>
 <strong>Private Anti-Delete</strong>
 <label style={{display:'flex',alignItems:'center',gap:8}}><input type="checkbox" name="enabled" defaultChecked={privacy?.find(p=>p.bot_instance_id===bot.id)?.anti_delete_enabled??false}/> Enable message retention</label>
 <label>Retention period (hours)<input type="number" name="retentionHours" min={1} max={168} defaultValue={privacy?.find(p=>p.bot_instance_id===bot.id)?.retention_hours??24}/></label>
 <button className="btn secondary" type="submit">Save privacy settings</button>
 <p className="muted" style={{fontSize:13}}>Owner-only access. Message capture will start only after the WhatsApp worker is connected.</p>
 </form><p className="muted" style={{fontSize:13}}>QR/pairing codes will become available when the persistent worker is connected.</p></div>)}{!bots?.length&&<div className="card"><p className="muted">No bots yet. Create one to get started.</p></div>}</section></>;
}
