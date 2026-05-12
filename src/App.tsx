import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Login } from '@/pages/Login';
import { supabase } from '@/lib/supabase';

function App() {
  const { user, loading, signOut } = useAuth();
  const [twins, setTwins] = useState<any[]>([]);
  const [newTwinId, setNewTwinId] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const fetchTwins = async () => {
    if (!user) return;
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('twins')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Erro ao buscar twins:', fetchError);
      setError('Erro ao carregar dados: ' + fetchError.message);
      return;
    }

    if (data) setTwins(data);
  };

  useEffect(() => {
    if (user && !loaded) {
      fetchTwins();
      setLoaded(true);
    }
    if (!user) {
      setTwins([]);
      setLoaded(false);
    }
  }, [user]);

  const handleCreateTwin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTwinId.trim() || !user) return;

    setCreating(true);
    setError(null);

    const { error: insertError } = await supabase.from('twins').insert([
      {
        owner_id: user.id,
        twin_id: newTwinId,
        content_hash: `hash-${Date.now()}`,
        ai_score: 0.0,
        is_confirmed: false,
      },
    ]);

    if (insertError) {
      setError('Erro ao criar twin: ' + insertError.message);
    } else {
      setNewTwinId('');
      fetchTwins();
    }
    setCreating(false);
  };

  const handleConfirmTwin = async (twinId: string) => {
    setError(null);
    const { error: updateError } = await supabase
      .from('twins')
      .update({ is_confirmed: true, ai_score: 0.85 })
      .eq('id', twinId);

    if (updateError) {
      setError('Erro ao confirmar: ' + updateError.message);
    } else {
      fetchTwins();
    }
  };

  const handleDeleteTwin = async (twinId: string) => {
    if (!confirm('Apagar este twin?')) return;
    setError(null);
    const { error: deleteError } = await supabase
      .from('twins')
      .delete()
      .eq('id', twinId);

    if (deleteError) {
      setError('Erro ao apagar: ' + deleteError.message);
    } else {
      fetchTwins();
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
          <p style={{ color: '#6b7280' }}>Carregando AMPERE.OS...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div style={{ minHeight: '100vh', padding: '24px', fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: 'white',
        padding: '16px 24px',
        borderRadius: '8px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>⚡ AMPERE.OS</h1>
          <span style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold' }}>● SUPABASE: LIGADO</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#374151', fontSize: '14px' }}>👤 {user.email}</span>
          <button
            onClick={async () => { await signOut(); }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Sair
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '900px', margin: '0 auto' }}>
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            border: '1px solid #fecaca',
            fontSize: '14px'
          }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#3b82f6' }}>{twins.length}</p>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0' }}>Total Twins</p>
          </div>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#10b981' }}>
              {twins.filter(t => t.is_confirmed).length}
            </p>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0' }}>Verificados</p>
          </div>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#f59e0b' }}>
              {twins.filter(t => !t.is_confirmed).length}
            </p>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0' }}>Pendentes</p>
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '24px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>🆕 Criar Novo Twin</h2>
          <form onSubmit={handleCreateTwin} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="ID do Twin (ex: twin-alpha-001)"
              value={newTwinId}
              onChange={(e) => setNewTwinId(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              required
            />
            <button
              type="submit"
              disabled={creating}
              style={{
                padding: '10px 20px',
                backgroundColor: creating ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: creating ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {creating ? '⏳ A criar...' : '✨ Criar'}
            </button>
          </form>
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
          📋 Meus Twins ({twins.length})
        </h2>

        {twins.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '8px',
            textAlign: 'center',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            <p style={{ fontSize: '48px', margin: '0 0 12px' }}>🧬</p>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>Nenhum twin criado ainda.</p>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>Usa o formulário acima para criar o primeiro.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {twins.map((twin) => (
              <div key={twin.id} style={{
                backgroundColor: 'white',
                padding: '16px 20px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{twin.twin_id}</h3>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>
                      Hash: {twin.content_hash}
                    </p>
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>
                      Criado: {new Date(twin.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: twin.is_confirmed ? '#d1fae5' : '#fef3c7',
                      color: twin.is_confirmed ? '#065f46' : '#92400e'
                    }}>
                      {twin.is_confirmed ? '✅ VERIFICADO' : '⏳ PENDENTE'}
                    </span>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                      Score AI: {Number(twin.ai_score).toFixed(2)}
                    </p>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {!twin.is_confirmed && (
                        <button
                          onClick={() => handleConfirmTwin(twin.id)}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}
                        >
                          ✓ Validar
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTwin(twin.id)}
                        style={{
                          padding: '4px 10px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}
                      >
                        ✕ Apagar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;