import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useChat(ordenId) {
  const [mensajes, setMensajes] = useState([])
  const [cargando, setCargando] = useState(true)

  const cargarMensajes = async () => {
    try {
      const { data, error } = await supabase
        .from('mensajes_orden')
        .select('*')
        .eq('orden_id', ordenId)
        .order('created_at', { ascending: true })
      if (error) throw error
      setMensajes(data || [])
    } catch (error) {
      console.error('Error cargando mensajes:', error)
    } finally {
      setCargando(false)
    }
  }

  const enviarMensaje = async (mensaje, usuarioNombre, imagenUrl = null) => {
    try {
      const { data, error } = await supabase
        .from('mensajes_orden')
        .insert([{
          orden_id: ordenId,
          mensaje,
          imagen_url: imagenUrl,
          usuario_id: null,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()
      if (error) throw error
      setMensajes(prev => [...prev, { ...data, usuario_nombre: usuarioNombre }])
      return data
    } catch (error) {
      console.error('Error enviando mensaje:', error)
      throw error
    }
  }

  useEffect(() => {
    if (ordenId) cargarMensajes()
  }, [ordenId])

  return { mensajes, cargando, enviarMensaje, recargar: cargarMensajes }
}