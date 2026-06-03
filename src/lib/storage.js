import { supabase } from './supabase'

// Subir una imagen al Storage de Supabase
export async function subirImagen(archivo, carpeta = 'general') {
  try {
    const extension = archivo.name.split('.').pop()
    const nombreUnico = `${carpeta}/${Date.now()}.${extension}`

    const { data, error } = await supabase.storage
      .from('imagenes')
      .upload(nombreUnico, archivo, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // Obtener la URL pública de la imagen
    const { data: urlData } = supabase.storage
      .from('imagenes')
      .getPublicUrl(nombreUnico)

    return urlData.publicUrl
  } catch (error) {
    console.error('Error subiendo imagen:', error)
    throw error
  }
}

// Eliminar una imagen del Storage
export async function eliminarImagen(url) {
  try {
    const path = url.split('/imagenes/')[1]
    if (!path) return
    await supabase.storage.from('imagenes').remove([path])
  } catch (error) {
    console.error('Error eliminando imagen:', error)
  }
}