import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uddgtdawoagonpkwlhyh.supabase.co'
const supabaseAnonKey = 'sb_publishable_oisMoY299Vd6RcgU8gRB3g_OLW8pe_S'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
