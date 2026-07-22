import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ANALYTICS_EVENTS } from '../../lib/constants';
import { BarChart3, Users, Clock, MousePointer2, CheckCircle2, TrendingUp, Filter } from 'lucide-react';
import './DashboardPage.css';

export default function GlobalAnalyticsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [webinars, setWebinars] = useState([]);
  const [selectedWebinarId, setSelectedWebinarId] = useState('all');
  const [globalStats, setGlobalStats] = useState({
    totalRegistrations: 0,
    totalAttendees: 0,
    conversionRate: 0,
    ctaClicks: 0,
    pollResponses: 0,
  });

  useEffect(() => {
    if (!profile?.org_id) return;

    const fetchGlobalAnalytics = async () => {
      setLoading(true);

      // Fetch all webinars for org
      const { data: webList } = await supabase
        .from('webinars')
        .select('*')
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false });

      setWebinars(webList || []);

      const webIds = (webList || []).map((w) => w.id);

      if (webIds.length === 0) {
        setLoading(false);
        return;
      }

      const targetWebinarIds = selectedWebinarId === 'all' ? webIds : [selectedWebinarId];

      // Fetch registrations count
      const { count: regCount } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .in('webinar_id', targetWebinarIds);

      // Fetch attendees count
      const { count: attCount } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .in('webinar_id', targetWebinarIds)
        .eq('attended', true);

      // Fetch analytics events
      const { data: events } = await supabase
        .from('analytics_events')
        .select('event_type')
        .in('webinar_id', targetWebinarIds);

      const ctaClicks = events?.filter((e) => e.event_type === ANALYTICS_EVENTS.CTA_CLICK).length || 0;
      const pollResponses = events?.filter((e) => e.event_type === ANALYTICS_EVENTS.POLL_RESPONSE).length || 0;

      setGlobalStats({
        totalRegistrations: regCount || 0,
        totalAttendees: attCount || 0,
        conversionRate: regCount ? Math.round((attCount / regCount) * 100) : 0,
        ctaClicks,
        pollResponses,
      });

      setLoading(false);
    };

    fetchGlobalAnalytics();
  }, [profile, selectedWebinarId]);

  return (
    <div className="dashboard-page">
      <header className="page-header flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">Relatórios e Analytics</h1>
          <p className="page-subtitle">Acompanhe métricas gerais de conversão e engajamento da sua conta.</p>
        </div>

        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-400" />
          <select
            className="select"
            value={selectedWebinarId}
            onChange={(e) => setSelectedWebinarId(e.target.value)}
            style={{ width: 260 }}
          >
            <option value="all">Todos os Webinários</option>
            {webinars.map((w) => (
              <option key={w.id} value={w.id}>
                {w.title}
              </option>
            ))}
          </select>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="spinner spinner-lg" />
        </div>
      ) : (
        <>
          <div className="stats-grid mb-8">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(51, 102, 255, 0.1)', color: 'var(--color-primary-600)' }}>
                <Users size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Total de Inscritos</span>
                <span className="stat-value">{globalStats.totalRegistrations}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success-600)' }}>
                <CheckCircle2 size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Total Participantes</span>
                <span className="stat-value">{globalStats.totalAttendees}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(234, 179, 8, 0.1)', color: 'var(--color-warning-600)' }}>
                <TrendingUp size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Taxa Média de Presença</span>
                <span className="stat-value">{globalStats.conversionRate}%</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error-600)' }}>
                <MousePointer2 size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Cliques em Ofertas (CTA)</span>
                <span className="stat-value">{globalStats.ctaClicks}</span>
              </div>
            </div>
          </div>

          {/* Webinars breakdown list */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Desempenho por Webinário</h3>
            </div>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Webinário</th>
                    <th>Tipo</th>
                    <th>Status</th>
                    <th>Inscritos</th>
                    <th>Visualizações</th>
                  </tr>
                </thead>
                <tbody>
                  {webinars.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-6 text-gray-500">
                        Nenhum webinário encontrado.
                      </td>
                    </tr>
                  ) : (
                    webinars.map((w) => (
                      <tr key={w.id}>
                        <td>
                          <strong>{w.title}</strong>
                        </td>
                        <td>
                          <span className="badge badge-secondary">{w.type === 'recorded' ? 'Gravado (Evergreen)' : 'Ao Vivo'}</span>
                        </td>
                        <td>
                          <span className="badge badge-primary">{w.status}</span>
                        </td>
                        <td>{globalStats.totalRegistrations}</td>
                        <td>{globalStats.totalAttendees}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
