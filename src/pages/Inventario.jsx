import { useState } from 'react'
import { useInventario } from '../hooks/useInventario'
import { useAuth } from '../context/AuthContext'
import SubirImagen from '../components/SubirImagen'

const CATEGORIAS_MATERIAL = ["Repuestos", "Lubricantes", "Eléctrico", "Hidráulico", "Neumático", "Herramientas", "Seguridad", "Limpieza", "Otros"]
const CATEGORIAS_HERRAMIENTA = ["Medición", "Corte", "Ajuste", "Elevación", "Eléctrica", "Neumática", "Otros"]
const UNIDADES = ["unidad", "kg", "litro", "metro", "par", "caja", "rollo"]

const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#0f172a", outline: "none", fontFamily: "inherit", background: "#f8fafc", boxSizing: "border-box" }
const labelStyle = { display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }

export default function Inventario() {
  const { items, cargando, crearItem, actualizarItem, eliminarItem } = useInventario()
  const { usuario } = useAuth()
  const [tab, setTab] = useState("material")
  const [busqueda, setBusqueda] = useState("")
  const [mostrarForm, setMostrarForm] = useState(false)
  const [itemEditando, setItemEditando] = useState(null)
  const [mostrarMovimiento, setMostrarMovimiento] = useState(false)
  const [itemMovimiento, setItemMovimiento] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    tipo: "material", nombre: "", codigo: "", categoria: "",
    descripcion: "", stock_actual: 0, stock_minimo: 0,
    unidad: "unidad", ubicacion: "", imagen_url: ""
  })
  const [movForm, setMovForm] = useState({ tipo_movimiento: "entrada", cantidad: 1, descripcion: "" })

  const canEdit = usuario?.role === 'admin' || usuario?.role === 'mantenimiento'

  const itemsFiltrados = items
    .filter(i => i.tipo === tab)
    .filter(i => !busqueda || i.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || i.codigo?.toLowerCase().includes(busqueda.toLowerCase()))

  const stockBajo = items.filter(i => i.tipo === 'material' && i.stock_actual <= i.stock_minimo && i.stock_minimo > 0)

  const abrirForm = (item = null) => {
    if (item) {
      setForm({ tipo: item.tipo, nombre: item.nombre, codigo: item.codigo || "", categoria: item.categoria || "", descripcion: item.descripcion || "", stock_actual: item.stock_actual, stock_minimo: item.stock_minimo, unidad: item.unidad || "unidad", ubicacion: item.ubicacion || "", imagen_url: item.imagen_url || "" })
      setItemEditando(item)
    } else {
      setForm({ tipo: tab, nombre: "", codigo: "", categoria: "", descripcion: "", stock_actual: 0, stock_minimo: 0, unidad: "unidad", ubicacion: "", imagen_url: "" })
      setItemEditando(null)
    }
    setMostrarForm(true)
  }

  const handleGuardar = async () => {
    if (!form.nombre) { setError("El nombre es obligatorio"); return }
    setGuardando(true); setError("")
    try {
      if (itemEditando) await actualizarItem(itemEditando.id, form)
      else await crearItem(form)
      setMostrarForm(false)
    } catch { setError("Error al guardar") }
    finally { setGuardando(false) }
  }

  const handleMovimiento = async () => {
    if (!movForm.cantidad || movForm.cantidad <= 0) { setError("Cantidad inválida"); return }
    setGuardando(true); setError("")
    try {
      const nuevoStock = movForm.tipo_movimiento === 'entrada'
        ? itemMovimiento.stock_actual + parseFloat(movForm.cantidad)
        : itemMovimiento.stock_actual - parseFloat(movForm.cantidad)
      await actualizarItem(itemMovimiento.id, { stock_actual: nuevoStock })
      setMostrarMovimiento(false)
      setMovForm({ tipo_movimiento: "entrada", cantidad: 1, descripcion: "" })
    } catch { setError("Error al registrar movimiento") }
    finally { setGuardando(false) }
  }

  const colorStock = (item) => {
    if (item.tipo !== 'material') return "#10b981"
    if (item.stock_actual <= 0) return "#ef4444"
    if (item.stock_actual <= item.stock_minimo) return "#f59e0b"
    return "#10b981"
  }

  return (
    <div>
      {/* Alertas stock bajo */}
      {stockBajo.length > 0 && (
        <div style={{ background: "#fef3c7", border: "1px solid #f59e0b40", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, color: "#d97706", fontSize: 14 }}>{stockBajo.length} material{stockBajo.length > 1 ? 'es' : ''} con stock bajo</div>
            <div style={{ fontSize: 12, color: "#92400e" }}>{stockBajo.map(i => i.nombre).join(', ')}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[{ id: "material", etiqueta: "📦 Materiales y Repuestos" }, { id: "herramienta", etiqueta: "🔧 Herramientas" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", background: tab === t.id ? "linear-gradient(90deg,#6366f1,#8b5cf6)" : "#fff", color: tab === t.id ? "#fff" : "#64748b", boxShadow: "0 1px 4px #00000010" }}>
            {t.etiqueta}
            <span style={{ marginLeft: 6, background: tab === t.id ? "#ffffff30" : "#f1f5f9", borderRadius: 10, padding: "1px 6px", fontSize: 11 }}>
              {items.filter(i => i.tipo === t.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        {canEdit && (
          <button onClick={() => abrirForm()} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            + Nuevo {tab === 'material' ? 'Material' : 'Herramienta'}
          </button>
        )}
        <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="🔍 Buscar..." style={{ padding: "9px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", fontFamily: "inherit", background: "#fff", width: 250 }} />
      </div>

      {/* Tabla */}
      {cargando ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>⚙ Cargando...</div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 8px #00000010" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                {tab === 'material'
                  ? ["Nombre", "Código", "Categoría", "Stock", "Stock Mín.", "Ubicación", ""].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</th>)
                  : ["Nombre", "Código", "Categoría", "Estado", "Ubicación", ""].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</th>)
                }
              </tr>
            </thead>
            <tbody>
              {itemsFiltrados.map((item, i) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {item.imagen_url && <img src={item.imagen_url} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }} />}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{item.nombre}</div>
                        {item.descripcion && <div style={{ fontSize: 11, color: "#94a3b8" }}>{item.descripcion.substring(0, 40)}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{item.codigo || "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{item.categoria || "—"}</td>
                  {tab === 'material' ? (
                    <>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: colorStock(item) }}>
                          {item.stock_actual} {item.unidad}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{item.stock_minimo} {item.unidad}</td>
                    </>
                  ) : (
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: "#d1fae5", color: "#065f46", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>✅ Disponible</span>
                    </td>
                  )}
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b" }}>{item.ubicacion || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {canEdit && tab === 'material' && (
                        <button onClick={() => { setItemMovimiento(item); setMostrarMovimiento(true) }} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #6366f140", background: "#f5f3ff", color: "#6366f1", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>± Stock</button>
                      )}
                      {canEdit && (
                        <button onClick={() => abrirForm(item)} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>✏️</button>
                      )}
                      {canEdit && (
                        <button onClick={() => { if (confirm("¿Eliminar?")) eliminarItem(item.id) }} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #ef444440", background: "#fee2e2", color: "#ef4444", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>🗑</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {itemsFiltrados.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>No hay {tab === 'material' ? 'materiales' : 'herramientas'} cargados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal nuevo/editar */}
      {mostrarForm && (
        <div style={{ position: "fixed", inset: 0, background: "#00000060", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => e.target === e.currentTarget && setMostrarForm(false)}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 540, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 64px #00000040" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff" }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{itemEditando ? "Editar" : "Nuevo"} {form.tipo === 'material' ? 'Material' : 'Herramienta'}</h2>
              <button onClick={() => setMostrarForm(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 16, color: "#64748b" }}>×</button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Tipo</label>
                  <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} style={inputStyle}>
                    <option value="material">📦 Material / Repuesto</option>
                    <option value="herramienta">🔧 Herramienta</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Categoría</label>
                  <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} style={inputStyle}>
                    <option value="">Seleccionar...</option>
                    {(form.tipo === 'material' ? CATEGORIAS_MATERIAL : CATEGORIAS_HERRAMIENTA).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Nombre *</label>
                  <input type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Ej: Rodamiento 6205" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Código</label>
                  <input type="text" value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})} placeholder="Ej: ROD-6205" style={inputStyle} />
                </div>
                {form.tipo === 'material' && (
                  <>
                    <div>
                      <label style={labelStyle}>Stock actual</label>
                      <input type="number" value={form.stock_actual} onChange={e => setForm({...form, stock_actual: parseFloat(e.target.value) || 0})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Stock mínimo</label>
                      <input type="number" value={form.stock_minimo} onChange={e => setForm({...form, stock_minimo: parseFloat(e.target.value) || 0})} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Unidad</label>
                      <select value={form.unidad} onChange={e => setForm({...form, unidad: e.target.value})} style={inputStyle}>
                        {UNIDADES.map(u => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                  </>
                )}
                <div>
                  <label style={labelStyle}>Ubicación</label>
                  <input type="text" value={form.ubicacion} onChange={e => setForm({...form, ubicacion: e.target.value})} placeholder="Ej: Estante A3" style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Imagen (opcional)</label>
                <SubirImagen onImagenSubida={(url) => setForm({...form, imagen_url: url || ""})} imagenActual={form.imagen_url} carpeta="inventario" />
              </div>
              {error && <div style={{ background: "#fee2e2", color: "#ef4444", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 14 }}>❌ {error}</div>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setMostrarForm(false)} style={{ padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
                <button onClick={handleGuardar} disabled={guardando} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: guardando ? "#4b5563" : "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: guardando ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                  {guardando ? "Guardando..." : itemEditando ? "Guardar cambios" : "Crear"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal movimiento de stock */}
      {mostrarMovimiento && itemMovimiento && (
        <div style={{ position: "fixed", inset: 0, background: "#00000060", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 400, padding: 24, boxShadow: "0 24px 64px #00000040" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>± Ajustar Stock</h3>
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{itemMovimiento.nombre}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Stock actual: <strong>{itemMovimiento.stock_actual} {itemMovimiento.unidad}</strong></div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Tipo de movimiento</label>
              <select value={movForm.tipo_movimiento} onChange={e => setMovForm({...movForm, tipo_movimiento: e.target.value})} style={inputStyle}>
                <option value="entrada">📥 Entrada (suma)</option>
                <option value="salida">📤 Salida (resta)</option>
                <option value="ajuste">🔄 Ajuste manual</option>
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Cantidad</label>
              <input type="number" value={movForm.cantidad} onChange={e => setMovForm({...movForm, cantidad: parseFloat(e.target.value) || 0})} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Motivo</label>
              <input type="text" value={movForm.descripcion} onChange={e => setMovForm({...movForm, descripcion: e.target.value})} placeholder="Ej: Compra, uso en OT-2026-001..." style={inputStyle} />
            </div>
            {error && <div style={{ background: "#fee2e2", color: "#ef4444", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 14 }}>❌ {error}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => { setMostrarMovimiento(false); setError("") }} style={{ padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
              <button onClick={handleMovimiento} disabled={guardando} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: guardando ? "#4b5563" : "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: guardando ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                {guardando ? "Guardando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}