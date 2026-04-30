import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cjhjuneryqxzufpztxwq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqaGp1bmVyeXF4enVmcHp0eHdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczODc3NDgsImV4cCI6MjA5Mjk2Mzc0OH0.PFndAuJVGoJmXIWCr_oAm9ietv2KAQ2gcOoCyU6HMf8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const signUp = async (email, password, userData) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: userData }
  })
  return { data, error }
}

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export default supabase