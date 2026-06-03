import { useState } from 'react'
import { useChat } from '../hooks/useChat'
import SubirImagen from './SubirImagen'

export default function Chat({ ordenId, usuarioNombre }) {
  const { mensajes, cargando, enviarMensaje } = useChat(ordenId)
  const [texto, setTexto] = useState("")
  const [imagenUrl, setImagenUrl] = useState("")
  const [enviando, setEnviando] = useState(false)

  const handleEnviar = async () => {
    if (!texto.trim() && !imagenUrl) return
    setEnviando(true)
    try {
      await enviarMensaje(texto, usuarioNombre, imagenUrl || null)
      setTexto("")
      setImagenUrl("")
    } catch (err) {
      console.error(err)
    } finally {
      setEnviando(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEnviar()
    }
  }

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 8px #00000010", marginTop: 20 }}>
      <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
        💬 Chat de la orden
      </h3>

      {/* Lista de mensajes */}
      <div style={{ 
        minHeight: 120, maxHeight: 400, overflowY: "auto",
        marginBottom: 16, display: "flex", flexDirection: "column", gap: 12
      }}>
        {cargando ? (
          <div style={{ textAlign: "center", padding: 20, color: "#94a3b8", fontSize: 13 }}>Cargando mensajes...</div>
        ) : mensajes.length === 0 ? (
          <div style={{ textAlign: "center", padding: 20, color: "#94a3b8", fontSize: 13 }}>
            No hay mensajes todavía. Iniciá la conversación.
          </div>
        ) : (
          mensajes.map((m, i) => {
            const esMio = m.usuario_nombre === usuarioNombre
            return (
              <div key={i} style={{
                display: "flex", flexDirection: "column",
                alignItems: esMio ? "flex-end" : "flex-start"
              }}>
                <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4, fontWeight: 600 }}>
                  {m.usuario_nombre || "Usuario"} · {new Date(m.created_at).toLocaleString("es-AR")}
                </div>
                <div style={{
                  maxWidth: "75%", padding: "10px 14px", borderRadius: 12,
                  background: esMio ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#f1f5f9",
                  color: esMio ? "#fff" : "#374151",
                  fontSize: 13, lineHeight: 1.5,
                  borderBottomRightRadius: esMio ? 4 : 12,
                  borderBottomLeftRadius: esMio ? 12 : 4,
                }}>
                  {m.mensaje && <p style={{ margin: 0 }}>{m.mensaje}</p>}
                  {m.imagen_url && (
                    <img src={m.imagen_url} alt="adjunto" style={{
                      width: "100%", maxHeight: 200, objectFit: "cover",
                      borderRadius: 8, marginTop: m.mensaje ? 8 : 0, cursor: "pointer"
                    }} onClick={() => window.open(m.imagen_url, '_blank')} />
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Preview imagen */}
      {imagenUrl && (
        <div style={{ marginBottom: 10 }}>
          <img src={imagenUrl} alt="preview" style={{ maxHeight: 100, borderRadius: 8, border: "2px solid #e2e8f0" }} />
          <button onClick={() => setImagenUrl("")} style={{ marginLeft: 8, background: "#fee2e2", border: "none", borderRadius: 6, padding: "3px 8px", color: "#ef4444", cursor: "pointer", fontSize: 12 }}>Quitar</button>
        </div>
      )}

      {/* Input */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribí un mensaje... (Enter para enviar)"
            rows={2}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 10,
              border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none",
              fontFamily: "inherit", resize: "none", boxSizing: "border-box",
              background: "#f8fafc"
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <SubirImagen
            onImagenSubida={(url) => setImagenUrl(url || "")}
            imagenActual={null}
            carpeta="chat"
          />
          <button onClick={handleEnviar} disabled={enviando || (!texto.trim() && !imagenUrl)} style={{
            padding: "10px 16px", borderRadius: 10, border: "none",
            background: enviando ? "#4b5563" : "linear-gradient(90deg,#6366f1,#8b5cf6)",
            color: "#fff", fontWeight: 700, fontSize: 13,
            cursor: enviando ? "not-allowed" : "pointer", fontFamily: "inherit",
            whiteSpace: "nowrap"
          }}>
            {enviando ? "..." : "Enviar →"}
          </button>
        </div>
      </div>
      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 6 }}>Enter para enviar · Shift+Enter para nueva línea</div>
    </div>
  )
}