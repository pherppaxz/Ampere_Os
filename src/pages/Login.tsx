import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function Login() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    setLoading(false);

    if (err) {
      setError(err.message);
    } else if (isSignUp) {
      alert('Conta criada! Verifica o email.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '24px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center' }}>
          {isSignUp ? 'Criar Conta' : 'Entrar'}
        </h1>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
          />
          
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
          />
          
          {error && <p style={{ color: '#ef4444', fontSize: '14px' }}>{error}</p>}
          
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px',
              backgroundColor: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'A processar...' : isSignUp ? 'Criar Conta' : 'Entrar'}
          </button>
          
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            style={{
              padding: '12px',
              backgroundColor: 'transparent',
              color: '#3b82f6',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            {isSignUp ? 'Já tens conta? Entrar' : 'Não tens conta? Criar'}
          </button>
        </form>
      </div>
    </div>
  );
}