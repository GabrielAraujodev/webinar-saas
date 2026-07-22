import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Mail, Clock } from 'lucide-react';
import './EmailsEditor.css';

export default function EmailsEditor({ webinarId }) {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchConfigs = async () => {
      let { data, error } = await supabase
        .from('email_configs')
        .select('*')
        .eq('webinar_id', webinarId)
        .order('type');

      if (!data || data.length === 0) {
        // Create defaults if they don't exist
        const defaults = [
          { webinar_id: webinarId, type: 'confirmation', subject: 'Confirmação de Inscrição', body_html: '<p>Obrigado por se inscrever!</p>', send_before_minutes: null, enabled: true },
          { webinar_id: webinarId, type: 'reminder', subject: 'Começa em 1 hora!', body_html: '<p>Seu webinário começa em breve.</p>', send_before_minutes: 60, enabled: true },
          { webinar_id: webinarId, type: 'replay', subject: 'Replay Liberado', body_html: '<p>O replay do webinário já está disponível.</p>', send_before_minutes: -1440, enabled: true }, // 24 hours after
        ];

        const { data: created } = await supabase.from('email_configs').insert(defaults).select();
        data = created;
      }
      
      if (data) setConfigs(data);
      setLoading(false);
    };

    fetchConfigs();
  }, [webinarId]);

  const handleSave = async () => {
    setSaving(true);
    
    // Update all configs
    for (const config of configs) {
      await supabase
        .from('email_configs')
        .update({
          subject: config.subject,
          body_html: config.body_html,
          enabled: config.enabled,
        })
        .eq('id', config.id);
    }
    
    setSaving(false);
    alert('Configurações de e-mail salvas com sucesso!');
  };

  const updateConfig = (id, field, value) => {
    setConfigs(configs.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  if (loading) return <div className="spinner spinner-sm" />;

  return (
    <div className="emails-editor">
      <div className="editor-header">
        <div className="flex items-center gap-2">
          <Mail size={20} className="text-gray-400" />
          <h3>Funil de E-mails Automáticos</h3>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <span className="spinner spinner-sm" /> : <><Save size={16} /> Salvar Alterações</>}
        </button>
      </div>

      <div className="emails-list">
        {configs.map(config => (
          <div key={config.id} className={`email-card ${!config.enabled ? 'disabled' : ''}`}>
            <div className="email-card-header">
              <div className="email-card-title">
                <span className="badge badge-primary">{config.type.toUpperCase()}</span>
                {config.send_before_minutes !== null && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock size={12} /> 
                    {config.send_before_minutes > 0 ? `${config.send_before_minutes} min antes` : `${Math.abs(config.send_before_minutes)/60} hrs depois`}
                  </span>
                )}
              </div>
              <label className="toggle-label">
                <input
                  type="checkbox"
                  className="toggle"
                  checked={config.enabled}
                  onChange={(e) => updateConfig(config.id, 'enabled', e.target.checked)}
                />
                Ativo
              </label>
            </div>
            
            <div className="email-card-body">
              <div className="input-group">
                <label className="input-label">Assunto</label>
                <input 
                  type="text" 
                  className="input" 
                  value={config.subject}
                  onChange={e => updateConfig(config.id, 'subject', e.target.value)}
                  disabled={!config.enabled}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Corpo do E-mail (HTML)</label>
                <textarea 
                  className="input textarea" 
                  rows={4}
                  value={config.body_html}
                  onChange={e => updateConfig(config.id, 'body_html', e.target.value)}
                  disabled={!config.enabled}
                />
                <span className="input-hint">Use variáveis como {'{{name}}'}, {'{{link}}'}.</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
