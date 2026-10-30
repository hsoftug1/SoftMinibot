'use client';
import {useState, type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import {supabaseBrowser} from '../../../lib/supabase/browser';
export default function Login(){const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false);const router=useRouter();
async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');const {error}=await supabaseBrowser().auth.signInWithPassword({email,password});setBusy(false);if(error)setError(error.message);else{router.push('/dashboard');router.refresh();}}
return <div className="card auth"><h1>Welcome back</h1><p className="muted">Sign in to SoftMinibot</p><form onSubmit={submit}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p className="error" role="alert">{error}</p>}<button className="btn" disabled={busy}>{busy?'Signing in…':'Sign in'}</button></form><p>New here? <a href="/signup">Create account</a></p></div>}
