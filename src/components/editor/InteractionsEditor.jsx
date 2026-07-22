import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MessageSquare, ExternalLink, BarChart3, Plus, Trash2, Save } from 'lucide-react';
import './InteractionsEditor.css';

export default function InteractionsEditor({ webinarId }) {
  const [activeSubTab, setActiveSubTab] = useState('chat');
  const [loading, setLoading] = useState(true);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState({ author_name: '', message: '', timestamp_seconds: 0 });
  
  // CTA state
  const [ctas, setCtas] = useState([]);
  const [newCta, setNewCta] = useState({ title: '', description: '', button_text: 'Comprar Agora', button_url: '', show_at_seconds: 0 });
  
  // Poll state
  const [polls, setPolls] = useState([]);
  const [newPoll, setNewPoll] = useState({ question: '', options: ['Sim', 'Não'], show_at_seconds: 0, active: true });

  useEffect(() => {
    fetchData();
  }, [webinarId]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch simulated messages
    const { data: chatData } = await supabase
      .from('simulated_messages')
      .select('*')
      .eq('webinar_id', webinarId)
      .order('timestamp_seconds', { ascending: true });
    if (chatData) setMessages(chatData);
    
    // Fetch CTAs
    const { data: ctaData } = await supabase
      .from('cta_configs')
      .select('*')
      .eq('webinar_id', webinarId)
      .order('show_at_seconds', { ascending: true });
    if (ctaData) setCtas(ctaData);
    
    // Fetch Polls
    const { data: pollData } = await supabase
      .from('polls')
      .select('*')
      .eq('webinar_id', webinarId)
      .order('show_at_seconds', { ascending: true });
    if (pollData) setPolls(pollData);

    setLoading(false);
  };

  const addMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.author_name || !newMsg.message) return;
    
    const { data } = await supabase.from('simulated_messages').insert({
      webinar_id: webinarId,
      ...newMsg
    }).select().single();
    
    if (data) {
      setMessages([...messages, data].sort((a,b) => a.timestamp_seconds - b.timestamp_seconds));
      setNewMsg({ author_name: '', message: '', timestamp_seconds: newMsg.timestamp_seconds + 30 });
    }
  };

  const deleteMessage = async (id) => {
    await supabase.from('simulated_messages').delete().eq('id', id);
    setMessages(messages.filter(m => m.id !== id));
  };

  const addCta = async (e) => {
    e.preventDefault();
    if (!newCta.title || !newCta.button_url) return;
    
    const { data } = await supabase.from('cta_configs').insert({
      webinar_id: webinarId,
      ...newCta
    }).select().single();
    
    if (data) {
      setCtas([...ctas, data].sort((a,b) => a.show_at_seconds - b.show_at_seconds));
      setNewCta({ title: '', description: '', button_text: 'Comprar Agora', button_url: '', show_at_seconds: 0 });
    }
  };

  const deleteCta = async (id) => {
    await supabase.from('cta_configs').delete().eq('id', id);
    setCtas(ctas.filter(c => c.id !== id));
  };

  const addPoll = async (e) => {
    e.preventDefault();
    if (!newPoll.question || newPoll.options.length < 2) return;
    
    const { data } = await supabase.from('polls').insert({
      webinar_id: webinarId,
      ...newPoll
    }).select().single();
    
    if (data) {
      setPolls([...polls, data].sort((a,b) => a.show_at_seconds - b.show_at_seconds));
      setNewPoll({ question: '', options: ['Sim', 'Não'], show_at_seconds: 0, active: true });
    }
  };

  const deletePoll = async (id) => {
    await supabase.from('polls').delete().eq('id', id);
    setPolls(polls.filter(p => p.id !== id));
  };

  const formatSeconds = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="spinner spinner-sm" />;

  return (
    <div className="interactions-editor">
      <div className="interactions-tabs">
        <button className={`btn btn-sm ${activeSubTab === 'chat' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveSubTab('chat')}>
          <MessageSquare size={16} /> Chat Simulado
        </button>
        <button className={`btn btn-sm ${activeSubTab === 'cta' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveSubTab('cta')}>
          <ExternalLink size={16} /> Ofertas (CTAs)
        </button>
        <button className={`btn btn-sm ${activeSubTab === 'polls' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveSubTab('polls')}>
          <BarChart3 size={16} /> Enquetes
        </button>
      </div>

      <div className="interactions-content">
        {activeSubTab === 'chat' && (
          <div className="interaction-section card">
            <div className="card-header">
              <h4>Timeline do Chat Simulado</h4>
            </div>
            <div className="card-body">
              <form onSubmit={addMessage} className="add-form">
                <div className="form-row" style={{ gridTemplateColumns: '80px 1fr 2fr auto' }}>
                  <input type="number" className="input" placeholder="Segs." value={newMsg.timestamp_seconds} onChange={e => setNewMsg({...newMsg, timestamp_seconds: parseInt(e.target.value) || 0})} min="0" required />
                  <input type="text" className="input" placeholder="Nome do autor" value={newMsg.author_name} onChange={e => setNewMsg({...newMsg, author_name: e.target.value})} required />
                  <input type="text" className="input" placeholder="Mensagem..." value={newMsg.message} onChange={e => setNewMsg({...newMsg, message: e.target.value})} required />
                  <button type="submit" className="btn btn-primary"><Plus size={16} /> Adicionar</button>
                </div>
              </form>

              <div className="timeline-list mt-4">
                {messages.length === 0 ? <p className="text-gray-500 text-sm">Nenhuma mensagem simulada.</p> : (
                  messages.map(msg => (
                    <div key={msg.id} className="timeline-item">
                      <span className="timeline-time">{formatSeconds(msg.timestamp_seconds)}</span>
                      <div className="timeline-content">
                        <strong>{msg.author_name}</strong>: {msg.message}
                      </div>
                      <button className="btn btn-ghost btn-xs btn-icon danger" onClick={() => deleteMessage(msg.id)}><Trash2 size={14} /></button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'cta' && (
          <div className="interaction-section card">
            <div className="card-header">
              <h4>Ofertas e Banners (CTAs)</h4>
            </div>
            <div className="card-body">
              <form onSubmit={addCta} className="add-form flex-col">
                <div className="form-row">
                  <input type="number" className="input" placeholder="Mostrar em (segs)" value={newCta.show_at_seconds} onChange={e => setNewCta({...newCta, show_at_seconds: parseInt(e.target.value) || 0})} required />
                  <input type="text" className="input" placeholder="Título (Ex: Curso Completo)" value={newCta.title} onChange={e => setNewCta({...newCta, title: e.target.value})} required />
                </div>
                <div className="form-row">
                  <input type="text" className="input" placeholder="Texto do Botão" value={newCta.button_text} onChange={e => setNewCta({...newCta, button_text: e.target.value})} required />
                  <input type="url" className="input" placeholder="URL do Botão" value={newCta.button_url} onChange={e => setNewCta({...newCta, button_url: e.target.value})} required />
                </div>
                <button type="submit" className="btn btn-primary"><Plus size={16} /> Adicionar Oferta</button>
              </form>

              <div className="timeline-list mt-4">
                {ctas.length === 0 ? <p className="text-gray-500 text-sm">Nenhuma oferta configurada.</p> : (
                  ctas.map(cta => (
                    <div key={cta.id} className="timeline-item">
                      <span className="timeline-time">{formatSeconds(cta.show_at_seconds)}</span>
                      <div className="timeline-content flex-col">
                        <strong>{cta.title}</strong>
                        <a href={cta.button_url} target="_blank" rel="noreferrer" className="text-xs text-primary-600">{cta.button_text}</a>
                      </div>
                      <button className="btn btn-ghost btn-xs btn-icon danger" onClick={() => deleteCta(cta.id)}><Trash2 size={14} /></button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'polls' && (
          <div className="interaction-section card">
            <div className="card-header">
              <h4>Enquetes</h4>
            </div>
            <div className="card-body">
              <form onSubmit={addPoll} className="add-form flex-col">
                <div className="form-row">
                  <input type="number" className="input" placeholder="Mostrar em (segs)" value={newPoll.show_at_seconds} onChange={e => setNewPoll({...newPoll, show_at_seconds: parseInt(e.target.value) || 0})} required />
                  <input type="text" className="input" placeholder="Pergunta da Enquete" value={newPoll.question} onChange={e => setNewPoll({...newPoll, question: e.target.value})} required />
                </div>
                <div className="form-row">
                  <input type="text" className="input" placeholder="Opções separadas por vírgula" value={newPoll.options.join(',')} onChange={e => setNewPoll({...newPoll, options: e.target.value.split(',').map(o=>o.trim()).filter(Boolean)})} required />
                </div>
                <button type="submit" className="btn btn-primary"><Plus size={16} /> Adicionar Enquete</button>
              </form>

              <div className="timeline-list mt-4">
                {polls.length === 0 ? <p className="text-gray-500 text-sm">Nenhuma enquete configurada.</p> : (
                  polls.map(poll => (
                    <div key={poll.id} className="timeline-item">
                      <span className="timeline-time">{formatSeconds(poll.show_at_seconds)}</span>
                      <div className="timeline-content flex-col">
                        <strong>{poll.question}</strong>
                        <span className="text-xs text-gray-500">{poll.options.join(' | ')}</span>
                      </div>
                      <button className="btn btn-ghost btn-xs btn-icon danger" onClick={() => deletePoll(poll.id)}><Trash2 size={14} /></button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
