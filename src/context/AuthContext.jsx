import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  const cargarPerfil = async (session) => {
    if (!session?.user) { setUsuario(null); setCargando(false); return }
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', session.user.email)
        .limit(1)

      const perfil = data?.[0]
      console.log('PERFIL:', perfil)

      if (error || !perfil) {
        setUsuario({
          name: session.user.email,
          nombre: session.user.email,
          email: session.user.email,
          role: 'admin',
          rol: 'admin',
          es_superadmin: false
        })
      } else {
        setUsuario({
          ...perfil,
          name: `${perfil.nombre} ${perfil.apellido || ''}`.trim(),
          role: perfil.es_superadmin ? 'superadmin' : perfil.rol,
          rol: perfil.es_superadmin ? 'superadmin' : perfil.rol,
        })
      }
    } catch(e) {
      console.error('Error cargando perfil:', e)
      setUsuario({
        name: session.user.email,
        email: session.user.email,
        role: 'admin',
        rol: 'admin',
        es_superadmin: false
      })
    }
    setCargando(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      cargarPerfil(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento, session) => {
      cargarPerfil(session)
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