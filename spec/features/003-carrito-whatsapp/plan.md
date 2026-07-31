# Plan: Carrito + Envío por WhatsApp

## Enfoque técnico
Todo el carrito es JavaScript vanilla inline en `index.html`. El estado del carrito se maneja en un array de objetos. Los cupones son un mapa clave-valor hardcodeado. El envío por WhatsApp se hace con un enlace `wa.me` con el mensaje codificado como texto.

## Archivos involucrados
- `index.html` — carrito JS inline (agregar, quitar, cantidades, totales), cupones, botón WhatsApp, CONFIG global

## Datos involucrados
- CONFIG: `WHATSAPP_NUM`, `WHATSAPP_DISPLAY`, `INSTAGRAM_HANDLE`, `PLATA_LEY`, `ENVIO_AMBATO`, `ENVIO_OTRA`
- Cupones: objeto clave-valor (frase → porcentaje descuento)

## Orden de implementación
1. Implementar estado del carrito (array + funciones)
2. Implementar UI del carrito (panel lateral con lista)
3. Implementar cálculo de totales (subtotal + envío - descuento)
4. Implementar cupones
5. Implementar generación de mensaje WhatsApp
6. Probar flujo completo
