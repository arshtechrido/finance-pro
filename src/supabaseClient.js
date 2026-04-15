import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fmnsgrcznzdhqcdnzktx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtbnNncmN6bnpkaHFjZG56a3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NDg3ODQsImV4cCI6MjA5MTUyNDc4NH0.sx6kWHqBqbR-77fi0wzW6cRWPHQZRJORr1MFnT9uY7c'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)