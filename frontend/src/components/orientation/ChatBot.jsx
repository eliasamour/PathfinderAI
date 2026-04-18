import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../../api/axios';

export default function ChatBot({ onOrientationPrompt }) {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(true);
  const [startError, setStartError] = useState('');
  const [completed, setCompleted] = useState(false);
  const [orientationPrompt, setOrientationPrompt] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => { startSession(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const startSession = async () => {
    setStarting(true);
    setMessages([]);
    setCompleted(false);
    setOrientationPrompt('');
    setStartError('');
    setSessionId(null);
    try {
      const { data } = await api.post('/chat/session');
      setSessionId(data.sessionId);
      setMessages([{ role: 'assistant', content: data.message.content, choices: data.message.choices || [] }]);
    } catch (err) {
      const detail = err.response?.data?.details || err.response?.data?.error || err.message;
      setStartError(`Impossible de démarrer la conversation : ${detail}`);
    } finally {
      setStarting(false);
    }
  };

  const sendMessage = async (text) => {
    const content = text || input;
    if (!content.trim() || loading || !sessionId) return;
    setMessages(m => [...m, { role: 'user', content, choices: [] }]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await api.post('/chat/message', { sessionId, content });
      setMessages(m => [...m, {
        role: 'assistant',
        content: data.message.content,
        choices: data.message.choices || []
      }]);
      if (data.isCompleted) {
        setCompleted(true);
        if (data.orientationPrompt) setOrientationPrompt(data.orientationPrompt);
      }
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Une erreur s\'est produite. Réessaie.', choices: [] }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (starting) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto 12px' }} />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Démarrage de la conversation...</p>
        </div>
      </div>
    );
  }

  if (startError) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <AlertCircle size={32} color="var(--red)" style={{ marginBottom: 12 }} />
        <p style={{ color: '#FCA5A5', fontSize: 14, marginBottom: 16 }}>{startError}</p>
        <button onClick={startSession} className="btn btn-ghost">
          <RefreshCw size={14} /> Réessayer
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 560 }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map((msg, i) => (
          <div key={i}>
            <div style={{
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              gap: 10, alignItems: 'flex-start'
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: msg.role === 'user' ? 'var(--blue-light)' : 'var(--bg-tertiary)',
                border: `1px solid ${msg.role === 'user' ? 'var(--blue)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {msg.role === 'user'
                  ? <User size={15} color="#93C5FD" />
                  : <Bot size={15} color="var(--text-secondary)" />
                }
              </div>
              <div style={{
                maxWidth: '70%', padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                background: msg.role === 'user' ? 'var(--blue)' : 'var(--bg-tertiary)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                fontSize: 14, lineHeight: 1.55,
                color: msg.role === 'user' ? '#fff' : 'var(--text-primary)'
              }}>
                {msg.content}
              </div>
            </div>

            {msg.role === 'assistant' && msg.choices?.length > 0 && !completed && i === messages.length - 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, marginLeft: 42 }}>
                {msg.choices.map((choice, ci) => (
                  <button
                    key={ci} type="button"
                    onClick={() => sendMessage(choice)}
                    disabled={loading}
                    style={{
                      padding: '6px 14px', borderRadius: 999, fontSize: 13,
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s', fontFamily: 'var(--font)'
                    }}
                    onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--blue)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-light)'; }}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Bot size={15} color="var(--text-secondary)" />
            </div>
            <div style={{
              padding: '10px 14px', background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)', borderRadius: '4px 12px 12px 12px',
              display: 'flex', gap: 5, alignItems: 'center'
            }}>
              {[0, 1, 2].map(n => (
                <div key={n} style={{
                  width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)',
                  animation: 'pulse 1.2s ease-in-out infinite',
                  animationDelay: `${n * 0.2}s`
                }} />
              ))}
            </div>
          </div>
        )}

        {completed && orientationPrompt && (
          <div className="card" style={{ border: '1px solid var(--green)', background: 'var(--green-light)', marginTop: 8 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#86EFAC', marginBottom: 8 }}>Profil analysé</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.6 }}>
              {orientationPrompt}
            </p>
            <button
              type="button"
              onClick={() => onOrientationPrompt(orientationPrompt, sessionId)}
              className="btn btn-green"
            >
              <ArrowRight size={15} />
              Générer mes recommandations
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {!completed && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10 }}>
            <input
              type="text" className="input"
              placeholder="Réponds librement ou utilise les boutons ci-dessus..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading || !sessionId}
            />
            <button type="submit" className="btn btn-blue"
              disabled={!input.trim() || loading || !sessionId}
              style={{ flexShrink: 0 }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {completed && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, textAlign: 'center' }}>
          <button type="button" onClick={startSession} className="btn btn-ghost btn-sm">
            <RefreshCw size={14} /> Recommencer
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}