import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useOrg } from '../contexts/OrgContext';

export function useWebinars() {
  const { orgId } = useOrg();
  const [webinars, setWebinars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWebinars = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const { data, error: err } = await supabase
      .from('webinars')
      .select('*, registrations(count)')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setWebinars(data || []);
      setError(null);
    }
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    fetchWebinars();
  }, [fetchWebinars]);

  return { webinars, loading, error, refetch: fetchWebinars };
}

export function useWebinar(id) {
  const [webinar, setWebinar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWebinar = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error: err } = await supabase
      .from('webinars')
      .select(`
        *,
        registration_pages(*),
        simulated_messages(*, order: sort_order),
        cta_configs(*, order: sort_order),
        polls(*, poll_responses(count)),
        email_configs(*)
      `)
      .eq('id', id)
      .single();

    if (err) {
      setError(err.message);
    } else {
      setWebinar(data);
      setError(null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchWebinar();
  }, [fetchWebinar]);

  const updateWebinar = async (updates) => {
    const { data, error: err } = await supabase
      .from('webinars')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (err) throw err;
    setWebinar((prev) => ({ ...prev, ...data }));
    return data;
  };

  const deleteWebinar = async () => {
    const { error: err } = await supabase
      .from('webinars')
      .delete()
      .eq('id', id);

    if (err) throw err;
  };

  return { webinar, loading, error, refetch: fetchWebinar, updateWebinar, deleteWebinar };
}

export function useCreateWebinar() {
  const { orgId } = useOrg();
  const [loading, setLoading] = useState(false);

  const createWebinar = async (webinarData) => {
    if (!orgId) throw new Error('No organization');
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('webinars')
        .insert({ ...webinarData, org_id: orgId })
        .select()
        .single();

      if (error) throw error;

      // Create default registration page
      await supabase.from('registration_pages').insert({
        webinar_id: data.id,
        blocks: JSON.stringify([
          { type: 'hero', data: { title: webinarData.title, subtitle: webinarData.description || '', cta: 'Garantir minha vaga' } },
          { type: 'countdown', data: {} },
          { type: 'form', data: { fields: ['name', 'email'] } },
        ]),
        theme: JSON.stringify({ primaryColor: '#3366ff', backgroundColor: '#ffffff', textColor: '#101828' }),
        published: false,
      });

      // Create default email configs
      await supabase.from('email_configs').insert([
        { webinar_id: data.id, type: 'confirmation', subject: 'Registro confirmado!', body_html: '', enabled: true },
        { webinar_id: data.id, type: 'reminder', subject: 'Seu webinário começa em breve!', body_html: '', send_before_minutes: 60, enabled: true },
        { webinar_id: data.id, type: 'replay', subject: 'Replay disponível!', body_html: '', enabled: true },
      ]);

      return data;
    } finally {
      setLoading(false);
    }
  };

  return { createWebinar, loading };
}
