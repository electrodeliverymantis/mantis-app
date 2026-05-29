import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

// Configuración de roles
const rolConfig = {
  admin:          { etiqueta: "Administrador",  color: "#7c3aed", icono: "👑" },
  produccion:     { etiqueta: "Producción",     color: "#0369a1", icono: "🏭" },
  mantenimiento:  { etiqueta: "Mantenimiento",  color: "#065f46", icono: "🔧" },
  visualizacion:  { etiqueta: "Visualización",  color: "#92400e", icono: "👁"  },
}

// Elementos del menú según rol
const menuItems = [
  { id: "dashboard",    etiqueta: "Dashboard",           icono: "📊", roles: ["admin","produccion","mantenimiento","visualizacion"] },
  { id: "ordenes",      etiqueta: "Órdenes de Trabajo",  icono: "📋", roles: ["admin","produccion","mantenimiento","visualizacion"] },
  { id: "preventivos",  etiqueta: "Preventivos",         icono: "🛡", roles: ["admin","mantenimiento","visualizacion"] },
  { id: "historial",    etiqueta: "Historial",           icono: "📁", roles: ["admin","mantenimiento","visualizacion"] },
  { id: "proveedores",  etiqueta: "Proveedores",         icono: "🏢", roles: ["admin","mantenimiento","visualizacion"] },
  { id: "usuarios",     etiqueta: "Usuarios",            icono: "👥", roles: ["admin"] },
]

export default function Layout({ vistaActual, setVistaActual, children }) {
  const { usuario, cerrarSesion } = useAuth()
  const [sidebarAbierto, setSidebarAbierto] = useState(true)

  // Filtrar menú según el rol del usuario
  const itemsVisibles = menuItems.filter(item => 
    item.roles.includes(usuario?.role || usuario?.rol)
  )

  const rolInfo = rolConfig[usuario?.role || usuario?.rol] || rolConfig.admin

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#f0f2f7", overflow: "hidden" }}>
      
      {/* ── SIDEBAR ── */}
      <div style={{
        width: sidebarAbierto ? 240 : 60,
        transition: "width 0.3s ease",
        background: "linear-gradient(160deg, #0f172a 0%, #1e293b 100%)",
        display: "flex", flexDirection: "column", flexShrink: 0,
        boxShadow: "4px 0 24px #00000030"
      }}>
        
        {/* Logo */}
        <div style={{ padding: "20px 16px", borderBottom: "1px solid #ffffff15", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            boxShadow: "0 4px 12px #6366f140"
          }}>⚙</div>
          {sidebarAbierto && (
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 17, letterSpacing: -0.5 }}>MANTIS</div>
              <div style={{ color: "#94a3b8", fontSize: 10, letterSpacing: 2, textTransform: "uppercase" }}>Mantenimiento</div>
            </div>
          )}
          <button onClick={() => setSidebarAbierto(!sidebarAbierto)} style={{
            marginLeft: "auto", background: "none", border: "none",
            color: "#64748b", cursor: "pointer", fontSize: 16, padding: 2
          }}>{sidebarAbierto ? "◀" : "▶"}</button>
        </div>

        {/* Navegación */}
        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
          {itemsVisibles.map(item => (
            <button key={item.id} onClick={() => setVistaActual(item.id)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer",
              textAlign: "left", whiteSpace: "nowrap", overflow: "hidden",
              background: vistaActual === item.id ? "linear-gradient(90deg,#6366f1,#8b5cf6)" : "transparent",
              color: vistaActual === item.id ? "#fff" : "#94a3b8",
              fontWeight: vistaActual === item.id ? 700 : 500,
              fontSize: 13, transition: "all 0.15s",
              fontFamily: "inherit"
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icono}</span>
              {sidebarAbierto && <span>{item.etiqueta}</span>}
            </button>
          ))}
        </nav>

        {/* Info del usuario */}
        <div style={{ padding: "12px", borderTop: "1px solid #ffffff15" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg, ${rolInfo.color}, #1e293b)`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15
            }}>{rolInfo.icono}</div>
            {sidebarAbierto && (
              <div style={{ overflow: "hidden" }}>
                <div style={{ color: "#fff", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {usuario?.nombre || usuario?.name}
                </div>
                <div style={{ color: "#64748b", fontSize: 10 }}>{rolInfo.etiqueta}</div>
              </div>
            )}
          </div>
          {sidebarAbierto && (
            <button onClick={cerrarSesion} style={{
              width: "100%", marginTop: 8, padding: "6px",
              borderRadius: 8, border: "1px solid #ffffff15",
              background: "#ffffff08", color: "#94a3b8",
              cursor: "pointer", fontSize: 12, fontFamily: "inherit"
            }}>Cerrar sesión</button>
          )}
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        {/* Topbar */}
        <div style={{
          background: "#fff", borderBottom: "1px solid #e2e8f0",
          padding: "12px 24px", display: "flex", alignItems: "center", gap: 12,
          boxShadow: "0 1px 8px #00000008"
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
              {menuItems.find(i => i.id === vistaActual)?.icono} {menuItems.find(i => i.id === vistaActual)?.etiqueta}
            </h1>
            <div style={{ color: "#94a3b8", fontSize: 11 }}>
              {new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
          <span style={{
            background: rolInfo.color + "18", color: rolInfo.color,
            border: `1px solid ${rolInfo.color}40`,
            borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700
          }}>
            {rolInfo.icono} {rolInfo.etiqueta}
          </span>
        </div>

        {/* Página activa */}
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {children}
        </div>
      </div>
    </div>
  )
}