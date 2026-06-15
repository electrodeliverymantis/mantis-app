import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const rolConfig = {
  admin:         { etiqueta: "Administrador",  color: "#7c3aed", icono: "👑" },
  produccion:    { etiqueta: "Producción",     color: "#0369a1", icono: "🏭" },
  mantenimiento: { etiqueta: "Mantenimiento",  color: "#065f46", icono: "🔧" },
  visualizacion: { etiqueta: "Visualización",  color: "#92400e", icono: "👁"  },
}

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1.5px solid #e2e8f0", fontSize: 13, color: "#0f172a",
  outline: "none", fontFamily: "inherit", background: "#f8fafc", boxSizing: "border-box"
}

const labelStyle = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6
}

export default function Usuarios() {
  const { usuario } = useAuth()
  const [tab, setTab] = useState("usuarios")
  const [usuarios, setUsuarios] = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")

  // Formulario nuevo usuario
  const [form, setForm] = useState({
    nombre: "", apellido: "", email: "", password: "",
    dni: "", telefono: "", cargo: "", sector: "", rol: "produccion"
  })

  const cargarDatos = async () => {
  if (!usuario?.empresa_id) return
  setCargando(true)
  try {
    const { data: usrs } = await supabase
      .from('usuarios')
      .select('*')
      .eq('empresa_id', usuario.empresa_id)
      .order('created_at', { ascending: false })
    const { data: sols } = await supabase
      .from('solicitudes_acceso')
      .select('*')
      .eq('empresa_id', usuario.empresa_id)
      .order('created_at', { ascending: false })
    setUsuarios(usrs || [])
    setSolicitudes(sols || [])
  } catch (error) {
    console.error('Error:', error)
  } finally {
    setCargando(false)
  }
}

useEffect(() => {
  if (usuario?.empresa_id) cargarDatos()
}, [usuario?.empresa_id])

  const handleCrearUsuario = async () => {
    if (!form.nombre || !form.apellido || !form.email || !form.password) {
      setError("Nombre, apellido, email y contraseña son obligatorios")
      return
    }
    setGuardando(true); setError("")
    try {
      const { error } = await supabase.from('usuarios').insert([{
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        dni: form.dni,
        telefono: form.telefono,
        cargo: form.cargo,
        sector: form.sector,
        rol: form.rol,
        activo: true
      }])
      if (error) throw error
      setForm({ nombre: "", apellido: "", email: "", password: "", dni: "", telefono: "", cargo: "", sector: "", rol: "produccion" })
      setMostrarFormulario(false)
      cargarDatos()
    } catch { setError("Error al crear el usuario") }
    finally { setGuardando(false) }
  }

  const handleDesactivar = async (id) => {
    if (!confirm("¿Desactivar este usuario?")) return
    await supabase.from('usuarios').update({ activo: false }).eq('id', id)
    cargarDatos()
  }

 const handleAprobarSolicitud = async (solicitud, rolAprobado) => {
    try {
      // 1. Crear el usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin
        ? await supabase.auth.signUp({
            email: solicitud.email,
            password: 'Mantis2026!', // contraseña temporal
            options: { emailRedirectTo: undefined }
          })
        : { data: null, error: null }

      // 2. Crear el perfil en la tabla usuarios
      await supabase.from('usuarios').insert([{
        nombre: solicitud.nombre,
        apellido: solicitud.apellido,
        email: solicitud.email,
        rol: rolAprobado,
        activo: true
      }])

      // 3. Marcar solicitud como aprobada
      await supabase.from('solicitudes_acceso')
        .update({ estado: 'aprobado' }).eq('id', solicitud.id)

      cargarDatos()
      alert(`✅ Usuario aprobado. Contraseña temporal: Mantis2026!\nEl usuario deberá cambiarla al ingresar.`)
    } catch (error) {
      console.error('Error aprobando:', error)
    }
  }

  const handleRechazarSolicitud = async (id) => {
    await supabase.from('solicitudes_acceso')
      .update({ estado: 'rechazado' }).eq('id', id)
    cargarDatos()
  }

  const solicitudesPendientes = solicitudes.filter(s => s.estado === 'pendiente')

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button onClick={() => setTab("usuarios")} style={{
          padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer",
          fontWeight: 700, fontSize: 13, fontFamily: "inherit",
          background: tab === "usuarios" ? "#0f172a" : "#fff",
          color: tab === "usuarios" ? "#fff" : "#64748b",
          boxShadow: "0 1px 4px #00000010"
        }}>👥 Usuarios activos ({usuarios.filter(u => u.activo).length})</button>
        <button onClick={() => setTab("solicitudes")} style={{
          padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer",
          fontWeight: 700, fontSize: 13, fontFamily: "inherit",
          background: tab === "solicitudes" ? "#0f172a" : "#fff",
          color: tab === "solicitudes" ? "#fff" : "#64748b",
          boxShadow: "0 1px 4px #00000010",
          position: "relative"
        }}>
          📋 Solicitudes
          {solicitudesPendientes.length > 0 && (
            <span style={{
              position: "absolute", top: -6, right: -6,
              background: "#ef4444", color: "#fff",
              borderRadius: "50%", width: 20, height: 20,
              fontSize: 11, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>{solicitudesPendientes.length}</span>
          )}
        </button>
      </div>

      {/* TAB USUARIOS */}
      {tab === "usuarios" && (
        <div>
          <button onClick={() => setMostrarFormulario(true)} style={{
            padding: "10px 18px", borderRadius: 10, border: "none", marginBottom: 20,
            background: "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "#fff",
            fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit"
          }}>+ Nuevo Usuario</button>

          <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 8px #00000010" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  {["Usuario", "DNI", "Cargo", "Email", "Rol", "Estado", ""].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u, i) => {
                  const cfg = rolConfig[u.rol] || rolConfig.produccion
                  return (
                    <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa", opacity: u.activo ? 1 : 0.5 }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${cfg.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{cfg.icono}</div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{u.nombre} {u.apellido}</div>
                            {u.sector && <div style={{ fontSize: 11, color: "#94a3b8" }}>{u.sector}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{u.dni || "—"}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{u.cargo || "—"}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{u.email}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}40`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                          {cfg.icono} {cfg.etiqueta}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: u.activo ? "#10b981" : "#ef4444" }}>
                          {u.activo ? "✅ Activo" : "❌ Inactivo"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {u.activo && (
                          <button onClick={() => handleDesactivar(u.id)} style={{
                            padding: "5px 10px", borderRadius: 6, border: "1px solid #ef444440",
                            background: "#fee2e2", color: "#ef4444", cursor: "pointer", fontSize: 11, fontFamily: "inherit"
                          }}>Desactivar</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {usuarios.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No hay usuarios todavía</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB SOLICITUDES */}
      {tab === "solicitudes" && (
        <div>
          {solicitudes.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#94a3b8", fontSize: 14 }}>No hay solicitudes todavía</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {solicitudes.map(s => {
                const cfg = rolConfig[s.rol_solicitado] || rolConfig.produccion
                return (
                  <div key={s.id} style={{
                    background: "#fff", borderRadius: 14, padding: 20,
                    boxShadow: "0 1px 8px #00000010",
                    border: s.estado === 'pendiente' ? "2px solid #6366f140" : "1px solid #e2e8f0"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{s.nombre} {s.apellido}</div>
                        <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>✉️ {s.email}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                          Solicita: <strong style={{ color: cfg.color }}>{cfg.icono} {cfg.etiqueta}</strong>
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                          {new Date(s.created_at).toLocaleString("es-AR")}
                        </div>
                      </div>

                      {s.estado === 'pendiente' ? (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {["produccion", "mantenimiento", "visualizacion", "admin"].map(rol => (
                            <button key={rol} onClick={() => handleAprobarSolicitud(s, rol)} style={{
                              padding: "7px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                              background: rol === s.rol_solicitado ? "#d1fae5" : "#f1f5f9",
                              color: rol === s.rol_solicitado ? "#065f46" : "#374151",
                              fontSize: 11, fontWeight: 600, fontFamily: "inherit"
                            }}>
                              ✅ {rolConfig[rol]?.etiqueta}
                            </button>
                          ))}
                          <button onClick={() => handleRechazarSolicitud(s.id)} style={{
                            padding: "7px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                            background: "#fee2e2", color: "#ef4444", fontSize: 11, fontWeight: 600, fontFamily: "inherit"
                          }}>❌ Rechazar</button>
                        </div>
                      ) : (
                        <span style={{
                          padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                          background: s.estado === 'aprobado' ? "#d1fae5" : "#fee2e2",
                          color: s.estado === 'aprobado' ? "#065f46" : "#ef4444"
                        }}>
                          {s.estado === 'aprobado' ? "✅ Aprobado" : "❌ Rechazado"}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal nuevo usuario */}
      {mostrarFormulario && (
        <div style={{ position: "fixed", inset: 0, background: "#00000060", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={e => e.target === e.currentTarget && setMostrarFormulario(false)}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 64px #00000040" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Nuevo Usuario</h2>
              <button onClick={() => setMostrarFormulario(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 16, color: "#64748b" }}>×</button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div><label style={labelStyle}>Nombre *</label><input type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Juan" style={inputStyle} /></div>
                <div><label style={labelStyle}>Apellido *</label><input type="text" value={form.apellido} onChange={e => setForm({...form, apellido: e.target.value})} placeholder="Pérez" style={inputStyle} /></div>
                <div><label style={labelStyle}>Email *</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="juan@empresa.com" style={inputStyle} /></div>
                <div><label style={labelStyle}>Contraseña *</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" style={inputStyle} /></div>
                <div><label style={labelStyle}>DNI</label><input type="text" value={form.dni} onChange={e => setForm({...form, dni: e.target.value})} placeholder="28.456.789" style={inputStyle} /></div>
                <div><label style={labelStyle}>Teléfono</label><input type="text" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} placeholder="011-XXXX-XXXX" style={inputStyle} /></div>
                <div><label style={labelStyle}>Cargo</label><input type="text" value={form.cargo} onChange={e => setForm({...form, cargo: e.target.value})} placeholder="Técnico Electricista" style={inputStyle} /></div>
                <div><label style={labelStyle}>Sector</label><input type="text" value={form.sector} onChange={e => setForm({...form, sector: e.target.value})} placeholder="Planta A" style={inputStyle} /></div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Rol</label>
                <select value={form.rol} onChange={e => setForm({...form, rol: e.target.value})} style={inputStyle}>
                  <option value="produccion">🏭 Producción</option>
                  <option value="mantenimiento">🔧 Mantenimiento</option>
                  <option value="visualizacion">👁 Visualización</option>
                  <option value="admin">👑 Administrador</option>
                </select>
              </div>
              {error && <div style={{ background: "#fee2e2", color: "#ef4444", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 14 }}>❌ {error}</div>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setMostrarFormulario(false)} style={{ padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
                <button onClick={handleCrearUsuario} disabled={guardando} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: guardando ? "#4b5563" : "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: guardando ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                  {guardando ? "Guardando..." : "Crear Usuario"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}