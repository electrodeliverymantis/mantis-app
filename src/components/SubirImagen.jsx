import { useState } from 'react'
import { subirImagen } from '../lib/storage'

export default function SubirImagen({ onImagenSubida, imagenActual, carpeta = 'general' }) {
  const [subiendo, setSubiendo] = useState(false)
  const [preview, setPreview] = useState(imagenActual || null)
  const [error, setError] = useState("")

  const handleArchivo = async (e) => {
    const archivo = e.target.files[0]
    if (!archivo) return

    // Validar tipo y tamaño
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!tiposPermitidos.includes(archivo.type)) {
      setError("Solo se permiten imágenes JPG, PNG o WebP")
      return
    }
    if (archivo.size > 5 * 1024 * 1024) {
      setError("La imagen no puede superar 5MB")
      return
    }

    setSubiendo(true)
    setError("")

    try {
      // Preview local inmediato
      const reader = new FileReader()
      reader.onload = (ev) => setPreview(ev.target.result)
      reader.readAsDataURL(archivo)

      // Subir a Supabase
      const url = await subirImagen(archivo, carpeta)
      onImagenSubida(url)
    } catch (err) {
      setError("Error al subir la imagen. Intentá de nuevo.")
      setPreview(imagenActual || null)
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div>
      {/* Preview */}
      {preview && (
        <div style={{ marginBottom: 10, position: 'relative', display: 'inline-block' }}>
          <img src={preview} alt="preview" style={{
            width: '100%', maxHeight: 200, objectFit: 'cover',
            borderRadius: 10, border: '2px solid #e2e8f0'
          }} />
          <button onClick={() => { setPreview(null); onImagenSubida(null) }} style={{
            position: 'absolute', top: 6, right: 6, background: '#ef4444',
            border: 'none', borderRadius: '50%', width: 24, height: 24,
            color: '#fff', cursor: 'pointer', fontSize: 14, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>×</button>
        </div>
      )}

      {/* Botón de carga */}
      {!preview && (
        <label style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
          borderRadius: 8, border: '2px dashed #cbd5e1', background: '#f8fafc',
          cursor: subiendo ? 'not-allowed' : 'pointer', fontSize: 13, color: '#64748b',
          transition: 'all 0.15s'
        }}>
          <input type="file" accept="image/*" onChange={handleArchivo}
            style={{ display: 'none' }} disabled={subiendo} />
          {subiendo ? '⏳ Subiendo...' : '📎 Adjuntar imagen'}
        </label>
      )}

      {error && (
        <div style={{ fontSize: 11, color: '#ef4444', marginTop: 6 }}>❌ {error}</div>
      )}
    </div>
  )
}