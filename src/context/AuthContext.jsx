import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUsuario({ name: session.user.email, email: session.user.email, role: 'admin' })
      }
      setCargando(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento, session) => {
      if (session?.user) {
        setUsuario({ name: session.user.email, email: session.user.email, role: 'admin' })
      } else {
        setUsuario(null)
      }
      setCargando(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  )
}