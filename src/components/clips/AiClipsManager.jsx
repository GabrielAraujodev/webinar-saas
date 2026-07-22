import { useState, useEffect } from 'react';
import {
  Sparkles,
  Scissors,
  Play,
  Download,
  Copy,
  Trash2,
  Check,
  Zap,
  Flame,
  Smartphone,
  Share2,
  Clock,
  Palette,
  ExternalLink,
} from 'lucide-react';
import { generateAiClipsForWebinar, getWebinarClips, deleteWebinarClip, getRealClipEmbedUrl, getRealClipShareUrl } from '../../lib/aiClipsGenerator';
import './AiClipsManager.css';

const SUBTITLE_STYLES = {
  'hormozi-yellow': { name: '💛 Hormozi Yellow', bg: 'rgba(0,0,0,0.85)', color: '#facc15', border: '#eab308' },
  'tiktok-neon': { name: '💚 TikTok Neon', bg: 'rgba(15,23,42,0.9)', color: '#22c55e', border: '#10b981' },
  'impact-red': { name: '❤️ Red Impact', bg: 'rgba(153,27,27,0.9)', color: '#ffffff', border: '#ef4444' },
  'clean-white': { name: '🤍 Clean Minimal', bg: 'rgba(255,255,255,0.95)', color: '#0f172a', border: '#cbd5e1' },
};

export default function AiClipsManager({ webinar }) {
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progressStatus, setProgressStatus] = useState(null);
  const [selectedClip, setSelectedClip] = useState(null);
  const [activeSubtitleStyle, setActiveSubtitleStyle] = useState('hormozi-yellow');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchClips();
  }, [webinar.id]);

  const fetchClips = async () => {
    setLoading(true);
    const data = await getWebinarClips(webinar.id);
    setClips(data);
    setLoading(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateAiClipsForWebinar(webinar.id, (status) => {
        setProgressStatus(status);
      }, webinar.video_url);
      await fetchClips();
    } catch (err) {
      alert('Erro ao gerar cortes. Tente novamente.');
    } finally {
      setGenerating(false);
      setProgressStatus(null);
    }
  };

  const handleDelete = async (clipId) => {
    if (window.confirm('Deseja excluir este corte?')) {
      await deleteWebinarClip(clipId);
      setClips(clips.filter((c) => c.id !== clipId));
      if (selectedClip?.id === clipId) setSelectedClip(null);
    }
  };

  const handleCopyCaption = (clip) => {
    const text = `${clip.title}\n\n${clip.transcript_excerpt}\n\n👉 Assista ao webinário completo no link da bio!\n\n#webinar #conteudo #vendas #dicas`;
    navigator.clipboard.writeText(text);
    setCopiedId(clip.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return <div className="spinner spinner-sm" />;
  }

  return (
    <div className="ai-clips-manager">
      {/* Header Banner */}
      <div className="clips-header-banner">
        <div className="clips-header-info">
          <div className="clips-badge">
            <Sparkles size={16} /> IA Video Clipper 9:16
          </div>
          <h2>Gerador de Cortes Automáticos para Reels & TikTok</h2>
          <p>
            Nossa Inteligência Artificial analisa a gravação do seu webinário, identifica os momentos de maior retenção e cria cortes em vídeo vertical (9:16) com legendas animadas.
          </p>
        </div>
        <button
          className="btn btn-primary btn-lg clips-generate-btn"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <>
              <span className="spinner spinner-sm" /> Processando IA...
            </>
          ) : (
            <>
              <Zap size={20} /> Gerar Novos Cortes com IA
            </>
          )}
        </button>
      </div>

      {/* Generation Progress Indicator */}
      {generating && progressStatus && (
        <div className="clips-progress-card">
          <div className="clips-progress-spinner">
            <Sparkles className="animate-spin text-primary-500" size={32} />
          </div>
          <div className="clips-progress-info">
            <h4>{progressStatus.text}</h4>
            <div className="clips-progress-bar">
              <div
                className="clips-progress-fill"
                style={{ width: `${(progressStatus.step / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {clips.length === 0 && !generating && (
        <div className="clips-empty-card">
          <Scissors size={48} className="clips-empty-icon" />
          <h3>Nenhum corte gerado para este webinário</h3>
          <p>Clique no botão acima para acionar a IA e recortar automaticamente os melhores momentos.</p>
          <button className="btn btn-primary" onClick={handleGenerate}>
            <Sparkles size={16} /> Gerar Meus Primeiros Cortes
          </button>
        </div>
      )}

      {/* Clips Grid */}
      {clips.length > 0 && (
        <div className="clips-grid">
          {clips.map((clip) => (
            <div key={clip.id} className="clip-card">
              {/* Card Header & Virality Badge */}
              <div className="clip-card-media" onClick={() => setSelectedClip(clip)}>
                <div className="clip-thumbnail-overlay">
                  <div className="clip-play-btn">
                    <Play size={24} fill="currentColor" />
                  </div>
                  <span className="clip-duration">
                    <Clock size={12} /> {clip.duration_seconds}s ({clip.start_time} - {clip.end_time})
                  </span>
                </div>
                <div className="clip-score-badge">
                  <Flame size={14} /> Viral Score {clip.virality_score}/100
                </div>
              </div>

              {/* Card Content */}
              <div className="clip-card-body">
                <h4 className="clip-card-title">{clip.title}</h4>
                <p className="clip-card-reason">💡 {clip.reason}</p>

                {/* Subtitle Excerpt */}
                <div className="clip-excerpt-box">
                  <span className="clip-excerpt-label">Transcrição:</span>
                  <p>"{clip.transcript_excerpt}"</p>
                </div>

                {/* Actions */}
                <div className="clip-card-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedClip(clip)}
                  >
                    <Smartphone size={14} /> Ver 9:16
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleCopyCaption(clip)}
                    title="Copiar Legenda Social"
                  >
                    {copiedId === clip.id ? <Check size={14} /> : <Copy size={14} />}
                    {copiedId === clip.id ? 'Copiado!' : 'Legenda'}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm danger btn-icon"
                    onClick={() => handleDelete(clip.id)}
                    title="Excluir Corte"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal 9:16 Smartphone */}
      {selectedClip && (
        <div className="clip-modal-backdrop" onClick={() => setSelectedClip(null)}>
          <div className="clip-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="clip-modal-header">
              <div className="flex items-center gap-2">
                <Smartphone size={20} className="text-primary-500" />
                <h3>Pré-visualização do Corte (Vertical 9:16)</h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedClip(null)}>
                ✕
              </button>
            </div>

            <div className="clip-modal-body">
              {/* 9:16 Smartphone Frame */}
              <div className="phone-preview-frame">
                <div className="phone-screen">
                  {/* Real Video Player with Start & End Timestamps */}
                  <div className="phone-video-container">
                    <iframe
                      src={
                        selectedClip.video_url ||
                        getRealClipEmbedUrl(webinar.video_url, selectedClip.start_time, selectedClip.end_time)
                      }
                      title={selectedClip.title}
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />

                    {/* Animated Hormozi Subtitles Overlay */}
                    <div
                      className="phone-subtitle-overlay"
                      style={{
                        backgroundColor: SUBTITLE_STYLES[activeSubtitleStyle].bg,
                        color: SUBTITLE_STYLES[activeSubtitleStyle].color,
                        borderColor: SUBTITLE_STYLES[activeSubtitleStyle].border,
                      }}
                    >
                      <span className="subtitle-word-highlight">"{selectedClip.title}"</span>
                      <p className="subtitle-text">{selectedClip.transcript_excerpt}</p>
                    </div>

                    {/* CTA Overlay Footer */}
                    <div className="phone-cta-overlay">
                      <span>🔗 Link na Bio para a transmissão completa</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customizer Sidebar */}
              <div className="clip-customizer-panel">
                <h4>{selectedClip.title}</h4>
                <div className="clip-meta-info">
                  <span className="badge badge-primary">
                    <Flame size={12} /> Score {selectedClip.virality_score}/100
                  </span>
                  <span className="badge badge-gray">{selectedClip.duration_seconds} segundos</span>
                </div>

                {/* Subtitle Style Picker */}
                <div className="subtitle-style-picker">
                  <label className="input-label">Estilo das Legendas Animadas</label>
                  <div className="style-buttons-grid">
                    {Object.keys(SUBTITLE_STYLES).map((key) => (
                      <button
                        key={key}
                        className={`style-btn ${activeSubtitleStyle === key ? 'active' : ''}`}
                        onClick={() => setActiveSubtitleStyle(key)}
                      >
                        {SUBTITLE_STYLES[key].name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Caption / Description Box */}
                <div className="input-group">
                  <label className="input-label">Legenda Recomendada para Reels/TikTok</label>
                  <textarea
                    className="input textarea text-xs"
                    rows={4}
                    readOnly
                    value={`${selectedClip.title}\n\n${selectedClip.transcript_excerpt}\n\n👉 Assista ao webinário completo no link da bio!\n\n#webinar #vendas #conteudo #dicas`}
                  />
                </div>

                {/* Export & Copy Actions */}
                <div className="flex flex-col gap-2 mt-4">
                  <button
                    className="btn btn-primary w-full"
                    onClick={() => handleCopyCaption(selectedClip)}
                  >
                    {copiedId === selectedClip.id ? <Check size={16} /> : <Copy size={16} />}
                    {copiedId === selectedClip.id ? 'Legenda Copiada!' : 'Copiar Legenda + Hashtags'}
                  </button>
                  <button
                    className="btn btn-secondary w-full"
                    onClick={() => alert(`Baixando corte HD (${selectedClip.title}.mp4)`)}
                  >
                    <Download size={16} /> Baixar Vídeo HD (9:16 .MP4)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
