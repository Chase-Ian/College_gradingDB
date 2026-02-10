import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://vbpqqdcbzkmeifllquhc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZicHFxZGNiemttZWlmbGxxdWhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MTQyNDcsImV4cCI6MjA4NjI5MDI0N30.GWj1d1Wk7pgrNeTR6O4KRcSIyT6P3nUJOIKWSznlMcs'
export const supabase = createClient(supabaseUrl, supabaseKey)