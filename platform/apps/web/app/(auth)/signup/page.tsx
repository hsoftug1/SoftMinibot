'use client';
import {useState,type FormEvent} from 'react';
import {supabaseBrowser} from '../../../lib/supabase/browser';
export default function Signup(){const[email,setEmail]=useState('');const[password,setPassword]=useState('');const[message,setMessage]=useState('');const[busy,setBusy]=useState(false);
async function submit(e:FormEvent){e.preventDefault();setBusy(true);const {error}=await supabaseBrowser().auth.signUp({email,password,emailRedirectTo:window.location.origin+'/login'});setBusy(false);setMessage(error?error.message:'Check your email to confirm your account, then sign in.');}
return <div className="card auth"><h1>Create your account</h1><p className="muted">Start managing your SoftMinibot workspace.</p><form onSubmit={submit}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)}/></label>{message&&<p role="status">{message}</p>}<button className="btn" disabled={busy}>{busy?'Creating…':'Create account'}</button></form><p>Already registered? <a href="/login">Sign in</a></p></div>}
