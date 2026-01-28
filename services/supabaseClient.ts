import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gesoseeqaaixidsvrttz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdlc29zZWVxYWFpeGlkc3ZydHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNjI1MTksImV4cCI6MjA4NDkzODUxOX0.fUc7TFUBRd9fLT_eq9NG9ZOyyvzIIhJzV9yrqyKYlWU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);