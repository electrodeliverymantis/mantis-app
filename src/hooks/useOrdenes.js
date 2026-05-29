import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useOrdenes() {
  const [ordenes, setOrdenes] = useState([])
  const [cargando, setCargando] = useState(true)

  const cargarOrdenes = async () => {
    setCargando(true)
    try {
      const { data, error } = await supabase
        .from('ordenes_trabajo')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrdenes(data || [])
    } catch (error) {
      console.error('Error cargando órdenes:', error)
    } finally {
      setCargando(false)
    }
  }

  const crearOrden = async (nuevaOrden) => {
    try {
      const { data, error } = await supabase
        .from('ordenes_trabajo')
        .insert([nuevaOrden])
        .select()
        .single()

      if (error) throw error
      setOrdenes(prev => [data, ...prev])
      return data
    } catch (error) {
      console.error('Error creando orden:', error)
      throw error
    }
  }

  useEffect(() => {
    cargarOrdenes()
  }, [])

  return { ordenes, cargando, crearOrden, recargar: cargarOrdenes }
}