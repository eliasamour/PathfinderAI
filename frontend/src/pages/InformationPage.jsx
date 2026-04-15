import { useState, useEffect } from 'react';
import { Save, User, BookOpen, FileText, MapPin, Euro } from 'lucide-react';
import api from '../api/axios';
import AcademicSection from '../components/profile/AcademicSection';
import GradesSection from '../components/profile/GradesSection';
import BulletinUpload from '../components/profile/BulletinUpload';
import MobilitySection from '../components/profile/MobilitySection';

const SECTIONS = [
  { id: 'academic', label: 'Parcours', icon: BookOpen },
  { id: 'grades', label: 'Notes', icon: FileText },
  { id: 'constraints', label: 'Budget & Lieu', icon: Euro },
];

export default function InformationPage() {
  const [profile, setProfile] = useState({
    profileType: 'lyceen',
    currentSchool: '', formation: '', level: '', filiere: '',
    specialites: [], previousSchool: '', previousFiliere: '',
    previousSpecialites: [], currentPath: '', previousPath: '',
    budgetMax: '', address: '', mobilityType: 'all',
    grades: [], mobilityZones: []
  });
  const [activeSection, setActiveSection] = useState('academic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'success' | 'error'

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/profile');
        setProfile(prev => ({
          ...prev,
          ...data,
          grades: data.grades || [],
          mobilityZones: data.mobilityZones || [],
          specialites: data.specialites || [],
          previousSpecialites: data.previousSpecialites || []
        }));
      } catch (err) {
        console.error('Erreur chargement profil:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (key, value) => {
    setProfile(p => ({ ...p, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      await api.put('/profile', profile);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleBulletinExtracted = (extractedGrades) => {
    setProfile(p => {
      const existing = p.grades.filter(g => g.source !== 'ocr');
      return { ...p, grades: [...existing, ...extractedGrades] };
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex-between" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="page-title">Mon profil</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            Ces informations permettent à l'IA de personnaliser tes recommandations
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {saveStatus === 'success' && (
            <span style={{ fontSize: 13, color: '#86EFAC' }}>Sauvegardé</span>
          )}
          {saveStatus === 'error' && (
            <span style={{ fontSize: 13, color: '#FCA5A5' }}>Erreur de sauvegarde</span>
          )}
          <button onClick={handleSave} className="btn btn-green" disabled={saving}>
            {saving ? <div className="spinner" /> : <Save size={16} />}
            Sauvegarder
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Sidebar navigation */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <div style={{ position: 'sticky', top: 84 }}>
            {SECTIONS.map(s => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                    background: active ? 'var(--bg-hover)' : 'transparent',
                    border: active ? '1px solid var(--border-light)' : '1px solid transparent',
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: 14, fontWeight: active ? 500 : 400,
                    marginBottom: 4, transition: 'all 0.15s', fontFamily: 'var(--font)'
                  }}
                >
                  <Icon size={16} />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Section Parcours */}
          {activeSection === 'academic' && (
            <div className="card">
              <h2 className="section-title">Parcours académique</h2>
              <AcademicSection profile={profile} onChange={handleChange} />
            </div>
          )}

          {/* Section Notes */}
          {activeSection === 'grades' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card">
                <h2 className="section-title">Remplissage automatique via bulletin</h2>
                <BulletinUpload onExtracted={handleBulletinExtracted} />
              </div>
              <div className="card">
                <div className="flex-between" style={{ marginBottom: 16 }}>
                  <h2 className="section-title" style={{ margin: 0, border: 'none', paddingBottom: 0 }}>Notes</h2>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{profile.grades.length} matière{profile.grades.length !== 1 ? 's' : ''}</span>
                </div>
                <GradesSection grades={profile.grades} onChange={(g) => handleChange('grades', g)} />
              </div>
            </div>
          )}

          {/* Section Budget & Localisation */}
          {activeSection === 'constraints' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card">
                <h2 className="section-title">Budget annuel maximum</h2>
                <div className="input-group">
                  <label className="input-label">Budget études (€/an)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number" className="input" placeholder="Ex: 12000"
                      value={profile.budgetMax || ''} min="0" max="100000" step="500"
                      onChange={e => handleChange('budgetMax', e.target.value)}
                      style={{ paddingRight: 52 }}
                    />
                    <span style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--text-muted)', fontSize: 13
                    }}>€/an</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                    Frais de scolarité uniquement. Laisse vide si pas de contrainte.
                  </p>
                </div>
              </div>

              <div className="card">
                <h2 className="section-title">Localisation</h2>
                <div className="input-group">
                  <label className="input-label">Adresse actuelle</label>
                  <input
                    type="text" className="input"
                    placeholder="Ex: 12 rue de la Paix, 75001 Paris"
                    value={profile.address || ''}
                    onChange={e => handleChange('address', e.target.value)}
                  />
                </div>
                <MobilitySection
                  mobilityType={profile.mobilityType || 'all'}
                  mobilityZones={profile.mobilityZones || []}
                  onTypeChange={(v) => handleChange('mobilityType', v)}
                  onZonesChange={(z) => handleChange('mobilityZones', z)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}