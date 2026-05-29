import { useDashboard } from '../hooks/useDashboard'

// Colores y etiquetas por estado
const estadoConfig = {
  pendiente:    { etiqueta: "Pendiente",       color: "#f59e0b", bg: "#fef3c7", icono: "⏳" },
  agendado:     { etiqueta: "Agendado",        color: "#3b82f6", bg: "#dbeafe", icono: "📅" },
  en_proceso:   { etiqueta: "En Proceso",      color: "#8b5cf6", bg: "#ede9fe", icono: "🔧" },
  espera_mat:   { etiqueta: "Esp. Materiales", color: "#f97316", bg: "#ffedd5", icono: "📦" },
  resuelto:     { etiqueta: "Resuelto",        color: "#10b981", bg: "#d1fae5", icono: "✅" },
  vencido:      { etiqueta: "Vencido",         color: "#ef4444", bg: "#fee2e2", icono: "🔴" },
}

function BadgeEstado({ estado }) {
  const cfg = estadoConfig[estado] || { etiqueta: estado, color: "#6b7280", bg: "#f3f4f6", icono: "•" }
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}40`,
      borderRadius: 20, padding: "3px 10px",
      fontSize: 11, fontWeight: 700
    }}>
      {cfg.icono} {cfg.etiqueta}
    </span>
  )
}

export default function Dashboard() {
  const { metricas, ordenesRecientes, preventivosProximos, cargando } = useDashboard()

  if (cargando) return (
    <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
      ⚙ Cargando datos...
    </div>
  )

  const tarjetas = [
    { etiqueta: "Total Órdenes",  valor: metricas.totalOrdenes,        icono: "📋", color: "#6366f1" },
    { etiqueta: "Pendientes",     valor: metricas.pendientes,          icono: "⏳", color: "#f59e0b" },
    { etiqueta: "Agendadas",      valor: metricas.agendadas,           icono: "📅", color: "#3b82f6" },
    { etiqueta: "En Proceso",     valor: metricas.enProceso,           icono: "🔧", color: "#8b5cf6" },
    { etiqueta: "Resueltas",      valor: metricas.resueltas,           icono: "✅", color: "#10b981" },
    { etiqueta: "Prev. Vencidos", valor: metricas.preventivosVencidos, icono: "🔴", color: "#ef4444" },
  ]
  return (
    <div>
      {/* Bienvenida */}
      <div style={{
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        borderRadius: 16, padding: "20px 24px", marginBottom: 24, color: "#fff"
      }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>Bienvenido a MANTIS 👋</div>
        <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
          Resumen del sistema al día de hoy
        </div>
      </div>

      {/* Tarjetas de métricas */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: 12, marginBottom: 24
      }}>
        {tarjetas.map(t => (
          <div key={t.etiqueta} style={{
            background: "#fff", borderRadius: 14, padding: 18,
            boxShadow: "0 1px 8px #00000010",
            border: `1px solid ${t.color}20`
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{t.icono}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: t.color }}>{t.valor}</div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{t.etiqueta}</div>
          </div>
        ))}
      </div>

      {/* Órdenes recientes y Preventivos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Órdenes recientes */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 1px 8px #00000010" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
            📋 Órdenes Recientes
          </h3>
          {ordenesRecientes.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 13 }}>No hay órdenes todavía</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ordenesRecientes.map(o => (
                <div key={o.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: 10, background: "#f8fafc", borderRadius: 10
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{o.numero}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{o.fecha}</div>
                  </div>
                  <BadgeEstado estado={o.estado} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preventivos próximos */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 1px 8px #00000010" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
            🛡 Preventivos Próximos
          </h3>
          {preventivosProximos.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 13 }}>No hay preventivos programados</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {preventivosProximos.map(p => (
                <div key={p.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: 10, background: "#f8fafc", borderRadius: 10
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{p.titulo}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>📅 {p.proxima_fecha}</div>
                  </div>
                  <BadgeEstado estado={p.estado} />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}