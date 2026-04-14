import { useState } from 'react';
import { Plus, X } from 'lucide-react';

export default function MobilitySection({ mobilityType, mobilityZones, onTypeChange, onZonesChange }) {
  const [newZone, setNewZone] = useState({ zoneType: 'ville', value: '' });

  const addZone = () => {
    if (!newZone.value.trim()) return;
    onZonesChange([...mobilityZones, { ...newZone, value: newZone.value.trim() }]);
    setNewZone({ zoneType: newZone.zoneType, value: '' });
  };

  const removeZone = (i) => {
    onZonesChange(mobilityZones.filter((_, idx) => idx !== i));
  };

  const ZONE_LABELS = { ville: 'Ville', departement: 'Département', region: 'Région' };

  return (
    <div>
      <div className="input-group">
        <label className="input-label">Mobilité géographique</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { value: 'none', label: 'Pas mobile' },
            { value: 'all', label: 'Partout en France' },
            { value: 'specific', label: 'Zones spécifiques' }
          ].map(opt => (
            <button
              key={opt.value} type="button"
              onClick={() => onTypeChange(opt.value)}
              className={`btn ${mobilityType === opt.value ? 'btn-blue' : 'btn-ghost'}`}
              style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {mobilityType === 'none' && (
        <div className="card-sm" style={{ borderColor: 'var(--red)', background: 'var(--red-light)' }}>
          <p style={{ fontSize: 13, color: '#FCA5A5' }}>
            Tu ne souhaites pas te déplacer. Les recommandations seront basées sur ton adresse actuelle.
          </p>
        </div>
      )}

      {mobilityType === 'all' && (
        <div className="card-sm" style={{ borderColor: 'var(--green)', background: 'var(--green-light)' }}>
          <p style={{ fontSize: 13, color: '#86EFAC' }}>
            Tu es mobile partout en France. Toutes les formations sont prises en compte.
          </p>
        </div>
      )}

      {mobilityType === 'specific' && (
        <div>
          {/* Zones existantes */}
          {mobilityZones.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {mobilityZones.map((z, i) => (
                <div key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '5px 10px 5px 12px',
                  background: 'var(--blue-light)', border: '1px solid var(--blue)',
                  borderRadius: 999, fontSize: 13
                }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{ZONE_LABELS[z.zoneType]}</span>
                  <span style={{ color: '#93C5FD', fontWeight: 500 }}>{z.value}</span>
                  <button
                    type="button" onClick={() => removeZone(i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, display: 'flex', lineHeight: 1 }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Ajouter une zone */}
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              className="input"
              value={newZone.zoneType}
              onChange={e => setNewZone(z => ({ ...z, zoneType: e.target.value }))}
              style={{ width: 140, flexShrink: 0 }}
            >
              <option value="ville">Ville</option>
              <option value="departement">Département</option>
              <option value="region">Région</option>
            </select>
            <input
              type="text" className="input"
              placeholder={newZone.zoneType === 'ville' ? 'Ex: Lyon' : newZone.zoneType === 'departement' ? 'Ex: Rhône (69)' : 'Ex: Auvergne-Rhône-Alpes'}
              value={newZone.value}
              onChange={e => setNewZone(z => ({ ...z, value: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addZone())}
            />
            <button type="button" onClick={addZone} className="btn btn-blue" style={{ flexShrink: 0 }}>
              <Plus size={15} />
              Ajouter
            </button>
          </div>
          {mobilityZones.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
              Ajoute au moins une zone pour affiner les recommandations.
            </p>
          )}
        </div>
      )}
    </div>
  );
}