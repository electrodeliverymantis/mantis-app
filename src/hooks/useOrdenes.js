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

  const actualizarEstado = async (ordenId, nuevoEstado, historial) => {
    try {
      // Actualizar estado en la orden
      const { error: errorOrden } = await supabase
        .from('ordenes_trabajo')
        .update({ estado: nuevoEstado })
        .eq('id', ordenId)

      if (errorOrden) throw errorOrden

      // Guardar en historial
      const { error: errorHistorial } = await supabase
        .from('historial_ordenes')
        .insert([{ orden_id: ordenId, estado: nuevoEstado, ...historial }])

      if (errorHistorial) throw errorHistorial

      // Actualizar lista local
      setOrdenes(prev => prev.map(o =>
        o.id === ordenId ? { ...o, estado: nuevoEstado } : o
      ))
    } catch (error) {
      console.error('Error actualizando estado:', error)
      throw error
    }
  }

  const cargarHistorial = async (ordenId) => {
    const { data, error } = await supabase
      .from('historial_ordenes')
      .select('*')
      .eq('orden_id', ordenId)
      .order('fecha', { ascending: true })

    if (error) throw error
    return data || []
  }

  useEffect(() => {
    cargarOrdenes()
  }, [])

  return { ordenes, cargando, crearOrden, actualizarEstado, cargarHistorial, recargar: cargarOrdenes }
}