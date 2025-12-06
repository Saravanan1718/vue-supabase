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

export async function getTree(userId) {
  const { data, error } = await supabase
    .from('family_trees')
    .select('tree_data')
    .eq('user_id', userId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error // PGRST116 is 0 rows
  return data?.tree_data || []
}

export async function saveTree(userId, nodes) {
  // Check if exists first to decide insert vs update, since user_id is unique
  // Actually upsert works if we have the constraint.
  const { data, error } = await supabase
    .from('family_trees')
    .upsert({ user_id: userId, tree_data: nodes }, { onConflict: 'user_id' })
    
  if (error) throw error
  return data
}
