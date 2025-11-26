// import {create} from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js'

const supabaseurl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseurl, supabaseAnonKey);

// helpers
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error && error.details !== 'Result is empty') throw error
  return data
}

export async function upsertProfile(profile) {
  const { data, error } = await supabase.from('profiles').upsert(profile)
  if (error) throw error
  return data
}