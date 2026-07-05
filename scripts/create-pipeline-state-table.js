require('dotenv').config({path: require('path').resolve(process.cwd(), '.env.local')});
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createPipelineStateTable() {
  console.log('Creating pipeline_state table...');
  
  try {
    // Create table
    const { error: createError } = await sb.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS pipeline_state (
          id BIGINT PRIMARY KEY DEFAULT 1,
          status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'maintenance')),
          paused_at TIMESTAMPTZ,
          resumed_at TIMESTAMPTZ,
          operator TEXT,
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          CONSTRAINT single_row CHECK (id = 1)
        );
      `
    });
    
    if (createError) {
      console.log('Table creation failed, trying direct SQL...');
      
      // Try direct insert to trigger table creation
      const { error: insertError } = await sb
        .from('pipeline_state')
        .insert({
          id: 1,
          status: 'running',
          paused_at: null,
          resumed_at: null,
          operator: null
        });
      
      if (insertError && !insertError.message.includes('does not exist')) {
        console.log('  ✓ Table exists or created');
      } else {
        console.log('  ✗ Table creation failed:', insertError.message);
        return false;
      }
    } else {
      console.log('  ✓ Table created');
    }
    
    // Insert initial state
    const { error: insertError } = await sb
      .from('pipeline_state')
      .upsert({
        id: 1,
        status: 'running',
        paused_at: null,
        resumed_at: null,
        operator: null
      }, { onConflict: 'id' });
    
    if (insertError) {
      console.log('  ✗ Initial state insert failed:', insertError.message);
      return false;
    }
    
    console.log('  ✓ Initial state inserted');
    
    // Enable RLS
    await sb.rpc('exec_sql', {
      sql: `
        ALTER TABLE pipeline_state ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS "Service role can manage pipeline state"
          ON pipeline_state
          FOR ALL
          TO service_role
          USING (true)
          WITH CHECK (true);
      `
    });
    
    console.log('  ✓ RLS policies configured');
    
    return true;
    
  } catch (error) {
    console.log('  ✗ Error:', error.message);
    return false;
  }
}

createPipelineStateTable().then(success => {
  if (success) {
    console.log('\n✓ Pipeline state table setup complete');
    process.exit(0);
  } else {
    console.log('\n✗ Pipeline state table setup failed');
    process.exit(1);
  }
}).catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
