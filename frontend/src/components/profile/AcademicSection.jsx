import { Plus, X } from 'lucide-react';

const FILIERES = ['Générale', 'Technologique (STI2D)', 'Technologique (STMG)', 'Technologique (ST2S)', 'Technologique (autre)', 'Professionnelle'];
const LEVELS = ['L1', 'L2', 'L3', 'M1', 'M2', 'BUT 1', 'BUT 2', 'BUT 3', 'BTS 1', 'BTS 2', 'Prépa 1', 'Prépa 2', 'Autre'];
const SPECIALITES_TERMINALE = ['Mathématiques', 'Physique-Chimie', 'SVT', 'NSI', 'SES', 'HGGSP', 'HLP', 'LLCE', 'Arts', 'EPS', 'SI', 'Autre'];

export default function AcademicSection({ profile, onChange }) {
  const { profileType } = profile;

  const handleSpecialite = (list, item, key) => {
    const current = profile[key] || [];
    const updated = current.includes(item)
      ? current.filter(s => s !== item)
      : current.length < 3 ? [...current, item] : current;
    onChange(key, updated);
  };

  const SpecialitesPicker = ({ fieldKey, label }) => (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
        {SPECIALITES_TERMINALE.map(s => {
          const selected = (profile[fieldKey] || []).includes(s);
          return (
            <button
              key={s} type="button"
              onClick={() => handleSpecialite(profile[fieldKey], s, fieldKey)}
              style={{
                padding: '5px 12px', borderRadius: 999, fontSize: 13, cursor: 'pointer',
                border: `1px solid ${selected ? 'var(--blue)' : 'var(--border)'}`,
                background: selected ? 'var(--blue-light)' : 'var(--bg-tertiary)',
                color: selected ? '#93C5FD' : 'var(--text-secondary)',
                transition: 'all 0.15s'
              }}
            >
              {s}
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Maximum 3 spécialités</p>
    </div>
  );

  return (
    <div>
      {/* Type de profil */}
      <div className="input-group">
        <label className="input-label">Tu es...</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { value: 'lyceen', label: 'Lycéen (Terminale)' },
            { value: 'etudiant', label: 'Étudiant' },
            { value: 'reorientation', label: 'En réorientation' }
          ].map(opt => (
            <button
              key={opt.value} type="button"
              onClick={() => onChange('profileType', opt.value)}
              className={`btn ${profileType === opt.value ? 'btn-blue' : 'btn-ghost'}`}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* CAS 1 : Lycéen */}
      {profileType === 'lyceen' && (
        <>
          <div className="input-group">
            <label className="input-label">Lycée actuel</label>
            <input type="text" className="input" placeholder="Lycée Henri IV, Paris" value={profile.currentSchool || ''} onChange={e => onChange('currentSchool', e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Filière</label>
            <select className="input" value={profile.filiere || ''} onChange={e => onChange('filiere', e.target.value)}>
              <option value="">Sélectionner</option>
              {FILIERES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <SpecialitesPicker fieldKey="specialites" label="Spécialités" />
        </>
      )}

      {/* CAS 2 : Étudiant */}
      {profileType === 'etudiant' && (
        <>
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">École / Université actuelle</label>
              <input type="text" className="input" placeholder="Université Paris-Saclay" value={profile.currentSchool || ''} onChange={e => onChange('currentSchool', e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Formation</label>
              <input type="text" className="input" placeholder="Licence Informatique" value={profile.formation || ''} onChange={e => onChange('formation', e.target.value)} />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Niveau actuel</label>
            <select className="input" value={profile.level || ''} onChange={e => onChange('level', e.target.value)}>
              <option value="">Sélectionner</option>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 4 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, fontWeight: 500 }}>Historique lycée</p>
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Lycée d'origine</label>
                <input type="text" className="input" placeholder="Lycée..." value={profile.previousSchool || ''} onChange={e => onChange('previousSchool', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Filière au lycée</label>
                <select className="input" value={profile.previousFiliere || ''} onChange={e => onChange('previousFiliere', e.target.value)}>
                  <option value="">Sélectionner</option>
                  {FILIERES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <SpecialitesPicker fieldKey="previousSpecialites" label="Spécialités au lycée" />
          </div>
        </>
      )}

      {/* CAS 3 : Réorientation */}
      {profileType === 'reorientation' && (
        <>
          <div className="input-group">
            <label className="input-label">Parcours actuel</label>
            <input type="text" className="input" placeholder="Ex: 2ème année de Droit à Paris 1" value={profile.currentPath || ''} onChange={e => onChange('currentPath', e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Parcours passé</label>
            <input type="text" className="input" placeholder="Ex: BTS Commerce après un Bac STMG" value={profile.previousPath || ''} onChange={e => onChange('previousPath', e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">École / Établissement actuel</label>
            <input type="text" className="input" placeholder="Université..." value={profile.currentSchool || ''} onChange={e => onChange('currentSchool', e.target.value)} />
          </div>
        </>
      )}
    </div>
  );
}