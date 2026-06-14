import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import SubirImagen from '../components/SubirImagen'

const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#0f172a", outline: "none", fontFamily: "inherit", background: "#f8fafc", boxSizing: "border-box" }
const labelStyle = { display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }

export default function Configuracion() {
  const { usuario } = useAuth()
  const [tab, setTab] = useState("sectores")
  const [sectores, setSectores] = useState([])
  const [maquinas, setMaquinas] = useState([])
  const [partes, setPartes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({ nombre: "", descripcion: "", imagen_url: "", sector_id: "", maquina_id: "" })

  const empresaId = usuario?.empresa_id || 'd0098530-4e23-48ef-86dd-bf12a6aa0ef4'

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const [{ data: sec }, { data: maq }, { data: par }] = await Promise.all([
        supabase.from('sectores').select('*').eq('activo', true).order('nombre'),
        supabase.from('maquinas').select('*').eq('activo', true).order('nombre'),
        supabase.from('partes').select('*').eq('activo', true).order('nombre'),
      ])
      setSectores(sec || [])
      setMaquinas(maq || [])
      setPartes(par || [])
    } catch (e) { console.error(e) }
    finally { setCargando(false) }
  }

  useEffect(() => { cargarDatos() }, [])

  const abrirForm = (item = null) => {
    if (item) {
      setForm({ nombre: item.nombre, descripcion: item.descripcion || "", imagen_url: item.imagen_url || "", sector_id: item.sector_id || "", maquina_id: item.maquina_id || "" })
      setEditando(item)
    } else {
      setForm({ nombre: "", descripcion: "", imagen_url: "", sector_id: "", maquina_id: "" })
      setEditando(null)
    }
    setMostrarForm(true)
  }

  const handleGuardar = async () => {
    if (!form.nombre) { setError("El nombre es obligatorio"); return }
    setGuardando(true); setError("")
    try {
      const tabla = tab === 'sectores' ? 'sectores' : tab === 'maquinas' ? 'maquinas' : 'partes'
      const datos = { nombre: form.nombre, descripcion: form.descripcion, imagen_url: form.imagen_url || null }
      if (tab === 'maquinas') datos.sector_id = form.sector_id || null
      if (tab === 'partes') datos.maquina_id = form.maquina_id || null

      if (editando) {
        await supabase.from(tabla).update(datos).eq('id', editando.id)
      } else {
        await supabase.from(tabla).insert([{ ...datos, empresa_id: empresaId, activo: true }])
      }
      setMostrarForm(false)
      cargarDatos()
    } catch { setError("Error al guardar") }
    finally { setGuardando(false) }
  }

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar este item?")) return
    const tabla = tab === 'sectores' ? 'sectores' : tab === 'maquinas' ? 'maquinas' : 'partes'
    await supabase.from(tabla).update({ activo: false }).eq('id', id)
    cargarDatos()
  }

  const items = tab === 'sectores' ? sectores : tab === 'maquinas' ? maquinas : partes

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { id: "sectores", etiqueta: "🏭 Sectores", count: sectores.length },
          { id: "maquinas", etiqueta: "⚙ Máquinas", count: maquinas.length },
          { id: "partes", etiqueta: "🔩 Partes", count: partes.length },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "10px 18px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", background: tab === t.id ? "linear-gradient(90deg,#6366f1,#8b5cf6)" : "#fff", color: tab === t.id ? "#fff" : "#64748b", boxShadow: "0 1px 4px #00000010" }}>
            {t.etiqueta} <span style={{ marginLeft: 4, opacity: 0.7, fontSize: 11 }}>{t.count}</span>
          </button>
        ))}
        <button onClick={() => abrirForm()} style={{ marginLeft: "auto", padding: "10px 18px", borderRadius: 10, border: "none", background: "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
          + Nuevo
        </button>
      </div>

      {/* Info contextual */}
      {tab === 'maquinas' && (
        <div style={{ background: "#ede9fe", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#6d28d9" }}>
          💡 Cada máquina pertenece a un sector. Agregá una imagen para que aparezca como referencia en las órdenes de trabajo.
        </div>
      )}
      {tab === 'partes' && (
        <div style={{ background: "#ede9fe", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#6d28d9" }}>
          💡 Las partes pertenecen a una máquina específica. Se usan al crear órdenes de trabajo.
        </div>
      )}

      {/* Lista */}
      {cargando ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>⚙ Cargando...</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>
            {tab === 'sectores' ? '🏭' : tab === 'maquinas' ? '⚙' : '🔩'}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>No hay {tab} cargados</div>
          <div style={{ fontSize: 12 }}>Hacé clic en "Nuevo" para agregar el primero</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map(item => {
            const sector = sectores.find(s => s.id === item.sector_id)
            const maquina = maquinas.find(m => m.id === item.maquina_id)
            return (
              <div key={item.id} style={{ background: "#fff", borderRadius: 14, padding: 16, boxShadow: "0 1px 8px #00000010", display: "flex", gap: 14, alignItems: "center" }}>
                {item.imagen_url ? (
                  <img src={item.imagen_url} alt={item.nombre} style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0, cursor: "pointer" }} onClick={() => window.open(item.imagen_url, '_blank')} />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: 10, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                    {tab === 'sectores' ? '🏭' : tab === 'maquinas' ? '⚙' : '🔩'}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{item.nombre}</div>
                  {sector && <div style={{ fontSize: 11, color: "#6366f1", marginTop: 2 }}>📍 {sector.nombre}</div>}
                  {maquina && <div style={{ fontSize: 11, color: "#6366f1", marginTop: 2 }}>⚙ {maquina.nombre}</div>}
                  {item.descripcion && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{item.descripcion.substring(0, 60)}</div>}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => abrirForm(item)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12 }}>✏️</button>
                  <button onClick={() => handleEliminar(item.id)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ef444440", background: "#fee2e2", color: "#ef4444", cursor: "pointer", fontSize: 12 }}>🗑</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {mostrarForm && (
        <div style={{ position: "fixed", inset: 0, background: "#00000060", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => e.target === e.currentTarget && setMostrarForm(false)}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 480, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 64px #00000040" }}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff" }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>
                {editando ? "Editar" : "Nuevo"} {tab === 'sectores' ? '🏭 Sector' : tab === 'maquinas' ? '⚙ Máquina' : '🔩 Parte'}
              </h2>
              <button onClick={() => setMostrarForm(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 16, color: "#64748b" }}>×</button>
            </div>
            <div style={{ padding: 20 }}>
              {tab === 'maquinas' && (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Sector *</label>
                  <select value={form.sector_id} onChange={e => setForm({...form, sector_id: e.target.value})} style={inputStyle}>
                    <option value="">Seleccionar sector...</option>
                    {sectores.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
              )}
              {tab === 'partes' && (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Máquina *</label>
                  <select value={form.maquina_id} onChange={e => setForm({...form, maquina_id: e.target.value})} style={inputStyle}>
                    <option value="">Seleccionar máquina...</option>
                    {maquinas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                </div>
              )}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Nombre *</label>
                <input type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder={tab === 'sectores' ? 'Ej: Planta A' : tab === 'maquinas' ? 'Ej: Torno CNC-01' : 'Ej: Motor principal'} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Descripción / Notas técnicas</label>
                <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} rows={2} placeholder="Información técnica, ubicación, observaciones..." style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>
                  {tab === 'sectores' ? '🗺 Plano o foto del sector' : tab === 'maquinas' ? '📸 Foto de la máquina' : '📸 Foto de la parte'} (opcional)
                </label>
                <SubirImagen onImagenSubida={(url) => setForm({...form, imagen_url: url || ""})} imagenActual={form.imagen_url} carpeta={tab} />
              </div>
              {error && <div style={{ background: "#fee2e2", color: "#ef4444", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 14 }}>❌ {error}</div>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setMostrarForm(false)} style={{ padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
                <button onClick={handleGuardar} disabled={guardando} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: guardando ? "#4b5563" : "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: guardando ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                  {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}