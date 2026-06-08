import { supabase } from './supabase'

export async function enviarEmail({ para, asunto, html }) {
  try {
    const { data, error } = await supabase.functions.invoke('enviar-email', {
      body: { para, asunto, html }
    })
    if (error) throw error
    return { ok: true, data }
  } catch (error) {
    console.error('Error enviando email:', error)
    return { ok: false, error }
  }
}

export function templateCambioEstado({ numeroOrden, estado, descripcion, empresa }) {
  const colores = {
    pendiente: "#f59e0b",
    agendado: "#3b82f6",
    en_proceso: "#8b5cf6",
    espera_mat: "#f97316",
    espera_definicion: "#0891b2",
    espera_respuesta: "#7c3aed",
    resuelto: "#10b981",
  }
  const color = colores[estado] || "#6366f1"
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 12px;">
      <div style="background: linear-gradient(90deg, #6366f1, #8b5cf6); padding: 24px; border-radius: 10px; margin-bottom: 24px;">
        <h1 style="color: white; margin: 0; font-size: 24px;">⚙ MANTIS</h1>
        <p style="color: #e0e7ff; margin: 4px 0 0;">Sistema de Gestión de Mantenimiento</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 10px; border-left: 4px solid ${color};">
        <h2 style="color: #0f172a; margin: 0 0 8px;">Actualización de Orden de Trabajo</h2>
        <p style="color: #64748b; margin: 0 0 16px;">La orden <strong>${numeroOrden}</strong> fue actualizada.</p>
        <div style="background: #f1f5f9; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px;">
          <span style="background: ${color}20; color: ${color}; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 14px;">
            Nuevo estado: ${estado.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>
        ${descripcion ? `<p style="color: #374151; font-size: 14px;"><strong>Novedad:</strong> ${descripcion}</p>` : ''}
        ${empresa ? `<p style="color: #94a3b8; font-size: 12px;">Empresa: ${empresa}</p>` : ''}
      </div>
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
        Este email fue enviado automáticamente por MANTIS. No respondas este mensaje.
      </p>
    </div>
  `
}

export function templateNuevaOrden({ numeroOrden, parte, descripcion, sector, empresa }) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 24px; border-radius: 12px;">
      <div style="background: linear-gradient(90deg, #6366f1, #8b5cf6); padding: 24px; border-radius: 10px; margin-bottom: 24px;">
        <h1 style="color: white; margin: 0; font-size: 24px;">⚙ MANTIS</h1>
        <p style="color: #e0e7ff; margin: 4px 0 0;">Sistema de Gestión de Mantenimiento</p>
      </div>
      <div style="background: white; padding: 24px; border-radius: 10px; border-left: 4px solid #6366f1;">
        <h2 style="color: #0f172a; margin: 0 0 8px;">🆕 Nueva Orden de Trabajo</h2>
        <p style="color: #64748b; margin: 0 0 16px;">Se creó una nueva orden que requiere atención.</p>
        <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
          <p style="margin: 0 0 8px; font-size: 14px;"><strong>N° Orden:</strong> ${numeroOrden}</p>
          <p style="margin: 0 0 8px; font-size: 14px;"><strong>Parte:</strong> ${parte}</p>
          ${sector ? `<p style="margin: 0 0 8px; font-size: 14px;"><strong>Sector:</strong> ${sector}</p>` : ''}
          <p style="margin: 0; font-size: 14px;"><strong>Descripción:</strong> ${descripcion}</p>
        </div>
        ${empresa ? `<p style="color: #94a3b8; font-size: 12px;">Empresa: ${empresa}</p>` : ''}
      </div>
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
        Este email fue enviado automáticamente por MANTIS. No respondas este mensaje.
      </p>
    </div>
  `
}