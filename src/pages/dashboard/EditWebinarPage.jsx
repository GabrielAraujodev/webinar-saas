import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Settings, Layout, MessageSquare, Mail, BarChart3, Save, ExternalLink } from 'lucide-react';
import RegistrationEditor from '../../components/editor/RegistrationEditor';
import InteractionsEditor from '../../components/editor/InteractionsEditor';
import EmailsEditor from '../../components/editor/EmailsEditor';
import AnalyticsDashboard from '../../components/editor/AnalyticsDashboard';
import './EditWebinarPage.css';

export default function EditWebinarPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [webinar, setWebinar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('config');

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('webinars')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error(error);
        navigate('/webinars');
        return;
      }
      
      setWebinar(data);
      setLoading(false);
    };
    
    fetch();
  }, [id, navigate]);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const { error } = await supabase
      .from('webinars')
      .update({
        title: webinar.title,
        description: webinar.description,
        video_url: webinar.video_url,
        scheduled_at: webinar.scheduled_at,
        replay_enabled: webinar.replay_enabled,
        replay_expires_hours: webinar.replay_expires_hours,
      })
      .eq('id', id);
      
    setSaving(false);
    if (!error) {
      alert(t('common.saved'));
    }
  };

  if (loading) {
    return (
      <div className="edit-page-loading">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  const tabs = [
    { id: 'config', label: 'Configuração', icon: Settings },
    { id: 'registration', label: 'Página de Registro', icon: Layout },
    { id: 'interactions', label: 'Interações (Chat, CTA, Enquetes)', icon: MessageSquare },
    { id: 'emails', label: 'E-mails', icon: Mail },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="edit-webinar-page">
      <div className="page-header">
        <div className="header-left">
          <button className="btn btn-ghost" onClick={() => navigate('/webinars')}>
            <ArrowLeft size={18} />
            {t('common.back')}
          </button>
          <div className="header-titles">
            <h1>{webinar.title}</h1>
            <p className="page-subtitle">Editando webinário</p>
          </div>
        </div>
        <div className="header-actions">
          <Link to={`/register/${webinar.id}`} target="_blank" className="btn btn-secondary">
            <ExternalLink size={16} />
            Ver Página
          </Link>
          <Link to={`/room/${webinar.id}`} target="_blank" className="btn btn-secondary">
            <ExternalLink size={16} />
            Ver Sala
          </Link>
        </div>
      </div>

      <div className="edit-layout">
        {/* Sidebar Tabs */}
        <div className="edit-sidebar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`edit-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="edit-content">
          {activeTab === 'config' && (
            <div className="card">
              <div className="card-header">
                <h3>Configurações Básicas</h3>
              </div>
              <div className="card-body">
                <form onSubmit={handleSaveConfig} className="config-form">
                  <div className="input-group">
                    <label className="input-label">Título</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={webinar.title || ''}
                      onChange={e => setWebinar({...webinar, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Descrição</label>
                    <textarea 
                      className="input textarea" 
                      value={webinar.description || ''}
                      onChange={e => setWebinar({...webinar, description: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">URL do Vídeo (YouTube/Vimeo)</label>
                    <input 
                      type="url" 
                      className="input" 
                      value={webinar.video_url || ''}
                      onChange={e => setWebinar({...webinar, video_url: e.target.value})}
                    />
                  </div>
                  <div className="form-row">
                    <div className="input-group">
                      <label className="input-label">Data e Hora</label>
                      <input 
                        type="datetime-local" 
                        className="input" 
                        value={webinar.scheduled_at ? new Date(webinar.scheduled_at).toISOString().slice(0, 16) : ''}
                        onChange={e => setWebinar({...webinar, scheduled_at: new Date(e.target.value).toISOString()})}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="input-group">
                      <label className="input-label toggle-label">
                        <input
                          type="checkbox"
                          className="toggle"
                          checked={webinar.replay_enabled}
                          onChange={(e) => setWebinar({...webinar, replay_enabled: e.target.checked})}
                        />
                        Habilitar Replay
                      </label>
                    </div>
                    {webinar.replay_enabled && (
                      <div className="input-group">
                        <label className="input-label">Expiração (horas)</label>
                        <input 
                          type="number" 
                          className="input" 
                          value={webinar.replay_expires_hours || 48}
                          onChange={e => setWebinar({...webinar, replay_expires_hours: parseInt(e.target.value, 10)})}
                        />
                      </div>
                    )}
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? <span className="spinner spinner-sm" /> : <><Save size={16} /> Salvar</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'registration' && (
            <RegistrationEditor webinarId={webinar.id} />
          )}

          {activeTab === 'interactions' && (
            <InteractionsEditor webinarId={webinar.id} />
          )}

          {activeTab === 'emails' && (
            <EmailsEditor webinarId={webinar.id} />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsDashboard webinarId={webinar.id} />
          )}
        </div>
      </div>
    </div>
  );
}
