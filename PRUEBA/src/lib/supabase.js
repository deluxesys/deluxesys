import { createClient } from '@supabase/supabase-js'

// Reemplaza esto con los datos de tu proyecto en Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'TU_URL_DE_SUPABASE'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'TU_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
