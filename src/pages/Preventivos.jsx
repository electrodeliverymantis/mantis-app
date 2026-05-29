import { useState } from 'react'
import { usePreventivos } from '../hooks/usePreventivos'
import { useAuth } from '../context/AuthContext'

const SECTORES = ["Planta A", "Planta B", "Almacén", "Oficinas", "Línea 1", "Línea 2"]
const MAQUINAS = {
  "Planta A":  ["Torno CNC-01", "Fresadora F-200", "Prensa H-50"],
  "Planta B":  ["Compresor C-10", "Soldadora MIG-3", "Cortadora Láser"],
  "Almacén":   ["Montacargas M-1", "Cinta Transportadora CT-2"],
  "Oficinas":  ["Aire Acondicionado AA-1", "UPS Central"],
  "Línea 1":   ["Robot Ensamble R1", "Banda Conveyor B1", "Selladora S1"],
  "Línea 2":   ["Robot Pintura R2", "Horno H-300", "Enfriador E-1"],
}
const FRECUENCIAS = ["Diario", "Semanal", "Quincenal", "Mensual", "Trimestral", "Semestral", "Anual"]

const estadoConfig = {
  pendiente: { etiqueta: "Pendiente", color: "#f59e0b", bg: "#fef3c7", icono: "⏳" },
  vencido:   { etiqueta: "Vencido",   color: "#ef4444", bg: "#fee2e2", icono: "🔴" },
  realizado: { etiqueta: "Realizado", color: "#10b981", bg: "#d1fae5", icono: "✅" },
}

function calcularProximaFecha(frecuencia) {
  const hoy = new Date()
  switch (frecuencia) {
    case "Diario":      hoy.setDate(hoy.getDate() + 1); break
    case "Semanal":     hoy.setDate(hoy.getDate() + 7); break
    case "Quincenal":   hoy.setDate(hoy.getDate() + 15); break
    case "Mensual":     hoy.setMonth(hoy.getMonth() + 1); break
    case "Trimestral":  hoy.setMonth(hoy.getMonth() + 3); break
    case "Semestral":   hoy.setMonth(hoy.getMonth() + 6); break
    case "Anual":       hoy.setFullYear(hoy.getFullYear() + 1); break
    default: break
  }
  return hoy.toISOString().split('T')[0]
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

export default function Preventivos() {
  const { preventivos, cargando, crearPreventivo, soloRealizado, reagendarPreventivo, eliminarPreventivo } = usePreventivos()
  const { usuario } = useAuth()
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [filtro, setFiltro] = useState("todos")
  const [modalRealizado, setModalRealizado] = useState(null)
  const [nuevaFechaModal, setNuevaFechaModal] = useState("")
  const [titulo, setTitulo] = useState("")
  const [sector, setSector] = useState("")
  const [maquina, setMaquina] = useState("")
  const [frecuencia, setFrecuencia] = useState("Mensual")
  const [proximaFecha, setProximaFecha] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")

  const isMant = usuario?.role === 'mantenimiento' || usuario?.role === 'admin'
  const maquinasDisponibles = sector ? (MAQUINAS[sector] || []) : []

  const handleCrear = async () => {
    if (!titulo || !sector || !maquina || !proximaFecha) { setError("Completá todos los campos obligatorios"); return }
    setGuardando(true); setError("")
    try {
      await crearPreventivo({ titulo, descripcion, frecuencia, proxima_fecha: proximaFecha, sector_id: null, maquina_id: null, estado: 'pendiente' })
      setTitulo(""); setSector(""); setMaquina(""); setFrecuencia("Mensual"); setProximaFecha(""); setDescripcion("")
      setMostrarFormulario(false)
    } catch { setError("Error al crear el preventivo") }
    finally { setGuardando(false) }
  }

  const handleReagendar = (preventivo) => {
    setNuevaFechaModal(calcularProximaFecha(preventivo.frecuencia))
    setModalRealizado(preventivo)
  }

  const confirmarReagendar = async () => {
    if (!modalRealizado) return
    await reagendarPreventivo(modalRealizado, nuevaFechaModal)
    setModalRealizado(null)
  }

  const preventivosFiltrados = filtro === "todos" ? preventivos : preventivos.filter(p => p.estado === filtro)
  const vencidos = preventivos.filter(p => p.estado === 'vencido').length

  return (
    <div>
      {vencidos > 0 && (
        <div style={{ background: "#fee2e2", border: "1px solid #ef444440", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🔴</span>
          <div>
            <div style={{ fontWeight: 700, color: "#ef4444", fontSize: 14 }}>{vencidos} preventivo{vencidos > 1 ? 's' : ''} vencido{vencidos > 1 ? 's' : ''}</div>
            <div style={{ fontSize: 12, color: "#b91c1c" }}>Revisá y marcalos como realizados</div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {isMant && (
          <button onClick={() => setMostrarFormulario(true)} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>+ Nuevo Preventivo</button>
        )}
        <div style={{ display: "flex", gap: 6 }}>
          {["todos", "pendiente", "vencido", "realizado"].map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{ padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", background: filtro === f ? "#0f172a" : "#fff", color: filtro === f ? "#fff" : "#64748b", boxShadow: "0 1px 4px #00000010" }}>
              {f === "todos" ? "Todos" : estadoConfig[f]?.etiqueta}
              <span style={{ marginLeft: 4, borderRadius: 10, padding: "1px 6px", fontSize: 11, background: filtro === f ? "#ffffff30" : "#f1f5f9" }}>
                {f === "todos" ? preventivos.length : preventivos.filter(p => p.estado === f).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {cargando ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>⚙ Cargando preventivos...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {preventivosFiltrados.map(p => {
            const cfg = estadoConfig[p.estado] || estadoConfig.pendiente
            return (
              <div key={p.id} style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 8px #00000010", border: p.estado === 'vencido' ? "2px solid #ef444440" : "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{cfg.icono} {cfg.etiqueta}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8", background: "#f1f5f9", padding: "3px 8px", borderRadius: 6 }}>{p.frecuencia}</span>
                </div>
                <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{p.titulo}</h4>
                {p.descripcion && <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 8px", lineHeight: 1.5 }}>{p.descripcion}</p>}
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>📅 Próxima fecha: <strong>{p.proxima_fecha}</strong></div>
                {isMant && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => soloRealizado(p.id)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid #10b98140", background: "#d1fae5", color: "#065f46", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>✅ Hecho</button>
                    <button onClick={() => handleReagendar(p)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid #3b82f640", background: "#dbeafe", color: "#1d4ed8", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>📅 Reagendar</button>
                    <button onClick={() => eliminarPreventivo(p.id)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ef444440", background: "#fee2e2", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>🗑</button>
                  </div>
                )}
              </div>
            )
          })}
          {preventivosFiltrados.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60, color: "#94a3b8", fontSize: 14 }}>No hay preventivos con este filtro</div>}
        </div>
      )}

      {/* Modal reagendar */}
      {modalRealizado && (
        <div style={{ position: "fixed", inset: 0, background: "#00000060", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 400, padding: 28, boxShadow: "0 24px 64px #00000040" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>📅 Reagendar preventivo</h3>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px" }}><strong>{modalRealizado.titulo}</strong> — {modalRealizado.frecuencia}</p>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Próxima fecha</label>
              <input type="date" value={nuevaFechaModal} onChange={e => setNuevaFechaModal(e.target.value)} style={inputStyle} />
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>Podés cambiar la fecha si necesitás ajustar el próximo mantenimiento</div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setModalRealizado(null)} style={{ padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
              <button onClick={confirmarReagendar} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "linear-gradient(90deg,#3b82f6,#6366f1)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>📅 Confirmar reagenda</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo preventivo */}
      {mostrarFormulario && (
        <div style={{ position: "fixed", inset: 0, background: "#00000060", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => e.target === e.currentTarget && setMostrarFormulario(false)}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 64px #00000040" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Nuevo Preventivo</h2>
              <button onClick={() => setMostrarFormulario(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 16, color: "#64748b" }}>×</button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Título *</label>
                <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ej: Cambio de aceite - Torno CNC-01" style={inputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div><label style={labelStyle}>Sector *</label><select value={sector} onChange={e => { setSector(e.target.value); setMaquina("") }} style={inputStyle}><option value="">Seleccionar...</option>{SECTORES.map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label style={labelStyle}>Máquina *</label><select value={maquina} onChange={e => setMaquina(e.target.value)} style={inputStyle} disabled={!sector}><option value="">Seleccionar...</option>{maquinasDisponibles.map(m => <option key={m}>{m}</option>)}</select></div>
                <div><label style={labelStyle}>Frecuencia</label><select value={frecuencia} onChange={e => setFrecuencia(e.target.value)} style={inputStyle}>{FRECUENCIAS.map(f => <option key={f}>{f}</option>)}</select></div>
                <div><label style={labelStyle}>Próxima fecha *</label><input type="date" value={proximaFecha} onChange={e => setProximaFecha(e.target.value)} style={inputStyle} /></div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Descripción de tareas</label>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3} placeholder="Describí las tareas a realizar..." style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              {error && <div style={{ background: "#fee2e2", color: "#ef4444", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 14 }}>❌ {error}</div>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setMostrarFormulario(false)} style={{ padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
                <button onClick={handleCrear} disabled={guardando} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: guardando ? "#4b5563" : "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: guardando ? "not-allowed" : "pointer", fontFamily: "inherit" }}>{guardando ? "Guardando..." : "Guardar Preventivo"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}