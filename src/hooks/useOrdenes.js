import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useOrdenes() {
  const [ordenes, setOrdenes] = useState([])
  const [cargando, setCargando] = useState(true)
  const { usuario } = useAuth()

  const cargarOrdenes = async () => {
    if (!usuario?.empresa_id) return
    setCargando(true)
    try {
      const { data, error } = await supabase
        .from('ordenes_trabajo')
        .select('*')
        .eq('empresa_id', usuario.empresa_id)
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
        .insert([{ ...nuevaOrden, empresa_id: usuario.empresa_id }])
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
      const { error: errorOrden } = await supabase
        .from('ordenes_trabajo')
        .update({ estado: nuevoEstado })
        .eq('id', ordenId)
      if (errorOrden) throw errorOrden

      const { error: errorHistorial } = await supabase
        .from('historial_ordenes')
        .insert([{ orden_id: ordenId, estado: nuevoEstado, ...historial }])
      if (errorHistorial) throw errorHistorial

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
    if (usuario?.empresa_id) cargarOrdenes()
  }, [usuario?.empresa_id])

  return { ordenes, cargando, crearOrden, actualizarEstado, cargarHistorial, recargar: cargarOrdenes }
}