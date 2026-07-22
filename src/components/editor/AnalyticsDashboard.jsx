import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ANALYTICS_EVENTS } from '../../lib/constants';
import { BarChart3, Users, Clock, MousePointer2, Download } from 'lucide-react';
import './AnalyticsDashboard.css';

export default function AnalyticsDashboard({ webinarId }) {
  const [stats, setStats] = useState({
    totalRegistrations: 0,
    totalAttendees: 0,
    conversionRate: 0,
    ctaClicks: 0,
    pollResponses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      // Fetch registrations
      const { count: regCount } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('webinar_id', webinarId);

      // Fetch attendees (registered and attended)
      const { count: attCount } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('webinar_id', webinarId)
        .eq('attended', true);

      // Fetch events
      const { data: events } = await supabase
        .from('analytics_events')
        .select('event_type')
        .eq('webinar_id', webinarId);

      const ctaClicks = events?.filter(e => e.event_type === ANALYTICS_EVENTS.CTA_CLICK).length || 0;
      const pollResponses = events?.filter(e => e.event_type === ANALYTICS_EVENTS.POLL_RESPONSE).length || 0;

      setStats({
        totalRegistrations: regCount || 0,
        totalAttendees: attCount || 0,
        conversionRate: regCount ? Math.round((attCount / regCount) * 100) : 0,
        ctaClicks,
        pollResponses,
      });
      setLoading(false);
    };

    fetchAnalytics();
  }, [webinarId]);

  if (loading) return <div className="spinner spinner-sm" />;

  return (
    <div className="analytics-dashboard">
      <div className="editor-header">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-gray-400" />
          <h3>Desempenho do Webinário</h3>
        </div>
        <button className="btn btn-secondary">
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ backgroundColor: 'var(--color-primary-500)', color: 'white' }}>
            <Users size={24} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Inscritos</span>
            <span className="stat-card-value">{stats.totalRegistrations}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ backgroundColor: 'var(--color-success-500)', color: 'white' }}>
            <Users size={24} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Participantes (Ao Vivo/Replay)</span>
            <span className="stat-card-value">{stats.totalAttendees}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ backgroundColor: 'var(--color-warning-500)', color: 'white' }}>
            <Clock size={24} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Conversão (Presença)</span>
            <span className="stat-card-value">{stats.conversionRate}%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ backgroundColor: 'var(--color-error-500)', color: 'white' }}>
            <MousePointer2 size={24} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Cliques na Oferta</span>
            <span className="stat-card-value">{stats.ctaClicks}</span>
          </div>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="card">
          <div className="card-header">
            <h4>Funil de Conversão</h4>
          </div>
          <div className="card-body">
            <div className="funnel-container">
              <div className="funnel-step" style={{ width: '100%' }}>
                <span className="funnel-label">Inscritos</span>
                <span className="funnel-value">{stats.totalRegistrations}</span>
              </div>
              <div className="funnel-step" style={{ width: `${Math.max(stats.conversionRate, 10)}%` }}>
                <span className="funnel-label">Participaram</span>
                <span className="funnel-value">{stats.totalAttendees}</span>
              </div>
              <div className="funnel-step" style={{ width: `${Math.max((stats.ctaClicks / (stats.totalAttendees || 1)) * 100, 5)}%` }}>
                <span className="funnel-label">Clicaram (CTA)</span>
                <span className="funnel-value">{stats.ctaClicks}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
