import { SessionBusy } from './session';
import { flushPlaySaves } from './lib/play';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';

type User = { id: string; username?: string; email?: string };
const apiUrl = import.meta.env.VITE_API_URL || '/api';

async function authRequest(path: string, body?: { email: string; password: string }) {
  const response = await fetch(`${apiUrl}/auth/${path}`, {
    method: path === 'me' ? 'GET' : 'POST',
    credentials: 'include',
    ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Request failed. Please try again.');
  return data as { user?: User };
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    authRequest('me').then((data) => { if (active) setUser(data.user || null); })
      .catch(() => {}).finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      const data = await authRequest(mode, { email: email.trim(), password });
      setUser(data.user || null); setPassword('');
    } catch (failure) {
      setError(failure instanceof TypeError ? 'Cannot reach the backend. Start it on port 3000 and try again.' : (failure as Error).message);
    } finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true); setError('');
    try {
      await flushPlaySaves();
      await authRequest('logout');
      setUser(null); setPassword(''); setMode('login'); setMessage('You have logged out. Log in to continue.');
    } catch { setError('Could not save or log out. Check your connection and try again.'); }
    finally { setBusy(false); }
  }

  if (checking) return <main className="auth-screen"><p role="status">Checking your session…</p></main>;
  if (user) return <SessionBusy.Provider value={busy}><div className="account-bar"><span>Signed in as <strong>{user.email || user.username}</strong></span><button disabled={busy} onClick={logout}>{busy ? 'Logging out…' : 'Log out'}</button>{error && <span role="alert">{error}</span>}</div>{children}</SessionBusy.Provider>;
  return <main className="auth-screen"><section className="auth-card" aria-labelledby="auth-title">
    <p className="eyebrow">NUDOKU</p><h1 id="auth-title">{mode === 'register' ? 'Create your account' : 'Welcome back'}</h1>
    <p>{mode === 'register' ? 'Sign up to start playing Sudoku.' : 'Log in with your email and password.'}</p>
    <form onSubmit={submit}>
      <label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="username" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy}/>
      <label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required minLength={mode === 'register' ? 8 : 1} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy}/>
      {mode === 'register' && <small>Use at least 8 characters. Your email address is your username.</small>}
      {error && <p className="auth-error" role="alert">{error}</p>}{message && <p role="status">{message}</p>}
      <button className="auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'register' ? 'Sign up' : 'Log in'}</button>
    </form>
    <button className="auth-switch" disabled={busy} onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setMessage(''); setPassword(''); }}>{mode === 'login' ? 'New here? Sign up' : 'Already have an account? Log in'}</button>
  </section></main>;
}
