import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#0f172a", outline: "none", fontFamily: "inherit", background: "#f8fafc", boxSizing: "border-box" }
const inputInlineStyle = { padding: "5px 8px", borderRadius: 6, border: "1.5px solid #6366f140", fontSize: 12, color: "#0f172a", outline: "none", fontFamily: "inherit", background: "#f5f3ff", boxSizing: "border-box" }
const labelStyle = { display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }

const planConfig = {
  basico:       { color: "#6366f1", bg: "#ede9fe", etiqueta: "Básico",      precio: "$60/mes" },
  profesional:  { color: "#0891b2", bg: "#ecfeff", etiqueta: "Profesional", precio: "$120/mes" },
  enterprise:   { color: "#065f46", bg: "#d1fae5", etiqueta: "Enterprise",  precio: "$250/mes" },
}

const rolConfig = {
  admin:         { icono: "👑", etiqueta: "Admin" },
  mantenimiento: { icono: "🔧", etiqueta: "Mantenimiento" },
  produccion:    { icono: "🏭", etiqueta: "Producción" },
  visualizacion: { icono: "👁", etiqueta: "Visualización" },
}

export default function SuperAdmin() {
  const [empresas, setEmpresas] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)
  const [error, setError] = useState("")
  const [empresasExpandidas, setEmpresasExpandidas] = useState({})
  const [passwordsVisibles, setPasswordsVisibles] = useState({})
  const [accesoEnProceso, setAccesoEnProceso] = useState(null)
  const [verArchivadas, setVerArchivadas] = useState(false)
  const [empresaEditando, setEmpresaEditando] = useState(null)
  const [formEdicion, setFormEdicion] = useState({})

  const [form, setForm] = useState({
    nombre: "", telefono: "", direccion: "",
    contacto_nombre: "", contacto_email: "",
    plan: "basico", max_usuarios: 10,
    fecha_vencimiento: "",
    admin_email: "", admin_password: "",
    codigo_invitacion: ""
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

  const generarCodigo = (nombre) => {
    const base = nombre.toUpperCase().replace(/\s+/g, '').substring(0, 6)
    const random = Date.now().toString(36).toUpperCase().slice(-4)
    return `${base}${random}`
  }

  const handleNombreChange = (nombre) => {
    setForm(f => ({ ...f, nombre, codigo_invitacion: nombre ? generarCodigo(nombre) : "" }))
  }

  const handleCrearEmpresa = async () => {
    if (!form.nombre) { setError("El nombre es obligatorio"); return }
    if (!form.admin_email || !form.admin_password) { setError("Email y contraseña del admin son obligatorios"); return }
    if (!form.codigo_invitacion) { setError("El código de invitación es obligatorio"); return }
    setGuardando(true); setError("")
    try {
      const { data: empresa, error: errorEmp } = await supabase
        .from('empresas')
        .insert([{
          nombre: form.nombre, telefono: form.telefono, direccion: form.direccion,
          contacto_nombre: form.contacto_nombre, contacto_email: form.contacto_email,
          plan: form.plan, max_usuarios: form.max_usuarios,
          fecha_vencimiento: form.fecha_vencimiento || null,
          admin_email: form.admin_email, admin_password: form.admin_password,
          codigo_invitacion: form.codigo_invitacion.toUpperCase(),
          activa: true, archivada: false
        }])
        .select().single()
      if (errorEmp) throw errorEmp

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.admin_email, password: form.admin_password,
        options: { emailRedirectTo: undefined }
      })
      if (authError) throw authError

      const { error: dbError } = await supabase.from('usuarios').insert([{
        id: authData.user.id, empresa_id: empresa.id,
        nombre: form.contacto_nombre || "Admin", apellido: "",
        email: form.admin_email, rol: 'admin', activo: true, es_superadmin: false
      }])
      if (dbError) throw dbError

      setMostrarForm(false)
      setForm({ nombre: "", telefono: "", direccion: "", contacto_nombre: "", contacto_email: "", plan: "basico", max_usuarios: 10, fecha_vencimiento: "", admin_email: "", admin_password: "", codigo_invitacion: "" })
      cargarDatos()
      alert(`✅ Empresa creada.\n\nCódigo: ${form.codigo_invitacion.toUpperCase()}\nAdmin: ${form.admin_email}`)
    } catch (e) { setError(e.message || "Error al crear empresa") }
    finally { setGuardando(false) }
  }

  const handleEditarClick = (empresa) => {
    setEmpresaEditando(empresa.id)
    setFormEdicion({
      nombre: empresa.nombre || "",
      telefono: empresa.telefono || "",
      direccion: empresa.direccion || "",
      contacto_nombre: empresa.contacto_nombre || "",
      contacto_email: empresa.contacto_email || "",
      plan: empresa.plan || "basico",
      max_usuarios: empresa.max_usuarios || 10,
      fecha_vencimiento: empresa.fecha_vencimiento || "",
      codigo_invitacion: empresa.codigo_invitacion || "",
      admin_email: empresa.admin_email || "",
      admin_password: empresa.admin_password || "",
    })
  }

  const handleGuardarEdicion = async (empresaId) => {
    setGuardandoEdicion(true)
    try {
      const { error } = await supabase.from('empresas').update({
        nombre: formEdicion.nombre,
        telefono: formEdicion.telefono,
        direccion: formEdicion.direccion,
        contacto_nombre: formEdicion.contacto_nombre,
        contacto_email: formEdicion.contacto_email,
        plan: formEdicion.plan,
        max_usuarios: parseInt(formEdicion.max_usuarios) || 10,
        fecha_vencimiento: formEdicion.fecha_vencimiento || null,
        codigo_invitacion: formEdicion.codigo_invitacion.toUpperCase(),
        admin_email: formEdicion.admin_email,
        admin_password: formEdicion.admin_password,
      }).eq('id', empresaId)
      if (error) throw error

      // Actualizar también el usuario admin en la tabla usuarios
      await supabase.from('usuarios').update({
        email: formEdicion.admin_email,
      }).eq('empresa_id', empresaId).eq('rol', 'admin')

      setEmpresaEditando(null)
      cargarDatos()
    } catch (e) { alert(`Error al guardar: ${e.message}`) }
    finally { setGuardandoEdicion(false) }
  }

  const toggleEmpresa = async (empresa) => {
    await supabase.from('empresas').update({ activa: !empresa.activa }).eq('id', empresa.id)
    cargarDatos()
  }

  const handleArchivar = async (empresa) => {
    const accion = empresa.archivada ? "desarchivar" : "archivar"
    if (!confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} "${empresa.nombre}"?`)) return
    await supabase.from('empresas').update({ archivada: !empresa.archivada }).eq('id', empresa.id)
    cargarDatos()
  }

  const handleEliminar = async (empresa) => {
  if (!confirm(`⚠️ ¿Eliminar permanentemente "${empresa.nombre}"?\n\nEsta acción no se puede deshacer.`)) return
  if (!confirm(`¿Estás seguro? Se eliminarán todos los datos de "${empresa.nombre}" incluyendo sus usuarios.`)) return
  try {
    await supabase.from('usuarios').delete().eq('empresa_id', empresa.id)
    await supabase.from('solicitudes_acceso').delete().eq('empresa_id', empresa.id)
    const { error } = await supabase.from('empresas').delete().eq('id', empresa.id)
    if (error) throw error
    cargarDatos()
  } catch (e) {
    alert(`Error al eliminar: ${e.message}`)
  }
}

  const toggleExpandir = (empresaId) => {
    setEmpresasExpandidas(prev => ({ ...prev, [empresaId]: !prev[empresaId] }))
  }

  const togglePassword = (key) => {
    setPasswordsVisibles(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleAcceder = async (email, password) => {
    if (!password) { alert("No hay contraseña guardada."); return }
    if (!confirm(`¿Acceder como ${email}?`)) return
    setAccesoEnProceso(email)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      window.location.reload()
    } catch (e) { alert(`Error: ${e.message}`) }
    finally { setAccesoEnProceso(null) }
  }

  const usuariosPorEmpresa = (empresaId) => usuarios.filter(u => u.empresa_id === empresaId)

  const diasParaVencer = (fecha) => {
    if (!fecha) return null
    const hoy = new Date()
    const vence = new Date(fecha)
    return Math.ceil((vence - hoy) / (1000 * 60 * 60 * 24))
  }

  const empresasFiltradas = empresas.filter(e => verArchivadas ? e.archivada : !e.archivada)
  const cantArchivadas = empresas.filter(e => e.archivada).length

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Empresas activas", value: empresas.filter(e => e.activa && !e.archivada).length, icono: "🏢", color: "#6366f1" },
          { label: "Total usuarios",   value: usuarios.length, icono: "👥", color: "#0891b2" },
          { label: "Por vencer",       value: empresas.filter(e => { const d = diasParaVencer(e.fecha_vencimiento); return d !== null && d <= 30 && d >= 0 }).length, icono: "⚠️", color: "#f59e0b" },
          { label: "Ingresos est.",    value: `$${empresas.filter(e => e.activa && !e.archivada).length * 60}/mes`, icono: "💰", color: "#10b981" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", boxShadow: "0 1px 8px #00000010" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icono}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
            {verArchivadas ? "📦 Empresas archivadas" : "🏢 Empresas"}
          </h2>
          {(cantArchivadas > 0 || verArchivadas) && (
            <button onClick={() => setVerArchivadas(!verArchivadas)} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: verArchivadas ? "#0f172a" : "#fff", color: verArchivadas ? "#fff" : "#64748b", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
              {verArchivadas ? "← Ver activas" : `📦 Archivadas (${cantArchivadas})`}
            </button>
          )}
        </div>
        {!verArchivadas && (
          <button onClick={() => setMostrarForm(true)} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "linear-gradient(90deg,#10b981,#059669)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            + Nueva Empresa
          </button>
        )}
      </div>

      {cargando ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>⚙ Cargando...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {empresasFiltradas.map(empresa => {
            const usrs = usuariosPorEmpresa(empresa.id)
            const plan = planConfig[empresa.plan] || planConfig.basico
            const expandida = empresasExpandidas[empresa.id]
            const dias = diasParaVencer(empresa.fecha_vencimiento)
            const editando = empresaEditando === empresa.id

            return (
              <div key={empresa.id} style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 8px #00000010", border: editando ? "2px solid #6366f1" : empresa.archivada ? "1px solid #94a3b840" : !empresa.activa ? "1px solid #ef444440" : "1px solid #e2e8f0", opacity: empresa.archivada ? 0.7 : 1 }}>
                <div style={{ padding: 24 }}>

                  {editando ? (
                    // ── MODO EDICIÓN INLINE ──────────────────────────
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>✏️ Editando empresa</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>NOMBRE</div>
                          <input value={formEdicion.nombre} onChange={e => setFormEdicion({...formEdicion, nombre: e.target.value})} style={{...inputInlineStyle, width: "100%"}} />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>PLAN</div>
                          <select value={formEdicion.plan} onChange={e => setFormEdicion({...formEdicion, plan: e.target.value})} style={{...inputInlineStyle, width: "100%"}}>
                            <option value="basico">Básico — $60/mes</option>
                            <option value="profesional">Profesional — $120/mes</option>
                            <option value="enterprise">Enterprise — $250/mes</option>
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>VENCIMIENTO</div>
                          <input type="date" value={formEdicion.fecha_vencimiento} onChange={e => setFormEdicion({...formEdicion, fecha_vencimiento: e.target.value})} style={{...inputInlineStyle, width: "100%"}} />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>CÓDIGO INVITACIÓN</div>
                          <input value={formEdicion.codigo_invitacion} onChange={e => setFormEdicion({...formEdicion, codigo_invitacion: e.target.value.toUpperCase()})} style={{...inputInlineStyle, width: "100%", textTransform: "uppercase", letterSpacing: 2}} />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>MÁX. USUARIOS</div>
                          <input type="number" value={formEdicion.max_usuarios} onChange={e => setFormEdicion({...formEdicion, max_usuarios: e.target.value})} style={{...inputInlineStyle, width: "100%"}} />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>TELÉFONO</div>
                          <input value={formEdicion.telefono} onChange={e => setFormEdicion({...formEdicion, telefono: e.target.value})} style={{...inputInlineStyle, width: "100%"}} />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>CONTACTO</div>
                          <input value={formEdicion.contacto_nombre} onChange={e => setFormEdicion({...formEdicion, contacto_nombre: e.target.value})} style={{...inputInlineStyle, width: "100%"}} />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>EMAIL CONTACTO</div>
                          <input value={formEdicion.contacto_email} onChange={e => setFormEdicion({...formEdicion, contacto_email: e.target.value})} style={{...inputInlineStyle, width: "100%"}} />
                        </div>
                      </div>

                      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12, marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>👑 Admin</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div>
                            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>EMAIL ADMIN</div>
                            <input type="email" value={formEdicion.admin_email} onChange={e => setFormEdicion({...formEdicion, admin_email: e.target.value})} style={{...inputInlineStyle, width: "100%"}} />
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>CONTRASEÑA ADMIN</div>
                            <input type="text" value={formEdicion.admin_password} onChange={e => setFormEdicion({...formEdicion, admin_password: e.target.value})} style={{...inputInlineStyle, width: "100%"}} />
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button onClick={() => setEmpresaEditando(null)} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
                          Cancelar
                        </button>
                        <button onClick={() => handleGuardarEdicion(empresa.id)} disabled={guardandoEdicion} style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: guardandoEdicion ? "#4b5563" : "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "#fff", cursor: guardandoEdicion ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>
                          {guardandoEdicion ? "Guardando..." : "✅ Guardar cambios"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // ── MODO VISTA NORMAL ────────────────────────────
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>{empresa.nombre}</h3>
                          <span style={{ background: plan.bg, color: plan.color, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{plan.etiqueta}</span>
                          {!empresa.activa && <span style={{ background: "#fee2e2", color: "#ef4444", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>❌ Inactiva</span>}
                          {empresa.archivada && <span style={{ background: "#f1f5f9", color: "#64748b", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>📦 Archivada</span>}
                          {dias !== null && dias <= 30 && dias >= 0 && <span style={{ background: "#fef3c7", color: "#d97706", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>⚠️ Vence en {dias}d</span>}
                          {dias !== null && dias < 0 && <span style={{ background: "#fee2e2", color: "#ef4444", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>🔴 Vencida</span>}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8, marginBottom: 8 }}>
                          {empresa.admin_email && (
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                              👑 Admin: <strong style={{ color: "#0f172a" }}>{empresa.admin_email}</strong>
                            </div>
                          )}
                          {empresa.admin_password && (
                            <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
                              🔑 Pass:{" "}
                              <strong style={{ color: "#0f172a", letterSpacing: passwordsVisibles[`admin_${empresa.id}`] ? 0 : 2 }}>
                                {passwordsVisibles[`admin_${empresa.id}`] ? empresa.admin_password : "••••••••"}
                              </strong>
                              <button onClick={() => togglePassword(`admin_${empresa.id}`)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#6366f1", padding: 0 }}>
                                {passwordsVisibles[`admin_${empresa.id}`] ? "🙈" : "👁"}
                              </button>
                            </div>
                          )}
                          {empresa.codigo_invitacion && (
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                              🎫 Código: <strong style={{ color: "#6366f1", letterSpacing: 1 }}>{empresa.codigo_invitacion}</strong>
                            </div>
                          )}
                          {empresa.fecha_vencimiento && (
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                              📅 Vence: <strong style={{ color: "#0f172a" }}>{new Date(empresa.fecha_vencimiento).toLocaleDateString("es-AR")}</strong>
                            </div>
                          )}
                        </div>

                        <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#94a3b8" }}>
                          <span>👥 {usrs.length}/{empresa.max_usuarios} usuarios</span>
                          {empresa.contacto_nombre && <span>📞 {empresa.contacto_nombre}</span>}
                          <span>📅 Creada {new Date(empresa.created_at).toLocaleDateString("es-AR")}</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 16, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <button onClick={() => handleEditarClick(empresa)} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #6366f140", background: "#f5f3ff", color: "#6366f1", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>
                          ✏️ Editar
                        </button>
                        {empresa.admin_email && empresa.admin_password && !empresa.archivada && (
                          <button onClick={() => handleAcceder(empresa.admin_email, empresa.admin_password)} disabled={accesoEnProceso === empresa.admin_email}
                            style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>
                            {accesoEnProceso === empresa.admin_email ? "..." : "Acceder →"}
                          </button>
                        )}
                        {!empresa.archivada && (
                          <button onClick={() => toggleEmpresa(empresa)} style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: empresa.activa ? "#fee2e2" : "#d1fae5", color: empresa.activa ? "#ef4444" : "#065f46", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
                            {empresa.activa ? "Desactivar" : "Activar"}
                          </button>
                        )}
                        <button onClick={() => handleArchivar(empresa)} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
                          {empresa.archivada ? "📤 Desarchivar" : "📦 Archivar"}
                        </button>
                        <button onClick={() => handleEliminar(empresa)} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #ef444440", background: "#fee2e2", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
                          🗑 Eliminar
                        </button>
                        <button onClick={() => toggleExpandir(empresa.id)} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 600, color: "#374151" }}>
                          {expandida ? "▲ Ocultar" : "▼ Usuarios"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Panel expandible usuarios */}
                {expandida && !editando && (
                  <div style={{ borderTop: "1px solid #f1f5f9", background: "#f8fafc", padding: "16px 24px" }}>
                    <h4 style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      👥 Usuarios ({usrs.length})
                    </h4>
                    {usrs.length === 0 ? (
                      <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>No hay usuarios todavía</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {usrs.map(u => {
                          const rolCfg = rolConfig[u.rol] || { icono: "👤", etiqueta: u.rol }
                          const passKey = `user_${u.id}`
                          const esAdmin = u.email === empresa.admin_email
                          const passGuardada = esAdmin ? empresa.admin_password : null
                          return (
                            <div key={u.id} style={{ background: "#fff", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 4px #00000008" }}>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                                  <span style={{ fontSize: 14 }}>{rolCfg.icono}</span>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{u.nombre} {u.apellido}</span>
                                  <span style={{ background: "#ede9fe", color: "#6d28d9", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>{rolCfg.etiqueta}</span>
                                  {!u.activo && <span style={{ background: "#fee2e2", color: "#ef4444", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>Inactivo</span>}
                                </div>
                                <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 8 }}>
                                  <span>✉️ {u.email}</span>
                                  {passGuardada && (
                                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                      🔑{" "}
                                      <span style={{ letterSpacing: passwordsVisibles[passKey] ? 0 : 2 }}>
                                        {passwordsVisibles[passKey] ? passGuardada : "••••••••"}
                                      </span>
                                      <button onClick={() => togglePassword(passKey)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#6366f1", padding: 0 }}>
                                        {passwordsVisibles[passKey] ? "🙈" : "👁"}
                                      </button>
                                    </span>
                                  )}
                                </div>
                              </div>
                              {passGuardada && (
                                <button onClick={() => handleAcceder(u.email, passGuardada)} disabled={accesoEnProceso === u.email}
                                  style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "inherit", flexShrink: 0 }}>
                                  {accesoEnProceso === u.email ? "..." : "Acceder →"}
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {empresasFiltradas.length === 0 && (
            <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
              {verArchivadas ? "No hay empresas archivadas" : "No hay empresas todavía. Creá la primera."}
            </div>
          )}
        </div>
      )}

      {/* Modal nueva empresa */}
      {mostrarForm && (
        <div style={{ position: "fixed", inset: 0, background: "#00000060", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => e.target === e.currentTarget && setMostrarForm(false)}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 64px #00000040" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>🏢 Nueva Empresa</h2>
              <button onClick={() => setMostrarForm(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 16, color: "#64748b" }}>×</button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>🏢 Datos de la empresa</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Nombre *</label>
                  <input type="text" value={form.nombre} onChange={e => handleNombreChange(e.target.value)} placeholder="Ej: Industrias XYZ SA" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Teléfono</label>
                  <input type="text" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} placeholder="+54 11 1234-5678" style={inputStyle} />
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
                  <input type="text" value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} placeholder="Av. Industrial 1234, Buenos Aires" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Nombre del contacto</label>
                  <input type="text" value={form.contacto_nombre} onChange={e => setForm({...form, contacto_nombre: e.target.value})} placeholder="Juan García" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Fecha de vencimiento</label>
                  <input type="date" value={form.fecha_vencimiento} onChange={e => setForm({...form, fecha_vencimiento: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Máx. usuarios</label>
                  <input type="number" value={form.max_usuarios} onChange={e => setForm({...form, max_usuarios: parseInt(e.target.value) || 10})} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Código de invitación</label>
                  <input type="text" value={form.codigo_invitacion} onChange={e => setForm({...form, codigo_invitacion: e.target.value.toUpperCase()})} style={{...inputStyle, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700}} />
                  <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, display: "block" }}>Se genera automáticamente al escribir el nombre</span>
                </div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>👑 Usuario administrador</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={labelStyle}>Email del admin *</label>
                  <input type="email" value={form.admin_email} onChange={e => setForm({...form, admin_email: e.target.value})} placeholder="admin@empresa.com" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Contraseña del admin *</label>
                  <input type="text" value={form.admin_password} onChange={e => setForm({...form, admin_password: e.target.value})} placeholder="Mín. 6 caracteres" style={inputStyle} />
                </div>
              </div>
              {error && <div style={{ background: "#fee2e2", color: "#ef4444", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 14 }}>❌ {error}</div>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setMostrarForm(false)} style={{ padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
                <button onClick={handleCrearEmpresa} disabled={guardando} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: guardando ? "#4b5563" : "linear-gradient(90deg,#10b981,#059669)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: guardando ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                  {guardando ? "Creando..." : "Crear empresa + admin"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}