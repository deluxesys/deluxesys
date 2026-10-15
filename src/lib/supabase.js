import { createClient } from '@supabase/supabase-js';

// Estos datos los cambiaremos más adelante cuando crees tu cuenta de Supabase
const supabaseUrl = 'https://xyzcompany.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);