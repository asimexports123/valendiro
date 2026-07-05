require('dotenv').config({path: require('path').resolve(process.cwd(), '.env.local')});
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createRetryQueueTable() {
  console.log('Creating retry_queue table...');
  
  const { data, error } = await sb.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS retry_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        slug TEXT NOT NULL,
        reason TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        last_attempted_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_retry_queue_topic_id ON retry_queue(topic_id);
      CREATE INDEX IF NOT EXISTS idx_retry_queue_slug ON retry_queue(slug);
      CREATE INDEX IF NOT EXISTS idx_retry_queue_retry_count ON retry_queue(retry_count);
      CREATE INDEX IF NOT EXISTS idx_retry_queue_created_at ON retry_queue(created_at);
      
      ALTER TABLE retry_queue ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY IF NOT EXISTS "Service role can read retry_queue" ON retry_queue
        FOR SELECT USING (auth.role() = 'service_role');
      
      CREATE POLICY IF NOT EXISTS "Service role can insert retry_queue" ON retry_queue
        FOR INSERT WITH CHECK (auth.role() = 'service_role');
      
      CREATE POLICY IF NOT EXISTS "Service role can update retry_queue" ON retry_queue
        FOR UPDATE USING (auth.role() = 'service_role');
      
      CREATE POLICY IF NOT EXISTS "Service role can delete retry_queue" ON retry_queue
        FOR DELETE USING (auth.role() = 'service_role');
    `
  });
  
  if (error) {
    console.error('Error creating table:', error);
    
    // Try alternative approach using direct SQL
    console.log('Trying direct SQL approach...');
    const { data: data2, error: error2 } = await sb
      .from('retry_queue')
      .select('*')
      .limit(1);
    
    if (error2 && error2.code === '42P01') {
      console.log('Table does not exist, cannot create via client');
      console.log('Please run the migration manually or use Supabase dashboard');
      return false;
    } else if (!error2) {
      console.log('Table already exists');
      return true;
    }
    
    return false;
  }
  
  console.log('Table created successfully');
  return true;
}

createRetryQueueTable().then(success => {
  if (success) {
    console.log('✓ Retry queue table ready');
  } else {
    console.log('✗ Failed to create retry queue table');
  }
  process.exit(success ? 0 : 1);
});
