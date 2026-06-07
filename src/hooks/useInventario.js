import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useInventario() {
  const [items, setItems] = useState([])
  const [cargando, setCargando] = useState(true)

  const cargarItems = async () => {
    setCargando(true)
    try {
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .eq('activo', true)
        .order('nombre')
      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error cargando inventario:', error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargarItems() }, [])

  const crearItem = async (item) => {
    const { error } = await supabase.from('inventario').insert([item])
    if (error) throw error
    await cargarItems()
  }

  const actualizarItem = async (id, datos) => {
    const { error } = await supabase.from('inventario').update(datos).eq('id', id)
    if (error) throw error
    await cargarItems()
  }

  const eliminarItem = async (id) => {
    const { error } = await supabase.from('inventario').update({ activo: false }).eq('id', id)
    if (error) throw error
    await cargarItems()
  }

  const registrarMovimiento = async (inventario_id, tipo_movimiento, cantidad, descripcion, orden_id = null) => {
    // Registrar movimiento
    const { error: errorMov } = await supabase.from('inventario_movimientos').insert([{
      inventario_id, tipo_movimiento, cantidad, descripcion, orden_id
    }])
    if (errorMov) throw errorMov

    // Actualizar stock
    const item = items.find(i => i.id === inventario_id)
    if (!item) return
    const nuevoStock = tipo_movimiento === 'entrada'
      ? item.stock_actual + cantidad
      : item.stock_actual - cantidad
    await actualizarItem(inventario_id, { stock_actual: nuevoStock })
  }

  const buscarItems = async (query, tipo = null) => {
    let q = supabase.from('inventario').select('*').eq('activo', true)
    if (query) q = q.ilike('nombre', `%${query}%`)
    if (tipo) q = q.eq('tipo', tipo)
    const { data } = await q.order('nombre')
    return data || []
  }

  return { items, cargando, cargarItems, crearItem, actualizarItem, eliminarItem, registrarMovimiento, buscarItems }
}