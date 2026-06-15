import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1.5px solid #e2e8f0", fontSize: 13, color: "#0f172a",
  outline: "none", fontFamily: "inherit", background: "#f8fafc", boxSizing: "border-box"
}

const labelStyle = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6
}

export default function Proveedores() {
  const { usuario } = useAuth()
  const [proveedores, setProveedores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")

  const [nombre, setNombre] = useState("")
  const [rubro, setRubro] = useState("")
  const [contacto, setContacto] = useState("")
  const [email, setEmail] = useState("")
  const [notas, setNotas] = useState("")

  const isMant = usuario?.role === 'mantenimiento' || usuario?.role === 'admin'

  const cargarProveedores = async () => {
    if (!usuario?.empresa_id) return
    setCargando(true)
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .eq('empresa_id', usuario.empresa_id)
        .order('nombre', { ascending: true })
      if (error) throw error
      setProveedores(data || [])
    } catch (error) {
      console.error('Error cargando proveedores:', error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    if (usuario?.empresa_id) cargarProveedores()
  }, [usuario?.empresa_id])

  const handleCrear = async () => {
    if (!nombre || !rubro) { setError("Nombre y rubro son obligatorios"); return }
    setGuardando(true); setError("")
    try {
      const { data, error } = await supabase
        .from('proveedores')
        .insert([{ nombre, rubro, contacto, email, notas, empresa_id: usuario.empresa_id }])
        .select().single()
      if (error) throw error
      setProveedores(prev => [...prev, data])
      setNombre(""); setRubro(""); setContacto(""); setEmail(""); setNotas("")
      setMostrarFormulario(false)
    } catch { setError("Error al guardar el proveedor") }
    finally { setGuardando(false) }
  }

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar este proveedor?")) return
    await supabase.from('proveedores').delete().eq('id', id)
    setProveedores(prev => prev.filter(p => p.id !== id))
  }

  const proveedoresFiltrados = proveedores.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.rubro.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {isMant && (
          <button onClick={() => setMostrarFormulario(true)} style={{
            padding: "10px 18px", borderRadius: 10, border: "none",
            background: "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "#fff",
            fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit"
          }}>+ Agregar Proveedor</button>
        )}
        <input
          type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o rubro..."
          style={{ ...inputStyle, width: 260 }}
        />
      </div>

      {cargando ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>⚙ Cargando proveedores...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {proveedoresFiltrados.map(p => (
            <div key={p.id} style={{
              background: "#fff", borderRadius: 16, padding: 20,
              boxShadow: "0 1px 8px #00000010", border: "1px solid #e2e8f0"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
                }}>🏢</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>{p.nombre}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{p.rubro}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#374151" }}>
                {p.contacto && <div>📞 {p.contacto}</div>}
                {p.email && <div>✉️ {p.email}</div>}
                {p.notas && (
                  <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px", color: "#64748b", marginTop: 4 }}>
                    💬 {p.notas}
                  </div>
                )}
              </div>
              {isMant && (
                <button onClick={() => handleEliminar(p.id)} style={{
                  width: "100%", marginTop: 12, padding: "7px", borderRadius: 8,
                  border: "1px solid #ef444440", background: "#fee2e2",
                  color: "#ef4444", cursor: "pointer", fontSize: 12,
                  fontWeight: 600, fontFamily: "inherit"
                }}>🗑 Eliminar</button>
              )}
            </div>
          ))}
          {proveedoresFiltrados.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60, color: "#94a3b8", fontSize: 14 }}>
              {busqueda ? "No se encontraron proveedores" : "No hay proveedores cargados"}
            </div>
          )}
        </div>
      )}

      {mostrarFormulario && (
        <div style={{
          position: "fixed", inset: 0, background: "#00000060", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }} onClick={e => e.target === e.currentTarget && setMostrarFormulario(false)}>
          <div style={{
            background: "#fff", borderRadius: 20, width: "100%", maxWidth: 480,
            maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 64px #00000040"
          }}>
            <div style={{
              padding: "20px 24px", borderBottom: "1px solid #e2e8f0",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              position: "sticky", top: 0, background: "#fff"
            }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Nuevo Proveedor</h2>
              <button onClick={() => setMostrarFormulario(false)} style={{
                background: "#f1f5f9", border: "none", borderRadius: 8,
                width: 28, height: 28, cursor: "pointer", fontSize: 16, color: "#64748b"
              }}>×</button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Nombre *</label>
                  <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Empresa SA" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Rubro *</label>
                  <input type="text" value={rubro} onChange={e => setRubro(e.target.value)} placeholder="Repuestos eléctricos" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Teléfono</label>
                  <input type="text" value={contacto} onChange={e => setContacto(e.target.value)} placeholder="011-XXXX-XXXX" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ventas@empresa.com" style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Notas</label>
                <textarea value={notas} onChange={e => setNotas(e.target.value)}
                  rows={2} placeholder="Condiciones especiales, descuentos, etc."
                  style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              {error && <div style={{ background: "#fee2e2", color: "#ef4444", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 14 }}>❌ {error}</div>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setMostrarFormulario(false)} style={{
                  padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0",
                  background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13,
                  cursor: "pointer", fontFamily: "inherit"
                }}>Cancelar</button>
                <button onClick={handleCrear} disabled={guardando} style={{
                  padding: "10px 18px", borderRadius: 10, border: "none",
                  background: guardando ? "#4b5563" : "linear-gradient(90deg,#6366f1,#8b5cf6)",
                  color: "#fff", fontWeight: 700, fontSize: 13,
                  cursor: guardando ? "not-allowed" : "pointer", fontFamily: "inherit"
                }}>
                  {guardando ? "Guardando..." : "Guardar Proveedor"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}