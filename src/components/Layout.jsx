import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const rolConfig = {
  superadmin:     { etiqueta: "Super Admin",    color: "#dc2626", icono: "🔐" },
  admin:          { etiqueta: "Administrador",  color: "#7c3aed", icono: "👑" },
  produccion:     { etiqueta: "Producción",     color: "#0369a1", icono: "🏭" },
  mantenimiento:  { etiqueta: "Mantenimiento",  color: "#065f46", icono: "🔧" },
  visualizacion:  { etiqueta: "Visualización",  color: "#92400e", icono: "👁"  },
}

const menuItems = [
  { id: "dashboard",       etiqueta: "Dashboard",                   icono: "📊", roles: ["admin","produccion","mantenimiento","visualizacion"] },
  { id: "ordenes",         etiqueta: "Órdenes de Trabajo",          icono: "📋", roles: ["admin","produccion","mantenimiento","visualizacion"] },
  { id: "preventivos",     etiqueta: "Preventivos",                 icono: "🛡", roles: ["admin","mantenimiento","visualizacion"] },
  { id: "infraestructura", etiqueta: "Infraestructura y Seguridad", icono: "🏛", roles: ["admin","mantenimiento","visualizacion"] },
  { id: "inventario",      etiqueta: "Inventario",                  icono: "📦", roles: ["admin","mantenimiento","visualizacion"] },
  { id: "historial",       etiqueta: "Historial",                   icono: "📁", roles: ["admin","mantenimiento","visualizacion"] },
  { id: "proveedores",     etiqueta: "Proveedores",                 icono: "🏢", roles: ["admin","mantenimiento","visualizacion"] },
  { id: "usuarios",        etiqueta: "Usuarios",                    icono: "👥", roles: ["admin"] },
  { id: "superadmin",      etiqueta: "Super Admin",                 icono: "🔐", roles: ["superadmin"] },
]

export default function Layout({ vistaActual, setVistaActual, children }) {
  const { usuario, cerrarSesion } = useAuth()
  const [sidebarAbierto, setSidebarAbierto] = useState(true)
  const [esMobile, setEsMobile] = useState(false)
  const [menuMobileAbierto, setMenuMobileAbierto] = useState(false)

  useEffect(() => {
    const verificar = () => {
      const mobile = window.innerWidth < 768
      setEsMobile(mobile)
      if (mobile) setSidebarAbierto(false)
      else setSidebarAbierto(true)
    }
    verificar()
    window.addEventListener('resize', verificar)
    return () => window.removeEventListener('resize', verificar)
  }, [])

  const itemsVisibles = menuItems.filter(item => {
    const rol = usuario?.role || usuario?.rol
    if (rol === 'superadmin') return true
    return item.roles.includes(rol)
  })

  const rolInfo = rolConfig[usuario?.role || usuario?.rol] || rolConfig.admin

  const handleNavegar = (id) => {
    setVistaActual(id)
    if (esMobile) setMenuMobileAbierto(false)
  }

  if (esMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#f0f2f7", overflow: "hidden" }}>
        <div style={{ background: "linear-gradient(90deg, #0f172a, #1e293b)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, boxShadow: "0 2px 12px #00000030" }}>
          <button onClick={() => setMenuMobileAbierto(!menuMobileAbierto)} style={{ background: "#ffffff15", border: "none", borderRadius: 8, width: 38, height: 38, cursor: "pointer", fontSize: 18, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>☰</button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>⚙</div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>MANTIS</div>
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>{menuItems.find(i => i.id === vistaActual)?.icono}</div>
        </div>

        {menuMobileAbierto && (
          <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex" }}>
            <div style={{ position: "absolute", inset: 0, background: "#00000060" }} onClick={() => setMenuMobileAbierto(false)} />
            <div style={{ position: "relative", width: 260, height: "100%", background: "linear-gradient(160deg, #0f172a 0%, #1e293b 100%)", display: "flex", flexDirection: "column", boxShadow: "4px 0 24px #00000040", zIndex: 1 }}>
              <div style={{ padding: "20px 16px", borderBottom: "1px solid #ffffff15", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚙</div>
                <div>
                  <div style={{ color: "#fff", fontWeight: 800, fontSize: 17 }}>MANTIS</div>
                  <div style={{ color: "#94a3b8", fontSize: 10, letterSpacing: 2, textTransform: "uppercase" }}>Mantenimiento</div>
                </div>
                <button onClick={() => setMenuMobileAbierto(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 20 }}>×</button>
              </div>
              <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", minHeight: 0 }}>
                {itemsVisibles.map(item => (
                  <button key={item.id} onClick={() => handleNavegar(item.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, border: "none", cursor: "pointer", textAlign: "left", background: vistaActual === item.id ? "linear-gradient(90deg,#6366f1,#8b5cf6)" : "transparent", color: vistaActual === item.id ? "#fff" : "#94a3b8", fontWeight: vistaActual === item.id ? 700 : 500, fontSize: 14, fontFamily: "inherit" }}>
                    <span style={{ fontSize: 18 }}>{item.icono}</span>
                    <span>{item.etiqueta}</span>
                  </button>
                ))}
              </nav>
              <div style={{ padding: "12px 16px", borderTop: "1px solid #ffffff15" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${rolInfo.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{rolInfo.icono}</div>
                  <div>
                    <div style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{usuario?.nombre || usuario?.name}</div>
                    <div style={{ color: "#64748b", fontSize: 10 }}>{rolInfo.etiqueta}</div>
                  </div>
                </div>
                <button onClick={cerrarSesion} style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid #ffffff15", background: "#ffffff08", color: "#94a3b8", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Cerrar sesión</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflow: "auto", padding: 16 }}>{children}</div>

        <div style={{ background: "#fff", borderTop: "1px solid #e2e8f0", display: "flex", flexShrink: 0, boxShadow: "0 -2px 12px #00000010" }}>
          {itemsVisibles.slice(0, 5).map(item => (
            <button key={item.id} onClick={() => handleNavegar(item.id)} style={{ flex: 1, padding: "10px 4px", border: "none", cursor: "pointer", background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, fontFamily: "inherit", borderTop: vistaActual === item.id ? "2px solid #6366f1" : "2px solid transparent" }}>
              <span style={{ fontSize: 20 }}>{item.icono}</span>
              <span style={{ fontSize: 9, color: vistaActual === item.id ? "#6366f1" : "#94a3b8", fontWeight: vistaActual === item.id ? 700 : 400 }}>{item.etiqueta.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#f0f2f7", overflow: "hidden" }}>

      <div style={{ width: sidebarAbierto ? 240 : 60, transition: "width 0.3s ease", background: "linear-gradient(160deg, #0f172a 0%, #1e293b 100%)", display: "flex", flexDirection: "column", flexShrink: 0, boxShadow: "4px 0 24px #00000030" }}>

        <div style={{ padding: "20px 16px", borderBottom: "1px solid #ffffff15", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 4px 12px #6366f140" }}>⚙</div>
          {sidebarAbierto && (
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 17, letterSpacing: -0.5 }}>MANTIS</div>
              <div style={{ color: "#94a3b8", fontSize: 10, letterSpacing: 2, textTransform: "uppercase" }}>Mantenimiento</div>
            </div>
          )}
          <button onClick={() => setSidebarAbierto(!sidebarAbierto)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16, padding: 2 }}>
            {sidebarAbierto ? "◀" : "▶"}
          </button>
        </div>

        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", minHeight: 0, position: "relative", zIndex: 1 }}>
          {itemsVisibles.map(item => (
            <button key={item.id} onClick={() => setVistaActual(item.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", background: vistaActual === item.id ? "linear-gradient(90deg,#6366f1,#8b5cf6)" : "transparent", color: vistaActual === item.id ? "#fff" : "#94a3b8", fontWeight: vistaActual === item.id ? 700 : 500, fontSize: 13, transition: "all 0.15s", fontFamily: "inherit" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icono}</span>
              {sidebarAbierto && <span>{item.etiqueta}</span>}
            </button>
          ))}
        </nav>

        <div style={{ padding: "12px", borderTop: "1px solid #ffffff15", flexShrink: 0, position: "relative", zIndex: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${rolInfo.color}, #1e293b)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{rolInfo.icono}</div>
            {sidebarAbierto && (
              <div style={{ overflow: "hidden" }}>
                <div style={{ color: "#fff", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{usuario?.nombre || usuario?.name}</div>
                <div style={{ color: "#64748b", fontSize: 10 }}>{rolInfo.etiqueta}</div>
              </div>
            )}
          </div>
          {sidebarAbierto && (
            <button onClick={cerrarSesion} style={{ width: "100%", marginTop: 8, padding: "6px", borderRadius: 8, border: "1px solid #ffffff15", background: "#ffffff08", color: "#94a3b8", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
              Cerrar sesión
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "12px 24px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 8px #00000008" }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
              {menuItems.find(i => i.id === vistaActual)?.icono} {menuItems.find(i => i.id === vistaActual)?.etiqueta}
            </h1>
            <div style={{ color: "#94a3b8", fontSize: 11 }}>
              {new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
          <span style={{ background: rolInfo.color + "18", color: rolInfo.color, border: `1px solid ${rolInfo.color}40`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
            {rolInfo.icono} {rolInfo.etiqueta}
          </span>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {children}
        </div>
      </div>
    </div>
  )
}