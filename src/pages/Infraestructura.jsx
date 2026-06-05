import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import SubirImagen from '../components/SubirImagen'

const CATEGORIAS = [
  { id: "matafuegos",    etiqueta: "Matafuegos",              icono: "🔥" },
  { id: "electrico",     etiqueta: "Instalación Eléctrica",   icono: "⚡" },
  { id: "iluminacion",   etiqueta: "Iluminación",             icono: "💡" },
  { id: "seguridad",     etiqueta: "Seguridad Física",        icono: "🚪" },
  { id: "edilicio",      etiqueta: "Infraestructura Edilicia", icono: "🏗" },
  { id: "habilitacion",  etiqueta: "Habilitaciones y Cert.",  icono: "🚒" },
]

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1.5px solid #e2e8f0", fontSize: 13, color: "#0f172a",
  outline: "none", fontFamily: "inherit", background: "#f8fafc", boxSizing: "border-box"
}

const labelStyle = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6
}

function calcularEstado(fechaVencimiento) {
  if (!fechaVencimiento) return 'vigente'
  const hoy = new Date()
  const vence = new Date(fechaVencimiento)
  const diasRestantes = Math.ceil((vence - hoy) / (1000 * 60 * 60 * 24))
  if (diasRestantes < 0) return 'vencido'
  if (diasRestantes <= 30) return 'proximo'
  return 'vigente'
}

function diasParaVencer(fechaVencimiento) {
  if (!fechaVencimiento) return null
  const hoy = new Date()
  const vence = new Date(fechaVencimiento)
  return Math.ceil((vence - hoy) / (1000 * 60 * 60 * 24))
}

const estadoConfig = {
  vigente:  { etiqueta: "Vigente",          color: "#10b981", bg: "#d1fae5", icono: "✅" },
  proximo:  { etiqueta: "Vence pronto",     color: "#f59e0b", bg: "#fef3c7", icono: "⚠️" },
  vencido:  { etiqueta: "Vencido",          color: "#ef4444", bg: "#fee2e2", icono: "🔴" },
}

function BadgeEstado({ estado }) {
  const cfg = estadoConfig[estado] || estadoConfig.vigente
  return (
    <span style={{
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40`,
      borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap"
    }}>{cfg.icono} {cfg.etiqueta}</span>
  )
}

export default function Infraestructura() {
  const { usuario } = useAuth()
  const [items, setItems] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState("todos")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [busqueda, setBusqueda] = useState("")
  const [itemSeleccionado, setItemSeleccionado] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    categoria: "matafuegos", nombre: "", ubicacion: "",
    descripcion: "", fecha_vencimiento: "", ultima_revision: "",
    proveedor_servicio: "", notas: "", imagen_url: ""
  })

  const canEdit = usuario?.role === 'admin' || usuario?.role === 'mantenimiento'

  const cargarItems = async () => {
    setCargando(true)
    try {
      const { data, error } = await supabase
        .from('infraestructura')
        .select('*')
        .order('fecha_vencimiento', { ascending: true })
      if (error) throw error

      // Calcular estado automáticamente según fecha
      const actualizados = (data || []).map(item => ({
        ...item,
        estado: calcularEstado(item.fecha_vencimiento)
      }))
      setItems(actualizados)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargarItems() }, [])

  const handleGuardar = async () => {
    if (!form.nombre || !form.categoria) { setError("Nombre y categoría son obligatorios"); return }
    setGuardando(true); setError("")
    try {
      const estadoCalculado = calcularEstado(form.fecha_vencimiento)
      if (itemSeleccionado) {
        const { error } = await supabase
          .from('infraestructura')
          .update({ ...form, estado: estadoCalculado })
          .eq('id', itemSeleccionado.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('infraestructura')
          .insert([{ ...form, estado: estadoCalculado }])
        if (error) throw error
      }
      setForm({ categoria: "matafuegos", nombre: "", ubicacion: "", descripcion: "", fecha_vencimiento: "", ultima_revision: "", proveedor_servicio: "", notas: "", imagen_url: "" })
      setItemSeleccionado(null)
      setMostrarFormulario(false)
      cargarItems()
    } catch { setError("Error al guardar") }
    finally { setGuardando(false) }
  }

  const handleEditar = (item) => {
    setForm({
      categoria: item.categoria,
      nombre: item.nombre,
      ubicacion: item.ubicacion || "",
      descripcion: item.descripcion || "",
      fecha_vencimiento: item.fecha_vencimiento || "",
      ultima_revision: item.ultima_revision || "",
      proveedor_servicio: item.proveedor_servicio || "",
      notas: item.notas || "",
      imagen_url: item.imagen_url || ""
    })
    setItemSeleccionado(item)
    setMostrarFormulario(true)
  }

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar este item?")) return
    await supabase.from('infraestructura').delete().eq('id', id)
    cargarItems()
  }

  const itemsFiltrados = items
    .filter(i => filtroCategoria === "todos" || i.categoria === filtroCategoria)
    .filter(i => filtroEstado === "todos" || i.estado === filtroEstado)
    .filter(i => !busqueda ||
      i.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      i.ubicacion?.toLowerCase().includes(busqueda.toLowerCase()) ||
      i.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
    )

  const vencidos = items.filter(i => i.estado === 'vencido').length
  const proximos = items.filter(i => i.estado === 'proximo').length

  return (
    <div>
      {/* Alertas */}
      {(vencidos > 0 || proximos > 0) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {vencidos > 0 && (
            <div style={{ background: "#fee2e2", border: "1px solid #ef444440", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>🔴</span>
              <div>
                <div style={{ fontWeight: 700, color: "#ef4444", fontSize: 14 }}>
                  {vencidos} item{vencidos > 1 ? 's' : ''} vencido{vencidos > 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: 12, color: "#b91c1c" }}>Requieren atención inmediata</div>
              </div>
            </div>
          )}
          {proximos > 0 && (
            <div style={{ background: "#fef3c7", border: "1px solid #f59e0b40", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, color: "#d97706", fontSize: 14 }}>
                  {proximos} item{proximos > 1 ? 's' : ''} vence{proximos === 1 ? '' : 'n'} en menos de 30 días
                </div>
                <div style={{ fontSize: 12, color: "#92400e" }}>Programá la renovación</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {canEdit && (
          <button onClick={() => { setItemSeleccionado(null); setForm({ categoria: "matafuegos", nombre: "", ubicacion: "", descripcion: "", fecha_vencimiento: "", ultima_revision: "", proveedor_servicio: "", notas: "", imagen_url: "" }); setMostrarFormulario(true) }} style={{
            padding: "10px 18px", borderRadius: 10, border: "none",
            background: "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "#fff",
            fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit"
          }}>+ Nuevo Item</button>
        )}
        <input
          type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="🔍 Buscar..."
          style={{ padding: "9px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", fontFamily: "inherit", background: "#fff", width: 220 }}
        />
      </div>

      {/* Filtros por categoría */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        <button onClick={() => setFiltroCategoria("todos")} style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", background: filtroCategoria === "todos" ? "#0f172a" : "#fff", color: filtroCategoria === "todos" ? "#fff" : "#64748b", boxShadow: "0 1px 4px #00000010" }}>
          Todas
        </button>
        {CATEGORIAS.map(c => (
          <button key={c.id} onClick={() => setFiltroCategoria(c.id)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", background: filtroCategoria === c.id ? "#0f172a" : "#fff", color: filtroCategoria === c.id ? "#fff" : "#64748b", boxShadow: "0 1px 4px #00000010" }}>
            {c.icono} {c.etiqueta}
          </button>
        ))}
      </div>

      {/* Filtros por estado */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {["todos", "vigente", "proximo", "vencido"].map(e => (
          <button key={e} onClick={() => setFiltroEstado(e)} style={{ padding: "7px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", background: filtroEstado === e ? "#6366f1" : "#fff", color: filtroEstado === e ? "#fff" : "#64748b", boxShadow: "0 1px 4px #00000010" }}>
            {e === "todos" ? "Todos" : estadoConfig[e]?.etiqueta}
            <span style={{ marginLeft: 4, borderRadius: 10, padding: "1px 6px", fontSize: 11, background: filtroEstado === e ? "#ffffff30" : "#f1f5f9" }}>
              {e === "todos" ? items.length : items.filter(i => i.estado === e).length}
            </span>
          </button>
        ))}
      </div>

      {/* Tabla */}
      {cargando ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>⚙ Cargando...</div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 8px #00000010" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                {["Categoría", "Nombre", "Ubicación", "Último servicio", "Vencimiento", "Estado", ""].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {itemsFiltrados.map((item, i) => {
                const cat = CATEGORIAS.find(c => c.id === item.categoria)
                const dias = diasParaVencer(item.fecha_vencimiento)
                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>
                      <span style={{ fontSize: 16 }}>{cat?.icono}</span>{" "}
                      <span style={{ fontSize: 11, color: "#64748b" }}>{cat?.etiqueta}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                        {item.nombre}
                        {item.imagen_url && <span style={{ marginLeft: 6 }} title="Tiene imagen">📎</span>}
                      </div>
                      {item.descripcion && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{item.descripcion.substring(0, 50)}{item.descripcion.length > 50 ? '...' : ''}</div>}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{item.ubicacion || "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{item.ultima_revision || "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {item.fecha_vencimiento ? (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: item.estado === 'vencido' ? "#ef4444" : item.estado === 'proximo' ? "#d97706" : "#374151" }}>
                            {item.fecha_vencimiento}
                          </div>
                          {dias !== null && (
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>
                              {dias < 0 ? `Venció hace ${Math.abs(dias)} días` : dias === 0 ? "Vence hoy" : `En ${dias} días`}
                            </div>
                          )}
                        </div>
                      ) : "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}><BadgeEstado estado={item.estado} /></td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {canEdit && (
                          <button onClick={() => handleEditar(item)} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>✏️</button>
                        )}
                        {canEdit && (
                          <button onClick={() => handleEliminar(item.id)} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #ef444440", background: "#fee2e2", color: "#ef4444", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>🗑</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {itemsFiltrados.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>No hay items con este filtro</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal formulario */}
      {mostrarFormulario && (
        <div style={{ position: "fixed", inset: 0, background: "#00000060", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={e => e.target === e.currentTarget && setMostrarFormulario(false)}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 64px #00000040" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                {itemSeleccionado ? "Editar item" : "Nuevo item de infraestructura"}
              </h2>
              <button onClick={() => setMostrarFormulario(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 16, color: "#64748b" }}>×</button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Categoría *</label>
                <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} style={inputStyle}>
                  {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.icono} {c.etiqueta}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Nombre *</label>
                  <input type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Ej: Matafuego Sector A-1" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Ubicación</label>
                  <input type="text" value={form.ubicacion} onChange={e => setForm({...form, ubicacion: e.target.value})} placeholder="Ej: Planta A - Columna 3" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Fecha de vencimiento</label>
                  <input type="date" value={form.fecha_vencimiento} onChange={e => setForm({...form, fecha_vencimiento: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Última revisión</label>
                  <input type="date" value={form.ultima_revision} onChange={e => setForm({...form, ultima_revision: e.target.value})} style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Descripción / Notas técnicas</label>
                <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} rows={2} placeholder="Detalles técnicos, normativa aplicable..." style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Empresa / Proveedor del servicio</label>
                  <input type="text" value={form.proveedor_servicio} onChange={e => setForm({...form, proveedor_servicio: e.target.value})} placeholder="Ej: Extintores SA" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Notas adicionales</label>
                  <input type="text" value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} placeholder="Observaciones" style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Imagen / Certificado (opcional)</label>
                <SubirImagen
                  onImagenSubida={(url) => setForm({...form, imagen_url: url || ""})}
                  imagenActual={form.imagen_url}
                  carpeta="infraestructura"
                />
              </div>
              {error && <div style={{ background: "#fee2e2", color: "#ef4444", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 14 }}>❌ {error}</div>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setMostrarFormulario(false)} style={{ padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
                <button onClick={handleGuardar} disabled={guardando} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: guardando ? "#4b5563" : "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: guardando ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                  {guardando ? "Guardando..." : itemSeleccionado ? "Guardar cambios" : "Crear item"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}