import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://lzfgigiyqpuuxslsygjt.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZmdpZ2l5cXB1dXhzbHN5Z2p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MTc0NjksImV4cCI6MjA1OTk5MzQ2OX0.qUNzDEr2rxjRSClh5P4jeDv_18_yCCkFXTizJqNYSgg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
