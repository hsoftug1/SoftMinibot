import http from 'node:http';
import { createClient } from '@supabase/supabase-js';

const required=['SUPABASE_URL','SUPABASE_SECRET_KEY'];
for(const key of required){if(!process.env[key])throw new Error('Missing '+key);}
const supabase=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const interval=Math.max(5000,Number(process.env.POLL_INTERVAL_MS||10000));
let busy=false;
async function tick(){
 if(busy)return;busy=true;
 try{
  const now=new Date().toISOString();
  const {data,error}=await supabase.from('pairing_requests').select('id,bot_instance_id,tenant_id,status,expires_at').eq('status','pending').lt('expires_at',now).limit(100);
  if(error)throw error;
  const {error:purgeError}=await supabase.from('deleted_message_archive').delete().lt('expires_at',now);
  if(purgeError)throw purgeError;
  for(const request of data||[]){
   const {error:updateError}=await supabase.from('pairing_requests').update({status:'expired'}).eq('id',request.id).eq('status','pending');
   if(updateError)console.error('Could not expire pairing request',request.id,updateError.message);
  }
 }catch(error){console.error('Worker tick failed:',error.message)}finally{busy=false}
}
const server=http.createServer((req,res)=>{
 if(req.url==='/health'&&req.method==='GET'){
  res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});
  res.end(JSON.stringify({status:'ok',service:'softminibot-worker',mode:'scaffold'}));return;
 }
 res.writeHead(404);res.end('Not found');
});
server.listen(Number(process.env.PORT||3001),'0.0.0.0',()=>console.log('SoftMinibot worker started'));
setInterval(tick,interval).unref();void tick();
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
