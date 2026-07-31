# Especificación: Carrito + Envío por WhatsApp

## Historia de usuario
> Como cliente, quiero seleccionar productos, ver el total y enviar mi pedido por WhatsApp para consultar disponibilidad y coordinar la entrega.

## Descripción
Carrito de compras 100% client-side. El usuario agrega productos desde el catálogo, selecciona tipo de envío (Ambato sin costo, otras provincias con recargo), aplica cupón de descuento si conoce la frase, y envía todo como mensaje formateado por WhatsApp.

## Criterios de aceptación
- [ ] Botón "Agregar al carrito" en cada producto del grid
- [ ] Panel lateral/carrusel del carrito con productos agregados
- [ ] Cantidad ajustable por producto (sumar/restar)
- [ ] Eliminar producto del carrito
- [ ] Selector de tipo de envío: Ambato (gratis) / otras provincias ($5)
- [ ] Campo para código de cupón con descuento aplicable
- [ ] Cálculo automático: subtotal + envío - descuento = total
- [ ] Botón "Enviar pedido por WhatsApp" genera mensaje formateado
- [ ] Mensaje incluye: lista de productos, subtotal, envío, descuento, total
- [ ] El cupón actual está en fase de prueba (no público)

## Dependencias
- Archivo: `index.html` (carrito JS inline, cupones inline, CONFIG global)
- CONFIG: `WHATSAPP_NUM`, `ENVIO_AMBATO`, `ENVIO_OTRA`
