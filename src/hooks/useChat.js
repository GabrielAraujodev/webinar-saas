import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useChat(webinarId, userName) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef(null);

  // Fetch existing messages
  useEffect(() => {
    if (!webinarId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('webinar_id', webinarId)
        .order('sent_at', { ascending: true })
        .limit(100);

      setMessages(data || []);
      setLoading(false);
    };

    fetchMessages();
  }, [webinarId]);

  // Subscribe to realtime
  useEffect(() => {
    if (!webinarId) return;

    const channel = supabase
      .channel(`chat:${webinarId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `webinar_id=eq.${webinarId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [webinarId]);

  const sendMessage = useCallback(
    async (message) => {
      if (!webinarId || !message.trim()) return;

      const { error } = await supabase.from('chat_messages').insert({
        webinar_id: webinarId,
        user_name: userName || 'Anônimo',
        message: message.trim(),
      });

      if (error) throw error;
    },
    [webinarId, userName]
  );

  return { messages, loading, sendMessage };
}

export function useSimulatedChat(webinarId, currentTimeSeconds) {
  const [allMessages, setAllMessages] = useState([]);
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch simulated messages
  useEffect(() => {
    if (!webinarId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('simulated_messages')
        .select('*')
        .eq('webinar_id', webinarId)
        .order('timestamp_seconds', { ascending: true });

      setAllMessages(data || []);
      setLoading(false);
    };

    fetchMessages();
  }, [webinarId]);

  // Show messages based on video time
  useEffect(() => {
    const visible = allMessages.filter(
      (msg) => msg.timestamp_seconds <= currentTimeSeconds
    );
    setVisibleMessages(visible);
  }, [allMessages, currentTimeSeconds]);

  return { messages: visibleMessages, loading };
}
