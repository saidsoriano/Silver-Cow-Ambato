# Tasks — 003-carrito-whatsapp

Verificado contra `index.html` y el smoke test de la sesión 010 (2026-10-07).

- [x] Definir CONFIG global en index.html (WHATSAPP_NUM, ENVIO_AMBATO, ENVIO_OTRA, etc.) — `index.html:608`
- [x] Implementar array de carrito + funciones (agregar, quitar, actualizar cantidad) — `agregarAlCarrito:653`, `eliminarDelCarrito:715`
- [x] Implementar UI del carrito (panel lateral con productos, cantidades, botón eliminar) — `#carritoOverlay`, `#carritoBody`, `#carritoFooter`
- [x] Implementar selector de tipo de envío (Ambato / otras provincias) — `#btnAmbato`, `#btnOtraCiudad`
- [x] Implementar campo de cupón + validación + aplicación de descuento — `aplicarCupon:736`
- [x] Implementar cálculo automático de subtotal, envío, descuento y total — `#totalFinal` y `enviarPedidoWhatsApp:846`
- [x] Implementar botón "Enviar pedido por WhatsApp" — `#btnWhatsapp`
- [x] Generar mensaje formateado con resumen del pedido — `enviarPedidoWhatsApp` arma `msg` con subtotal/envío/descuento/total
- [~] Probar flujo: agregar productos → ajustar cantidades → seleccionar envío → aplicar cupón → enviar WhatsApp — agregado, contador, panel y total verificados en el smoke test de la sesión 010; **el paso final de envío real no se automatiza** (dispara `wa.me` con el teléfono del dueño)
