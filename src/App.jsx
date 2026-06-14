import { useState } from 'react'
import { supabase } from './lib/supabase'
import { loginUser } from './auth'
import Registro from './pages/Registro'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Ordenes from './pages/Ordenes'
import Preventivos from './pages/Preventivos'
import Historial from './pages/Historial'
import Proveedores from './pages/Proveedores'
import Usuarios from './pages/Usuarios'
import Infraestructura from './pages/Infraestructura'
import Inventario from './pages/Inventario'
import SuperAdmin from './pages/SuperAdmin'
import Configuracion from './pages/Configuracion'
import Asistente from './pages/Asistente'

// ── PANTALLA DE LOGIN ──────────────────────────────────────────
function PantallaLogin({ onRegistro }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) { setError("Completá todos los campos"); return }
    setCargando(true)
    setError("")
    try {
      await loginUser(email, password)
    } catch (err) {
      setError("Email o contraseña incorrectos")
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      fontFamily: "'DM Sans', sans-serif"
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: "0 auto 16px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
            boxShadow: "0 8px 32px #6366f140"
          }}>⚙</div>
          <h1 style={{ color: "#fff", fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: -1 }}>MANTIS</h1>
          <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>Sistema de Gestión de Mantenimiento</p>
        </div>

        {/* Formulario */}
        <div style={{ background: "#1e293b", borderRadius: 20, padding: 32, border: "1px solid #ffffff10" }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>EMAIL</label>
            <input value={email} onChange={e => setEmail(e.target.value)}
              placeholder="usuario@empresa.com" type="email"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #334155", background: "#0f172a", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>CONTRASEÑA</label>
            <input value={password} onChange={e => setPassword(e.target.value)}
              type="password" placeholder="••••••••"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #334155", background: "#0f172a", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          {error && (
            <div style={{ background: "#ef444420", color: "#ef4444", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 12 }}>
              ❌ {error}
            </div>
          )}
          <button onClick={handleLogin} disabled={cargando} style={{
            width: "100%", padding: "13px", borderRadius: 10, border: "none",
            background: cargando ? "#4b5563" : "linear-gradient(90deg, #6366f1, #8b5cf6)",
            color: "#fff", fontWeight: 800, fontSize: 15, cursor: cargando ? "not-allowed" : "pointer",
            fontFamily: "inherit"
          }}>
            {cargando ? "Ingresando..." : "Ingresar →"}
            <button onClick={onRegistro} style={{
            width: "100%", marginTop: 10, padding: "11px",
            borderRadius: 10, border: "1px solid #ffffff15",
            background: "transparent", color: "#94a3b8",
            fontSize: 13, cursor: "pointer", fontFamily: "inherit"
          }}>
            ¿No tenés cuenta? Solicitá acceso →
          </button>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── APP PRINCIPAL ──────────────────────────────────────────────
function AppContenido() {
  const { usuario, cargando } = useAuth()
  const [vistaActual, setVistaActual] = useState("dashboard")
  const [mostrarRegistro, setMostrarRegistro] = useState(false)

  if (cargando) return (
    <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#6366f1", fontSize: 18, fontWeight: 700 }}>⚙ Cargando MANTIS...</div>
    </div>
  )

  if (mostrarRegistro) return <Registro onVolver={() => setMostrarRegistro(false)} />
  if (!usuario) return <PantallaLogin onRegistro={() => setMostrarRegistro(true)} />

  // ── SUPERADMIN: solo ve su panel ──────────────────────────
  if (usuario?.role === 'superadmin' || usuario?.es_superadmin) {
    return (
      <div style={{ minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#f0f2f7" }}>
        <div style={{ background: "linear-gradient(90deg, #0f172a, #1e293b)", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 12px #00000030" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚙</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>MANTIS</div>
              <div style={{ color: "#94a3b8", fontSize: 10, letterSpacing: 2, textTransform: "uppercase" }}>Super Admin</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ background: "#dc262618", color: "#dc2626", border: "1px solid #dc262640", borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700 }}>
              🔐 Super Admin
            </span>
            <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
              style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #ffffff15", background: "#ffffff08", color: "#94a3b8", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
              Cerrar sesión
            </button>
          </div>
        </div>
        <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
          <SuperAdmin />
        </div>
      </div>
    )
  }

  // ── RESTO DE ROLES: layout normal ─────────────────────────
  const renderPagina = () => {
    switch (vistaActual) {
      case "dashboard":       return <Dashboard />
      case "ordenes":         return <Ordenes />
      case "preventivos":     return <Preventivos />
      case "historial":       return <Historial />
      case "infraestructura": return <Infraestructura />
      case "inventario":      return <Inventario />
      case "configuracion":   return <Configuracion />
      case "asistente":       return <Asistente />
      case "proveedores":     return <Proveedores />
      case "usuarios":        return <Usuarios />
      default:                return <Dashboard />
    }
  }

  return (
    <Layout vistaActual={vistaActual} setVistaActual={setVistaActual}>
      {renderPagina()}
    </Layout>
  )
}

// ── PUNTO DE ENTRADA ───────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppContenido />
    </AuthProvider>
  )
}