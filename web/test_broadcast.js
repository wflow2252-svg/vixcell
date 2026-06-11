import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ilrxkhgdsirqppgqavjs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlscnhraGdkc2lycXBwZ3FhdmpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5OTQ3MjIsImV4cCI6MjA5MDU3MDcyMn0.PcskF1v9PboxO3mdnmqq9p1mW0hsef1I32bUtFVp0f4';

const client1 = createClient(SUPABASE_URL, SUPABASE_KEY);
const client2 = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('Initializing test...');
  
  const ch1 = client1.channel('test-room', { config: { broadcast: { self: false } } });
  const ch2 = client2.channel('test-room', { config: { broadcast: { self: false } } });

  let received = false;

  ch2.on('broadcast', { event: 'ping' }, ({ payload }) => {
    console.log('Client 2 received ping from Client 1:', payload);
    received = true;
  });

  const sub2 = new Promise((resolve) => {
    ch2.subscribe((status) => {
      console.log('Client 2 subscription status:', status);
      if (status === 'SUBSCRIBED') resolve();
    });
  });

  const sub1 = new Promise((resolve) => {
    ch1.subscribe((status) => {
      console.log('Client 1 subscription status:', status);
      if (status === 'SUBSCRIBED') resolve();
    });
  });

  await Promise.all([sub1, sub2]);
  console.log('Both subscribed! Sending ping from Client 1...');

  await ch1.send({
    type: 'broadcast',
    event: 'ping',
    payload: { msg: 'Hello from Client 1' }
  });

  // Wait 3 seconds to see if received
  await new Promise((resolve) => setTimeout(resolve, 3000));
  
  if (received) {
    console.log('SUCCESS: Realtime broadcast works!');
  } else {
    console.log('FAIL: Realtime broadcast did NOT work.');
  }

  await ch1.unsubscribe();
  await ch2.unsubscribe();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
