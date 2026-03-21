import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert("Signup Error: " + error.message);
      else alert("Sign up successful! Please check your email inbox to confirm your account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("Login Error: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ backgroundColor: 'transparent', color: '#fff', fontFamily: 'system-ui' }}>
      <form onSubmit={handleAuth} style={{ padding: '40px', background: '#0D0F14', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 24px 64px rgba(0,0,0,0.8)', width: '380px' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--accent-gold)' }}>
          {mode === 'login' ? 'Sign in to LexScan' : 'Create an Account'}
        </h2>
        <p style={{ margin: '0 0 32px', color: 'var(--text-dim)', fontSize: 13 }}>
          Analyze and persist your secure contract history entirely isolated in the cloud.
        </p>
        
        <input 
          type="email" 
          placeholder="Email address" 
          value={email} 
          onChange={e => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '14px 16px', marginBottom: '16px', boxSizing: 'border-box', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', transition: 'border-color 0.2s' }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '14px 16px', marginBottom: '24px', boxSizing: 'border-box', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', transition: 'border-color 0.2s' }}
        />
        
        <button disabled={loading} style={{ width: '100%', padding: '14px', background: 'var(--accent-gold)', color: '#0A0A0B', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Authenticating...' : (mode === 'login' ? 'Sign In' : 'Sign Up')}
        </button>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: 13, color: 'var(--text-dim)' }}>
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <span style={{ color: '#fff', cursor: 'pointer', fontWeight: 500 }} onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </span>
        </div>
      </form>
    </div>
  );
}
