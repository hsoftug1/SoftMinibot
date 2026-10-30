import {createCipheriv,randomBytes,createHash} from 'node:crypto';

// Integration boundary: call only after the WhatsApp adapter has received a message.
// Never log message bodies or encryption keys.
export function createAntiDeleteStore(supabase,base64Key){
 const key=Buffer.from(base64Key||'','base64');
 if(key.length!==32)throw new Error('ANTI_DELETE_ENCRYPTION_KEY must be a base64-encoded 32-byte key');
 function encrypt(plaintext){
  const iv=randomBytes(12);
  const cipher=createCipheriv('aes-256-gcm',key,iv);
  const data=Buffer.concat([cipher.update(plaintext,'utf8'),cipher.final()]);
  return [iv.toString('base64'),cipher.getAuthTag().toString('base64'),data.toString('base64')].join('.');
 }
 async function capture({botId,tenantId,messageId,text}){
  if(!botId||!tenantId||!messageId||typeof text!=='string'||!text.trim())return false;
  const {data:settings,error}=await supabase.from('bot_privacy_settings').select('anti_delete_enabled,retention_hours').eq('bot_instance_id',botId).eq('tenant_id',tenantId).maybeSingle();
  if(error)throw error;
  if(!settings?.anti_delete_enabled)return false;
  const ttl=Math.min(168,Math.max(1,settings.retention_hours||24));
  const messageKey=createHash('sha256').update(messageId).digest('hex');
  const {error:writeError}=await supabase.from('deleted_message_archive').upsert({
   bot_instance_id:botId,tenant_id:tenantId,message_key:messageKey,
   ciphertext:encrypt(text),expires_at:new Date(Date.now()+ttl*3600000).toISOString()
  },{onConflict:'bot_instance_id,message_key',ignoreDuplicates:true});
  if(writeError)throw writeError;
  return true;
 }
 async function markDeleted({botId,messageId}){
  const messageKey=createHash('sha256').update(messageId).digest('hex');
  const {error}=await supabase.from('deleted_message_archive').update({deleted_at:new Date().toISOString()}).eq('bot_instance_id',botId).eq('message_key',messageKey).gt('expires_at',new Date().toISOString());
  if(error)throw error;
 }
 async function purgeExpired(){
  const {error}=await supabase.from('deleted_message_archive').delete().lt('expires_at',new Date().toISOString());
  if(error)throw error;
 }
 return {capture,markDeleted,purgeExpired};
}
