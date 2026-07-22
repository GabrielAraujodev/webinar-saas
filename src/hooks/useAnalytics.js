import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ANALYTICS_EVENTS } from '../lib/constants';

export function useAnalytics(webinarId) {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!webinarId) return;
    setLoading(true);

    // Fetch registrations
    const { data: registrations } = await supabase
      .from('registrations')
      .select('*')
      .eq('webinar_id', webinarId);

    // Fetch analytics events
    const { data: analyticsEvents } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('webinar_id', webinarId)
      .order('created_at', { ascending: true });

    const regs = registrations || [];
    const evts = analyticsEvents || [];

    const totalRegistrations = regs.length;
    const totalAttendees = regs.filter((r) => r.attended).length;
    const showUpRate = totalRegistrations > 0
      ? ((totalAttendees / totalRegistrations) * 100).toFixed(1)
      : 0;

    const ctaClicks = evts.filter((e) => e.event_type === ANALYTICS_EVENTS.CTA_CLICK).length;
    const ctaViews = evts.filter((e) => e.event_type === ANALYTICS_EVENTS.CTA_VIEW).length;
    const ctaConversion = ctaViews > 0
      ? ((ctaClicks / ctaViews) * 100).toFixed(1)
      : 0;

    const chatMessages = evts.filter((e) => e.event_type === ANALYTICS_EVENTS.CHAT_MESSAGE).length;
    const pollResponses = evts.filter((e) => e.event_type === ANALYTICS_EVENTS.POLL_RESPONSE).length;

    // Calculate average watch time from video_progress events
    const progressEvents = evts.filter((e) => e.event_type === ANALYTICS_EVENTS.VIDEO_PROGRESS);
    const watchTimes = {};
    progressEvents.forEach((e) => {
      const regId = e.registration_id;
      const seconds = e.event_data?.seconds || 0;
      if (!watchTimes[regId] || seconds > watchTimes[regId]) {
        watchTimes[regId] = seconds;
      }
    });
    const watchTimeValues = Object.values(watchTimes);
    const avgWatchTime = watchTimeValues.length > 0
      ? Math.round(watchTimeValues.reduce((a, b) => a + b, 0) / watchTimeValues.length)
      : 0;

    setStats({
      totalRegistrations,
      totalAttendees,
      showUpRate: Number(showUpRate),
      ctaClicks,
      ctaViews,
      ctaConversion: Number(ctaConversion),
      chatMessages,
      pollResponses,
      avgWatchTime,
    });

    setEvents(evts);
    setLoading(false);
  }, [webinarId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, events, loading, refetch: fetchStats };
}

export function useTrackEvent() {
  const trackEvent = useCallback(async (webinarId, registrationId, eventType, eventData = {}) => {
    await supabase.from('analytics_events').insert({
      webinar_id: webinarId,
      registration_id: registrationId,
      event_type: eventType,
      event_data: eventData,
    });
  }, []);

  return { trackEvent };
}

export function useWebinarComparison(webinarIds) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!webinarIds || webinarIds.length === 0) {
      setData([]);
      setLoading(false);
      return;
    }

    const fetchComparison = async () => {
      setLoading(true);
      const results = [];

      for (const id of webinarIds) {
        const { data: webinar } = await supabase
          .from('webinars')
          .select('id, title, scheduled_at')
          .eq('id', id)
          .single();

        const { data: regs } = await supabase
          .from('registrations')
          .select('*')
          .eq('webinar_id', id);

        const { data: evts } = await supabase
          .from('analytics_events')
          .select('*')
          .eq('webinar_id', id);

        const registrations = regs || [];
        const events = evts || [];
        const attendees = registrations.filter((r) => r.attended).length;
        const ctaClicks = events.filter((e) => e.event_type === ANALYTICS_EVENTS.CTA_CLICK).length;

        results.push({
          id,
          title: webinar?.title || 'Unknown',
          scheduledAt: webinar?.scheduled_at,
          registrations: registrations.length,
          attendees,
          showUpRate: registrations.length > 0
            ? ((attendees / registrations.length) * 100).toFixed(1)
            : '0',
          ctaClicks,
        });
      }

      setData(results);
      setLoading(false);
    };

    fetchComparison();
  }, [webinarIds]);

  return { data, loading };
}
