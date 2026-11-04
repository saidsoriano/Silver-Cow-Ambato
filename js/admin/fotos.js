// ══════════════════════════════════════════════════
// FOTOS — subir/reemplazar a Supabase Storage
// Fase 4 de spec/features/010-vista-admin/tasks.md
//
// Cada producto tiene como máximo UNA foto nueva: se sube siempre al
// mismo nombre de archivo (el código), con "upsert" activado, así que
// reemplazar una foto sobrescribe la anterior en vez de acumular
// archivos sueltos en el bucket.
//
// supabase-config.js importa el SDK desde un CDN externo (cdn.jsdelivr.net).
// Si ese import fuera estático acá arriba, una falla de red/CDN al cargar
// la página rompería TODO productos.js (tabs, lista, buscador, filtros),
// no solo la subida de fotos — se vio pasar en vivo. Por eso se importa
// recién adentro de subirFoto(), solo cuando el dueño sube una foto de
// verdad: el resto del panel queda sano aunque el CDN falle.
// ══════════════════════════════════════════════════
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const PESO_MAXIMO = 8 * 1024 * 1024; // 8 MB, de sobra para una foto de producto

/**
 * Sube `archivo` reemplazando la foto de `codigo` y devuelve la URL
 * pública final, o lanza un Error con un mensaje para mostrar tal cual.
 */
export async function subirFoto(codigo, archivo) {
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
    throw new Error("Solo se aceptan fotos JPG, PNG o WEBP.");
  }
  if (archivo.size > PESO_MAXIMO) {
    throw new Error("La foto pesa demasiado (máximo 8 MB).");
  }

  const { supabase, BUCKET } = await import("./supabase-config.js");

  const extension = archivo.type.split("/")[1].replace("jpeg", "jpg");
  const ruta = `${codigo}.${extension}`;

  const { error: errorSubida } = await supabase.storage
    .from(BUCKET)
    .upload(ruta, archivo, { upsert: true, contentType: archivo.type });

  if (errorSubida) throw new Error(errorSubida.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(ruta);
  // Supabase cachea agresivo por nombre de archivo; se agrega la hora
  // como parámetro para que la foto nueva se vea al toque, no la vieja
  // cacheada en el navegador.
  return `${data.publicUrl}?t=${Date.now()}`;
}
