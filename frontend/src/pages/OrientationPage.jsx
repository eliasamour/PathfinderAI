import { useState } from 'react';
import { Search, MessageSquare, Send, Lightbulb, History, ChevronDown, ChevronUp, MessageCircle, X } from 'lucide-react';
import api from '../api/axios';
import PathCard from '../components/orientation/PathCard';
import ChatBot from '../components/orientation/ChatBot';

export default function OrientationPage() {
  const [activeCase, setActiveCase] = useState('know');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [chatbotGenerating, setChatbotGenerating] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);

  const handleGenerate = async (text, chatSessionId = null) => {
    const query = text || input;
    if (!query.trim()) return;
    setError('');
    setResult(null);
    setLoading(true);
    if (text) setChatbotGenerating(true);
    try {
      const { data } = await api.post('/orientation/generate', {
        userInput: query,
        sourceType: text ? 'chatbot' : 'direct',
        chatSessionId: chatSessionId || null
      });
      setResult(data);
      if (text) setActiveCase('know');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la génération. Vérifie que ton profil est renseigné.');
    } finally {
      setLoading(false);
      setChatbotGenerating(false);
    }
  };

  const loadHistory = async () => {
    if (showHistory) { setShowHistory(false); return; }
    setHistoryLoading(true);
    try {
      const { data } = await api.get('/orientation/history');
      setHistory(data);
      setShowHistory(true);
    } catch {
      console.error('Erreur historique');
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadChatSessions = async () => {
    setChatLoading(true);
    setSelectedChat(null);
    try {
      const { data } = await api.get('/chat/sessions');
      if (data && data.length > 0) {
        setSelectedChat(data[0]);
      } else {
        setSelectedChat({ messages: [], empty: true });
      }
    } catch (err) {
      console.error('Erreur chargement sessions:', err);
      setSelectedChat({ messages: [], empty: true });
    } finally {
      setChatLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleGenerate();
  };

  const SUGGESTIONS = [
    'Travailler dans l\'aéronautique',
    'Devenir développeur web',
    'Travailler dans la santé',
    'Métiers du marketing digital',
    'Ingénierie environnementale'
  ];

  if (chatbotGenerating) {
    return (
      <div style={{
        minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 20
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          border: '3px solid var(--blue-light)',
          borderTopColor: 'var(--blue)',
          animation: 'spin 0.8s linear infinite'
        }} />
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Analyse en cours...</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            L'IA génère tes recommandations personnalisées
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 1100 }}>
      <div className="flex-between" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="page-title">Orientation</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Trouve ton chemin grâce à une analyse personnalisée basée sur ton profil
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={loadChatSessions} className="btn btn-ghost btn-sm">
            <MessageCircle size={15} />
            Conversations
          </button>
          <button onClick={loadHistory} className="btn btn-ghost btn-sm" disabled={historyLoading}>
            {historyLoading ? <div className="spinner" /> : <History size={15} />}
            Historique
            {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Modal conversation */}
      {(selectedChat !== null || chatLoading) && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 24
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 600, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="flex-between" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Dernière conversation d'exploration</h3>
              <button type="button" onClick={() => setSelectedChat(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {chatLoading ? (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto' }} />
                </div>
              ) : selectedChat?.empty ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: 32 }}>
                  Aucune conversation enregistrée pour le moment.
                </p>
              ) : (
                selectedChat?.messages?.map((msg, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    gap: 8
                  }}>
                    <div style={{
                      maxWidth: '75%', padding: '8px 12px', fontSize: 13, lineHeight: 1.5,
                      borderRadius: msg.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                      background: msg.role === 'user' ? 'var(--blue)' : 'var(--bg-tertiary)',
                      border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                      color: msg.role === 'user' ? '#fff' : 'var(--text-primary)'
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* History panel */}
      {showHistory && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: 'var(--text-secondary)' }}>
            Recherches récentes
          </h3>
          {history.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Aucune recherche pour le moment.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.map(h => (
                <button key={h.id} type="button"
                  onClick={() => { setInput(h.userInput); setResult(h.result); setShowHistory(false); setActiveCase('know'); }}
                  style={{
                    padding: '10px 14px', background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{h.userInput}</span>
                    {h.sourceType === 'chatbot' && (
                      <span className="badge badge-blue" style={{ fontSize: 11 }}>Via chatbot</span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(h.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mode selector */}
      <div style={{
        display: 'flex', background: 'var(--bg-secondary)',
        border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
        padding: 4, marginBottom: 24, width: 'fit-content'
      }}>
        {[
          { value: 'know', label: 'J\'ai une idée', icon: Search },
          { value: 'dontknow', label: 'Je ne sais pas', icon: MessageSquare }
        ].map(opt => {
          const Icon = opt.icon;
          return (
            <button key={opt.value} type="button" onClick={() => setActiveCase(opt.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: activeCase === opt.value ? 'var(--bg-hover)' : 'transparent',
                color: activeCase === opt.value ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: activeCase === opt.value ? 500 : 400,
                fontSize: 14, fontFamily: 'var(--font)', transition: 'all 0.15s'
              }}
            >
              <Icon size={15} />
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* CAS 1 — caché avec display:none pour ne pas détruire l'état */}
      <div style={{ display: activeCase === 'know' ? 'block' : 'none' }}>
        <div className="card" style={{ marginBottom: 24 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label className="input-label">Décris ton objectif ou ton domaine d'intérêt</label>
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <input type="text" className="input"
                  placeholder="Ex: travailler dans l'aéronautique, devenir data scientist..."
                  value={input} onChange={e => setInput(e.target.value)}
                  disabled={loading} style={{ fontSize: 15 }}
                />
                <button type="submit" className="btn btn-blue"
                  disabled={!input.trim() || loading} style={{ flexShrink: 0, padding: '10px 20px' }}>
                  {loading ? <div className="spinner" /> : <Send size={16} />}
                  {loading ? 'Analyse...' : 'Analyser'}
                </button>
              </div>
            </div>
            {!result && (
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Exemples :</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {SUGGESTIONS.map(s => (
                    <button key={s} type="button" onClick={() => setInput(s)}
                      style={{
                        padding: '5px 12px', borderRadius: 999, fontSize: 13,
                        border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)', cursor: 'pointer',
                        fontFamily: 'var(--font)', transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.color = '#93C5FD'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {error && <div className="error-msg" style={{ marginBottom: 20 }}>{error}</div>}

        {result && (
          <div>
            {result.aiComment && (
              <div className="card" style={{ marginBottom: 20, borderColor: 'var(--blue-light)', background: '#0D1B3E' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--blue-light)', border: '1px solid var(--blue)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Lightbulb size={16} color="#93C5FD" />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#93C5FD', marginBottom: 6 }}>Analyse personnalisée</p>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{result.aiComment}</p>
                  </div>
                </div>
              </div>
            )}

            {result.domainSuggestions && result.domainSuggestions.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>Domaines proches :</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {result.domainSuggestions.map(d => (
                    <button key={d} type="button"
                      onClick={() => handleGenerate(d)}
                      className="badge badge-blue"
                      style={{ cursor: 'pointer', padding: '6px 14px', fontSize: 13, fontFamily: 'var(--font)' }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {result.idealPath && (
              <div style={{ marginBottom: 16 }}>
                <PathCard path={result.idealPath} isIdeal={true} />
              </div>
            )}

            {result.alternativePaths && result.alternativePaths.length > 0 && (
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', margin: '20px 0 12px' }}>
                  Parcours alternatifs
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {result.alternativePaths.map((path, i) => (
                    <PathCard key={i} path={path} index={i + 1} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CAS 2 — toujours monté, juste caché avec display:none */}
      <div style={{ display: activeCase === 'dontknow' ? 'block' : 'none' }}>
        <div className="card">
          <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Exploration guidée</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Réponds aux questions du conseiller pour découvrir les domaines qui correspondent à ta personnalité. La conversation dure environ 5 minutes.
            </p>
          </div>
          <ChatBot onOrientationPrompt={(prompt, sid) => handleGenerate(prompt, sid)} />
        </div>
      </div>
    </div>
  );
}