import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

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

  const cargarDatos = async () => {
    setCargando(true)
    try {
      // Obtener todas las órdenes
      const { data: ordenes } = await supabase
        .from('ordenes_trabajo')
        .select('*')
        .order('created_at', { ascending: false })

      // Obtener preventivos
      const { data: preventivos } = await supabase
        .from('preventivos')
        .select('*')
        .order('proxima_fecha', { ascending: true })

      if (ordenes) {
        // Calcular métricas
        setMetricas({
          totalOrdenes: ordenes.length,
          pendientes: ordenes.filter(o => o.estado === 'pendiente').length,
          enProceso: ordenes.filter(o => o.estado === 'en_proceso').length,
          resueltas: ordenes.filter(o => o.estado === 'resuelto').length,
          preventivosVencidos: preventivos?.filter(p => p.estado === 'vencido').length || 0,
        })

        // Últimas 5 órdenes
        setOrdenesRecientes(ordenes.slice(0, 5))
      }

      if (preventivos) {
        // Próximos 5 preventivos
        setPreventivosProximos(preventivos.slice(0, 5))
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()

    // Actualizar cada 60 segundos automáticamente
    const intervalo = setInterval(cargarDatos, 60000)
    return () => clearInterval(intervalo)
  }, [])

  return { metricas, ordenesRecientes, preventivosProximos, cargando, recargar: cargarDatos }
}