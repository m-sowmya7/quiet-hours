import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const channel = supabase
    .channel('schedule-triggers')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'schedule_triggers' },
      (payload) => {
        console.log('New trigger row:', payload.new);
        // e.g., you could forward to an external job queue here
      }
    )
    .subscribe();
}

main();
