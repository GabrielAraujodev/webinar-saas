import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Settings, Building, User, Save, Globe } from 'lucide-react';
import './DashboardPage.css';

export default function SettingsPage() {
  const { user, profile } = useAuth();
  const [orgName, setOrgName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [locale, setLocale] = useState('pt-BR');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setLocale(profile.locale || 'pt-BR');
    }
  }, [profile]);

  useEffect(() => {
    const fetchOrg = async () => {
      if (!profile?.org_id) return;
      const { data } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.org_id)
        .single();
      if (data) {
        setOrgName(data.name);
      }
    };
    fetchOrg();
  }, [profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      if (profile?.id) {
        await supabase
          .from('profiles')
          .update({ display_name: displayName, locale })
          .eq('id', profile.id);
      }

      if (profile?.org_id && orgName.trim()) {
        await supabase
          .from('organizations')
          .update({ name: orgName })
          .eq('id', profile.org_id);
      }

      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-page">
      <header className="page-header mb-6">
        <h1 className="page-title">Configurações da Conta</h1>
        <p className="page-subtitle">Gerencie os dados da sua organização e preferências do perfil.</p>
      </header>

      {message && (
        <div className={`badge badge-${message.type === 'success' ? 'success' : 'error'} mb-4 p-3 style={{ width: '100%' }}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="card max-w-2xl">
        <div className="card-header border-b pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Building size={20} className="text-gray-400" />
            <h3 className="card-title">Organização</h3>
          </div>
        </div>

        <div className="form-group mb-6">
          <label className="label">Nome da Empresa / Conta</label>
          <input
            type="text"
            className="input"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
          />
        </div>

        <div className="card-header border-b pb-4 mb-4 pt-2">
          <div className="flex items-center gap-2">
            <User size={20} className="text-gray-400" />
            <h3 className="card-title">Perfil do Usuário</h3>
          </div>
        </div>

        <div className="form-group mb-4">
          <label className="label">E-mail (Login)</label>
          <input type="text" className="input" value={user?.email || ''} disabled />
        </div>

        <div className="form-group mb-4">
          <label className="label">Nome de Exibição</label>
          <input
            type="text"
            className="input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div className="form-group mb-6">
          <label className="label">Idioma Padrão</label>
          <select className="select" value={locale} onChange={(e) => setLocale(e.target.value)}>
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={16} />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}
