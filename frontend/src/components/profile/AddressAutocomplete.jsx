import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader } from 'lucide-react';

export default function AddressAutocomplete({ value, onChange }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const searchAddress = async (q) => {
    if (q.length < 3) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=5&autocomplete=1`
      );
      const data = await res.json();
      const results = (data.features || []).map(f => ({
        label: f.properties.label,
      }));
      setSuggestions(results);
      setOpen(results.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(val), 300);
  };

  const handleSelect = (suggestion) => {
    setQuery(suggestion.label);
    onChange(suggestion.label);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="input"
          placeholder="Ex: 12 rue de la Paix, Paris"
          value={query}
          onChange={handleInput}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          style={{ paddingRight: 36 }}
          autoComplete="off"
        />
        <div style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-muted)', display: 'flex'
        }}>
          {loading
            ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
            : <MapPin size={14} />
          }
        </div>
      </div>

      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', marginTop: 4,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)', overflow: 'hidden'
        }}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(s)}
              style={{
                width: '100%', padding: '10px 14px', background: 'none',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                fontFamily: 'var(--font)',
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                display: 'flex', alignItems: 'center', gap: 10,
                transition: 'background 0.1s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <MapPin size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}