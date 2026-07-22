import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BLOCK_TYPES } from '../../lib/constants';
import { Plus, Trash2, GripVertical, Save, Layout } from 'lucide-react';
import './RegistrationEditor.css';

export default function RegistrationEditor({ webinarId }) {
  const [page, setPage] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [theme, setTheme] = useState({
    primaryColor: '#3366ff',
    backgroundColor: '#ffffff',
    textColor: '#1a1f36',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      let { data, error } = await supabase
        .from('registration_pages')
        .select('*')
        .eq('webinar_id', webinarId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Not found, let's create it
        const defaultBlocks = [
          { type: BLOCK_TYPES.HERO, data: { title: 'Webinário Incrível', subtitle: 'Aprenda tudo aqui.', cta: 'Garantir Vaga' } },
          { type: BLOCK_TYPES.COUNTDOWN, data: {} },
          { type: BLOCK_TYPES.FORM, data: { fields: ['phone'] } },
        ];
        const newPage = {
          webinar_id: webinarId,
          blocks: defaultBlocks,
          theme: theme,
        };
        const { data: created } = await supabase
          .from('registration_pages')
          .insert(newPage)
          .select()
          .single();
        
        data = created;
      }

      if (data) {
        setPage(data);
        setBlocks(typeof data.blocks === 'string' ? JSON.parse(data.blocks) : data.blocks || []);
        setTheme(typeof data.theme === 'string' ? JSON.parse(data.theme) : data.theme || theme);
      }
      setLoading(false);
    };

    fetchPage();
  }, [webinarId]);

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from('registration_pages')
      .update({ blocks, theme })
      .eq('id', page.id);
    setSaving(false);
    alert('Página salva com sucesso!');
  };

  const addBlock = (type) => {
    const newBlock = { type, data: {} };
    if (type === BLOCK_TYPES.HERO) {
      newBlock.data = { title: 'Novo Título', subtitle: 'Nova descrição', cta: 'Inscreva-se' };
    }
    setBlocks([...blocks, newBlock]);
  };

  const removeBlock = (index) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const updateBlock = (index, data) => {
    const newBlocks = [...blocks];
    newBlocks[index].data = { ...newBlocks[index].data, ...data };
    setBlocks(newBlocks);
  };

  const moveBlock = (index, direction) => {
    if (direction === -1 && index === 0) return;
    if (direction === 1 && index === blocks.length - 1) return;
    
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[index + direction];
    newBlocks[index + direction] = temp;
    setBlocks(newBlocks);
  };

  if (loading) return <div className="spinner spinner-sm" />;

  return (
    <div className="registration-editor">
      <div className="editor-header">
        <h3>Construtor de Página</h3>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <span className="spinner spinner-sm" /> : <><Save size={16} /> Salvar Alterações</>}
        </button>
      </div>

      <div className="editor-layout">
        <div className="editor-blocks">
          {blocks.map((block, index) => (
            <div key={index} className="block-editor-card">
              <div className="block-editor-header">
                <div className="block-editor-title">
                  <GripVertical size={16} className="text-gray-400 cursor-move" />
                  <span className="badge badge-gray">{block.type.toUpperCase()}</span>
                </div>
                <div className="block-editor-actions">
                  <button className="btn btn-ghost btn-xs btn-icon" onClick={() => moveBlock(index, -1)} disabled={index === 0}>↑</button>
                  <button className="btn btn-ghost btn-xs btn-icon" onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1}>↓</button>
                  <button className="btn btn-ghost btn-xs btn-icon danger" onClick={() => removeBlock(index)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="block-editor-body">
                {block.type === BLOCK_TYPES.HERO && (
                  <div className="input-group">
                    <input 
                      type="text" className="input" placeholder="Título" 
                      value={block.data.title || ''} onChange={e => updateBlock(index, { title: e.target.value })} 
                    />
                    <input 
                      type="text" className="input" placeholder="Subtítulo" 
                      value={block.data.subtitle || ''} onChange={e => updateBlock(index, { subtitle: e.target.value })} 
                    />
                    <input 
                      type="text" className="input" placeholder="Texto do Botão" 
                      value={block.data.cta || ''} onChange={e => updateBlock(index, { cta: e.target.value })} 
                    />
                  </div>
                )}
                {block.type === BLOCK_TYPES.TEXT && (
                  <div className="input-group">
                    <textarea 
                      className="input textarea" placeholder="Conteúdo HTML/Texto" rows={4}
                      value={block.data.content || ''} onChange={e => updateBlock(index, { content: e.target.value })}
                    />
                  </div>
                )}
                {(block.type === BLOCK_TYPES.COUNTDOWN || block.type === BLOCK_TYPES.FORM) && (
                  <p className="text-sm text-gray-500">Este bloco é gerado automaticamente e não possui configurações avançadas nesta versão.</p>
                )}
              </div>
            </div>
          ))}

          <div className="add-block-menu">
            <span className="text-sm font-medium">Adicionar Bloco:</span>
            <div className="add-block-buttons">
              {Object.values(BLOCK_TYPES).map(type => (
                <button key={type} className="btn btn-secondary btn-sm" onClick={() => addBlock(type)}>
                  <Plus size={14} /> {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="editor-sidebar">
          <div className="card">
            <div className="card-header">
              <h4>Tema (Cores)</h4>
            </div>
            <div className="card-body">
              <div className="input-group">
                <label className="input-label">Cor Principal</label>
                <div className="color-picker-input">
                  <input type="color" value={theme.primaryColor} onChange={e => setTheme({...theme, primaryColor: e.target.value})} />
                  <input type="text" className="input" value={theme.primaryColor} onChange={e => setTheme({...theme, primaryColor: e.target.value})} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Cor de Fundo</label>
                <div className="color-picker-input">
                  <input type="color" value={theme.backgroundColor} onChange={e => setTheme({...theme, backgroundColor: e.target.value})} />
                  <input type="text" className="input" value={theme.backgroundColor} onChange={e => setTheme({...theme, backgroundColor: e.target.value})} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Cor do Texto</label>
                <div className="color-picker-input">
                  <input type="color" value={theme.textColor} onChange={e => setTheme({...theme, textColor: e.target.value})} />
                  <input type="text" className="input" value={theme.textColor} onChange={e => setTheme({...theme, textColor: e.target.value})} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
