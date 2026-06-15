import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const estadoConfig = {
  pendiente:         { etiqueta: "Pendiente",        color: "#f59e0b", bg: "#fef3c7", icono: "⏳" },
  agendado:          { etiqueta: "Agendado",         color: "#3b82f6", bg: "#dbeafe", icono: "📅" },
  en_proceso:        { etiqueta: "En Proceso",       color: "#8b5cf6", bg: "#ede9fe", icono: "🔧" },
  espera_mat:        { etiqueta: "Esp. Materiales",  color: "#f97316", bg: "#ffedd5", icono: "📦" },
  espera_definicion: { etiqueta: "Esp. Definición",  color: "#0891b2", bg: "#ecfeff", icono: "🤔" },
  espera_respuesta:  { etiqueta: "Esp. Respuesta",   color: "#7c3aed", bg: "#f5f3ff", icono: "💬" },
  resuelto:          { etiqueta: "Resuelto",         color: "#10b981", bg: "#d1fae5", icono: "✅" },
}

function BadgeEstado({ estado }) {
  const cfg = estadoConfig[estado] || { etiqueta: estado, color: "#6b7280", bg: "#f3f4f6", icono: "•" }
  return (
    <span style={{
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40`,
      borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700
    }}>{cfg.icono} {cfg.etiqueta}</span>
  )
}

export default function Historial() {
  const { usuario } = useAuth()
  const [ordenes, setOrdenes] = useState([])
  const [historial, setHistorial] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [busqueda, setBusqueda] = useState("")
  const [filtroPeriodo, setFiltroPeriodo] = useState("total")

  useEffect(() => {
    const cargar = async () => {
      if (!usuario?.empresa_id) return
      setCargando(true)
      try {
        const { data: ords } = await supabase
          .from('ordenes_trabajo')
          .select('*')
          .eq('empresa_id', usuario.empresa_id)
          .order('created_at', { ascending: false })
        const { data: hist } = await supabase
          .from('historial_ordenes').select('*')
        setOrdenes(ords || [])
        setHistorial(hist || [])
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setCargando(false)
      }
    }
    if (usuario?.empresa_id) cargar()
  }, [usuario?.empresa_id])

  const ordenesConMetricas = ordenes.map(o => {
    const hist = historial.filter(h => h.orden_id === o.id)
    return {
      ...o,
      tiempoTotal: hist.reduce((a, h) => a + (h.tiempo_min || 0), 0),
      costoTotal: hist.reduce((a, h) => a + (parseFloat(h.costo) || 0), 0),
      repuestos: hist.filter(h => h.repuestos).map(h => h.repuestos).join(", "),
    }
  })

  const totalCosto = ordenesConMetricas.reduce((a, o) => a + o.costoTotal, 0)
  const totalTiempo = ordenesConMetricas.reduce((a, o) => a + o.tiempoTotal, 0)
  const totalResueltas = ordenes.filter(o => o.estado === 'resuelto').length

  const filtrarPorPeriodo = (fecha) => {
    if (!fecha || filtroPeriodo === "total") return true
    const hoy = new Date()
    const fechaOrden = new Date(fecha)
    switch (filtroPeriodo) {
      case "hoy": return fechaOrden.toDateString() === hoy.toDateString()
      case "semana": const unaSemana = new Date(hoy); unaSemana.setDate(hoy.getDate() - 7); return fechaOrden >= unaSemana
      case "mes": return fechaOrden.getMonth() === hoy.getMonth() && fechaOrden.getFullYear() === hoy.getFullYear()
      case "trimestre": const tresMeses = new Date(hoy); tresMeses.setMonth(hoy.getMonth() - 3); return fechaOrden >= tresMeses
      case "semestre": const seisMeses = new Date(hoy); seisMeses.setMonth(hoy.getMonth() - 6); return fechaOrden >= seisMeses
      case "año": return fechaOrden.getFullYear() === hoy.getFullYear()
      default: return true
    }
  }

  const ordenesFiltradas = ordenesConMetricas
    .filter(o => filtroEstado === "todos" || o.estado === filtroEstado)
    .filter(o => filtrarPorPeriodo(o.fecha))
    .filter(o => !busqueda ||
      o.numero?.toLowerCase().includes(busqueda.toLowerCase()) ||
      o.parte?.toLowerCase().includes(busqueda.toLowerCase()) ||
      o.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
    )

  const exportarExcel = () => {
    const datos = ordenesFiltradas.map(o => ({
      'N° OT': o.numero,
      'Fecha': o.fecha,
      'Parte': o.parte,
      'Descripción': o.descripcion,
      'Estado': estadoConfig[o.estado]?.etiqueta || o.estado,
      'Tiempo (min)': o.tiempoTotal,
      'Costo ($)': o.costoTotal,
      'Repuestos': o.repuestos || '',
    }))
    const hoja = XLSX.utils.json_to_sheet(datos)
    const libro = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(libro, hoja, 'Historial')
    const buffer = XLSX.write(libro, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([buffer]), `historial-mantis-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <div>
      {/* Tarjetas resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Órdenes",  value: ordenes.length,                           icono: "📋", color: "#6366f1" },
          { label: "Resueltas",      value: totalResueltas,                            icono: "✅", color: "#10b981" },
          { label: "Costo total",    value: "$" + totalCosto.toLocaleString("es-AR"),  icono: "💰", color: "#f59e0b" },
          { label: "Tiempo total",   value: Math.round(totalTiempo / 60) + " hs",      icono: "⏱", color: "#8b5cf6" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 1px 8px #00000010", textAlign: "center" }}>
            <div style={{ fontSize: 22 }}>{s.icono}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, margin: "4px 0" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtro por período */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {[
          { id: "hoy", label: "Hoy" },
          { id: "semana", label: "Semana" },
          { id: "mes", label: "Mes" },
          { id: "trimestre", label: "Trimestre" },
          { id: "semestre", label: "Semestre" },
          { id: "año", label: "Año" },
          { id: "total", label: "Total" },
        ].map(p => (
          <button key={p.id} onClick={() => setFiltroPeriodo(p.id)} style={{
            padding: "7px 14px", borderRadius: 8, border: "none",
            cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
            background: filtroPeriodo === p.id ? "#6366f1" : "#fff",
            color: filtroPeriodo === p.id ? "#fff" : "#64748b",
            boxShadow: "0 1px 4px #00000010"
          }}>{p.label}</button>
        ))}
      </div>

      {/* Filtros, búsqueda y exportar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por número, parte o descripción..."
            style={{ padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", fontFamily: "inherit", background: "#f8fafc", width: 280 }} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["todos", "pendiente", "agendado", "en_proceso", "resuelto"].map(e => (
              <button key={e} onClick={() => setFiltroEstado(e)} style={{
                padding: "8px 12px", borderRadius: 8, border: "none",
                cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                background: filtroEstado === e ? "#0f172a" : "#fff",
                color: filtroEstado === e ? "#fff" : "#64748b",
                boxShadow: "0 1px 4px #00000010"
              }}>
                {e === "todos" ? "Todos" : estadoConfig[e]?.etiqueta}
              </button>
            ))}
          </div>
        </div>
        <button onClick={exportarExcel} style={{
          padding: "9px 16px", borderRadius: 10, border: "none",
          background: "linear-gradient(90deg,#10b981,#059669)",
          color: "#fff", fontWeight: 700, fontSize: 13,
          cursor: "pointer", fontFamily: "inherit"
        }}>📥 Exportar Excel</button>
      </div>

      {/* Tabla historial */}
      {cargando ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>⚙ Cargando historial...</div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 8px #00000010" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                {["N° OT", "Fecha", "Parte", "Descripción", "Estado", "Tiempo", "Costo", "Repuestos"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordenesFiltradas.map((o, i) => (
                <tr key={o.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#6366f1" }}>{o.numero}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{o.fecha}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12 }}>{o.parte}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.descripcion}</td>
                  <td style={{ padding: "12px 16px" }}><BadgeEstado estado={o.estado} /></td>
                  <td style={{ padding: "12px 16px", fontSize: 12 }}>{o.tiempoTotal > 0 ? o.tiempoTotal + " min" : "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#059669" }}>{o.costoTotal > 0 ? "$" + o.costoTotal.toLocaleString("es-AR") : "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 11, color: "#64748b", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.repuestos || "—"}</td>
                </tr>
              ))}
              {ordenesFiltradas.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>No hay órdenes con este filtro</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}