import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import jsPDF from 'jspdf'

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuanhvYWV3dWZwcGVxcmhvYWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MTM5MzUsImV4cCI6MjA5NDI4OTkzNX0.Opp3mz5p0thf2_oCo928MUaJZoGbmDuk5yF3QGwsR7s'
const FUNCTION_URL = 'https://jnjxoaewufppeqrhoaja.supabase.co/functions/v1/asistente-ia'
const LIMITE_MENSUAL = 200

const SUGERENCIAS = [
  "Cuantas ordenes estan pendientes?",
  "Que maquina tuvo mas fallas?",
  "Cuanto gastamos en mantenimiento?",
  "Que preventivos vencen pronto?",
  "Que materiales tienen stock bajo?",
  "Dame un resumen del mantenimiento",
]

export default function Asistente() {
  const { usuario } = useAuth()
  const [conversaciones, setConversaciones] = useState([])
  const [convActual, setConvActual] = useState(null)
  const [mensajes, setMensajes] = useState([
    { rol: "asistente", texto: "Hola! Soy el asistente de MANTIS con IA. Puedo analizar los datos de tu sistema. En que te puedo ayudar?" }
  ])
  const [input, setInput] = useState("")
  const [cargando, setCargando] = useState(false)
  const [consultasMes, setConsultasMes] = useState(0)
  const [sidebarAbierto, setSidebarAbierto] = useState(true)
  const endRef = useRef(null)

  const empresaId = usuario?.empresa_id || 'd0098530-4e23-48ef-86dd-bf12a6aa0ef4'

  useEffect(() => {
    cargarConversaciones()
    contarConsultasMes()
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensajes])

  const cargarConversaciones = async () => {
    const { data } = await supabase
      .from('ia_conversaciones')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('updated_at', { ascending: false })
      .limit(10)
    setConversaciones(data || [])
  }

  const contarConsultasMes = async () => {
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)
    const { data } = await supabase
      .from('ia_conversaciones')
      .select('consultas_count')
      .eq('empresa_id', empresaId)
      .gte('created_at', inicioMes.toISOString())
    const total = (data || []).reduce((a, c) => a + (c.consultas_count || 0), 0)
    setConsultasMes(total)
  }

  const nuevaConversacion = () => {
    setConvActual(null)
    setMensajes([{ rol: "asistente", texto: "Hola! Nueva conversacion iniciada. En que te puedo ayudar?" }])
  }

  const abrirConversacion = (conv) => {
    setConvActual(conv)
    setMensajes(conv.mensajes || [])
  }

  const cargarContexto = async () => {
    try {
      const [
        { data: ordenes },
        { data: preventivos },
        { data: inventario },
        { data: historial },
        { data: infraestructura },
      ] = await Promise.all([
        supabase.from('ordenes_trabajo').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('preventivos').select('*').order('proxima_fecha').limit(30),
        supabase.from('inventario').select('*').eq('activo', true),
        supabase.from('historial_ordenes').select('*').limit(100),
        supabase.from('infraestructura').select('*'),
      ])

      const hoy = new Date()
      const otPendientes = (ordenes || []).filter(o => o.estado === 'pendiente').length
      const otResueltas = (ordenes || []).filter(o => o.estado === 'resuelto').length
      const otEnProceso = (ordenes || []).filter(o => o.estado === 'en_proceso').length
      const costoTotal = (historial || []).reduce((a, h) => a + (parseFloat(h.costo) || 0), 0)
      const tiempoTotal = (historial || []).reduce((a, h) => a + (parseInt(h.tiempo_min) || 0), 0)
      const prevVencidos = (preventivos || []).filter(p => p.proxima_fecha && new Date(p.proxima_fecha) < hoy).length
      const prevProximos = (preventivos || []).filter(p => {
        if (!p.proxima_fecha) return false
        const dias = Math.ceil((new Date(p.proxima_fecha) - hoy) / (1000 * 60 * 60 * 24))
        return dias >= 0 && dias <= 30
      }).length
      const stockBajo = (inventario || []).filter(i => i.tipo === 'material' && i.stock_actual <= i.stock_minimo && i.stock_minimo > 0)
      const infraVencida = (infraestructura || []).filter(i => i.fecha_vencimiento && new Date(i.fecha_vencimiento) < hoy)

      return `DATOS DEL SISTEMA MANTIS (${hoy.toLocaleDateString('es-AR')}):
ORDENES: Total ${(ordenes||[]).length}, Pendientes ${otPendientes}, En proceso ${otEnProceso}, Resueltas ${otResueltas}
Detalle: ${(ordenes||[]).slice(0,20).map(o=>`OT ${o.numero}: ${o.parte} - ${o.estado}`).join(' | ')}
COSTOS: Total $${costoTotal.toLocaleString('es-AR')}, Tiempo ${tiempoTotal} min (${Math.round(tiempoTotal/60)}hs)
PREVENTIVOS: Vencidos ${prevVencidos}, Proximos ${prevProximos}
Detalle: ${(preventivos||[]).slice(0,10).map(p=>`${p.nombre}: ${p.proxima_fecha} - ${p.estado}`).join(' | ')}
INVENTARIO stock bajo: ${stockBajo.map(i=>`${i.nombre}: ${i.stock_actual}/${i.stock_minimo} ${i.unidad}`).join(', ')}
INFRAESTRUCTURA vencida: ${infraVencida.map(i=>`${i.nombre}: ${i.fecha_vencimiento}`).join(', ')}`
    } catch (e) {
      return "No se pudieron cargar los datos."
    }
  }

  const guardarConversacion = async (nuevosMensajes, pregunta) => {
    const titulo = pregunta.substring(0, 50)
    if (convActual) {
      const { data } = await supabase
        .from('ia_conversaciones')
        .update({
          mensajes: nuevosMensajes,
          consultas_count: (convActual.consultas_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', convActual.id)
        .select().single()
      setConvActual(data)
    } else {
      const { data } = await supabase
        .from('ia_conversaciones')
        .insert([{
          empresa_id: empresaId,
          usuario_email: usuario?.email,
          titulo,
          mensajes: nuevosMensajes,
          consultas_count: 1,
        }])
        .select().single()
      setConvActual(data)
    }
    cargarConversaciones()
    contarConsultasMes()
  }

  const enviar = async (texto) => {
    const pregunta = texto || input.trim()
    if (!pregunta || cargando) return
    if (consultasMes >= LIMITE_MENSUAL) {
      alert(`Alcanzaste el limite de ${LIMITE_MENSUAL} consultas mensuales. Contacta al administrador para ampliar tu plan.`)
      return
    }

    setInput("")
    const nuevosMensajesConPregunta = [...mensajes, { rol: "usuario", texto: pregunta }]
    setMensajes(nuevosMensajesConPregunta)
    setCargando(true)

    try {
      const contexto = await cargarContexto()
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      const response = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
        },
        body: JSON.stringify({ pregunta, contexto, empresa: usuario?.nombre || "Mi Empresa" })
      })

      const data = await response.json()
      const respuesta = data.respuesta || "No pude procesar la consulta."
      const nuevosMensajesFinal = [...nuevosMensajesConPregunta, { rol: "asistente", texto: respuesta }]
      setMensajes(nuevosMensajesFinal)
      await guardarConversacion(nuevosMensajesFinal, pregunta)
    } catch (e) {
      console.error(e)
      setMensajes(prev => [...prev, { rol: "asistente", texto: "Error al conectar con el asistente." }])
    } finally {
      setCargando(false)
    }
  }

  const exportarPDF = (conv) => {
    const doc = new jsPDF()
    const msgs = conv ? conv.mensajes : mensajes
    const titulo = conv ? conv.titulo : "Conversacion actual"

    doc.setFontSize(18)
    doc.setTextColor(99, 102, 241)
    doc.text("MANTIS - Asistente IA", 20, 20)

    doc.setFontSize(11)
    doc.setTextColor(100, 116, 139)
    doc.text(`Conversacion: ${titulo}`, 20, 30)
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, 20, 37)
    doc.text(`Empresa: ${usuario?.nombre || "Mi Empresa"}`, 20, 44)

    doc.setDrawColor(99, 102, 241)
    doc.line(20, 48, 190, 48)

    let y = 58
    msgs.forEach((m) => {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.setFontSize(10)
      doc.setTextColor(m.rol === 'usuario' ? 99 : 15, m.rol === 'usuario' ? 102 : 23, m.rol === 'usuario' ? 241 : 42)
      doc.setFont(undefined, 'bold')
      doc.text(m.rol === 'usuario' ? 'Usuario:' : 'Asistente IA:', 20, y)
      y += 6
      doc.setFont(undefined, 'normal')
      doc.setTextColor(55, 65, 81)
      const lines = doc.splitTextToSize(m.texto, 165)
      lines.forEach(line => {
        if (y > 275) { doc.addPage(); y = 20 }
        doc.text(line, 25, y)
        y += 5
      })
      y += 4
    })

    doc.save(`MANTIS_IA_${titulo.substring(0,30).replace(/\s/g,'_')}.pdf`)
  }

  const limitePorc = Math.min((consultasMes / LIMITE_MENSUAL) * 100, 100)
  const limiteColor = limitePorc > 80 ? '#ef4444' : limitePorc > 60 ? '#f59e0b' : '#10b981'

  return (
    <div style={{ display: "flex", height: "calc(100vh - 120px)", gap: 0 }}>

      {/* SIDEBAR HISTORIAL */}
      {sidebarAbierto && (
        <div style={{ width: 240, background: "#fff", borderRadius: 14, marginRight: 14, display: "flex", flexDirection: "column", boxShadow: "0 1px 8px #00000010", overflow: "hidden", flexShrink: 0 }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>🤖 Asistente IA</div>
            <button onClick={nuevaConversacion} style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1.5px solid #6366f1", background: "#fff", color: "#6366f1", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              + Nueva conversacion
            </button>
          </div>

          {/* Limite */}
          <div style={{ padding: "10px 16px", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "#64748b" }}>Consultas este mes</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: limiteColor }}>{consultasMes}/{LIMITE_MENSUAL}</span>
            </div>
            <div style={{ height: 4, background: "#e2e8f0", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${limitePorc}%`, background: limiteColor, borderRadius: 2, transition: "width 0.3s" }} />
            </div>
          </div>

          {/* Lista conversaciones */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {conversaciones.length === 0 ? (
              <div style={{ padding: 16, fontSize: 12, color: "#94a3b8", textAlign: "center" }}>No hay conversaciones anteriores</div>
            ) : (
              conversaciones.map(conv => (
                <div key={conv.id} style={{ padding: "10px 16px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", background: convActual?.id === conv.id ? "#ede9fe" : "transparent" }}
                  onClick={() => abrirConversacion(conv)}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: convActual?.id === conv.id ? "#6366f1" : "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {conv.titulo}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                    <span style={{ fontSize: 10, color: "#94a3b8" }}>{new Date(conv.updated_at).toLocaleDateString('es-AR')}</span>
                    <button onClick={e => { e.stopPropagation(); exportarPDF(conv) }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#6366f1" }} title="Exportar PDF">📄</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CHAT PRINCIPAL */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 14, padding: "14px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setSidebarAbierto(!sidebarAbierto)} style={{ background: "#ffffff20", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 14, color: "#fff" }}>☰</button>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#ffffff20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🤖</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>Asistente MANTIS IA</div>
            <div style={{ color: "#e0e7ff", fontSize: 11 }}>Powered by Claude · Analiza tus datos en tiempo real</div>
          </div>
          <button onClick={() => exportarPDF(null)} style={{ background: "#ffffff20", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, color: "#fff", fontWeight: 600, fontFamily: "inherit" }}>
            📄 Exportar PDF
          </button>
        </div>

        {/* Mensajes */}
        <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 8 }}>
          {mensajes.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.rol === "usuario" ? "flex-end" : "flex-start" }}>
              {m.rol === "asistente" && (
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginRight: 8, alignSelf: "flex-end" }}>🤖</div>
              )}
              <div style={{ maxWidth: "75%", padding: "12px 16px", borderRadius: m.rol === "usuario" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: m.rol === "usuario" ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#fff", color: m.rol === "usuario" ? "#fff" : "#0f172a", fontSize: 13, lineHeight: 1.6, boxShadow: "0 1px 8px #00000010", whiteSpace: "pre-wrap" }}>
                {m.texto}
              </div>
            </div>
          ))}

          {cargando && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🤖</div>
              <div style={{ background: "#fff", borderRadius: "18px 18px 18px 4px", padding: "12px 16px", boxShadow: "0 1px 8px #00000010" }}>
                <div style={{ display: "flex", gap: 4 }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", opacity: 0.6 }} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Sugerencias */}
        {mensajes.length <= 1 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {SUGERENCIAS.map((s, i) => (
              <button key={i} onClick={() => enviar(s)} style={{ padding: "6px 12px", borderRadius: 20, border: "1.5px solid #e2e8f0", background: "#fff", color: "#374151", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ display: "flex", gap: 8, background: "#fff", borderRadius: 14, padding: "8px 8px 8px 16px", boxShadow: "0 2px 12px #00000015", border: "1.5px solid #e2e8f0" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && enviar()}
            placeholder="Escribi tu pregunta aqui..."
            style={{ flex: 1, border: "none", outline: "none", fontSize: 13, fontFamily: "inherit", background: "transparent" }}
            disabled={cargando || consultasMes >= LIMITE_MENSUAL}
          />
          <button
            onClick={() => enviar()}
            disabled={cargando || !input.trim() || consultasMes >= LIMITE_MENSUAL}
            style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: cargando || !input.trim() ? "#e2e8f0" : "linear-gradient(90deg,#6366f1,#8b5cf6)", color: cargando || !input.trim() ? "#94a3b8" : "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            {cargando ? "..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  )
}