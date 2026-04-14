import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data.user, data.accessToken, data.refreshToken);
      navigate('/information');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: 24
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, background: 'var(--blue-light)', borderRadius: 12, marginBottom: 14 }}>
            <GraduationCap size={26} color="var(--blue)" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>OrientIA</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Crée ton compte gratuitement</p>
        </div>

        <div className="card">
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Inscription</h2>

          {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="grid-2" style={{ marginBottom: 0 }}>
              <div className="input-group">
                <label className="input-label">Prénom</label>
                <input type="text" className="input" placeholder="Marie" value={form.firstName} onChange={set('firstName')} required />
              </div>
              <div className="input-group">
                <label className="input-label">Nom</label>
                <input type="text" className="input" placeholder="Dupont" value={form.lastName} onChange={set('lastName')} required />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input type="email" className="input" placeholder="marie@email.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="input-group">
              <label className="input-label">Mot de passe</label>
              <input type="password" className="input" placeholder="Au moins 6 caractères" value={form.password} onChange={set('password')} required minLength={6} />
            </div>
            <button type="submit" className="btn btn-green" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
              {loading ? <div className="spinner" /> : 'Créer mon compte'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
            Déjà un compte ?{' '}
            <Link to="/login" style={{ color: 'var(--blue)', fontWeight: 500 }}>Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}