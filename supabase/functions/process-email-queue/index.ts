import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Fetch pending emails from queue
  const { data: queue } = await supabaseClient
    .from('email_queue')
    .select('*, email_configs(*), registrations(*)')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .limit(50)

  if (!queue || queue.length === 0) {
    return new Response(JSON.stringify({ message: 'No emails to process' }), { headers: { 'Content-Type': 'application/json' } })
  }

  for (const item of queue) {
    console.log(`Processing email for ${item.registrations.email}...`)
    // Invoke send-email function or SMTP directly
    await supabaseClient.from('email_queue').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', item.id)
  }

  return new Response(JSON.stringify({ processed: queue.length }), { headers: { 'Content-Type': 'application/json' } })
})
