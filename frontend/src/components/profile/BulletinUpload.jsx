import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import api from '../../api/axios';

export default function BulletinUpload({ onExtracted }) {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');
  const [extractedCount, setExtractedCount] = useState(0);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    const file = acceptedFiles[0];

    setStatus('loading');
    setMessage('');

    const formData = new FormData();
    formData.append('bulletin', file);

    try {
      const { data } = await api.post('/profile/extract-bulletin', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data.grades && data.grades.length > 0) {
        onExtracted(data.grades);
        setExtractedCount(data.grades.length);
        setStatus('success');
        setMessage(`${data.grades.length} matière${data.grades.length > 1 ? 's' : ''} extraite${data.grades.length > 1 ? 's' : ''} avec succès.`);
      } else {
        setStatus('error');
        setMessage('Aucune note trouvée dans ce document. Vérifie le fichier ou saisis les notes manuellement.');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Erreur lors de l\'extraction. Réessaie ou saisis les notes manuellement.');
    }
  }, [onExtracted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: status === 'loading'
  });

  return (
    <div>
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? 'var(--blue)' : status === 'success' ? 'var(--green)' : status === 'error' ? 'var(--red)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '28px 20px',
          textAlign: 'center',
          cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          background: isDragActive ? 'var(--blue-light)' : 'var(--bg-tertiary)',
          transition: 'all 0.15s'
        }}
      >
        <input {...getInputProps()} />

        {status === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Loader size={28} color="var(--blue)" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Analyse du bulletin en cours...</p>
          </div>
        )}

        {status === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <Upload size={28} color={isDragActive ? 'var(--blue)' : 'var(--text-muted)'} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: isDragActive ? '#93C5FD' : 'var(--text-primary)' }}>
                {isDragActive ? 'Dépose le fichier ici' : 'Glisse ton bulletin ici'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                ou clique pour sélectionner un fichier — JPG, PNG, PDF jusqu'à 10 Mo
              </p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <CheckCircle size={28} color="var(--green)" />
            <p style={{ fontSize: 14, color: '#86EFAC', fontWeight: 500 }}>{message}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Clique pour remplacer par un autre bulletin</p>
          </div>
        )}

        {status === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={28} color="var(--red)" />
            <p style={{ fontSize: 14, color: '#FCA5A5' }}>{message}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Clique pour réessayer</p>
          </div>
        )}
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
        <FileText size={12} />
        Les notes extraites s'ajoutent à la liste ci-dessus. Tu peux les modifier manuellement.
      </p>
    </div>
  );
}