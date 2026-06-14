import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Registro({ onVolver }) {
  const [form, setForm] = useState({
    nombre: "", apellido: "", email: "", password: "",
    codigo_empresa: "", rol_solicitado: "produccion"
  })
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState("")

  const handleRegistro = async () => {
    if (!form.nombre || !form.apellido || !form.email || !form.password || !form.codigo_empresa) {
      setError("Completá todos los campos"); return
    }
    setEnviando(true); setError("")
    try {
      const { data: empresa, error: errEmpresa } = await supabase
        .from('empresas')
        .select('id, nombre')
        .eq('codigo_invitacion', form.codigo_empresa.trim().toUpperCase())
        .eq('activa', true)
        .single()

      if (errEmpresa || !empresa) {
        setError("Código de empresa inválido. Verificá el código con tu administrador.")
        setEnviando(false); return
      }

      const { error } = await supabase.from('solicitudes_acceso').insert([{
        empresa_id: empresa.id,
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        password: form.password,        // ← esto es lo que faltaba
        rol_solicitado: form.rol_solicitado,
        estado: 'pendiente'
      }])
      if (error) throw error
      setEnviado(true)
    } catch { setError("Error al enviar la solicitud. Intentá de nuevo.") }
    finally { setEnviando(false) }
  }

  const inputStyle = {
    width: "100%", padding: "12px 14px", borderRadius: 10,
    border: "1px solid #334155", background: "#0f172a",
    color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box"
  }
  const labelStyle = {
    color: "#94a3b8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6
  }

  if (enviado) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a, #1e293b)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 60, marginBottom: 20 }}>✅</div>
        <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 800, marginBottom: 12 }}>¡Solicitud enviada!</h2>
        <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          El administrador de tu empresa va a revisar tu solicitud y te va a dar acceso en breve.
        </p>
        <button onClick={onVolver} style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          ← Volver al login
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a, #1e293b)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, margin: "0 auto 16px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>⚙</div>
          <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 800, margin: 0 }}>Solicitar acceso</h1>
          <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>Completá tus datos y el admin te dará acceso</p>
        </div>

        <div style={{ background: "#1e293b", borderRadius: 20, padding: 32, border: "1px solid #ffffff10" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div><label style={labelStyle}>NOMBRE *</label><input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Juan" style={inputStyle} /></div>
            <div><label style={labelStyle}>APELLIDO *</label><input value={form.apellido} onChange={e => setForm({...form, apellido: e.target.value})} placeholder="Pérez" style={inputStyle} /></div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>EMAIL *</label>
            <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} type="email" placeholder="juan@empresa.com" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>CONTRASEÑA *</label>
            <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} type="password" placeholder="••••••••" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>CÓDIGO DE EMPRESA *</label>
            <input
              value={form.codigo_empresa}
              onChange={e => setForm({...form, codigo_empresa: e.target.value})}
              placeholder="Ej: FRIGORIFICO01"
              style={{...inputStyle, textTransform: "uppercase", letterSpacing: 2}}
            />
            <span style={{ color: "#475569", fontSize: 11, marginTop: 4, display: "block" }}>
              Tu administrador te proporcionó este código
            </span>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>ROL QUE SOLICITÁS</label>
            <select value={form.rol_solicitado} onChange={e => setForm({...form, rol_solicitado: e.target.value})} style={inputStyle}>
              <option value="produccion">🏭 Producción</option>
              <option value="mantenimiento">🔧 Mantenimiento</option>
              <option value="visualizacion">👁 Visualización</option>
            </select>
          </div>
          {error && <div style={{ background: "#ef444420", color: "#ef4444", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 14 }}>❌ {error}</div>}
          <button onClick={handleRegistro} disabled={enviando} style={{ width: "100%", padding: "13px", borderRadius: 10, border: "none", background: enviando ? "#4b5563" : "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: enviando ? "not-allowed" : "pointer", fontFamily: "inherit", marginBottom: 12 }}>
            {enviando ? "Verificando..." : "Solicitar acceso →"}
          </button>
          <button onClick={onVolver} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid #ffffff15", background: "transparent", color: "#94a3b8", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            ← Ya tengo cuenta, iniciar sesión
          </button>
        </div>
      </div>
    </div>
  )
}