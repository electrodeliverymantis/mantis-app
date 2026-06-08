import { useState, useEffect } from 'react'
import { useOrdenes } from '../hooks/useOrdenes'
import { useAuth } from '../context/AuthContext'
import SubirImagen from '../components/SubirImagen'
import Chat from '../components/Chat'
import { enviarEmail, templateCambioEstado, templateNuevaOrden } from '../lib/email'

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
  pendiente:         { etiqueta: "Pendiente",       color: "#f59e0b", bg: "#fef3c7", icono: "⏳" },
  agendado:          { etiqueta: "Agendado",        color: "#3b82f6", bg: "#dbeafe", icono: "📅" },
  en_proceso:        { etiqueta: "En Proceso",      color: "#8b5cf6", bg: "#ede9fe", icono: "🔧" },
  espera_mat:        { etiqueta: "Esp. Materiales", color: "#f97316", bg: "#ffedd5", icono: "📦" },
  espera_definicion: { etiqueta: "Esp. Definición", color: "#0891b2", bg: "#ecfeff", icono: "🤔" },
  espera_respuesta:  { etiqueta: "Esp. Respuesta",  color: "#7c3aed", bg: "#f5f3ff", icono: "💬" },
  resuelto:          { etiqueta: "Resuelto",        color: "#10b981", bg: "#d1fae5", icono: "✅" },
}

function BadgeEstado({ estado }) {
  const cfg = estadoConfig[estado] || { etiqueta: estado, color: "#6b7280", bg: "#f3f4f6", icono: "•" }
  return (
    <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      {cfg.icono} {cfg.etiqueta}
    </span>
  )
}

const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#0f172a", outline: "none", fontFamily: "inherit", background: "#f8fafc", boxSizing: "border-box" }
const labelStyle = { display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }

function DetalleOrden({ orden, onVolver, actualizarEstado, cargarHistorial, isMant, canEdit }) {
  const [historial, setHistorial] = useState([])
  const [mostrarModal, setMostrarModal] = useState(false)
  const [nuevoEstado, setNuevoEstado] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [tiempoMin, setTiempoMin] = useState("")
  const [repuestos, setRepuestos] = useState("")
  const [costo, setCosto] = useState("")
  const [fechaAgendada, setFechaAgendada] = useState("")
  const [imagenEstado, setImagenEstado] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [ubicacion, setUbicacion] = useState(null)
  const [capturandoUbicacion, setCapturandoUbicacion] = useState(false)

  useEffect(() => { cargarHistorial(orden.id).then(setHistorial) }, [orden.id])

  const abrirModal = (estado) => { setNuevoEstado(estado); setMostrarModal(true) }
  const cerrarModal = () => {
    setMostrarModal(false); setNuevoEstado(""); setDescripcion("")
    setTiempoMin(""); setRepuestos(""); setCosto("")
    setFechaAgendada(""); setImagenEstado(""); setUbicacion(null)
  }

  const handleGuardar = async () => {
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
        latitud: ubicacion ? ubicacion.latitud : null,
        longitud: ubicacion ? ubicacion.longitud : null,
        direccion: ubicacion ? ubicacion.direccion : null,
        fecha: new Date().toISOString(),
      })
      const nuevo = await cargarHistorial(orden.id)
      setHistorial(nuevo)
      orden.estado = nuevoEstado
      // Notificación email al cambiar estado
try {
  await enviarEmail({
    para: "electrodeliverycomercial@gmail.com", // temporal - después se configura por empresa
    asunto: `MANTIS — ${orden.numero} cambió a ${nuevoEstado.replace('_',' ')}`,
    html: templateCambioEstado({
      numeroOrden: orden.numero,
      estado: nuevoEstado,
      descripcion: descripcion,
      empresa: "Mi Empresa"
    })
  })
} catch (e) { console.log("Email no enviado:", e) }
      cerrarModal()
    } catch { alert("Error al cambiar estado") }
    finally { setGuardando(false) }
  }

  const capturarUbicacion = async () => {
    setCapturandoUbicacion(true)
    try {
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 }))
      const { latitude, longitude } = pos.coords
      let dir = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
        const d = await r.json()
        if (d.display_name) dir = d.display_name.split(',').slice(0, 3).join(',').trim()
      } catch {}
      setUbicacion({ latitud: latitude, longitud: longitude, direccion: dir })
    } catch { alert("No se pudo obtener la ubicación.") }
    finally { setCapturandoUbicacion(false) }
  }

  const estadosMant = ["agendado", "en_proceso", "espera_mat", "espera_definicion", "espera_respuesta", "resuelto"]
  const tiempoTotal = historial.reduce((a, h) => a + (h.tiempo_min || 0), 0)
  const costoTotal = historial.reduce((a, h) => a + (parseFloat(h.costo) || 0), 0)
  const mostrarGeo = nuevoEstado === "en_proceso" || nuevoEstado === "resuelto"

  return (
    <div>
      <button onClick={onVolver} style={{ background: "none", border: "none", color: "#6366f1", fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 16, fontFamily: "inherit" }}>
        ← Volver a Órdenes
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
        <div>
          {/* Info de la orden */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 8px #00000010", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{orden.numero}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Creada el {orden.fecha}</div>
              </div>
              <BadgeEstado estado={orden.estado} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[{ label: "Parte", value: orden.parte, icono: "🔩" }, { label: "Estado", value: estadoConfig[orden.estado]?.etiqueta, icono: "📊" }].map(f => (
                <div key={f.label} style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{f.icono} {f.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{f.value}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>📝 Descripción</div>
              <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{orden.descripcion}</p>
            </div>
            {orden.imagen_url && (
              <img src={orden.imagen_url} alt="adjunto" style={{ width: "100%", borderRadius: 10, maxHeight: 250, objectFit: "cover", marginTop: 12, cursor: "pointer" }}
                onClick={() => window.open(orden.imagen_url, '_blank')} />
            )}
          </div>

          {/* Timeline */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 8px #00000010" }}>
            <h3 style={{ margin: "0 0 24px", fontSize: 15, fontWeight: 800, color: "#0f172a" }}>📅 Línea de Tiempo</h3>
            {historial.length === 0 ? (
              <div style={{ position: "relative", paddingLeft: 32 }}>
  <div style={{ position: "absolute", left: 15, top: 0, bottom: 0, width: 2, background: "linear-gradient(180deg, #6366f1, #e2e8f0)" }} />
  <div style={{ position: "relative" }}>
    <div style={{ position: "absolute", left: -25, top: 4, width: 20, height: 20, borderRadius: "50%", background: "#6366f1", border: "2px solid #6366f1", zIndex: 1 }} />
    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>📋 Orden Creada</span>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
            {new Date(new Date(orden.created_at || orden.fecha).getTime() - (3 * 60 * 60 * 1000)).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>
            {new Date(new Date(orden.created_at || orden.fecha).getTime() - (3 * 60 * 60 * 1000)).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}hs
          </div>
        </div>
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 13, color: "#64748b" }}>Esperando intervención de mantenimiento</p>
    </div>
  </div>
</div>
            ) : (
              <div style={{ position: "relative", paddingLeft: 32 }}>
                <div style={{ position: "absolute", left: 15, top: 0, bottom: 0, width: 2, background: "linear-gradient(180deg, #6366f1, #e2e8f0)" }} />
                <div style={{ position: "relative", marginBottom: 28 }}>
    <div style={{ position: "absolute", left: -25, top: 4, width: 20, height: 20, borderRadius: "50%", background: "#fff", border: "2px solid #6366f1", zIndex: 1 }} />
    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>📋 Orden Creada</span>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
          {new Date(new Date(orden.created_at || orden.fecha).getTime() - (3 * 60 * 60 * 1000)).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
<div style={{ fontSize: 11, color: "#94a3b8" }}>
  {new Date(new Date(orden.created_at || orden.fecha).getTime() - (3 * 60 * 60 * 1000)).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}hs
</div>
        </div>
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 13, color: "#64748b" }}>Solicitante: {orden.solicitante_id || "Sistema"}</p>
    </div>
  </div>

  {historial.map((h, i) => {
                  const cfg = estadoConfig[h.estado] || { bg: "#f1f5f9", color: "#94a3b8", icono: "•", etiqueta: h.estado }
                  const fecha = new Date(new Date(h.fecha).getTime() - (3 * 60 * 60 * 1000))
                  const fechaAR = fecha
                  const esUltimo = i === historial.length - 1
                  return (
                    <div key={i} style={{ position: "relative", marginBottom: esUltimo ? 0 : 28 }}>
                      <div style={{
                        position: "absolute", left: -25, top: 4,
                        width: 20, height: 20, borderRadius: "50%",
                        background: esUltimo ? cfg.color : "#fff",
                        border: `2px solid ${cfg.color}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, zIndex: 1,
                        boxShadow: esUltimo ? `0 0 0 4px ${cfg.color}20` : "none"
                      }}>
                        {esUltimo ? "✓" : ""}
                      </div>
                      <div style={{
                        background: esUltimo ? cfg.bg : "#f8fafc",
                        border: `1px solid ${esUltimo ? cfg.color + "40" : "#e2e8f0"}`,
                        borderRadius: 12, padding: "14px 16px",
                        boxShadow: esUltimo ? `0 2px 12px ${cfg.color}15` : "none"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <BadgeEstado estado={h.estado} />
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                              {fecha.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Argentina/Buenos_Aires" })}
                            </div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>
                              {fecha.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })}hs
                            </div>
                          </div>
                        </div>
                        {h.descripcion && <p style={{ margin: "0 0 8px", fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{h.descripcion}</p>}
                        {h.fecha_agendada && <div style={{ fontSize: 11, color: "#3b82f6", marginBottom: 6 }}>📅 Agendado para: {h.fecha_agendada}</div>}
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                          {h.tiempo_min > 0 && <span style={{ fontSize: 11, background: "#dbeafe", color: "#1d4ed8", borderRadius: 6, padding: "2px 8px" }}>⏱ {h.tiempo_min} min</span>}
                          {h.repuestos && <span style={{ fontSize: 11, background: "#ede9fe", color: "#6d28d9", borderRadius: 6, padding: "2px 8px" }}>🔩 {h.repuestos}</span>}
                          {h.costo > 0 && <span style={{ fontSize: 11, background: "#d1fae5", color: "#065f46", borderRadius: 6, padding: "2px 8px" }}>💰 ${parseFloat(h.costo).toLocaleString()}</span>}
                        </div>
                        {h.latitud && h.longitud && (
                          <a href={`https://www.google.com/maps?q=${h.latitud},${h.longitud}`} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 11, background: "#dbeafe", color: "#1d4ed8", borderRadius: 6, padding: "2px 8px", textDecoration: "none", display: "inline-block", marginTop: 6 }}>
                            📍 {h.direccion || "Ver en Maps"}
                          </a>
                        )}
                        {h.imagen_url && (
                          <img src={h.imagen_url} alt="foto" style={{ width: "100%", borderRadius: 8, maxHeight: 180, objectFit: "cover", marginTop: 8, cursor: "pointer" }}
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
          <Chat ordenId={orden.id} usuarioNombre={orden.solicitante_id || "Usuario"} />
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 8px #00000010" }}>
            <h4 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>📊 Resumen</h4>
            {[{ label: "Tiempo total", value: tiempoTotal + " min" }, { label: "Costo total", value: "$" + costoTotal.toLocaleString() }].map(r => (
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
                  <button key={e} onClick={() => abrirModal(e)} style={{ padding: "10px", borderRadius: 8, border: "1px solid #ffffff30", background: "#ffffff15", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, textAlign: "left", fontFamily: "inherit" }}>
                    {estadoConfig[e]?.icono} {estadoConfig[e]?.etiqueta}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal cambio de estado */}
      {mostrarModal && (
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
              <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3} placeholder="Describí el trabajo realizado..." style={{ ...inputStyle, resize: "vertical" }} />
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
              <input type="text" value={repuestos} onChange={e => setRepuestos(e.target.value)} placeholder="Ej: Rodamiento 6205 x2..." style={inputStyle} />
            </div>

            {mostrarGeo && (
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>📍 Ubicación (opcional)</label>
                {!ubicacion ? (
                  <button onClick={capturarUbicacion} disabled={capturandoUbicacion} style={{ padding: "10px 16px", borderRadius: 8, border: "1.5px solid #6366f140", background: "#f5f3ff", color: "#6366f1", cursor: capturandoUbicacion ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", width: "100%" }}>
                    {capturandoUbicacion ? "⏳ Capturando ubicación..." : "📍 Capturar mi ubicación actual"}
                  </button>
                ) : (
                  <div style={{ background: "#f0fdf4", border: "1px solid #10b98140", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#065f46" }}>✅ Ubicación capturada</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{ubicacion.direccion}</div>
                    </div>
                    <button onClick={() => setUbicacion(null)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 18 }}>×</button>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Foto del trabajo (opcional)</label>
              <SubirImagen onImagenSubida={(url) => setImagenEstado(url || "")} imagenActual={imagenEstado} carpeta="estados" />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={cerrarModal} style={{ padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
              <button onClick={handleGuardar} disabled={guardando} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: guardando ? "#4b5563" : "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: guardando ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                {guardando ? "Guardando..." : "Confirmar cambio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Ordenes() {
  const { ordenes, cargando, crearOrden, actualizarEstado, cargarHistorial } = useOrdenes()
  const { usuario } = useAuth()
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [busqueda, setBusqueda] = useState("")
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

  const generarNumero = () => `OT-${new Date().getFullYear()}-${String(ordenes.length + 1).padStart(3, "0")}`

  const handleCrearOrden = async () => {
    if (!sector || !maquina || !parte || !descripcion) { setError("Completá todos los campos"); return }
    setGuardando(true); setError("")
    try {
      await crearOrden({ numero: generarNumero(), fecha: new Date().toISOString().split("T")[0], sector_id: null, maquina_id: null, parte, descripcion, imagen_url: imagenUrl || null, estado: "pendiente", solicitante_id: null })
        setSector(""); setMaquina(""); setParte(""); setDescripcion(""); setImagenUrl("")
try {
  await enviarEmail({
    para: "electrodeliverycomercial@gmail.com",
    asunto: `MANTIS — Nueva orden creada`,
    html: templateNuevaOrden({
      numeroOrden: generarNumero(),
      parte: parte,
      descripcion: descripcion,
      empresa: "Mi Empresa"
    })
  })
} catch (e) { console.log("Email no enviado:", e) }
setMostrarFormulario(false)
    } catch { setError("Error al crear la orden.") }
    finally { setGuardando(false) }
  }

  if (ordenSeleccionada) {
    const ordenActual = ordenes.find(o => o.id === ordenSeleccionada.id) || ordenSeleccionada
    return <DetalleOrden orden={ordenActual} onVolver={() => setOrdenSeleccionada(null)} actualizarEstado={actualizarEstado} cargarHistorial={cargarHistorial} isMant={isMant} canEdit={canEdit} />
  }

  const ordenesFiltradas = ordenes
    .filter(o => filtroEstado === "todos" || o.estado === filtroEstado)
    .filter(o => !busqueda || o.numero?.toLowerCase().includes(busqueda.toLowerCase()) || o.parte?.toLowerCase().includes(busqueda.toLowerCase()) || o.descripcion?.toLowerCase().includes(busqueda.toLowerCase()))

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {puedeCrear && (
          <button onClick={() => setMostrarFormulario(true)} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            + Nueva Orden de Trabajo
          </button>
        )}
        <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="🔍 Buscar por número, parte o descripción..." style={{ padding: "9px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", fontFamily: "inherit", background: "#fff", width: 300 }} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["todos", "pendiente", "agendado", "en_proceso", "espera_mat", "resuelto"].map(e => (
            <button key={e} onClick={() => setFiltroEstado(e)} style={{ padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", background: filtroEstado === e ? "#0f172a" : "#fff", color: filtroEstado === e ? "#fff" : "#64748b", boxShadow: "0 1px 4px #00000010" }}>
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
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>{o.numero}{o.imagen_url && <span title="Tiene imagen">📎</span>}</div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{o.fecha}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12 }}>{o.parte}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.descripcion}</td>
                  <td style={{ padding: "12px 16px" }}><BadgeEstado estado={o.estado} /></td>
                  <td style={{ padding: "12px 16px" }}>
                    <button onClick={() => setOrdenSeleccionada(o)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#374151", fontFamily: "inherit" }}>Ver →</button>
                  </td>
                </tr>
              ))}
              {ordenesFiltradas.length === 0 && <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>No hay órdenes todavía</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {mostrarFormulario && (
        <div style={{ position: "fixed", inset: 0, background: "#00000060", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => e.target === e.currentTarget && setMostrarFormulario(false)}>
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
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={4} placeholder="Describa el problema o falla detectada..." style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Imagen adjunta (opcional)</label>
                <SubirImagen onImagenSubida={(url) => setImagenUrl(url || "")} imagenActual={imagenUrl} carpeta="ordenes" />
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