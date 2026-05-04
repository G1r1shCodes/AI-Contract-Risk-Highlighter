import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Auth({ onClose }: { onClose?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signup' && password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
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
    <div style={{ backgroundColor: 'transparent', color: 'var(--text-main)', fontFamily: 'system-ui' }}>
      <form onSubmit={handleAuth} style={{ position: 'relative', padding: '40px', background: 'var(--bg-panel)', borderRadius: '16px', border: '1px solid var(--border-main)', boxShadow: '0 24px 64px var(--glass-border)', width: '380px' }}>
        {onClose && (
          <button type="button" onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'var(--bg-panel-hover)', border: '1px solid var(--border-light)', color: 'var(--text-muted)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, fontSize: 16, padding: 0 }}>
            &#215;
          </button>
        )}
        <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--accent-gold)' }}>
          {mode === 'login' ? 'Sign in to LexScan' : 'Join LexScan'}
        </h2>
        <p style={{ margin: '0 0 32px', color: 'var(--text-dim)', fontSize: 13 }}>
          {mode === 'login' 
            ? 'Analyze and persist your secure contract history entirely isolated in the cloud.'
            : 'Create your account to start analyzing contracts with AI risk detection.'}
        </p>
        
        <input 
          type="email" 
          placeholder="Email address" 
          value={email} 
          onChange={e => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '14px 16px', marginBottom: '16px', boxSizing: 'border-box', background: 'var(--bg-main)', border: '1px solid var(--border-main)', borderRadius: '8px', color: 'var(--text-main)', outline: 'none', transition: 'border-color 0.2s' }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '14px 16px', marginBottom: mode === 'signup' ? '16px' : '24px', boxSizing: 'border-box', background: 'var(--bg-main)', border: '1px solid var(--border-main)', borderRadius: '8px', color: 'var(--text-main)', outline: 'none', transition: 'border-color 0.2s' }}
        />
        {mode === 'signup' && (
          <input 
            type="password" 
            placeholder="Confirm Password" 
            value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '14px 16px', marginBottom: '24px', boxSizing: 'border-box', background: 'var(--bg-main)', border: '1px solid var(--border-main)', borderRadius: '8px', color: 'var(--text-main)', outline: 'none', transition: 'border-color 0.2s' }}
          />
        )}
        
        <button disabled={loading} style={{ width: '100%', padding: '14px', background: mode === 'login' ? 'var(--accent-gold)' : 'var(--bg-main)', color: mode === 'login' ? 'var(--bg-main)' : 'var(--accent-gold)', border: mode === 'login' ? 'none' : '1px solid var(--accent-gold)', borderRadius: '8px', fontWeight: 600, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Authenticating...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
        </button>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: 13, color: 'var(--text-dim)' }}>
          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <span style={{ color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500, textDecoration: 'underline' }} onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </span>
        </div>
      </form>
    </div>
  );
}
