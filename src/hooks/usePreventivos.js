import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function usePreventivos() {
  const [preventivos, setPreventivos] = useState([])
  const [cargando, setCargando] = useState(true)
  const { usuario } = useAuth()

  const cargarPreventivos = async () => {
    if (!usuario?.empresa_id) return
    setCargando(true)
    try {
      const { data, error } = await supabase
        .from('preventivos')
        .select('*')
        .eq('empresa_id', usuario.empresa_id)
        .order('proxima_fecha', { ascending: true })
      if (error) throw error
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

  useEffect(() => {
    if (usuario?.empresa_id) cargarPreventivos()
  }, [usuario?.empresa_id])

  const crearPreventivo = async (nuevoPreventivo) => {
    try {
      const { data, error } = await supabase
        .from('preventivos')
        .insert([{ ...nuevoPreventivo, empresa_id: usuario.empresa_id }])
        .select().single()
      if (error) throw error
      setPreventivos(prev => [...prev, data])
      return data
    } catch (error) {
      console.error('Error creando preventivo:', error)
      throw error
    }
  }

  const soloRealizado = async (id) => {
    try {
      const { error } = await supabase
        .from('preventivos').update({ estado: 'realizado' }).eq('id', id)
      if (error) throw error
      setPreventivos(prev => prev.map(p =>
        p.id === id ? { ...p, estado: 'realizado' } : p
      ))
    } catch (error) {
      console.error('Error:', error)
      throw error
    }
  }

  const reagendarPreventivo = async (preventivo, proximaFecha) => {
    try {
      const { data: nuevo, error } = await supabase
        .from('preventivos')
        .insert([{
          titulo: preventivo.titulo,
          descripcion: preventivo.descripcion,
          frecuencia: preventivo.frecuencia,
          proxima_fecha: proximaFecha,
          sector_id: preventivo.sector_id,
          maquina_id: preventivo.maquina_id,
          empresa_id: usuario.empresa_id,
          estado: 'pendiente'
        }])
        .select().single()
      if (error) throw error
      setPreventivos(prev => [...prev, nuevo])
    } catch (error) {
      console.error('Error reagendando:', error)
      throw error
    }
  }

  const eliminarPreventivo = async (id) => {
    try {
      const { error } = await supabase
        .from('preventivos').delete().eq('id', id)
      if (error) throw error
      setPreventivos(prev => prev.filter(p => p.id !== id))
    } catch (error) {
      console.error('Error eliminando:', error)
      throw error
    }
  }

  return { preventivos, cargando, crearPreventivo, soloRealizado, reagendarPreventivo, eliminarPreventivo, recargar: cargarPreventivos }
}