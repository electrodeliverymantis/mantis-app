import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useDashboard() {
  const [metricas, setMetricas] = useState({
    totalOrdenes: 0,
    pendientes: 0,
    enProceso: 0,
    resueltas: 0,
    preventivosVencidos: 0,
  })
  const [ordenesRecientes, setOrdenesRecientes] = useState([])
  const [preventivosProximos, setPreventivosProximos] = useState([])
  const [cargando, setCargando] = useState(true)
  const { usuario } = useAuth()

  const cargarDatos = async () => {
    if (!usuario?.empresa_id) return
    setCargando(true)
    try {
      const { data: ordenes } = await supabase
        .from('ordenes_trabajo')
        .select('*')
        .eq('empresa_id', usuario.empresa_id)
        .order('created_at', { ascending: false })

      const { data: preventivos } = await supabase
        .from('preventivos')
        .select('*')
        .eq('empresa_id', usuario.empresa_id)
        .order('proxima_fecha', { ascending: true })

      if (ordenes) {
        setMetricas({
          totalOrdenes: ordenes.length,
          pendientes: ordenes.filter(o => o.estado === 'pendiente').length,
          agendadas: ordenes.filter(o => o.estado === 'agendado').length,
          enProceso: ordenes.filter(o => o.estado === 'en_proceso').length,
          resueltas: ordenes.filter(o => o.estado === 'resuelto').length,
          preventivosVencidos: preventivos?.filter(p => p.estado === 'vencido').length || 0,
        })
        setOrdenesRecientes(ordenes.slice(0, 5))
      }

      if (preventivos) {
        setPreventivosProximos(preventivos.slice(0, 5))
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    if (usuario?.empresa_id) {
      cargarDatos()
      const intervalo = setInterval(cargarDatos, 60000)
      return () => clearInterval(intervalo)
    }
  }, [usuario?.empresa_id])

  return { metricas, ordenesRecientes, preventivosProximos, cargando, recargar: cargarDatos }
}