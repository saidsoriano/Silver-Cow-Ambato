// ══════════════════════════════════════════════════
// CONEXIÓN A SUPABASE — solo Storage (fotos)
// Proyecto "silver-cow-storage" (plan Free, sin tarjeta). La clave
// "sb_publishable_..." no es secreta — está hecha para exponerse en el
// navegador. Lo que protege el bucket son las políticas de Storage
// (ver spec/features/010-vista-admin/spec.md § infraestructura).
// ══════════════════════════════════════════════════
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://jgzysksqcgqasmhvromp.supabase.co";
const SUPABASE_KEY = "sb_publishable_ummHco3IH9x6GIbxmViY8Q_eshIOM5C";
const BUCKET = "fotos-productos";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
export { BUCKET };
