import { useState } from 'react'
import { useOrdenes } from '../hooks/useOrdenes'
import { useAuth } from '../context/AuthContext'

// Datos para los selectores
const SECTORES = ["Planta A", "Planta B", "Almacén", "Oficinas", "Línea 1", "Línea 2"]
const MAQUINAS = {
  "Planta A":  ["Torno CNC-01", "Fresadora F-200", "Prensa H-50"],
  "Planta B":  ["Compresor C-10", "Soldadora MIG-3", "Cortadora Láser"],
  "Almacén":   ["Montacargas M-1", "Cinta Transportadora CT-2"],
  "Oficinas":  ["Aire Acondicionado AA-1", "UPS Central"],
  "Línea 1":   ["Robot Ensamble R1", "Banda Conveyor B1", "Selladora S1"],
  "Línea 2":   ["Robot Pintura R2", "Horno H-300", "Enfriador E-1"],
}
const PARTES = ["Motor principal", "Sistema hidráulico", "Panel eléctrico", "Rodamientos", "Correas", "Filtros", "Bomba", "Válvulas", "Sensores", "Estructura"]

// Configuración visual de estados
const estadoConfig = {
  pendiente:          { etiqueta: "Pendiente",         color: "#f59e0b", bg: "#fef3c7", icono: "⏳" },
  agendado:           { etiqueta: "Agendado",          color: "#3b82f6", bg: "#dbeafe", icono: "📅" },
  en_proceso:         { etiqueta: "En Proceso",        color: "#8b5cf6", bg: "#ede9fe", icono: "🔧" },
  espera_mat:         { etiqueta: "Esp. Materiales",   color: "#f97316", bg: "#ffedd5", icono: "📦" },
  espera_definicion:  { etiqueta: "Esp. Definición",   color: "#0891b2", bg: "#ecfeff", icono: "🤔" },
  espera_respuesta:   { etiqueta: "Esp. Respuesta",    color: "#7c3aed", bg: "#f5f3ff", icono: "💬" },
  resuelto:           { etiqueta: "Resuelto",          color: "#10b981", bg: "#d1fae5", icono: "✅" },
}

function BadgeEstado({ estado }) {
  const cfg = estadoConfig[estado] || { etiqueta: estado, color: "#6b7280", bg: "#f3f4f6", icono: "•" }
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}40`,
      borderRadius: 20, padding: "3px 10px",
      fontSize: 11, fontWeight: 700, whiteSpace: "nowrap"
    }}>
      {cfg.icono} {cfg.etiqueta}
    </span>
  )
}

// Estilos reutilizables
const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1.5px solid #e2e8f0", fontSize: 13, color: "#0f172a",
  outline: "none", fontFamily: "inherit", background: "#f8fafc",
  boxSizing: "border-box"
}

const labelStyle = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "#64748b", textTransform: "uppercase",
  letterSpacing: 0.5, marginBottom: 6
}

export default function Ordenes() {
  const { ordenes, cargando, crearOrden } = useOrdenes()
  const { usuario } = useAuth()
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState("todos")

  // Formulario nueva orden
  const [sector, setSector] = useState("")
  const [maquina, setMaquina] = useState("")
  const [parte, setParte] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")

  const puedeCrear = usuario?.role === 'produccion' || usuario?.role === 'admin'

  const maquinasDisponibles = sector ? (MAQUINAS[sector] || []) : []

  // Generar número de orden automático
  const generarNumero = () => {
    const año = new Date().getFullYear()
    const numero = String(ordenes.length + 1).padStart(3, "0")
    return `OT-${año}-${numero}`
  }

  const handleCrearOrden = async () => {
    if (!sector || !maquina || !parte || !descripcion) {
      setError("Completá todos los campos")
      return
    }
    setGuardando(true)
    setError("")
    try {
      await crearOrden({
        numero: generarNumero(),
        fecha: new Date().toISOString().split("T")[0],
        sector_id: null,
        maquina_id: null,
        parte,
        descripcion,
        estado: "pendiente",
        solicitante_id: null,
      })
      // Limpiar formulario
      setSector("")
      setMaquina("")
      setParte("")
      setDescripcion("")
      setMostrarFormulario(false)
    } catch (err) {
      setError("Error al crear la orden. Intentá de nuevo.")
    } finally {
      setGuardando(false)
    }
  }

  // Filtrar órdenes
  const ordenesFiltradas = filtroEstado === "todos"
    ? ordenes
    : ordenes.filter(o => o.estado === filtroEstado)

  return (
    <div>
      {/* Barra de herramientas */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {puedeCrear && (
          <button onClick={() => setMostrarFormulario(true)} style={{
            padding: "10px 18px", borderRadius: 10, border: "none",
            background: "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "#fff",
            fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit"
          }}>
            + Nueva Orden de Trabajo
          </button>
        )}

        {/* Filtros por estado */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["todos", "pendiente", "agendado", "en_proceso", "espera_mat", "resuelto"].map(e => (
            <button key={e} onClick={() => setFiltroEstado(e)} style={{
              padding: "8px 14px", borderRadius: 8, border: "none",
              cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: filtroEstado === e ? "#0f172a" : "#fff",
              color: filtroEstado === e ? "#fff" : "#64748b",
              boxShadow: "0 1px 4px #00000010", fontFamily: "inherit"
            }}>
              {e === "todos" ? "Todos" : estadoConfig[e]?.etiqueta}
              <span style={{
                marginLeft: 4, borderRadius: 10, padding: "1px 6px", fontSize: 11,
                background: filtroEstado === e ? "#ffffff30" : "#f1f5f9"
              }}>
                {e === "todos" ? ordenes.length : ordenes.filter(o => o.estado === e).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de órdenes */}
      {cargando ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>⚙ Cargando órdenes...</div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 8px #00000010" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                {["N° OT", "Fecha", "Parte", "Descripción", "Estado"].map(h => (
                  <th key={h} style={{
                    padding: "12px 16px", textAlign: "left",
                    fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase"
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordenesFiltradas.map((o, i) => (
                <tr key={o.id} style={{
                  borderBottom: "1px solid #f1f5f9",
                  background: i % 2 === 0 ? "#fff" : "#fafafa"
                }}>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#6366f1" }}>{o.numero}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{o.fecha}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12 }}>{o.parte}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b", maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.descripcion}</td>
                  <td style={{ padding: "12px 16px" }}><BadgeEstado estado={o.estado} /></td>
                </tr>
              ))}
              {ordenesFiltradas.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                    {filtroEstado === "todos" ? "No hay órdenes todavía" : "No hay órdenes con este estado"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal nueva orden */}
      {mostrarFormulario && (
        <div style={{
          position: "fixed", inset: 0, background: "#00000060", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }} onClick={e => e.target === e.currentTarget && setMostrarFormulario(false)}>
          <div style={{
            background: "#fff", borderRadius: 20, width: "100%", maxWidth: 520,
            maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 64px #00000040"
          }}>
            {/* Header modal */}
            <div style={{
              padding: "20px 24px", borderBottom: "1px solid #e2e8f0",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              position: "sticky", top: 0, background: "#fff"
            }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                Nueva Orden de Trabajo — {generarNumero()}
              </h2>
              <button onClick={() => setMostrarFormulario(false)} style={{
                background: "#f1f5f9", border: "none", borderRadius: 8,
                width: 28, height: 28, cursor: "pointer", fontSize: 16, color: "#64748b"
              }}>×</button>
            </div>

            {/* Cuerpo modal */}
            <div style={{ padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Sector</label>
                  <select value={sector} onChange={e => { setSector(e.target.value); setMaquina("") }} style={inputStyle}>
                    <option value="">Seleccionar...</option>
                    {SECTORES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Máquina</label>
                  <select value={maquina} onChange={e => setMaquina(e.target.value)} style={inputStyle} disabled={!sector}>
                    <option value="">Seleccionar...</option>
                    {maquinasDisponibles.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Parte / Componente</label>
                  <select value={parte} onChange={e => setParte(e.target.value)} style={inputStyle}>
                    <option value="">Seleccionar...</option>
                    {PARTES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Fecha</label>
                  <input type="text" value={new Date().toLocaleDateString("es-AR")} disabled style={{ ...inputStyle, opacity: 0.5 }} />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Descripción del problema</label>
                <textarea
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  rows={4}
                  placeholder="Describa el problema o falla detectada..."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {error && (
                <div style={{ background: "#fee2e2", color: "#ef4444", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 14 }}>
                  ❌ {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setMostrarFormulario(false)} style={{
                  padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0",
                  background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13,
                  cursor: "pointer", fontFamily: "inherit"
                }}>Cancelar</button>
                <button onClick={handleCrearOrden} disabled={guardando} style={{
                  padding: "10px 18px", borderRadius: 10, border: "none",
                  background: guardando ? "#4b5563" : "linear-gradient(90deg,#6366f1,#8b5cf6)",
                  color: "#fff", fontWeight: 700, fontSize: 13,
                  cursor: guardando ? "not-allowed" : "pointer", fontFamily: "inherit"
                }}>
                  {guardando ? "Guardando..." : "Crear Orden de Trabajo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}