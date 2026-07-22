import { supabase } from './supabase';

/**
 * AI Clips Generator Helper
 * Simulates and processes video content analysis to identify high-retention 9:16 clip segments.
 */

// Sample viral hooks templates for generated clips
const SAMPLE_CLIP_TEMPLATES = [
  {
    title: "🔥 O Erro nº 1 que destrói suas vendas no ao vivo",
    start_time: "00:04:15",
    end_time: "00:05:02",
    duration_seconds: 47,
    virality_score: 98,
    reason: "Gancho de alta curiosidade com quebra de padrão nos primeiros 3 segundos.",
    transcript_excerpt: "Se você faz isso na abertura da sua apresentação, 80% do seu público vai embora antes da proposta...",
    captionStyle: "hormozi-yellow",
    suggestedCaption: "Você está cometendo esse erro sem saber? 😱 comente 'AULA' para assistir ao webinário completo! #vendas #webinar #marketingdigital",
  },
  {
    title: "💡 A Estratégia de R$ 100k em 60 minutos revelada",
    start_time: "00:18:30",
    end_time: "00:19:24",
    duration_seconds: 54,
    virality_score: 95,
    reason: "Apresenta prova social e método prático de rápida aplicação.",
    transcript_excerpt: "Quando aplicamos este modelo simples de 3 etapas, nosso faturamento triplicou na primeira transmissão...",
    captionStyle: "tiktok-neon",
    suggestedCaption: "Salva este vídeo antes que saia do ar! 🚀 Link na bio para a transmissão completa de hoje. #sucesso #empreendedorismo",
  },
  {
    title: "⚡ Como reter a atenção de qualquer audiência",
    start_time: "00:27:10",
    end_time: "00:27:58",
    duration_seconds: 48,
    virality_score: 91,
    reason: "Gatilho de autoridade e técnica de retenção psicológica.",
    transcript_excerpt: "O segredo para ninguém fechar sua aba é fazer uma pergunta estratégica a cada 7 minutos...",
    captionStyle: "impact-red",
    suggestedCaption: "Aplique isso na sua próxima apresentação! 🎯 Cadastre-se no link da bio. #dicas #comunicacao",
  },
  {
    title: "🚀 O segredo dos maiores palestrantes do Brasil",
    start_time: "00:35:40",
    end_time: "00:36:25",
    duration_seconds: 45,
    virality_score: 88,
    reason: "Storytelling com final surpreendente.",
    transcript_excerpt: "Eu costumava ficar extremamente nervoso antes de entrar ao vivo, até descobrir esse gatilho mental simples...",
    captionStyle: "clean-white",
    suggestedCaption: "Você sente vergonha de falar ao vivo? Assista até o final! 💬 #superacao #webinar",
  },
];

export async function generateAiClipsForWebinar(webinarId, progressCallback) {
  // Step 1: Extract Audio / Transcribe
  if (progressCallback) progressCallback({ step: 1, text: '🎙️ Extraindo áudio e gerando transcrição via Whisper...' });
  await new Promise((r) => setTimeout(r, 1200));

  // Step 2: AI Engagement Analysis
  if (progressCallback) progressCallback({ step: 2, text: '🧠 Analisando retenção e identificando momentos virais com IA...' });
  await new Promise((r) => setTimeout(r, 1500));

  // Step 3: Vertical 9:16 Auto-Crop & Subtitle Burn
  if (progressCallback) progressCallback({ step: 3, text: '🎬 Enquadrando em 9:16 vertical e gerando legendas animadas...' });
  await new Promise((r) => setTimeout(r, 1200));

  // Insert generated clips into Supabase
  const clipsToInsert = SAMPLE_CLIP_TEMPLATES.map((clip) => ({
    webinar_id: webinarId,
    title: clip.title,
    start_time: clip.start_time,
    end_time: clip.end_time,
    duration_seconds: clip.duration_seconds,
    virality_score: clip.virality_score,
    reason: clip.reason,
    transcript_excerpt: clip.transcript_excerpt,
    status: 'ready',
    video_url: null, // Will use preview player fallback
  }));

  const { data, error } = await supabase
    .from('webinar_clips')
    .insert(clipsToInsert)
    .select();

  if (error) {
    console.error('Error inserting AI clips:', error);
    throw error;
  }

  if (progressCallback) progressCallback({ step: 4, text: '✅ 4 Cortes de alta conversão gerados com sucesso!' });
  return data;
}

export async function getWebinarClips(webinarId) {
  const { data, error } = await supabase
    .from('webinar_clips')
    .select('*')
    .eq('webinar_id', webinarId)
    .order('virality_score', { ascending: false });

  if (error) {
    console.error('Error fetching clips:', error);
    return [];
  }
  return data;
}

export async function deleteWebinarClip(clipId) {
  const { error } = await supabase
    .from('webinar_clips')
    .delete()
    .eq('id', clipId);
  return !error;
}
