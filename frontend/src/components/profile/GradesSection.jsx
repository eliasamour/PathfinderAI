import { Plus, Trash2 } from 'lucide-react';

export default function GradesSection({ grades, onChange }) {
  const addGrade = () => {
    onChange([...grades, { subject: '', grade: '', subjectType: 'tronc_commun' }]);
  };

  const removeGrade = (i) => {
    onChange(grades.filter((_, idx) => idx !== i));
  };

  const updateGrade = (i, key, value) => {
    const updated = [...grades];
    updated[i] = { ...updated[i], [key]: value };
    onChange(updated);
  };

  return (
    <div>
      {grades.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 100px 140px 40px',
            gap: 8, padding: '6px 8px',
            fontSize: 12, color: 'var(--text-muted)', fontWeight: 500
          }}>
            <span>Matière</span>
            <span>Note /20</span>
            <span>Type</span>
            <span></span>
          </div>

          {grades.map((g, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 100px 140px 40px',
              gap: 8, marginBottom: 8, alignItems: 'center'
            }}>
              <input
                type="text" className="input" placeholder="Ex: Mathématiques"
                value={g.subject}
                onChange={e => updateGrade(i, 'subject', e.target.value)}
                style={{ padding: '8px 12px' }}
              />
              <input
                type="number" className="input" placeholder="14.5" min="0" max="20" step="0.5"
                value={g.grade}
                onChange={e => updateGrade(i, 'grade', e.target.value)}
                style={{ padding: '8px 12px' }}
              />
              <select
                className="input"
                value={g.subjectType}
                onChange={e => updateGrade(i, 'subjectType', e.target.value)}
                style={{ padding: '8px 12px' }}
              >
                <option value="tronc_commun">Tronc commun</option>
                <option value="specialite">Spécialité</option>
              </select>
              <button
                type="button" onClick={() => removeGrade(i)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 8, borderRadius: 6, display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {grades.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '24px 16px',
          color: 'var(--text-muted)', fontSize: 13,
          background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border)', marginBottom: 12
        }}>
          Aucune note renseignée. Ajoute des matières manuellement ou via un bulletin.
        </div>
      )}

      <button type="button" onClick={addGrade} className="btn btn-ghost btn-sm">
        <Plus size={15} />
        Ajouter une matière
      </button>
    </div>
  );
}