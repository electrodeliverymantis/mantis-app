import { useState, useEffect } from "react";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const USERS = [
  { id: 1, name: "Admin Principal", role: "admin", email: "admin@mantis.com", password: "admin123" },
  { id: 2, name: "Carlos Producción", role: "produccion", email: "carlos@mantis.com", password: "prod123" },
  { id: 3, name: "Luis Mantenimiento", role: "mantenimiento", email: "luis@mantis.com", password: "mant123" },
  { id: 4, name: "Gerente Vista", role: "visualizacion", email: "gerente@mantis.com", password: "vis123" },
];

const SECTORES = ["Planta A", "Planta B", "Almacén", "Oficinas", "Línea 1", "Línea 2"];
const MAQUINAS = {
  "Planta A": ["Torno CNC-01", "Fresadora F-200", "Prensa H-50"],
  "Planta B": ["Compresor C-10", "Soldadora MIG-3", "Cortadora Láser"],
  "Almacén": ["Montacargas M-1", "Cinta Transportadora CT-2"],
  "Oficinas": ["Aire Acondicionado AA-1", "UPS Central"],
  "Línea 1": ["Robot Ensamble R1", "Banda Conveyor B1", "Selladora S1"],
  "Línea 2": ["Robot Pintura R2", "Horno H-300", "Enfriador E-1"],
};

const PARTES = ["Motor principal", "Sistema hidráulico", "Panel eléctrico", "Rodamientos", "Correas", "Filtros", "Bomba", "Válvulas", "Sensores", "Estructura"];

const PROVEEDORES_INIT = [
  { id: 1, nombre: "TechParts SA", rubro: "Repuestos eléctricos", contacto: "011-4444-1111", email: "ventas@techparts.com", notas: "Proveedor preferencial" },
  { id: 2, nombre: "Hidráulica del Sur", rubro: "Sistemas hidráulicos", contacto: "011-5555-2222", email: "info@hidrosur.com", notas: "" },
  { id: 3, nombre: "LubriMax", rubro: "Lubricantes y aceites", contacto: "011-6666-3333", email: "pedidos@lubrimax.com", notas: "Descuento 10% por volumen" },
];

const PREVENTIVOS_INIT = [
  { id: 1, titulo: "Cambio de aceite - Torno CNC-01", sector: "Planta A", maquina: "Torno CNC-01", frecuencia: "Mensual", proximaFecha: "2026-06-01", descripcion: "Cambio de aceite lubricante ISO 46", estado: "pendiente", historial: [] },
  { id: 2, titulo: "Revisión filtros - Compresor C-10", sector: "Planta B", maquina: "Compresor C-10", frecuencia: "Trimestral", proximaFecha: "2026-05-20", descripcion: "Limpieza y reemplazo de filtros de aire", estado: "vencido", historial: [] },
  { id: 3, titulo: "Lubricación rodamientos - Banda B1", sector: "Línea 1", maquina: "Banda Conveyor B1", frecuencia: "Semanal", proximaFecha: "2026-05-15", descripcion: "Lubricación general de todos los rodamientos", estado: "pendiente", historial: [] },
];

const ORDENES_INIT = [
  {
    id: 1, numero: "OT-2026-001", fecha: "2026-05-01", sector: "Planta A", maquina: "Torno CNC-01", parte: "Motor principal",
    descripcion: "Ruido anormal en el motor durante operación. Vibración excesiva detectada.", imagen: null,
    estado: "resuelto", solicitante: "Carlos Producción", asignado: "Luis Mantenimiento",
    historial: [
      { estado: "pendiente", fecha: "2026-05-01 09:00", descripcion: "Orden creada", tiempo: 0, repuestos: "", costo: 0 },
      { estado: "agendado", fecha: "2026-05-02 08:00", descripcion: "Agendado para revisión. Se solicitó técnico especialista.", tiempo: 30, repuestos: "", costo: 0, fechaAgendada: "2026-05-03" },
      { estado: "en_proceso", fecha: "2026-05-03 09:00", descripcion: "En revisión. Rodamiento dañado detectado.", tiempo: 120, repuestos: "Rodamiento 6205", costo: 4500 },
      { estado: "resuelto", fecha: "2026-05-03 14:00", descripcion: "Rodamiento reemplazado. Máquina funcionando correctamente.", tiempo: 300, repuestos: "Rodamiento 6205 x2, Grasa SKF 500g", costo: 12500 },
    ]
  },
  {
    id: 2, numero: "OT-2026-002", fecha: "2026-05-08", sector: "Línea 1", maquina: "Robot Ensamble R1", parte: "Panel eléctrico",
    descripcion: "Error en pantalla HMI. El robot no responde a comandos.", imagen: null,
    estado: "en_proceso", solicitante: "Carlos Producción", asignado: "Luis Mantenimiento",
    historial: [
      { estado: "pendiente", fecha: "2026-05-08 11:00", descripcion: "Orden creada. Parada de línea.", tiempo: 0, repuestos: "", costo: 0 },
      { estado: "agendado", fecha: "2026-05-08 12:00", descripcion: "Técnico asignado. Se pide manual de HMI.", tiempo: 20, repuestos: "", costo: 0, fechaAgendada: "2026-05-09" },
      { estado: "en_proceso", fecha: "2026-05-09 08:00", descripcion: "Se detectó fallo en tarjeta de comunicación. Pieza en pedido.", tiempo: 90, repuestos: "Tarjeta IO Link (en pedido)", costo: 0 },
    ]
  },
  {
    id: 3, numero: "OT-2026-003", fecha: "2026-05-12", sector: "Planta B", maquina: "Compresor C-10", parte: "Filtros",
    descripcion: "Baja presión de salida. Posible obstrucción en filtros.", imagen: null,
    estado: "pendiente", solicitante: "Carlos Producción", asignado: null,
    historial: [
      { estado: "pendiente", fecha: "2026-05-12 15:30", descripcion: "Orden creada.", tiempo: 0, repuestos: "", costo: 0 },
    ]
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const estadoConfig = {
  pendiente:     { label: "Pendiente",         color: "#f59e0b", bg: "#fef3c7", icon: "⏳" },
  agendado:      { label: "Agendado",          color: "#3b82f6", bg: "#dbeafe", icon: "📅" },
  en_proceso:    { label: "En Proceso",        color: "#8b5cf6", bg: "#ede9fe", icon: "🔧" },
  espera_mat:    { label: "Esp. Materiales",   color: "#f97316", bg: "#ffedd5", icon: "📦" },
  resuelto:      { label: "Resuelto",          color: "#10b981", bg: "#d1fae5", icon: "✅" },
  vencido:       { label: "Vencido",           color: "#ef4444", bg: "#fee2e2", icon: "🔴" },
};

const rolConfig = {
  admin:         { label: "Administrador",    color: "#7c3aed", icon: "👑" },
  produccion:    { label: "Producción",       color: "#0369a1", icon: "🏭" },
  mantenimiento: { label: "Mantenimiento",    color: "#065f46", icon: "🔧" },
  visualizacion: { label: "Visualización",   color: "#92400e", icon: "👁" },
};

function Badge({ estado, small }) {
  const cfg = estadoConfig[estado] || { label: estado, color: "#6b7280", bg: "#f3f4f6", icon: "•" };
  return (
    <span style={{
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40`,
      borderRadius: 20, padding: small ? "2px 8px" : "4px 12px",
      fontSize: small ? 11 : 12, fontWeight: 700, letterSpacing: 0.3, whiteSpace: "nowrap"
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function RolBadge({ rol }) {
  const cfg = rolConfig[rol] || { label: rol, color: "#6b7280", icon: "•" };
  return (
    <span style={{
      background: cfg.color + "18", color: cfg.color, border: `1px solid ${cfg.color}40`,
      borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function MantisApp() {
  const [user, setUser] = useState(null);
  const [ordenes, setOrdenes] = useState(ORDENES_INIT);
  const [preventivos, setPreventivos] = useState(PREVENTIVOS_INIT);
  const [proveedores, setProveedores] = useState(PROVEEDORES_INIT);
  const [usuarios, setUsuarios] = useState(USERS);
  const [view, setView] = useState("dashboard");
  const [selectedOrden, setSelectedOrden] = useState(null);
  const [notification, setNotification] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const canEdit = user && user.role !== "visualizacion";
  const isAdmin = user && user.role === "admin";
  const isMant = user && (user.role === "mantenimiento" || user.role === "admin");
  const isProd = user && (user.role === "produccion" || user.role === "admin");

  if (!user) return <LoginScreen onLogin={setUser} />;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊", roles: ["admin","produccion","mantenimiento","visualizacion"] },
    { id: "ordenes", label: "Órdenes de Trabajo", icon: "📋", roles: ["admin","produccion","mantenimiento","visualizacion"] },
    { id: "preventivos", label: "Preventivos", icon: "🛡", roles: ["admin","mantenimiento","visualizacion"] },
    { id: "historial", label: "Historial", icon: "📁", roles: ["admin","mantenimiento","visualizacion"] },
    { id: "proveedores", label: "Proveedores", icon: "🏢", roles: ["admin","mantenimiento","visualizacion"] },
    { id: "usuarios", label: "Usuarios", icon: "👥", roles: ["admin"] },
  ].filter(n => n.roles.includes(user.role));

  const pendientesCount = ordenes.filter(o => o.estado === "pendiente").length;
  const vencidosCount = preventivos.filter(p => p.estado === "vencido").length;

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: "#f0f2f7", overflow: "hidden" }}>
      {/* SIDEBAR */}
      <div style={{
        width: sidebarOpen ? 240 : 60, transition: "width 0.3s cubic-bezier(.4,0,.2,1)",
        background: "linear-gradient(160deg, #0f172a 0%, #1e293b 100%)",
        display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden",
        boxShadow: "4px 0 24px #00000030"
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 16px", borderBottom: "1px solid #ffffff15", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
            boxShadow: "0 4px 12px #6366f140"
          }}>⚙</div>
          {sidebarOpen && <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 17, letterSpacing: -0.5 }}>MANTIS</div>
            <div style={{ color: "#94a3b8", fontSize: 10, letterSpacing: 2, textTransform: "uppercase" }}>Mantenimiento</div>
          </div>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            marginLeft: "auto", background: "none", border: "none", color: "#64748b",
            cursor: "pointer", fontSize: 16, padding: 2
          }}>{sidebarOpen ? "◀" : "▶"}</button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => setView(n.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              borderRadius: 10, border: "none", cursor: "pointer", textAlign: "left",
              background: view === n.id ? "linear-gradient(90deg,#6366f1,#8b5cf6)" : "transparent",
              color: view === n.id ? "#fff" : "#94a3b8",
              fontWeight: view === n.id ? 700 : 500, fontSize: 13, transition: "all 0.15s",
              whiteSpace: "nowrap", overflow: "hidden"
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{n.icon}</span>
              {sidebarOpen && <span style={{ flex: 1 }}>{n.label}</span>}
              {sidebarOpen && n.id === "ordenes" && pendientesCount > 0 && (
                <span style={{ background: "#ef4444", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 800 }}>{pendientesCount}</span>
              )}
              {sidebarOpen && n.id === "preventivos" && vencidosCount > 0 && (
                <span style={{ background: "#f59e0b", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 800 }}>{vencidosCount}</span>
              )}
            </button>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: "12px 12px", borderTop: "1px solid #ffffff15" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg, ${rolConfig[user.role]?.color || "#6366f1"}, #1e293b)`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
            }}>{rolConfig[user.role]?.icon}</div>
            {sidebarOpen && <div style={{ overflow: "hidden" }}>
              <div style={{ color: "#fff", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
              <div style={{ color: "#64748b", fontSize: 10 }}>{rolConfig[user.role]?.label}</div>
            </div>}
          </div>
          {sidebarOpen && <button onClick={() => { setUser(null); setView("dashboard"); }} style={{
            width: "100%", marginTop: 8, padding: "6px", borderRadius: 8, border: "1px solid #ffffff15",
            background: "#ffffff08", color: "#94a3b8", cursor: "pointer", fontSize: 12
          }}>Cerrar sesión</button>}
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <div style={{
          background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "12px 24px",
          display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 8px #00000008"
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
              {navItems.find(n => n.id === view)?.icon} {navItems.find(n => n.id === view)?.label || "Dashboard"}
            </h1>
            <div style={{ color: "#94a3b8", fontSize: 11 }}>
              {new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
          <RolBadge rol={user.role} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {view === "dashboard" && <Dashboard ordenes={ordenes} preventivos={preventivos} user={user} setView={setView} />}
          {view === "ordenes" && <OrdenesView ordenes={ordenes} setOrdenes={setOrdenes} user={user} notify={notify} canEdit={canEdit} isMant={isMant} isProd={isProd} onSelect={setSelectedOrden} />}
          {view === "preventivos" && <PreventivosView preventivos={preventivos} setPreventivos={setPreventivos} user={user} notify={notify} canEdit={canEdit} isMant={isMant} />}
          {view === "historial" && <HistorialView ordenes={ordenes} preventivos={preventivos} />}
          {view === "proveedores" && <ProveedoresView proveedores={proveedores} setProveedores={setProveedores} notify={notify} isMant={isMant} isAdmin={isAdmin} />}
          {view === "usuarios" && isAdmin && <UsuariosView usuarios={usuarios} setUsuarios={setUsuarios} notify={notify} />}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: notification.type === "success" ? "#10b981" : "#ef4444",
          color: "#fff", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 600,
          boxShadow: "0 8px 32px #00000030", animation: "slideIn 0.3s ease",
          maxWidth: 320
        }}>
          {notification.type === "success" ? "✅" : "❌"} {notification.msg}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        @keyframes slideIn { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:translateX(0) } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .card { animation: fadeIn 0.3s ease; }
        .hover-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px #00000015 !important; transition: all 0.2s; }
      `}</style>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const u = USERS.find(u => u.email === email && u.password === password);
    if (u) { onLogin(u); setError(""); }
    else setError("Credenciales incorrectas");
  };

  const demos = [
    { label: "Admin", email: "admin@mantis.com", pass: "admin123", color: "#7c3aed" },
    { label: "Producción", email: "carlos@mantis.com", pass: "prod123", color: "#0369a1" },
    { label: "Mantenimiento", email: "luis@mantis.com", pass: "mant123", color: "#065f46" },
    { label: "Visualización", email: "gerente@mantis.com", pass: "vis123", color: "#92400e" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
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

        {/* Card */}
        <div style={{ background: "#1e293b", borderRadius: 20, padding: 32, border: "1px solid #ffffff10" }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>EMAIL</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@empresa.com"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #334155", background: "#0f172a", color: "#fff", fontSize: 14, outline: "none" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>CONTRASEÑA</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #334155", background: "#0f172a", color: "#fff", fontSize: 14, outline: "none" }} />
          </div>
          {error && <div style={{ background: "#ef444420", color: "#ef4444", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 12 }}>❌ {error}</div>}
          <button onClick={handleLogin} style={{
            width: "100%", padding: "13px", borderRadius: 10, border: "none",
            background: "linear-gradient(90deg, #6366f1, #8b5cf6)", color: "#fff",
            fontWeight: 800, fontSize: 15, cursor: "pointer", letterSpacing: 0.3
          }}>Ingresar →</button>

          {/* Demo users */}
          <div style={{ marginTop: 24, borderTop: "1px solid #ffffff10", paddingTop: 20 }}>
            <p style={{ color: "#64748b", fontSize: 11, textAlign: "center", marginBottom: 12 }}>ACCESOS DE DEMOSTRACIÓN</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {demos.map(d => (
                <button key={d.label} onClick={() => { setEmail(d.email); setPassword(d.pass); }} style={{
                  padding: "8px", borderRadius: 8, border: `1px solid ${d.color}40`,
                  background: `${d.color}15`, color: d.color, fontSize: 12, fontWeight: 600, cursor: "pointer"
                }}>{d.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ ordenes, preventivos, user, setView }) {
  const stats = {
    total: ordenes.length,
    pendiente: ordenes.filter(o => o.estado === "pendiente").length,
    en_proceso: ordenes.filter(o => o.estado === "en_proceso").length,
    resuelto: ordenes.filter(o => o.estado === "resuelto").length,
    preventivosVencidos: preventivos.filter(p => p.estado === "vencido").length,
  };

  const recentOrdenes = [...ordenes].sort((a, b) => b.id - a.id).slice(0, 5);

  const statCards = [
    { label: "Total Órdenes", value: stats.total, icon: "📋", color: "#6366f1", bg: "#eef2ff" },
    { label: "Pendientes", value: stats.pendiente, icon: "⏳", color: "#f59e0b", bg: "#fef3c7" },
    { label: "En Proceso", value: stats.en_proceso, icon: "🔧", color: "#8b5cf6", bg: "#ede9fe" },
    { label: "Resueltos", value: stats.resuelto, icon: "✅", color: "#10b981", bg: "#d1fae5" },
    { label: "Prev. Vencidos", value: stats.preventivosVencidos, icon: "🔴", color: "#ef4444", bg: "#fee2e2" },
  ];

  return (
    <div>
      {/* Welcome */}
      <div style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 16, padding: "20px 24px", marginBottom: 24, color: "#fff" }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>Bienvenido, {user.name.split(" ")[0]} 👋</div>
        <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>Resumen del sistema al día de hoy</div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
        {statCards.map(s => (
          <div key={s.label} className="card hover-card" style={{
            background: "#fff", borderRadius: 14, padding: "16px", cursor: "pointer",
            boxShadow: "0 1px 8px #00000010", border: `1px solid ${s.color}20`
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Recent orders */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 1px 8px #00000010" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>📋 Órdenes Recientes</h3>
            <button onClick={() => setView("ordenes")} style={{ background: "none", border: "none", color: "#6366f1", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Ver todas →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentOrdenes.map(o => (
              <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px", background: "#f8fafc", borderRadius: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{o.numero}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{o.sector} · {o.maquina}</div>
                </div>
                <Badge estado={o.estado} small />
              </div>
            ))}
          </div>
        </div>

        {/* Preventivos */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 1px 8px #00000010" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>🛡 Próximos Preventivos</h3>
            <button onClick={() => setView("preventivos")} style={{ background: "none", border: "none", color: "#6366f1", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Ver todos →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {preventivos.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px", background: "#f8fafc", borderRadius: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{p.titulo}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>📅 {p.proximaFecha} · {p.frecuencia}</div>
                </div>
                <Badge estado={p.estado} small />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ÓRDENES VIEW ─────────────────────────────────────────────────────────────
function OrdenesView({ ordenes, setOrdenes, user, notify, canEdit, isMant, isProd }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState(null);
  const [filterEstado, setFilterEstado] = useState("todos");

  const nextId = Math.max(...ordenes.map(o => o.id)) + 1;
  const nextNum = `OT-${new Date().getFullYear()}-${String(nextId).padStart(3, "0")}`;

  const filtered = filterEstado === "todos" ? ordenes : ordenes.filter(o => o.estado === filterEstado);

  return (
    <div>
      {selectedOrden ? (
        <OrdenDetail orden={selectedOrden} onBack={() => setSelectedOrden(null)}
          ordenes={ordenes} setOrdenes={setOrdenes} user={user} notify={notify} isMant={isMant} canEdit={canEdit} />
      ) : (
        <>
          {/* Toolbar */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            {isProd && canEdit && (
              <button onClick={() => setShowForm(true)} style={{
                padding: "10px 18px", borderRadius: 10, border: "none",
                background: "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "#fff",
                fontWeight: 700, fontSize: 13, cursor: "pointer"
              }}>+ Nueva Orden de Trabajo</button>
            )}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["todos", "pendiente", "agendado", "en_proceso", "espera_mat", "resuelto"].map(e => (
                <button key={e} onClick={() => setFilterEstado(e)} style={{
                  padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                  background: filterEstado === e ? "#0f172a" : "#fff",
                  color: filterEstado === e ? "#fff" : "#64748b",
                  boxShadow: "0 1px 4px #00000010"
                }}>
                  {e === "todos" ? "Todos" : estadoConfig[e]?.label}
                  {e !== "todos" && <span style={{ marginLeft: 4, background: filterEstado === e ? "#ffffff30" : "#f1f5f9", borderRadius: 10, padding: "1px 6px" }}>
                    {ordenes.filter(o => o.estado === e).length}
                  </span>}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 8px #00000010" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  {["N° OT", "Fecha", "Sector", "Máquina", "Parte", "Descripción", "Estado", ""].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, i) => (
                  <tr key={o.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#6366f1" }}>{o.numero}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{o.fecha}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12 }}>{o.sector}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600 }}>{o.maquina}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{o.parte}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.descripcion}</td>
                    <td style={{ padding: "12px 16px" }}><Badge estado={o.estado} small /></td>
                    <td style={{ padding: "12px 16px" }}>
                      <button onClick={() => setSelectedOrden(o)} style={{
                        padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
                        background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#374151"
                      }}>Ver →</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>No hay órdenes con este filtro</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showForm && (
        <NuevaOrdenModal nextNum={nextNum} onClose={() => setShowForm(false)}
          onSave={(orden) => {
            setOrdenes(prev => [...prev, { ...orden, id: nextId, numero: nextNum }]);
            setShowForm(false);
            notify(`Orden ${nextNum} creada exitosamente`);
          }} user={user} />
      )}
    </div>
  );
}

// ─── NUEVA ORDEN MODAL ────────────────────────────────────────────────────────
function NuevaOrdenModal({ nextNum, onClose, onSave, user }) {
  const [sector, setSector] = useState("");
  const [maquina, setMaquina] = useState("");
  const [parte, setParte] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagen, setImagen] = useState(null);

  const maquinas = sector ? (MAQUINAS[sector] || []) : [];

  const handleSave = () => {
    if (!sector || !maquina || !parte || !descripcion) { alert("Completar todos los campos"); return; }
    onSave({
      fecha: new Date().toISOString().split("T")[0],
      sector, maquina, parte, descripcion, imagen,
      estado: "pendiente",
      solicitante: user.name,
      asignado: null,
      historial: [{ estado: "pendiente", fecha: new Date().toLocaleString("es-AR"), descripcion: "Orden creada por " + user.name, tiempo: 0, repuestos: "", costo: 0 }]
    });
  };

  return (
    <Modal title={`Nueva Orden de Trabajo — ${nextNum}`} onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FormField label="Sector">
          <select value={sector} onChange={e => { setSector(e.target.value); setMaquina(""); }}>
            <option value="">Seleccionar...</option>
            {SECTORES.map(s => <option key={s}>{s}</option>)}
          </select>
        </FormField>
        <FormField label="Máquina">
          <select value={maquina} onChange={e => setMaquina(e.target.value)} disabled={!sector}>
            <option value="">Seleccionar...</option>
            {maquinas.map(m => <option key={m}>{m}</option>)}
          </select>
        </FormField>
        <FormField label="Parte / Componente">
          <select value={parte} onChange={e => setParte(e.target.value)}>
            <option value="">Seleccionar...</option>
            {PARTES.map(p => <option key={p}>{p}</option>)}
          </select>
        </FormField>
        <FormField label="Fecha"  >
          <input type="text" value={new Date().toLocaleDateString("es-AR")} disabled />
        </FormField>
      </div>
      <FormField label="Descripción del problema">
        <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
          rows={4} placeholder="Describa el problema o falla detectada..." />
      </FormField>
      <FormField label="Imagen adjunta (opcional)">
        <input type="file" accept="image/*" onChange={e => {
          const f = e.target.files[0];
          if (f) { const r = new FileReader(); r.onload = ev => setImagen(ev.target.result); r.readAsDataURL(f); }
        }} style={{ padding: "8px 0", border: "none", background: "none" }} />
        {imagen && <img src={imagen} alt="preview" style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 8, marginTop: 8 }} />}
      </FormField>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <button onClick={onClose} style={btnSecStyle}>Cancelar</button>
        <button onClick={handleSave} style={btnPrimStyle}>Crear Orden de Trabajo</button>
      </div>
    </Modal>
  );
}

// ─── ORDEN DETAIL ─────────────────────────────────────────────────────────────
function OrdenDetail({ orden: ordenOriginal, onBack, ordenes, setOrdenes, user, notify, isMant, canEdit }) {
  const orden = ordenes.find(o => o.id === ordenOriginal.id);
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [estadoDesc, setEstadoDesc] = useState("");
  const [estadoTiempo, setEstadoTiempo] = useState("");
  const [estadoRepuestos, setEstadoRepuestos] = useState("");
  const [estadoCosto, setEstadoCosto] = useState("");
  const [fechaAgendada, setFechaAgendada] = useState("");

  const updateEstado = () => {
    if (!nuevoEstado || !estadoDesc) return;
    const newHist = {
      estado: nuevoEstado, fecha: new Date().toLocaleString("es-AR"),
      descripcion: estadoDesc, tiempo: parseInt(estadoTiempo) || 0,
      repuestos: estadoRepuestos, costo: parseFloat(estadoCosto) || 0,
      ...(nuevoEstado === "agendado" && { fechaAgendada })
    };
    setOrdenes(prev => prev.map(o => o.id === orden.id ? {
      ...o, estado: nuevoEstado, historial: [...o.historial, newHist]
    } : o));
    setShowEstadoModal(false);
    notify(`Estado actualizado a: ${estadoConfig[nuevoEstado]?.label}`);
  };

  const estados_mant = ["agendado", "en_proceso", "espera_mat", "resuelto"];
  const lastHist = orden.historial[orden.historial.length - 1];

  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#6366f1", fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 16 }}>← Volver a Órdenes</button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>
        {/* Main card */}
        <div>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 8px #00000010", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{orden.numero}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Creada el {orden.fecha} por {orden.solicitante}</div>
              </div>
              <Badge estado={orden.estado} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
              {[
                { label: "Sector", value: orden.sector, icon: "📍" },
                { label: "Máquina", value: orden.maquina, icon: "⚙" },
                { label: "Parte", value: orden.parte, icon: "🔩" },
              ].map(f => (
                <div key={f.label} style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{f.icon} {f.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 4 }}>{f.value}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px", marginBottom: orden.imagen ? 16 : 0 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>📝 Descripción</div>
              <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{orden.descripcion}</p>
            </div>

            {orden.imagen && <img src={orden.imagen} alt="adjunto" style={{ width: "100%", borderRadius: 10, maxHeight: 200, objectFit: "cover", marginTop: 12 }} />}
          </div>

          {/* Historial */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 8px #00000010" }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 800, color: "#0f172a" }}>📅 Historial de Estados</h3>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 19, top: 0, bottom: 0, width: 2, background: "#e2e8f0" }} />
              {orden.historial.map((h, i) => {
                const cfg = estadoConfig[h.estado];
                return (
                  <div key={i} style={{ display: "flex", gap: 16, marginBottom: 20, position: "relative" }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                      background: cfg?.bg || "#f1f5f9", border: `2px solid ${cfg?.color || "#94a3b8"}`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, zIndex: 1
                    }}>{cfg?.icon || "•"}</div>
                    <div style={{ flex: 1, background: "#f8fafc", borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <Badge estado={h.estado} small />
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{h.fecha}</span>
                      </div>
                      <p style={{ margin: "6px 0 4px", fontSize: 13, color: "#374151" }}>{h.descripcion}</p>
                      {h.fechaAgendada && <div style={{ fontSize: 11, color: "#3b82f6" }}>📅 Agendado para: {h.fechaAgendada}</div>}
                      {(h.tiempo > 0 || h.repuestos || h.costo > 0) && (
                        <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                          {h.tiempo > 0 && <span style={{ fontSize: 11, background: "#dbeafe", color: "#1d4ed8", borderRadius: 6, padding: "2px 8px" }}>⏱ {h.tiempo} min</span>}
                          {h.repuestos && <span style={{ fontSize: 11, background: "#ede9fe", color: "#6d28d9", borderRadius: 6, padding: "2px 8px" }}>🔩 {h.repuestos}</span>}
                          {h.costo > 0 && <span style={{ fontSize: 11, background: "#d1fae5", color: "#065f46", borderRadius: 6, padding: "2px 8px" }}>💰 ${h.costo.toLocaleString()}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Resumen costos */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 8px #00000010" }}>
            <h4 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>📊 Resumen</h4>
            {[
              { label: "Tiempo total", value: orden.historial.reduce((a, h) => a + (h.tiempo || 0), 0) + " min" },
              { label: "Costo total", value: "$" + orden.historial.reduce((a, h) => a + (h.costo || 0), 0).toLocaleString() },
              { label: "Repuestos", value: orden.historial.filter(h => h.repuestos).map(h => h.repuestos).join(", ") || "—" },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>{r.label}</span>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>{r.value}</span>
              </div>
            ))}
          </div>

          {/* Notificaciones */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 8px #00000010" }}>
            <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>📢 Notificar</h4>
            <button style={{ ...btnSecStyle, width: "100%", marginBottom: 8, justifyContent: "center" }}>
              ✉️ Enviar por Email
            </button>
            <button style={{ ...btnSecStyle, width: "100%", justifyContent: "center", background: "#dcfce7", borderColor: "#16a34a", color: "#16a34a" }}>
              💬 Enviar por WhatsApp
            </button>
            <p style={{ fontSize: 10, color: "#94a3b8", margin: "8px 0 0", textAlign: "center" }}>Integración vía API externa</p>
          </div>

          {/* Cambiar estado (solo mantenimiento) */}
          {isMant && canEdit && orden.estado !== "resuelto" && (
            <div style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 16, padding: 20 }}>
              <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#fff" }}>🔄 Actualizar Estado</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {estados_mant.filter(e => e !== orden.estado).map(e => (
                  <button key={e} onClick={() => { setNuevoEstado(e); setShowEstadoModal(true); }} style={{
                    padding: "10px", borderRadius: 8, border: "1px solid #ffffff30",
                    background: "#ffffff15", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, textAlign: "left"
                  }}>
                    {estadoConfig[e]?.icon} {estadoConfig[e]?.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Estado modal */}
      {showEstadoModal && (
        <Modal title={`Cambiar estado → ${estadoConfig[nuevoEstado]?.label}`} onClose={() => setShowEstadoModal(false)}>
          {nuevoEstado === "agendado" && (
            <FormField label="Fecha agendada">
              <input type="date" value={fechaAgendada} onChange={e => setFechaAgendada(e.target.value)} />
            </FormField>
          )}
          <FormField label="Descripción / Novedad *">
            <textarea value={estadoDesc} onChange={e => setEstadoDesc(e.target.value)} rows={3} placeholder="Describa el trabajo realizado, novedades, etc." />
          </FormField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="Tiempo (minutos)">
              <input type="number" value={estadoTiempo} onChange={e => setEstadoTiempo(e.target.value)} placeholder="0" />
            </FormField>
            <FormField label="Costo ($)">
              <input type="number" value={estadoCosto} onChange={e => setEstadoCosto(e.target.value)} placeholder="0" />
            </FormField>
          </div>
          <FormField label="Repuestos utilizados">
            <input type="text" value={estadoRepuestos} onChange={e => setEstadoRepuestos(e.target.value)} placeholder="Ej: Rodamiento 6205 x2, Grasa SKF..." />
          </FormField>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <button onClick={() => setShowEstadoModal(false)} style={btnSecStyle}>Cancelar</button>
            <button onClick={updateEstado} style={btnPrimStyle}>Confirmar cambio</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── PREVENTIVOS ──────────────────────────────────────────────────────────────
function PreventivosView({ preventivos, setPreventivos, user, notify, canEdit, isMant }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titulo: "", sector: "", maquina: "", frecuencia: "Mensual", proximaFecha: "", descripcion: "" });

  const frecuencias = ["Diario", "Semanal", "Quincenal", "Mensual", "Trimestral", "Semestral", "Anual"];
  const maquinas = form.sector ? (MAQUINAS[form.sector] || []) : [];

  const savePreventivo = () => {
    const newP = { ...form, id: preventivos.length + 1, estado: "pendiente", historial: [] };
    setPreventivos(prev => [...prev, newP]);
    setShowForm(false);
    notify("Preventivo programado correctamente");
    setForm({ titulo: "", sector: "", maquina: "", frecuencia: "Mensual", proximaFecha: "", descripcion: "" });
  };

  const marcarRealizado = (id) => {
    setPreventivos(prev => prev.map(p => p.id === id ? {
      ...p, estado: "pendiente",
      historial: [...p.historial, { fecha: new Date().toLocaleString("es-AR"), accion: "Realizado por " + user.name }]
    } : p));
    notify("Preventivo marcado como realizado");
  };

  return (
    <div>
      {isMant && canEdit && (
        <button onClick={() => setShowForm(true)} style={{ ...btnPrimStyle, marginBottom: 20 }}>
          + Nuevo Preventivo
        </button>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {preventivos.map(p => (
          <div key={p.id} className="card" style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 8px #00000010", border: p.estado === "vencido" ? "2px solid #ef444440" : "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <Badge estado={p.estado} small />
              <span style={{ fontSize: 11, color: "#94a3b8", background: "#f1f5f9", padding: "3px 8px", borderRadius: 6 }}>{p.frecuencia}</span>
            </div>
            <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{p.titulo}</h4>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>📍 {p.sector} · ⚙ {p.maquina}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>📅 Próxima fecha: <strong>{p.proximaFecha}</strong></div>
            <p style={{ fontSize: 12, color: "#374151", marginBottom: 12, lineHeight: 1.5 }}>{p.descripcion}</p>
            {p.historial.length > 0 && (
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>Última realización: {p.historial[p.historial.length - 1].fecha}</div>
            )}
            {isMant && canEdit && (
              <button onClick={() => marcarRealizado(p.id)} style={{ ...btnSecStyle, width: "100%", justifyContent: "center" }}>
                ✅ Marcar como realizado
              </button>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <Modal title="Nuevo Mantenimiento Preventivo" onClose={() => setShowForm(false)}>
          <FormField label="Título">
            <input type="text" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Cambio de aceite - Torno CNC" />
          </FormField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="Sector">
              <select value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value, maquina: "" })}>
                <option value="">Seleccionar...</option>
                {SECTORES.map(s => <option key={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="Máquina">
              <select value={form.maquina} onChange={e => setForm({ ...form, maquina: e.target.value })} disabled={!form.sector}>
                <option value="">Seleccionar...</option>
                {maquinas.map(m => <option key={m}>{m}</option>)}
              </select>
            </FormField>
            <FormField label="Frecuencia">
              <select value={form.frecuencia} onChange={e => setForm({ ...form, frecuencia: e.target.value })}>
                {frecuencias.map(f => <option key={f}>{f}</option>)}
              </select>
            </FormField>
            <FormField label="Próxima fecha">
              <input type="date" value={form.proximaFecha} onChange={e => setForm({ ...form, proximaFecha: e.target.value })} />
            </FormField>
          </div>
          <FormField label="Descripción de tareas">
            <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={3} placeholder="Describe las tareas a realizar..." />
          </FormField>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <button onClick={() => setShowForm(false)} style={btnSecStyle}>Cancelar</button>
            <button onClick={savePreventivo} style={btnPrimStyle}>Guardar Preventivo</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── HISTORIAL ────────────────────────────────────────────────────────────────
function HistorialView({ ordenes, preventivos }) {
  const resueltas = ordenes.filter(o => o.estado === "resuelto");
  const totalCosto = ordenes.reduce((a, o) => a + o.historial.reduce((b, h) => b + (h.costo || 0), 0), 0);
  const totalTiempo = ordenes.reduce((a, o) => a + o.historial.reduce((b, h) => b + (h.tiempo || 0), 0), 0);

  return (
    <div>
      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Órdenes totales", value: ordenes.length, icon: "📋", color: "#6366f1" },
          { label: "Resueltas", value: resueltas.length, icon: "✅", color: "#10b981" },
          { label: "Costo total", value: "$" + totalCosto.toLocaleString(), icon: "💰", color: "#f59e0b" },
          { label: "Tiempo total", value: Math.round(totalTiempo / 60) + " hs", icon: "⏱", color: "#8b5cf6" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 1px 8px #00000010", textAlign: "center" }}>
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, margin: "4px 0" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* All orders history */}
      <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 8px #00000010" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", fontWeight: 700, fontSize: 14 }}>📁 Historial completo de Órdenes</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              {["N° OT", "Sector", "Máquina", "Estado", "Tiempo total", "Costo total", "Repuestos"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ordenes.map((o, i) => {
              const tiempoTotal = o.historial.reduce((a, h) => a + (h.tiempo || 0), 0);
              const costoTotal = o.historial.reduce((a, h) => a + (h.costo || 0), 0);
              const repuestos = o.historial.filter(h => h.repuestos).map(h => h.repuestos).join(", ");
              return (
                <tr key={o.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "10px 16px", fontSize: 12, fontWeight: 700, color: "#6366f1" }}>{o.numero}</td>
                  <td style={{ padding: "10px 16px", fontSize: 12 }}>{o.sector}</td>
                  <td style={{ padding: "10px 16px", fontSize: 12 }}>{o.maquina}</td>
                  <td style={{ padding: "10px 16px" }}><Badge estado={o.estado} small /></td>
                  <td style={{ padding: "10px 16px", fontSize: 12 }}>{tiempoTotal} min</td>
                  <td style={{ padding: "10px 16px", fontSize: 12, fontWeight: 600, color: "#059669" }}>{costoTotal > 0 ? "$" + costoTotal.toLocaleString() : "—"}</td>
                  <td style={{ padding: "10px 16px", fontSize: 11, color: "#64748b", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{repuestos || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── PROVEEDORES ──────────────────────────────────────────────────────────────
function ProveedoresView({ proveedores, setProveedores, notify, isMant, isAdmin }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: "", rubro: "", contacto: "", email: "", notas: "" });
  const canAdd = isMant || isAdmin;

  const save = () => {
    setProveedores(prev => [...prev, { ...form, id: prev.length + 1 }]);
    setShowForm(false);
    notify("Proveedor agregado");
    setForm({ nombre: "", rubro: "", contacto: "", email: "", notas: "" });
  };

  return (
    <div>
      {canAdd && (
        <button onClick={() => setShowForm(true)} style={{ ...btnPrimStyle, marginBottom: 20 }}>+ Agregar Proveedor</button>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {proveedores.map(p => (
          <div key={p.id} className="card hover-card" style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 8px #00000010", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏢</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>{p.nombre}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{p.rubro}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#374151" }}>
              <div>📞 {p.contacto}</div>
              <div>✉️ {p.email}</div>
              {p.notas && <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px", color: "#64748b", marginTop: 4 }}>💬 {p.notas}</div>}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <Modal title="Nuevo Proveedor" onClose={() => setShowForm(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="Nombre"><input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Empresa SA" /></FormField>
            <FormField label="Rubro"><input type="text" value={form.rubro} onChange={e => setForm({ ...form, rubro: e.target.value })} placeholder="Repuestos eléctricos" /></FormField>
            <FormField label="Teléfono"><input type="text" value={form.contacto} onChange={e => setForm({ ...form, contacto: e.target.value })} placeholder="011-XXXX-XXXX" /></FormField>
            <FormField label="Email"><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="ventas@empresa.com" /></FormField>
          </div>
          <FormField label="Notas"><textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} rows={2} placeholder="Condiciones especiales, descuentos, etc." /></FormField>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <button onClick={() => setShowForm(false)} style={btnSecStyle}>Cancelar</button>
            <button onClick={save} style={btnPrimStyle}>Guardar Proveedor</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── USUARIOS (admin only) ────────────────────────────────────────────────────
function UsuariosView({ usuarios, setUsuarios, notify }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "produccion" });

  const save = () => {
    setUsuarios(prev => [...prev, { ...form, id: prev.length + 1 }]);
    setShowForm(false);
    notify("Usuario creado correctamente");
    setForm({ name: "", email: "", password: "", role: "produccion" });
  };

  const deleteUser = (id) => {
    if (id === 1) { notify("No se puede eliminar el admin principal", "error"); return; }
    setUsuarios(prev => prev.filter(u => u.id !== id));
    notify("Usuario eliminado");
  };

  return (
    <div>
      <button onClick={() => setShowForm(true)} style={{ ...btnPrimStyle, marginBottom: 20 }}>+ Nuevo Usuario</button>

      <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 8px #00000010" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              {["Usuario", "Email", "Rol", "Contraseña", ""].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${rolConfig[u.role]?.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{rolConfig[u.role]?.icon}</div>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b" }}>{u.email}</td>
                <td style={{ padding: "12px 16px" }}><RolBadge rol={u.role} /></td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8", fontFamily: "monospace" }}>{"•".repeat(u.password.length)}</td>
                <td style={{ padding: "12px 16px" }}>
                  <button onClick={() => deleteUser(u.id)} style={{ background: "#fee2e2", border: "none", color: "#ef4444", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12 }}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title="Nuevo Usuario" onClose={() => setShowForm(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormField label="Nombre completo"><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Juan Pérez" /></FormField>
            <FormField label="Rol">
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="produccion">Producción</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="visualizacion">Visualización</option>
                <option value="admin">Administrador</option>
              </select>
            </FormField>
            <FormField label="Email"><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="usuario@empresa.com" /></FormField>
            <FormField label="Contraseña"><input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="contraseña segura" /></FormField>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <button onClick={() => setShowForm(false)} style={btnSecStyle}>Cancelar</button>
            <button onClick={save} style={btnPrimStyle}>Crear Usuario</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000060", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 64px #00000040" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 16, color: "#64748b" }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{label}</label>
      <style>{`
        .form-field-wrap input, .form-field-wrap select, .form-field-wrap textarea {
          width: 100%; padding: 10px 12px; border-radius: 8px; border: 1.5px solid #e2e8f0;
          font-size: 13px; color: #0f172a; outline: none; font-family: inherit; background: #f8fafc;
          transition: border-color 0.15s;
        }
        .form-field-wrap input:focus, .form-field-wrap select:focus, .form-field-wrap textarea:focus { border-color: #6366f1; background: #fff; }
        .form-field-wrap textarea { resize: vertical; }
        .form-field-wrap input:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
      <div className="form-field-wrap">{children}</div>
    </div>
  );
}

const btnPrimStyle = {
  padding: "10px 18px", borderRadius: 10, border: "none",
  background: "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "#fff",
  fontWeight: 700, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6
};
const btnSecStyle = {
  padding: "9px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0",
  background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6
};