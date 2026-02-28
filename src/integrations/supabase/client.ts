import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Prefer env vars, fall back to hardcoded values
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://lzfgigiyqpuuxslsygjt.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZmdpZ2l5cXB1dXhzbHN5Z2p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE3MTg4MDAsImV4cCI6MjA0NzI5NDgwMH0.QyO4xkrY-hH7P4_qV8K2Rg-qJhF9mPQ7XwJ0xMZxYzs';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});
