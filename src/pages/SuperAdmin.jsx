import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#0f172a", outline: "none", fontFamily: "inherit", background: "#f8fafc", boxSizing: "border-box" }
const labelStyle = { display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }

export default function SuperAdmin() {
  const [empresas, setEmpresas] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [tab, setTab] = useState("empresas")
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null)

  const [form, setForm] = useState({
    nombre: "", telefono: "", direccion: "",
    contacto_nombre: "", contacto_email: "",
    plan: "basico", max_usuarios: 10
  })

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const { data: emp } = await supabase.from('empresas').select('*').order('created_at', { ascending: false })
      const { data: usr } = await supabase.from('usuarios').select('*').order('created_at', { ascending: false })
      setEmpresas(emp || [])
      setUsuarios(usr || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargarDatos() }, [])

  const handleCrearEmpresa = async () => {
    if (!form.nombre) { setError("El nombre es obligatorio"); return }
    setGuardando(true); setError("")
    try {
      // Crear empresa
      const { data: empresa, error: errorEmp } = await supabase
        .from('empresas')
        .insert([{ ...form, activa: true }])
        .select()
        .single()
      if (errorEmp) throw errorEmp

      // Crear código de invitación
      const codigo = `${form.nombre.toLowerCase().replace(/\s/g, '-')}-${Math.random().toString(36).substring(2, 8)}`
      await supabase.from('invitaciones').insert([{
        empresa_id: empresa.id,
        codigo,
        rol: 'admin',
        activa: true
      }])

      setMostrarForm(false)
      setForm({ nombre: "", telefono: "", direccion: "", contacto_nombre: "", contacto_email: "", plan: "basico", max_usuarios: 10 })
      cargarDatos()
      alert(`✅ Empresa creada.\nLink de invitación para el admin:\n${window.location.origin}/registro?codigo=${codigo}`)
    } catch { setError("Error al crear empresa") }
    finally { setGuardando(false) }
  }

  const toggleEmpresa = async (empresa) => {
    await supabase.from('empresas').update({ activa: !empresa.activa }).eq('id', empresa.id)
    cargarDatos()
  }

  const usuariosPorEmpresa = (empresaId) => usuarios.filter(u => u.empresa_id === empresaId)

  const planConfig = {
    basico: { color: "#6366f1", bg: "#ede9fe", etiqueta: "Básico" },
    profesional: { color: "#0891b2", bg: "#ecfeff", etiqueta: "Profesional" },
    enterprise: { color: "#065f46", bg: "#d1fae5", etiqueta: "Enterprise" },
  }

  return (
    <div>
      {/* Header stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Empresas activas", value: empresas.filter(e => e.activa).length, icono: "🏢", color: "#6366f1" },
          { label: "Total usuarios", value: usuarios.length, icono: "👥", color: "#0891b2" },
          { label: "Órdenes hoy", value: "—", icono: "📋", color: "#f59e0b" },
          { label: "Ingresos est.", value: `$${empresas.filter(e => e.activa).length * 60}/mes`, icono: "💰", color: "#10b981" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", boxShadow: "0 1px 8px #00000010" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icono}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[{ id: "empresas", etiqueta: "🏢 Empresas" }, { id: "usuarios", etiqueta: "👥 Todos los usuarios" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", background: tab === t.id ? "linear-gradient(90deg,#6366f1,#8b5cf6)" : "#fff", color: tab === t.id ? "#fff" : "#64748b", boxShadow: "0 1px 4px #00000010" }}>
            {t.etiqueta}
          </button>
        ))}
        <button onClick={() => setMostrarForm(true)} style={{ marginLeft: "auto", padding: "10px 18px", borderRadius: 10, border: "none", background: "linear-gradient(90deg,#10b981,#059669)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
          + Nueva Empresa
        </button>
      </div>

      {cargando ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>⚙ Cargando...</div>
      ) : tab === "empresas" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {empresas.map(empresa => {
            const usrs = usuariosPorEmpresa(empresa.id)
            const plan = planConfig[empresa.plan] || planConfig.basico
            return (
              <div key={empresa.id} style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 8px #00000010", border: empresa.activa ? "none" : "1px solid #ef444440" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{empresa.nombre}</h3>
                      <span style={{ background: plan.bg, color: plan.color, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{plan.etiqueta}</span>
                      {!empresa.activa && <span style={{ background: "#fee2e2", color: "#ef4444", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>Inactiva</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {empresa.contacto_email && `📧 ${empresa.contacto_email}`}
                      {empresa.telefono && ` · 📞 ${empresa.telefono}`}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setEmpresaSeleccionada(empresaSeleccionada?.id === empresa.id ? null : empresa)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
                      {empresaSeleccionada?.id === empresa.id ? "Ocultar" : "Ver detalle"}
                    </button>
                    <button onClick={() => toggleEmpresa(empresa)} style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: empresa.activa ? "#fee2e2" : "#d1fae5", color: empresa.activa ? "#ef4444" : "#065f46", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
                      {empresa.activa ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: empresaSeleccionada?.id === empresa.id ? 16 : 0 }}>
                  {[
                    { label: "Usuarios", value: `${usrs.length} / ${empresa.max_usuarios}` },
                    { label: "Creada", value: empresa.created_at ? new Date(empresa.created_at).toLocaleDateString("es-AR") : "—" },
                    { label: "Contacto", value: empresa.contacto_nombre || "—" },
                  ].map(d => (
                    <div key={d.label} style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{d.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{d.value}</div>
                    </div>
                  ))}
                </div>

                {empresaSeleccionada?.id === empresa.id && (
                  <div>
                    <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>👥 Usuarios de esta empresa</h4>
                    {usrs.length === 0 ? (
                      <p style={{ color: "#94a3b8", fontSize: 13 }}>No hay usuarios todavía</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {usrs.map(u => (
                          <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", borderRadius: 8, padding: "8px 12px" }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{u.nombre} {u.apellido}</div>
                              <div style={{ fontSize: 11, color: "#94a3b8" }}>{u.email}</div>
                            </div>
                            <span style={{ background: "#ede9fe", color: "#6d28d9", borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{u.rol}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {empresas.length === 0 && <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>No hay empresas todavía</div>}
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 8px #00000010" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                {["Usuario", "Email", "Empresa", "Rol", "Estado"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u, i) => {
                const empresa = empresas.find(e => e.id === u.empresa_id)
                return (
                  <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{u.nombre} {u.apellido}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{u.email}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{empresa?.nombre || "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: "#ede9fe", color: "#6d28d9", borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{u.rol}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: u.activo ? "#d1fae5" : "#fee2e2", color: u.activo ? "#065f46" : "#ef4444", borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                        {u.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal nueva empresa */}
      {mostrarForm && (
        <div style={{ position: "fixed", inset: 0, background: "#00000060", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => e.target === e.currentTarget && setMostrarForm(false)}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 540, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 64px #00000040" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>🏢 Nueva Empresa</h2>
              <button onClick={() => setMostrarForm(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 16, color: "#64748b" }}>×</button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Nombre de la empresa *</label>
                  <input type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Ej: Industrias XYZ SA" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Teléfono</label>
                  <input type="text" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} placeholder="Ej: +54 11 1234-5678" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Plan</label>
                  <select value={form.plan} onChange={e => setForm({...form, plan: e.target.value})} style={inputStyle}>
                    <option value="basico">Básico — $60/mes</option>
                    <option value="profesional">Profesional — $120/mes</option>
                    <option value="enterprise">Enterprise — $250/mes</option>
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Dirección</label>
                  <input type="text" value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} placeholder="Ej: Av. Industrial 1234, Buenos Aires" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Nombre del contacto</label>
                  <input type="text" value={form.contacto_nombre} onChange={e => setForm({...form, contacto_nombre: e.target.value})} placeholder="Ej: Juan García" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email del contacto</label>
                  <input type="email" value={form.contacto_email} onChange={e => setForm({...form, contacto_email: e.target.value})} placeholder="admin@empresa.com" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Máx. usuarios</label>
                  <input type="number" value={form.max_usuarios} onChange={e => setForm({...form, max_usuarios: parseInt(e.target.value) || 10})} style={inputStyle} />
                </div>
              </div>
              {error && <div style={{ background: "#fee2e2", color: "#ef4444", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 14 }}>❌ {error}</div>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setMostrarForm(false)} style={{ padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
                <button onClick={handleCrearEmpresa} disabled={guardando} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: guardando ? "#4b5563" : "linear-gradient(90deg,#10b981,#059669)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: guardando ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                  {guardando ? "Creando..." : "Crear empresa"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}