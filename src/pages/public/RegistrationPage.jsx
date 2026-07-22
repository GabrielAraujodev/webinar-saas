import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useCountdown } from '../../hooks/useCountdown';
import { BLOCK_TYPES } from '../../lib/constants';
import { useSeo } from '../../hooks/useSeo';
import { sanitizeInput, isValidEmail } from '../../lib/sanitize';
import { CheckCircle, Clock, Star, Quote, ArrowRight, Users } from 'lucide-react';
import './RegistrationPage.css';

export default function RegistrationPage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [webinar, setWebinar] = useState(null);
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // SEO metadata optimization
  useSeo({
    title: webinar?.title ? `Inscrição: ${webinar.title}` : 'Webinário Gratuito',
    description: webinar?.description || 'Inscreva-se agora para assistir a este exclusivo webinário online.',
  });

  useEffect(() => {
    const fetch = async () => {
      const { data: webinarData } = await supabase
        .from('webinars')
        .select('*, registration_pages(*)')
        .eq('id', slug)
        .single();

      if (webinarData) {
        setWebinar(webinarData);
        const regPage = webinarData.registration_pages?.[0];
        if (regPage) {
          setPage({
            ...regPage,
            blocks: typeof regPage.blocks === 'string' ? JSON.parse(regPage.blocks) : regPage.blocks,
            theme: typeof regPage.theme === 'string' ? JSON.parse(regPage.theme) : regPage.theme,
          });
        }
      }
      setLoading(false);
    };
    fetch();
  }, [slug]);

  const countdown = useCountdown(webinar?.scheduled_at);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanName = sanitizeInput(formData.name);

    if (!isValidEmail(cleanEmail)) {
      setError('Por favor, informe um endereço de e-mail válido.');
      setSubmitting(false);
      return;
    }

    try {
      // Check if already registered
      const { data: existing } = await supabase
        .from('registrations')
        .select('id')
        .eq('webinar_id', webinar.id)
        .eq('email', cleanEmail)
        .single();

      if (existing) {
        setError(t('registration.alreadyRegistered'));
        setSubmitting(false);
        return;
      }

      const { data: reg, error: regError } = await supabase
        .from('registrations')
        .insert({
          webinar_id: webinar.id,
          name: cleanName,
          email: cleanEmail,
          phone: formData.phone ? sanitizeInput(formData.phone) : null,
        })
        .select()
        .single();

      if (regError) throw regError;

      // Store registration ID for room access
      localStorage.setItem(`webinar-reg-${webinar.id}`, reg.id);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Error registering');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="reg-loading">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!webinar) {
    return (
      <div className="reg-error">
        <h2>Webinar not found</h2>
      </div>
    );
  }

  if (success) {
    return (
      <div className="reg-success-page">
        <div className="reg-success-card">
          <CheckCircle size={64} className="reg-success-icon" />
          <h1>{t('registration.successTitle')}</h1>
          <p>{t('registration.successMessage')}</p>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate(`/room/${webinar.id}`)}
          >
            {t('room.title')}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  const theme = page?.theme || {};
  const blocks = page?.blocks || [];
  const customStyle = {
    '--reg-primary': theme.primaryColor || 'var(--color-primary-600)',
    '--reg-bg': theme.backgroundColor || 'var(--color-white)',
    '--reg-text': theme.textColor || 'var(--color-text)',
  };

  const renderBlock = (block, index) => {
    switch (block.type) {
      case BLOCK_TYPES.HERO:
        return (
          <section key={index} className="reg-block reg-hero">
            <h1 className="reg-hero-title">{block.data?.title || webinar.title}</h1>
            <p className="reg-hero-subtitle">{block.data?.subtitle || webinar.description}</p>
            {block.data?.cta && (
              <a href="#reg-form" className="btn btn-primary btn-xl reg-hero-cta">
                {block.data.cta}
                <ArrowRight size={20} />
              </a>
            )}
          </section>
        );

      case BLOCK_TYPES.COUNTDOWN:
        return (
          <section key={index} className="reg-block reg-countdown-section">
            <p className="reg-countdown-label">
              <Clock size={18} />
              {t('registration.startsIn')}
            </p>
            <div className="reg-countdown">
              <div className="reg-countdown-unit">
                <span className="reg-countdown-value">{countdown.days}</span>
                <span className="reg-countdown-unit-label">{t('registration.days')}</span>
              </div>
              <span className="reg-countdown-separator">:</span>
              <div className="reg-countdown-unit">
                <span className="reg-countdown-value">{countdown.hours}</span>
                <span className="reg-countdown-unit-label">{t('registration.hours')}</span>
              </div>
              <span className="reg-countdown-separator">:</span>
              <div className="reg-countdown-unit">
                <span className="reg-countdown-value">{countdown.minutes}</span>
                <span className="reg-countdown-unit-label">{t('registration.minutes')}</span>
              </div>
              <span className="reg-countdown-separator">:</span>
              <div className="reg-countdown-unit">
                <span className="reg-countdown-value">{countdown.seconds}</span>
                <span className="reg-countdown-unit-label">{t('registration.seconds')}</span>
              </div>
            </div>
          </section>
        );

      case BLOCK_TYPES.BENEFITS:
        return (
          <section key={index} className="reg-block reg-benefits">
            <h2 className="reg-section-title">{block.data?.title || 'O que você vai aprender'}</h2>
            <div className="reg-benefits-grid">
              {(block.data?.items || []).map((item, i) => (
                <div key={i} className="reg-benefit-item">
                  <CheckCircle size={20} className="reg-benefit-icon" />
                  <div>
                    <h4>{item.title}</h4>
                    {item.description && <p>{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case BLOCK_TYPES.TESTIMONIALS:
        return (
          <section key={index} className="reg-block reg-testimonials">
            <h2 className="reg-section-title">{block.data?.title || 'Depoimentos'}</h2>
            <div className="reg-testimonials-grid">
              {(block.data?.items || []).map((item, i) => (
                <div key={i} className="reg-testimonial-card">
                  <Quote size={24} className="reg-testimonial-quote" />
                  <p className="reg-testimonial-text">{item.text}</p>
                  <div className="reg-testimonial-author">
                    <div className="avatar avatar-sm">
                      {item.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <span className="reg-testimonial-name">{item.name}</span>
                      {item.role && <span className="reg-testimonial-role">{item.role}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case BLOCK_TYPES.FORM:
        return (
          <section key={index} id="reg-form" className="reg-block reg-form-section">
            <div className="reg-form-card">
              <h2 className="reg-form-title">{t('registration.title')}</h2>

              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={handleSubmit} className="reg-form">
                <div className="input-group">
                  <label className="input-label" htmlFor="reg-name">
                    {t('common.name')} <span className="required">*</span>
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    className="input"
                    placeholder={t('auth.namePlaceholder')}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="reg-email">
                    {t('common.email')} <span className="required">*</span>
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    className="input"
                    placeholder={t('auth.emailPlaceholder')}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                {(block.data?.fields || []).includes('phone') && (
                  <div className="input-group">
                    <label className="input-label" htmlFor="reg-phone">
                      {t('common.phone')} <span className="input-hint">({t('common.optional')})</span>
                    </label>
                    <input
                      id="reg-phone"
                      type="tel"
                      className="input"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                )}
                <button
                  type="submit"
                  className="btn btn-primary btn-xl reg-submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="spinner spinner-sm" />
                  ) : (
                    <>
                      {t('registration.registerButton')}
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </section>
        );

      case BLOCK_TYPES.HOST_BIO:
        return (
          <section key={index} className="reg-block reg-host-bio">
            <h2 className="reg-section-title">{block.data?.title || 'Quem será seu Mentor'}</h2>
            <div className="reg-host-card">
              {block.data?.photoUrl ? (
                <img src={block.data.photoUrl} alt={block.data.name} className="reg-host-photo" />
              ) : (
                <div className="reg-host-avatar">{block.data?.name?.[0] || 'A'}</div>
              )}
              <div className="reg-host-info">
                <h3>{block.data?.name || 'Apresentador Principal'}</h3>
                <span className="reg-host-role">{block.data?.role || 'Especialista & Fundador'}</span>
                <p>{block.data?.bio || 'Mais de 10 anos de experiência transformando negócios e liderando eventos online.'}</p>
              </div>
            </div>
          </section>
        );

      case BLOCK_TYPES.FAQ:
        return (
          <section key={index} className="reg-block reg-faq">
            <h2 className="reg-section-title">{block.data?.title || 'Perguntas Frequentes'}</h2>
            <div className="reg-faq-list">
              {(block.data?.items || [
                { q: 'O webinário é totalmente gratuito?', a: 'Sim, a participação ao vivo é 100% gratuita.' },
                { q: 'Haverá reprise disponível?', a: 'A reprise será disponibilizada por tempo limitado para os inscritos.' }
              ]).map((item, i) => (
                <details key={i} className="reg-faq-item">
                  <summary className="reg-faq-question">{item.q}</summary>
                  <p className="reg-faq-answer">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        );

      case BLOCK_TYPES.TRAILER:
        return (
          <section key={index} className="reg-block reg-trailer">
            <h2 className="reg-section-title">{block.data?.title || 'Assista à Prévia'}</h2>
            <div className="reg-trailer-video">
              {block.data?.videoUrl ? (
                <iframe
                  src={block.data.videoUrl.replace('watch?v=', 'embed/')}
                  title="Trailer"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="reg-trailer-placeholder">
                  <p>Adicione a URL do vídeo nas configurações do bloco</p>
                </div>
              )}
            </div>
          </section>
        );

      case BLOCK_TYPES.PROOF_BADGES:
        return (
          <section key={index} className="reg-block reg-proof-badges">
            <div className="reg-proof-grid">
              <div className="reg-proof-badge">
                <Users size={24} />
                <span>+10.000 Participantes</span>
              </div>
              <div className="reg-proof-badge">
                <Star size={24} />
                <span>Nota 4.9/5 em Avaliações</span>
              </div>
              <div className="reg-proof-badge">
                <CheckCircle size={24} />
                <span>Certificado de Participação</span>
              </div>
            </div>
          </section>
        );

      case BLOCK_TYPES.TEXT:
        return (
          <section key={index} className="reg-block reg-text">
            <div dangerouslySetInnerHTML={{ __html: block.data?.content || '' }} />
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="reg-page" style={customStyle}>
      {blocks.map(renderBlock)}
    </div>
  );
}
