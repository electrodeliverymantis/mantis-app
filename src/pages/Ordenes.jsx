import { useState, useEffect } from 'react'
import { useOrdenes } from '../hooks/useOrdenes'
import { useAuth } from '../context/AuthContext'
import SubirImagen from '../components/SubirImagen'

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

const estadoConfig = {
  pendiente:         { etiqueta: "Pendiente",        color: "#f59e0b", bg: "#fef3c7", icono: "⏳" },
  agendado:          { etiqueta: "Agendado",         color: "#3b82f6", bg: "#dbeafe", icono: "📅" },
  en_proceso:        { etiqueta: "En Proceso",       color: "#8b5cf6", bg: "#ede9fe", icono: "🔧" },
  espera_mat:        { etiqueta: "Esp. Materiales",  color: "#f97316", bg: "#ffedd5", icono: "📦" },
  espera_definicion: { etiqueta: "Esp. Definición",  color: "#0891b2", bg: "#ecfeff", icono: "🤔" },
  espera_respuesta:  { etiqueta: "Esp. Respuesta",   color: "#7c3aed", bg: "#f5f3ff", icono: "💬" },
  resuelto:          { etiqueta: "Resuelto",         color: "#10b981", bg: "#d1fae5", icono: "✅" },
}

function BadgeEstado({ estado }) {
  const cfg = estadoConfig[estado] || { etiqueta: estado, color: "#6b7280", bg: "#f3f4f6", icono: "•" }
  return (
    <span style={{
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40`,
      borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap"
    }}>
      {cfg.icono} {cfg.etiqueta}
    </span>
  )
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

// ── DETALLE DE ORDEN ──────────────────────────────────────────
function DetalleOrden({ orden, onVolver, actualizarEstado, cargarHistorial, isMant, canEdit }) {
  const [historial, setHistorial] = useState([])
  const [mostrarCambioEstado, setMostrarCambioEstado] = useState(false)
  const [nuevoEstado, setNuevoEstado] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [tiempoMin, setTiempoMin] = useState("")
  const [repuestos, setRepuestos] = useState("")
  const [costo, setCosto] = useState("")
  const [fechaAgendada, setFechaAgendada] = useState("")
  const [imagenEstado, setImagenEstado] = useState("")
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    cargarHistorial(orden.id).then(setHistorial)
  }, [orden.id])

  const handleCambiarEstado = async () => {
    if (!nuevoEstado || !descripcion) return
    setGuardando(true)
    try {
      await actualizarEstado(orden.id, nuevoEstado, {
        descripcion,
        tiempo_min: parseInt(tiempoMin) || 0,
        repuestos,
        costo: parseFloat(costo) || 0,
        fecha_agendada: fechaAgendada || null,
        imagen_url: imagenEstado || null,
        fecha: new Date().toISOString(),
      })
      const nuevoHistorial = await cargarHistorial(orden.id)
      setHistorial(nuevoHistorial)
      orden.estado = nuevoEstado
      setMostrarCambioEstado(false)
      setDescripcion(""); setTiempoMin(""); setRepuestos(""); setCosto("")
      setFechaAgendada(""); setImagenEstado("")
    } catch (err) {
      alert("Error al cambiar estado")
    } finally {
      setGuardando(false)
    }
  }

  const estadosMant = ["agendado", "en_proceso", "espera_mat", "espera_definicion", "espera_respuesta", "resuelto"]
  const tiempoTotal = historial.reduce((a, h) => a + (h.tiempo_min || 0), 0)
  const costoTotal = historial.reduce((a, h) => a + (parseFloat(h.costo) || 0), 0)

  return (
    <div>
      <button onClick={onVolver} style={{
        background: "none", border: "none", color: "#6366f1",
        fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 16, fontFamily: "inherit"
      }}>← Volver a Órdenes</button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
        <div>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 8px #00000010", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{orden.numero}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Creada el {orden.fecha}</div>
              </div>
              <BadgeEstado estado={orden.estado} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Parte", value: orden.parte, icono: "🔩" },
                { label: "Estado", value: estadoConfig[orden.estado]?.etiqueta, icono: "📊" },
              ].map(f => (
                <div key={f.label} style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{f.icono} {f.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{f.value}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px", marginBottom: orden.imagen_url ? 12 : 0 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>📝 Descripción</div>
              <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{orden.descripcion}</p>
            </div>

            {orden.imagen_url && (
              <img src={orden.imagen_url} alt="adjunto" style={{ width: "100%", borderRadius: 10, maxHeight: 250, objectFit: "cover", marginTop: 12, cursor: "pointer" }}
                onClick={() => window.open(orden.imagen_url, '_blank')} />
            )}
          </div>

          {/* Historial */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 8px #00000010" }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 800, color: "#0f172a" }}>📅 Historial de Estados</h3>
            {historial.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: 13 }}>No hay historial todavía</p>
            ) : (
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 19, top: 0, bottom: 0, width: 2, background: "#e2e8f0" }} />
                {historial.map((h, i) => {
                  const cfg = estadoConfig[h.estado] || { bg: "#f1f5f9", color: "#94a3b8", icono: "•" }
                  return (
                    <div key={i} style={{ display: "flex", gap: 16, marginBottom: 16, position: "relative" }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                        background: cfg.bg, border: `2px solid ${cfg.color}`,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, zIndex: 1
                      }}>{cfg.icono}</div>
                      <div style={{ flex: 1, background: "#f8fafc", borderRadius: 10, padding: "12px 14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <BadgeEstado estado={h.estado} />
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(h.fecha).toLocaleString("es-AR")}</span>
                        </div>
                        <p style={{ margin: "6px 0 4px", fontSize: 13, color: "#374151" }}>{h.descripcion}</p>
                        {h.fecha_agendada && <div style={{ fontSize: 11, color: "#3b82f6" }}>📅 Agendado para: {h.fecha_agendada}</div>}
                        <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                          {h.tiempo_min > 0 && <span style={{ fontSize: 11, background: "#dbeafe", color: "#1d4ed8", borderRadius: 6, padding: "2px 8px" }}>⏱ {h.tiempo_min} min</span>}
                          {h.repuestos && <span style={{ fontSize: 11, background: "#ede9fe", color: "#6d28d9", borderRadius: 6, padding: "2px 8px" }}>🔩 {h.repuestos}</span>}
                          {h.costo > 0 && <span style={{ fontSize: 11, background: "#d1fae5", color: "#065f46", borderRadius: 6, padding: "2px 8px" }}>💰 ${parseFloat(h.costo).toLocaleString()}</span>}
                        </div>
                        {h.imagen_url && (
                          <img src={h.imagen_url} alt="foto estado" style={{ width: "100%", borderRadius: 8, maxHeight: 180, objectFit: "cover", marginTop: 8, cursor: "pointer" }}
                            onClick={() => window.open(h.imagen_url, '_blank')} />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 8px #00000010" }}>
            <h4 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>📊 Resumen</h4>
            {[
              { label: "Tiempo total", value: tiempoTotal + " min" },
              { label: "Costo total", value: "$" + costoTotal.toLocaleString() },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
                <span style={{ color: "#64748b" }}>{r.label}</span>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>{r.value}</span>
              </div>
            ))}
          </div>

          {isMant && canEdit && orden.estado !== "resuelto" && (
            <div style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 16, padding: 20 }}>
              <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#fff" }}>🔄 Cambiar Estado</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {estadosMant.filter(e => e !== orden.estado).map(e => (
                  <button key={e} onClick={() => { setNuevoEstado(e); setMostrarCambioEstado(true) }} style={{
                    padding: "10px", borderRadius: 8, border: "1px solid #ffffff30",
                    background: "#ffffff15", color: "#fff", cursor: "pointer",
                    fontSize: 12, fontWeight: 600, textAlign: "left", fontFamily: "inherit"
                  }}>
                    {estadoConfig[e]?.icono} {estadoConfig[e]?.etiqueta}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal cambio de estado */}
      {mostrarCambioEstado && (
        <div style={{ position: "fixed", inset: 0, background: "#00000060", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 480, maxHeight: "90vh", overflow: "auto", padding: 24, boxShadow: "0 24px 64px #00000040" }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
              Cambiar a: {estadoConfig[nuevoEstado]?.icono} {estadoConfig[nuevoEstado]?.etiqueta}
            </h3>

            {nuevoEstado === "agendado" && (
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Fecha agendada</label>
                <input type="date" value={fechaAgendada} onChange={e => setFechaAgendada(e.target.value)} style={inputStyle} />
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Descripción / Novedad *</label>
              <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
                rows={3} placeholder="Describí el trabajo realizado o la novedad..."
                style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Tiempo (minutos)</label>
                <input type="number" value={tiempoMin} onChange={e => setTiempoMin(e.target.value)} placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Costo ($)</label>
                <input type="number" value={costo} onChange={e => setCosto(e.target.value)} placeholder="0" style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Repuestos utilizados</label>
              <input type="text" value={repuestos} onChange={e => setRepuestos(e.target.value)}
                placeholder="Ej: Rodamiento 6205 x2..." style={inputStyle} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Foto del trabajo (opcional)</label>
              <SubirImagen
                onImagenSubida={(url) => setImagenEstado(url || "")}
                imagenActual={imagenEstado}
                carpeta="estados"
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setMostrarCambioEstado(false)} style={{
                padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0",
                background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13,
                cursor: "pointer", fontFamily: "inherit"
              }}>Cancelar</button>
              <button onClick={handleCambiarEstado} disabled={guardando} style={{
                padding: "10px 18px", borderRadius: 10, border: "none",
                background: guardando ? "#4b5563" : "linear-gradient(90deg,#6366f1,#8b5cf6)",
                color: "#fff", fontWeight: 700, fontSize: 13,
                cursor: guardando ? "not-allowed" : "pointer", fontFamily: "inherit"
              }}>
                {guardando ? "Guardando..." : "Confirmar cambio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── LISTA DE ÓRDENES ──────────────────────────────────────────
export default function Ordenes() {
  const { ordenes, cargando, crearOrden, actualizarEstado, cargarHistorial } = useOrdenes()
  const { usuario } = useAuth()
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [sector, setSector] = useState("")
  const [maquina, setMaquina] = useState("")
  const [parte, setParte] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [imagenUrl, setImagenUrl] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")

  const puedeCrear = usuario?.role === 'produccion' || usuario?.role === 'admin'
  const isMant = usuario?.role === 'mantenimiento' || usuario?.role === 'admin'
  const canEdit = usuario?.role !== 'visualizacion'
  const maquinasDisponibles = sector ? (MAQUINAS[sector] || []) : []

  const generarNumero = () => {
    const año = new Date().getFullYear()
    const numero = String(ordenes.length + 1).padStart(3, "0")
    return `OT-${año}-${numero}`
  }

  const handleCrearOrden = async () => {
    if (!sector || !maquina || !parte || !descripcion) { setError("Completá todos los campos"); return }
    setGuardando(true); setError("")
    try {
      await crearOrden({
        numero: generarNumero(),
        fecha: new Date().toISOString().split("T")[0],
        sector_id: null, maquina_id: null,
        parte, descripcion,
        imagen_url: imagenUrl || null,
        estado: "pendiente", solicitante_id: null,
      })
      setSector(""); setMaquina(""); setParte(""); setDescripcion(""); setImagenUrl("")
      setMostrarFormulario(false)
    } catch { setError("Error al crear la orden. Intentá de nuevo.") }
    finally { setGuardando(false) }
  }

  if (ordenSeleccionada) {
    const ordenActual = ordenes.find(o => o.id === ordenSeleccionada.id) || ordenSeleccionada
    return <DetalleOrden orden={ordenActual} onVolver={() => setOrdenSeleccionada(null)}
      actualizarEstado={actualizarEstado} cargarHistorial={cargarHistorial}
      isMant={isMant} canEdit={canEdit} />
  }

  const ordenesFiltradas = filtroEstado === "todos" ? ordenes : ordenes.filter(o => o.estado === filtroEstado)

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {puedeCrear && (
          <button onClick={() => setMostrarFormulario(true)} style={{
            padding: "10px 18px", borderRadius: 10, border: "none",
            background: "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "#fff",
            fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit"
          }}>+ Nueva Orden de Trabajo</button>
        )}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["todos", "pendiente", "agendado", "en_proceso", "espera_mat", "resuelto"].map(e => (
            <button key={e} onClick={() => setFiltroEstado(e)} style={{
              padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 600, fontFamily: "inherit",
              background: filtroEstado === e ? "#0f172a" : "#fff",
              color: filtroEstado === e ? "#fff" : "#64748b",
              boxShadow: "0 1px 4px #00000010"
            }}>
              {e === "todos" ? "Todos" : estadoConfig[e]?.etiqueta}
              <span style={{ marginLeft: 4, borderRadius: 10, padding: "1px 6px", fontSize: 11, background: filtroEstado === e ? "#ffffff30" : "#f1f5f9" }}>
                {e === "todos" ? ordenes.length : ordenes.filter(o => o.estado === e).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {cargando ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>⚙ Cargando órdenes...</div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 8px #00000010" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                {["N° OT", "Fecha", "Parte", "Descripción", "Estado", ""].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordenesFiltradas.map((o, i) => (
                <tr key={o.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#6366f1" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {o.numero}
                      {o.imagen_url && <span title="Tiene imagen adjunta">📎</span>}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{o.fecha}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12 }}>{o.parte}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.descripcion}</td>
                  <td style={{ padding: "12px 16px" }}><BadgeEstado estado={o.estado} /></td>
                  <td style={{ padding: "12px 16px" }}>
                    <button onClick={() => setOrdenSeleccionada(o)} style={{
                      padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
                      background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600,
                      color: "#374151", fontFamily: "inherit"
                    }}>Ver →</button>
                  </td>
                </tr>
              ))}
              {ordenesFiltradas.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>No hay órdenes todavía</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal nueva orden */}
      {mostrarFormulario && (
        <div style={{ position: "fixed", inset: 0, background: "#00000060", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={e => e.target === e.currentTarget && setMostrarFormulario(false)}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 64px #00000040" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Nueva Orden — {generarNumero()}</h2>
              <button onClick={() => setMostrarFormulario(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 16, color: "#64748b" }}>×</button>
            </div>
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
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={4}
                  placeholder="Describa el problema o falla detectada..." style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Imagen adjunta (opcional)</label>
                <SubirImagen
                  onImagenSubida={(url) => setImagenUrl(url || "")}
                  imagenActual={imagenUrl}
                  carpeta="ordenes"
                />
              </div>
              {error && <div style={{ background: "#fee2e2", color: "#ef4444", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 14 }}>❌ {error}</div>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setMostrarFormulario(false)} style={{ padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
                <button onClick={handleCrearOrden} disabled={guardando} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: guardando ? "#4b5563" : "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: guardando ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
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