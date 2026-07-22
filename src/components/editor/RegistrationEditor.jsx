import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BLOCK_TYPES } from '../../lib/constants';
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  Monitor,
  Smartphone,
  Wand2,
  CheckCircle,
  Clock,
  Star,
  Quote,
  ArrowRight,
  Users,
  HelpCircle,
  Video,
  User,
  ShieldCheck,
} from 'lucide-react';
import './RegistrationEditor.css';

// Preset Templates
const PRESET_TEMPLATES = {
  DARK_TECH: {
    name: '🌙 Escuro Moderno',
    theme: { primaryColor: '#2563eb', backgroundColor: '#0f172a', textColor: '#f8fafc' },
    blocks: [
      { type: BLOCK_TYPES.HERO, data: { title: 'Masterclass Exclusiva: Alta Performance', subtitle: 'Aprenda as estratégias que geram resultados extraordinários.', cta: 'Garantir Minha Vaga Grátis' } },
      { type: BLOCK_TYPES.COUNTDOWN, data: {} },
      { type: BLOCK_TYPES.PROOF_BADGES, data: {} },
      { type: BLOCK_TYPES.HOST_BIO, data: { name: 'Dr. Lucas Silveira', role: 'Fundador & Especialista', bio: 'Mais de 12 anos impulsionando negócios digitais no Brasil.' } },
      { type: BLOCK_TYPES.FORM, data: { fields: ['phone'] } },
    ],
  },
  MINIMALIST: {
    name: '☀️ Minimalista Claro',
    theme: { primaryColor: '#16a34a', backgroundColor: '#ffffff', textColor: '#0f172a' },
    blocks: [
      { type: BLOCK_TYPES.HERO, data: { title: 'Webinário Gratuito de Inovação', subtitle: 'Descubra o passo a passo para escalar sua empresa.', cta: 'Inscrever-me Agora' } },
      { type: BLOCK_TYPES.COUNTDOWN, data: {} },
      { type: BLOCK_TYPES.FAQ, data: {} },
      { type: BLOCK_TYPES.FORM, data: { fields: [] } },
    ],
  },
  HIGH_ENERGY: {
    name: '🔥 Funil Alta Conversão',
    theme: { primaryColor: '#dc2626', backgroundColor: '#18181b', textColor: '#ffffff' },
    blocks: [
      { type: BLOCK_TYPES.HERO, data: { title: 'O SEGREDO DA CONVERSÃO AO VIVO', subtitle: 'Vagas extremamente limitadas para esta transmissão especial.', cta: 'QUERO MINHA VAGA AGORA' } },
      { type: BLOCK_TYPES.COUNTDOWN, data: {} },
      { type: BLOCK_TYPES.TRAILER, data: { title: 'Veja o Teaser do Evento' } },
      { type: BLOCK_TYPES.TESTIMONIALS, data: { title: 'Quem já participou recomenda', items: [{ name: 'Carlos Eduardo', text: 'Esse webinário mudou meu jogo completamente!', role: 'CEO Tech' }] } },
      { type: BLOCK_TYPES.FORM, data: { fields: ['phone'] } },
    ],
  },
};

export default function RegistrationEditor({ webinarId }) {
  const [page, setPage] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [theme, setTheme] = useState({
    primaryColor: '#3366ff',
    backgroundColor: '#ffffff',
    textColor: '#101828',
  });
  const [previewMode, setPreviewMode] = useState('desktop'); // 'desktop' | 'mobile'
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
        const defaultBlocks = PRESET_TEMPLATES.DARK_TECH.blocks;
        const newPage = {
          webinar_id: webinarId,
          blocks: defaultBlocks,
          theme: PRESET_TEMPLATES.DARK_TECH.theme,
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

  const applyTemplate = (templateKey) => {
    const tmpl = PRESET_TEMPLATES[templateKey];
    if (!tmpl) return;
    if (window.confirm(`Deseja aplicar o modelo "${tmpl.name}"? Isso substituirá os blocos atuais.`)) {
      setBlocks(tmpl.blocks);
      setTheme(tmpl.theme);
    }
  };

  const addBlock = (type) => {
    const newBlock = { type, data: {} };
    if (type === BLOCK_TYPES.HERO) {
      newBlock.data = { title: 'Novo Título do Webinário', subtitle: 'Descrição do evento', cta: 'Inscreva-se Já' };
    } else if (type === BLOCK_TYPES.HOST_BIO) {
      newBlock.data = { name: 'Seu Nome', role: 'Sua Especialidade', bio: 'Breve biografia sobre sua experiência.' };
    } else if (type === BLOCK_TYPES.FAQ) {
      newBlock.data = { title: 'Perguntas Frequentes', items: [{ q: 'Qual a duração?', a: 'Cerca de 60 minutos.' }] };
    } else if (type === BLOCK_TYPES.TRAILER) {
      newBlock.data = { title: 'Veja o Trailer', videoUrl: '' };
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
      {/* Editor Header */}
      <div className="editor-top-bar">
        <div className="editor-title-area">
          <h3>Construtor de Página de Inscrição</h3>
          <span className="badge badge-primary">Edição Ao Vivo</span>
        </div>

        {/* Viewport Switcher */}
        <div className="viewport-switcher">
          <button
            className={`viewport-btn ${previewMode === 'desktop' ? 'active' : ''}`}
            onClick={() => setPreviewMode('desktop')}
            title="Visualização Desktop"
          >
            <Monitor size={16} /> Desktop
          </button>
          <button
            className={`viewport-btn ${previewMode === 'mobile' ? 'active' : ''}`}
            onClick={() => setPreviewMode('mobile')}
            title="Visualização Mobile (Celular)"
          >
            <Smartphone size={16} /> Mobile
          </button>
        </div>

        {/* Actions */}
        <div className="editor-top-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner spinner-sm" /> : <><Save size={16} /> Salvar Alterações</>}
          </button>
        </div>
      </div>

      {/* Split-Screen Main Layout */}
      <div className="split-editor-container">
        {/* Left Panel: Control Form & Blocks */}
        <div className="editor-controls-panel">
          {/* Preset Templates Selector */}
          <div className="card mb-4 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Wand2 size={18} className="text-primary-500" />
              <h4 className="font-semibold text-sm">Modelos Prontos (1 Clique)</h4>
            </div>
            <div className="template-buttons-grid">
              {Object.keys(PRESET_TEMPLATES).map((key) => (
                <button
                  key={key}
                  className="btn btn-secondary btn-xs"
                  onClick={() => applyTemplate(key)}
                >
                  {PRESET_TEMPLATES[key].name}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Customizer */}
          <div className="card mb-4 p-4">
            <h4 className="font-semibold text-sm mb-3">Estilo Visual & Cores</h4>
            <div className="theme-pickers-grid">
              <div className="input-group">
                <label className="text-xs text-gray-500">Cor Principal</label>
                <input
                  type="color"
                  value={theme.primaryColor}
                  onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label className="text-xs text-gray-500">Cor de Fundo</label>
                <input
                  type="color"
                  value={theme.backgroundColor}
                  onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label className="text-xs text-gray-500">Cor do Texto</label>
                <input
                  type="color"
                  value={theme.textColor}
                  onChange={(e) => setTheme({ ...theme, textColor: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Blocks Manager */}
          <div className="blocks-list-container">
            <h4 className="font-semibold text-sm mb-3">Estrutura de Blocos da Página</h4>

            {blocks.map((block, index) => (
              <div key={index} className="block-editor-card">
                <div className="block-editor-header">
                  <div className="block-editor-title">
                    <GripVertical size={16} className="text-gray-400" />
                    <span className="badge badge-gray">{block.type.toUpperCase()}</span>
                  </div>
                  <div className="block-editor-actions">
                    <button className="btn btn-ghost btn-xs" onClick={() => moveBlock(index, -1)} disabled={index === 0}>↑</button>
                    <button className="btn btn-ghost btn-xs" onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1}>↓</button>
                    <button className="btn btn-ghost btn-xs danger" onClick={() => removeBlock(index)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="block-editor-body">
                  {block.type === BLOCK_TYPES.HERO && (
                    <div className="input-group gap-2">
                      <input
                        type="text" className="input input-sm" placeholder="Título Principal"
                        value={block.data.title || ''} onChange={e => updateBlock(index, { title: e.target.value })}
                      />
                      <input
                        type="text" className="input input-sm" placeholder="Subtítulo Descritivo"
                        value={block.data.subtitle || ''} onChange={e => updateBlock(index, { subtitle: e.target.value })}
                      />
                      <input
                        type="text" className="input input-sm" placeholder="Texto do Botão CTA"
                        value={block.data.cta || ''} onChange={e => updateBlock(index, { cta: e.target.value })}
                      />
                    </div>
                  )}

                  {block.type === BLOCK_TYPES.HOST_BIO && (
                    <div className="input-group gap-2">
                      <input
                        type="text" className="input input-sm" placeholder="Nome do Apresentador"
                        value={block.data.name || ''} onChange={e => updateBlock(index, { name: e.target.value })}
                      />
                      <input
                        type="text" className="input input-sm" placeholder="Cargo / Especialidade"
                        value={block.data.role || ''} onChange={e => updateBlock(index, { role: e.target.value })}
                      />
                      <textarea
                        className="input textarea input-sm" placeholder="Mini biografia" rows={2}
                        value={block.data.bio || ''} onChange={e => updateBlock(index, { bio: e.target.value })}
                      />
                    </div>
                  )}

                  {block.type === BLOCK_TYPES.TEXT && (
                    <textarea
                      className="input textarea input-sm" placeholder="Conteúdo HTML ou Texto" rows={3}
                      value={block.data.content || ''} onChange={e => updateBlock(index, { content: e.target.value })}
                    />
                  )}

                  {block.type === BLOCK_TYPES.TRAILER && (
                    <input
                      type="text" className="input input-sm" placeholder="URL do Vídeo (YouTube/Vimeo)"
                      value={block.data.videoUrl || ''} onChange={e => updateBlock(index, { videoUrl: e.target.value })}
                    />
                  )}
                </div>
              </div>
            ))}

            {/* Add Block Menu */}
            <div className="add-block-menu mt-4">
              <span className="text-xs font-semibold text-gray-500 mb-2 block">+ Adicionar Bloco à Página:</span>
              <div className="add-block-buttons">
                {Object.values(BLOCK_TYPES).map((type) => (
                  <button key={type} className="btn btn-secondary btn-xs" onClick={() => addBlock(type)}>
                    <Plus size={12} /> {type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Live Interactive Preview */}
        <div className="editor-preview-panel">
          <div className={`preview-wrapper ${previewMode}`}>
            <div className="preview-screen" style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}>
              {blocks.map((b, i) => (
                <div key={i} className="preview-block-item">
                  {b.type === BLOCK_TYPES.HERO && (
                    <div className="reg-hero text-center p-8">
                      <h1 className="text-3xl font-extrabold mb-3" style={{ color: theme.textColor }}>
                        {b.data?.title || 'Título do Webinário'}
                      </h1>
                      <p className="text-sm opacity-80 mb-4">{b.data?.subtitle || 'Subtítulo da transmissão'}</p>
                      <button className="btn btn-primary btn-lg" style={{ backgroundColor: theme.primaryColor }}>
                        {b.data?.cta || 'Garantir Vaga'} <ArrowRight size={16} />
                      </button>
                    </div>
                  )}

                  {b.type === BLOCK_TYPES.COUNTDOWN && (
                    <div className="p-6 text-center border-y border-opacity-10" style={{ borderColor: theme.textColor }}>
                      <p className="text-xs uppercase tracking-widest opacity-60 mb-2">Evento Começa Em:</p>
                      <div className="flex justify-center gap-3 text-2xl font-bold" style={{ color: theme.primaryColor }}>
                        <span>02d</span>:<span>14h</span>:<span>35m</span>:<span>10s</span>
                      </div>
                    </div>
                  )}

                  {b.type === BLOCK_TYPES.HOST_BIO && (
                    <div className="p-6 border-b border-opacity-10" style={{ borderColor: theme.textColor }}>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ backgroundColor: theme.primaryColor }}>
                          {b.data?.name?.[0] || 'A'}
                        </div>
                        <div>
                          <h4 className="font-bold">{b.data?.name || 'Nome do Mentor'}</h4>
                          <span className="text-xs font-semibold" style={{ color: theme.primaryColor }}>{b.data?.role || 'Apresentador'}</span>
                          <p className="text-xs opacity-75 mt-1">{b.data?.bio || 'Biografia do apresentador.'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {b.type === BLOCK_TYPES.PROOF_BADGES && (
                    <div className="p-4 flex justify-around text-center text-xs font-semibold opacity-80">
                      <div><Users size={18} className="mx-auto mb-1" /> +10.000 Alunos</div>
                      <div><Star size={18} className="mx-auto mb-1" /> Nota 4.9/5</div>
                      <div><ShieldCheck size={18} className="mx-auto mb-1" /> 100% Grátis</div>
                    </div>
                  )}

                  {b.type === BLOCK_TYPES.FORM && (
                    <div className="p-6 max-w-sm mx-auto my-4 rounded-xl border border-opacity-20 shadow-md" style={{ borderColor: theme.textColor, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                      <h4 className="text-lg font-bold text-center mb-4">Inscreva-se Gratuitamente</h4>
                      <input type="text" className="input input-sm mb-2" placeholder="Seu nome completo" disabled />
                      <input type="email" className="input input-sm mb-3" placeholder="Seu melhor e-mail" disabled />
                      <button className="btn btn-primary w-full" style={{ backgroundColor: theme.primaryColor }}>
                        Confirmar Inscrição
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
