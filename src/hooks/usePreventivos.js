import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function usePreventivos() {
  const [preventivos, setPreventivos] = useState([])
  const [cargando, setCargando] = useState(true)

  const cargarPreventivos = async () => {
    setCargando(true)
    try {
      const { data, error } = await supabase
        .from('preventivos')
        .select('*')
        .order('proxima_fecha', { ascending: true })

      if (error) throw error

      // Marcar automáticamente como vencido si la fecha ya pasó
      const hoy = new Date().toISOString().split('T')[0]
      const actualizados = (data || []).map(p => ({
        ...p,
        estado: p.proxima_fecha < hoy && p.estado !== 'realizado' ? 'vencido' : p.estado
      }))

      setPreventivos(actualizados)
    } catch (error) {
      console.error('Error cargando preventivos:', error)
    } finally {
      setCargando(false)
    }
  }

  const crearPreventivo = async (nuevoPreventivo) => {
    try {
      const { data, error } = await supabase
        .from('preventivos')
        .insert([nuevoPreventivo])
        .select()
        .single()

      if (error) throw error
      setPreventivos(prev => [...prev, data])
      return data
    } catch (error) {
      console.error('Error creando preventivo:', error)
      throw error
    }
  }

  const marcarRealizado = async (id, proximaFecha) => {
    try {
      const { error } = await supabase
        .from('preventivos')
        .update({ estado: 'pendiente', proxima_fecha: proximaFecha })
        .eq('id', id)

      if (error) throw error
      await cargarPreventivos()
    } catch (error) {
      console.error('Error marcando realizado:', error)
      throw error
    }
  }

  const eliminarPreventivo = async (id) => {
    try {
      const { error } = await supabase
        .from('preventivos')
        .delete()
        .eq('id', id)

      if (error) throw error
      setPreventivos(prev => prev.filter(p => p.id !== id))
    } catch (error) {
      console.error('Error eliminando preventivo:', error)
      throw error
    }
  }

  useEffect(() => {
    cargarPreventivos()
  }, [])

  return { preventivos, cargando, crearPreventivo, marcarRealizado, eliminarPreventivo, recargar: cargarPreventivos }
}