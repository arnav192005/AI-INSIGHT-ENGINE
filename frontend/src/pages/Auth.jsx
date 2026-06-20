import React, { useState } from 'react';
import { Lock, Unlock, UserPlus, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Auth({ setIsLoggedIn }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const inputStyle = { 
    width: '100%', 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    border: '1px solid var(--border-color)', 
    color: 'var(--text-primary)', 
    padding: '0.8rem 1rem', 
    fontFamily: 'var(--font-mono)', 
    fontSize: '0.9rem', 
    outline: 'none',
    borderRadius: '8px',
    textAlign: 'center'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/login' : '/api/register';
    
    try {
      const res = await fetch(`http://127.0.0.1:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          password,
          ...(!isLogin && {
            first_name: firstName,
            last_name: lastName,
            email,
            phone
          })
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      if (isLogin) {
        localStorage.setItem('AUTH_SESSION', data.access_token);
        setIsLoggedIn(true);
        navigate('/dashboard');
      } else {
        setIsLogin(true);
        setError('Registration successful. Please login.');
        setUsername('');
        setPassword('');
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: 'var(--surface-opaque)', padding: '1rem', borderRadius: '50%', border: '1px solid var(--border-color)' }}>
            <Lock size={32} className="text-accent" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {isLogin ? 'SYSTEM LOCKED' : 'NEW REGISTRATION'}
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              AI Insight Engine requires authorization.
            </p>
          </div>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 95, 86, 0.1)', border: '1px solid #ff5f56', padding: '0.75rem', color: '#ff5f56', fontSize: '0.8rem', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!isLogin && (
            <>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input 
                  type="text" 
                  placeholder="First Name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  style={inputStyle}
                  className="glow-border"
                />
                <input 
                  type="text" 
                  placeholder="Last Name"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  style={inputStyle}
                  className="glow-border"
                />
              </div>
              <input 
                type="email" 
                placeholder="Email Address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                className="glow-border"
              />
              <input 
                type="tel" 
                placeholder="Phone Number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={inputStyle}
                className="glow-border"
              />
            </>
          )}
          <input 
            type="text" 
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={inputStyle}
            className="glow-border"
            autoFocus
          />
          <div style={{ position: 'relative', width: '100%' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ ...inputStyle, padding: '0.8rem 2.5rem 0.8rem 1rem' }}
              className="glow-border"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '0.8rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button 
            type="submit" 
            disabled={!username || !password || loading}
            className="btn-primary"
            style={{ width: '100%', padding: '0.8rem' }}
          >
            {isLogin ? <Unlock size={16} /> : <UserPlus size={16} />}
            {loading ? 'PROCESSING...' : (isLogin ? 'AUTHENTICATE' : 'REGISTER')}
          </button>
        </form>

        <button 
          onClick={() => { setIsLogin(!isLogin); setError(''); }}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'var(--font-mono)' }}
        >
          {isLogin ? 'Create an account' : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  );
}
