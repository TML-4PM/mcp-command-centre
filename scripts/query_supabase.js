// Quick script to explore Supabase tables
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lzfgigiyqpuuxslsygjt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZmdpZ2l5cXB1dXhzbHN5Z2p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE3MTg4MDAsImV4cCI6MjA0NzI5NDgwMH0.QyO4xkrY-hH7P4_qV8K2Rg-qJhF9mPQ7XwJ0xMZxYzs'
);

async function exploreTables() {
  console.log('Exploring Supabase tables...\n');

  // Try to query common tables that might have worker/role data
  const tables = [
    'workers',
    'roles',
    'team_members',
    'employees',
    'agents',
    'neural_ennead',
    'family_members',
    'work_family',
    'contacts',
    'holowog_projects',
    'run_queue',
    'conversations',
    'code_blocks'
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: false })
        .limit(3);

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count || data?.length || 0} rows`);
        if (data && data.length > 0) {
          console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
          console.log(`   Sample: ${JSON.stringify(data[0]).substring(0, 200)}...`);
        }
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
    }
    console.log('');
  }

  // Also try the execute_sql RPC to list all tables
  console.log('\n--- Querying all tables via execute_sql ---\n');
  try {
    const { data, error } = await supabase.rpc('execute_sql', {
      query: "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
      params: {}
    });

    if (error) {
      console.log('RPC Error:', error.message);
    } else {
      console.log('All public tables:', JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.log('RPC Exception:', e.message);
  }
}

exploreTables().then(() => process.exit(0));
