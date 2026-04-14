import { useState } from 'react';
import { Search, MessageSquare, Send, Lightbulb, History, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../api/axios';
import PathCard from '../components/orientation/PathCard';
import ChatBot from '../components/orientation/ChatBot';

export default function OrientationPage() {
  const [activeCase, setActiveCase] = useState('know'); // know | dontknow
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleGenerate = async (text) => {
    const query = text || input;
    if (!query.trim()) return;
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const { data } = await api.post('/orientation/generate', {
        userInput: query,
        sourceType: text ? 'chatbot' : 'direct'
      });
      setResult(data);
      if (text) setActiveCase('know');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la génération. Vérifie que ton profil est renseigné.');
    } finally {
      setLoading(false);
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

  return (
    <div className="page-container" style={{ maxWidth: 1100 }}>
      <div className="flex-between" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="page-title">Orientation</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Trouve ton chemin grâce à une analyse personnalisée basée sur ton profil
          </p>
        </div>
        <button
          onClick={loadHistory}
          className="btn btn-ghost btn-sm"
          disabled={historyLoading}
        >
          {historyLoading ? <div className="spinner" /> : <History size={15} />}
          Historique
          {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

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
                <button
                  key={h.id}
                  type="button"
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
                  <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{h.userInput}</span>
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
        <button
          type="button"
          onClick={() => setActiveCase('know')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: activeCase === 'know' ? 'var(--bg-hover)' : 'transparent',
            color: activeCase === 'know' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeCase === 'know' ? 500 : 400,
            fontSize: 14, fontFamily: 'var(--font)', transition: 'all 0.15s',
            borderRight: 'none'
          }}
        >
          <Search size={15} />
          J'ai une idée
        </button>
        <button
          type="button"
          onClick={() => setActiveCase('dontknow')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: activeCase === 'dontknow' ? 'var(--bg-hover)' : 'transparent',
            color: activeCase === 'dontknow' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeCase === 'dontknow' ? 500 : 400,
            fontSize: 14, fontFamily: 'var(--font)', transition: 'all 0.15s'
          }}
        >
          <MessageSquare size={15} />
          Je ne sais pas
        </button>
      </div>

      {/* CAS 1 : Je sais à peu près */}
      {activeCase === 'know' && (
        <div>
          <div className="card" style={{ marginBottom: 24 }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label className="input-label">Décris ton objectif ou ton domaine d'intérêt</label>
                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ex: travailler dans l'aéronautique, devenir data scientist, métiers du soin..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={loading}
                    style={{ fontSize: 15 }}
                  />
                  <button
                    type="submit"
                    className="btn btn-blue"
                    disabled={!input.trim() || loading}
                    style={{ flexShrink: 0, padding: '10px 20px' }}
                  >
                    {loading ? <div className="spinner" /> : <Send size={16} />}
                    {loading ? 'Analyse...' : 'Analyser'}
                  </button>
                </div>
              </div>

              {/* Suggestions */}
              {!result && (
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Exemples :</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s} type="button"
                        onClick={() => setInput(s)}
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

          {/* Results */}
          {result && (
            <div>
              {/* AI comment */}
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

              {/* Domain suggestions (si vague) */}
              {result.domainSuggestions && result.domainSuggestions.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
                    Domaines proches à explorer :
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {result.domainSuggestions.map(d => (
                      <button
                        key={d} type="button"
                        onClick={() => { setInput(d); handleGenerate(d); }}
                        className="badge badge-blue"
                        style={{ cursor: 'pointer', border: '1px solid var(--blue)', padding: '6px 14px', fontSize: 13, fontFamily: 'var(--font)' }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Ideal path */}
              {result.idealPath && (
                <div style={{ marginBottom: 16 }}>
                  <PathCard path={result.idealPath} isIdeal={true} />
                </div>
              )}

              {/* Alternative paths */}
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
      )}

      {/* CAS 2 : Je ne sais pas */}
      {activeCase === 'dontknow' && (
        <div className="card">
          <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Exploration guidée</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Tu ne sais pas encore quelle voie prendre ? Réponds aux questions du conseiller pour découvrir les domaines qui correspondent à ta personnalité et tes envies. La conversation dure environ 5 minutes.
            </p>
          </div>
          <ChatBot onOrientationPrompt={(prompt) => handleGenerate(prompt)} />
        </div>
      )}
    </div>
  );
}