import { supabase } from './lib/supabase'

// Iniciar sesión
export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

// Cerrar sesión
export async function logoutUser() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Obtener usuario actual
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}