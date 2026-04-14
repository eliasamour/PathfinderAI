import { Clock, Euro, ChevronDown, ChevronUp, School } from 'lucide-react';
import { useState } from 'react';

const DIFFICULTY_COLORS = {
  'Accessible': { bg: 'var(--green-light)', border: 'var(--green)', text: '#86EFAC' },
  'Modéré': { bg: 'var(--blue-light)', border: 'var(--blue)', text: '#93C5FD' },
  'Sélectif': { bg: '#422006', border: '#92400E', text: '#FCD34D' },
  'Très sélectif': { bg: 'var(--red-light)', border: 'var(--red)', text: '#FCA5A5' }
};

export default function PathCard({ path, isIdeal = false, index }) {
  const [expanded, setExpanded] = useState(isIdeal);
  const colors = DIFFICULTY_COLORS[path.difficulty] || DIFFICULTY_COLORS['Modéré'];

  const scoreColor = path.accessibilityScore >= 70
    ? 'var(--green)' : path.accessibilityScore >= 40
    ? 'var(--blue)' : 'var(--red)';

  return (
    <div className="card" style={{
      border: isIdeal ? '1px solid var(--blue)' : '1px solid var(--border)',
      background: isIdeal ? '#0D1B3E' : 'var(--bg-secondary)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            {isIdeal && (
              <span className="badge badge-blue" style={{ fontSize: 11 }}>Parcours idéal</span>
            )}
            {!isIdeal && index !== undefined && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Alternative {index}</span>
            )}
            <span style={{
              padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500,
              background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text
            }}>
              {path.difficulty}
            </span>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{path.title}</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{path.description}</p>
        </div>

        {/* Accessibility score */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            border: `3px solid ${scoreColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 700, color: scoreColor
          }}>
            {path.accessibilityScore}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Accessibilité</p>
        </div>
      </div>

      {/* Meta info */}
      <div style={{ display: 'flex', gap: 20, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--text-secondary)' }}>
          <Clock size={14} color="var(--text-muted)" />
          <span><strong style={{ color: 'var(--text-primary)' }}>{path.totalDuration}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--text-secondary)' }}>
          <Euro size={14} color="var(--text-muted)" />
          <span>{path.estimatedCost}</span>
        </div>
      </div>

      {/* Alternative reason */}
      {path.whyAlternative && (
        <div style={{
          marginTop: 12, padding: '10px 14px',
          background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)',
          fontSize: 13, color: 'var(--text-secondary)', borderLeft: '3px solid var(--blue)'
        }}>
          {path.whyAlternative}
        </div>
      )}

      {/* Steps toggle */}
      {path.steps && path.steps.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--blue)', fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 6, padding: 0,
              fontFamily: 'var(--font)'
            }}
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            {expanded ? 'Masquer' : 'Voir'} les étapes du parcours
          </button>

          {expanded && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {path.steps.map((step, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 14, padding: '12px 14px',
                  background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)'
                }}>
                  {/* Step number */}
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--blue-light)', border: '1px solid var(--blue)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#93C5FD', flexShrink: 0, marginTop: 2
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{step.formation}</span>
                      <span className="badge badge-blue" style={{ fontSize: 11 }}>{step.level}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{step.duration}</span>
                    </div>
                    {step.schools && step.schools.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <School size={12} color="var(--text-muted)" />
                        {step.schools.map((school, si) => (
                          <span key={si} style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            {school}{si < step.schools.length - 1 ? ',' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                    {step.cost && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        Coût : {step.cost}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}