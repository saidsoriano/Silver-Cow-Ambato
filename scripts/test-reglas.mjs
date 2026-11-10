import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, getDoc, setDoc, getDocs, collection, serverTimestamp, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
const env = await initializeTestEnvironment({ projectId: 'demo-sc', firestore: { rules: readFileSync('/home/said/Silver Cow Ambato/Paguina_joyas/firestore.rules','utf8'), host:'127.0.0.1', port:8080 }});
await env.withSecurityRulesDisabled(async c => {
  const d = c.firestore();
  await setDoc(doc(d,'productos/P-1'),{nombre:'x'});
  await setDoc(doc(d,'costos/P-1'),{costo:3});
  await setDoc(doc(d,'vendedores/dome'),{nombre:'Dome',activo:true});
  await setDoc(doc(d,'vendedores/salo'),{nombre:'Salo',activo:false});
  await setDoc(doc(d,'config/privado'),{valoresBono:[10,15]});
  await setDoc(doc(d,'pedidos/SC-AAAAAA'),{codigo:'SC-AAAAAA'});
  await setDoc(doc(d,'pedidos_vendedor/SC-AAAAAA'),{sellerId:'dome',monto:10});
  await setDoc(doc(d,'ventas/v1'),{sellerId:'salo',estado:'pendiente'});
  await setDoc(doc(d,'codigos/DOME'),{pct:5});
  await setDoc(doc(d,'config/negocio'),{meta:50});
  await setDoc(doc(d,'roles/u1'),{role:'vendedor',sellerId:'dome',activo:true});
  await setDoc(doc(d,'roles/u2'),{role:'vendedor',sellerId:'salo',activo:false});
});
const anon = env.unauthenticatedContext().firestore();
const admin = env.authenticatedContext('a',{email:'jhetro2005@gmail.com',email_verified:true}).firestore();
const dome = env.authenticatedContext('u1').firestore();
const saloInactivo = env.authenticatedContext('u2').firestore();
const intruso = env.authenticatedContext('u9').firestore(); // logueado sin rol
let ok=0, bad=0;
async function t(n, p){ try{ await p; ok++; console.log('OK  ',n);}catch(e){ bad++; console.log('FAIL',n, e.message.slice(0,80)); } }
const venta = (sid, o={})=>({sellerId:sid,fecha:serverTimestamp(),piezas:[{codigo:'P-1',cantidad:1,precio:20}],subtotal:20,tipoDescuento:'codigo',descuento:1,precioFinal:19,metodoPago:'efectivo',estado:'pendiente',...o});
const pedido = (o={})=>({codigo:'SC-BBBBBB',items:[{c:'P-1',q:1,p:10}],subtotal:10,total:9.5,estado:'sin_confirmar',creado:serverTimestamp(),...o});
// cliente
await t('anon lee productos', assertSucceeds(getDoc(doc(anon,'productos/P-1'))));
await t('anon NO escribe productos', assertFails(setDoc(doc(anon,'productos/P-2'),{a:1})));
await t('anon NO lee costos', assertFails(getDoc(doc(anon,'costos/P-1'))));
await t('anon get codigo', assertSucceeds(getDoc(doc(anon,'codigos/DOME'))));
await t('anon NO lista codigos', assertFails(getDocs(collection(anon,'codigos'))));
await t('anon crea pedido valido', assertSucceeds(setDoc(doc(anon,'pedidos/SC-BBBBBB'),pedido())));
await t('anon NO crea pedido estado nuevo', assertFails(setDoc(doc(anon,'pedidos/SC-BBBBBB'),pedido({estado:'pagado'}))));
await t('anon NO crea pedido con campo extra', assertFails(setDoc(doc(anon,'pedidos/SC-BBBBBB'),pedido({hack:1}))));
await t('anon NO crea pedido total absurdo negativo', assertFails(setDoc(doc(anon,'pedidos/SC-BBBBBB'),pedido({total:-5}))));
await t('anon NO crea pedido codigo distinto al id', assertFails(setDoc(doc(anon,'pedidos/SC-CCCCCC'),pedido())));
await t('anon NO lee pedidos', assertFails(getDoc(doc(anon,'pedidos/SC-AAAAAA'))));
await t('anon NO borra pedidos', assertFails(deleteDoc(doc(anon,'pedidos/SC-AAAAAA'))));
// vendedor
await t('dome lee su vendedor', assertSucceeds(getDoc(doc(dome,'vendedores/dome'))));
await t('dome NO lee vendedor salo', assertFails(getDoc(doc(dome,'vendedores/salo'))));
await t('dome NO lee pedidos', assertFails(getDoc(doc(dome,'pedidos/SC-AAAAAA'))));
await t('dome lee su espejo', assertSucceeds(getDoc(doc(dome,'pedidos_vendedor/SC-AAAAAA'))));
await t('dome NO lee costos', assertFails(getDoc(doc(dome,'costos/P-1'))));
await t('dome NO lee venta de salo', assertFails(getDoc(doc(dome,'ventas/v1'))));
await t('dome crea venta propia pendiente', assertSucceeds(setDoc(doc(dome,'ventas/v2'),venta('dome'))));
await t('dome NO crea venta como salo', assertFails(setDoc(doc(dome,'ventas/v3'),venta('salo'))));
await t('dome NO crea venta confirmada', assertFails(setDoc(doc(dome,'ventas/v4'),venta('dome',{estado:'pagada'}))));
await t('dome lee config', assertSucceeds(getDoc(doc(dome,'config/negocio'))));
await t('dome NO escribe config', assertFails(setDoc(doc(dome,'config/negocio'),{meta:1})));
await t('dome NO escribe productos', assertFails(setDoc(doc(dome,'productos/P-1'),{a:1})));
// admin
await t('admin lee costos', assertSucceeds(getDoc(doc(admin,'costos/P-1'))));
await t('admin lee pedidos', assertSucceeds(getDoc(doc(admin,'pedidos/SC-AAAAAA'))));
await t('admin escribe productos', assertSucceeds(setDoc(doc(admin,'productos/P-1'),{nombre:'y'})));
await t('admin escribe resumenes', assertSucceeds(setDoc(doc(admin,'resumenes/r'),{sellerId:'dome'})));
await t('admin crea rol', assertSucceeds(setDoc(doc(admin,'roles/u3'),{role:'vendedor',sellerId:'sebas',activo:true})));
// roles y escalada
await t('anon NO lee roles', assertFails(getDoc(doc(anon,'roles/u1'))));
await t('dome lee su rol', assertSucceeds(getDoc(doc(dome,'roles/u1'))));
await t('dome NO cambia su rol', assertFails(setDoc(doc(dome,'roles/u1'),{role:'vendedor',sellerId:'salo',activo:true})));
await t('intruso NO se da rol', assertFails(setDoc(doc(intruso,'roles/u9'),{role:'vendedor',sellerId:'dome',activo:true})));
await t('intruso NO lee vendedor', assertFails(getDoc(doc(intruso,'vendedores/dome'))));
await t('intruso NO crea venta', assertFails(setDoc(doc(intruso,'ventas/v9'),venta('dome'))));
await t('salo inactivo NO lee su vendedor', assertFails(getDoc(doc(saloInactivo,'vendedores/salo'))));
await t('salo inactivo NO crea venta', assertFails(setDoc(doc(saloInactivo,'ventas/v8'),venta('salo'))));
await t('dome NO escribe resumenes', assertFails(setDoc(doc(dome,'resumenes/r2'),{sellerId:'dome'})));
await t('dome NO escribe espejo', assertFails(setDoc(doc(dome,'pedidos_vendedor/X'),{sellerId:'dome'})));
// consultas del panel del vendedor (Fase 3)
await t('dome lista SUS ventas', assertSucceeds(getDocs(query(collection(dome,'ventas'), where('sellerId','==','dome')))));
await t('dome NO lista ventas de salo', assertFails(getDocs(query(collection(dome,'ventas'), where('sellerId','==','salo')))));
await t('dome NO lista todas las ventas', assertFails(getDocs(collection(dome,'ventas'))));
await t('dome lista SUS pedidos espejo', assertSucceeds(getDocs(query(collection(dome,'pedidos_vendedor'), where('sellerId','==','dome')))));
await t('dome NO lista espejos de salo', assertFails(getDocs(query(collection(dome,'pedidos_vendedor'), where('sellerId','==','salo')))));
await t('salo inactivo NO lista sus ventas', assertFails(getDocs(query(collection(saloInactivo,'ventas'), where('sellerId','==','salo')))));
// ventas en persona (Fase 5)
await t('dome NO venta con campo extra', assertFails(setDoc(doc(dome,'ventas/v5'),venta('dome',{comision:999}))));
await t('dome NO venta precio final > subtotal', assertFails(setDoc(doc(dome,'ventas/v6'),venta('dome',{precioFinal:25}))));
await t('dome NO venta sin piezas', assertFails(setDoc(doc(dome,'ventas/v7'),venta('dome',{piezas:[]}))));
await t('dome NO venta con fecha inventada', assertFails(setDoc(doc(dome,'ventas/v10'),venta('dome',{fecha:Timestamp.fromMillis(0)}))));
await t('dome NO edita su venta', assertFails(setDoc(doc(dome,'ventas/v2'),venta('dome',{precioFinal:1}))));
await t('dome NO borra su venta', assertFails(deleteDoc(doc(dome,'ventas/v2'))));
await t('admin confirma venta', assertSucceeds(setDoc(doc(admin,'ventas/v2'),{estado:'pagada'},{merge:true})));
await t('admin marca pieza agotada', assertSucceeds(setDoc(doc(admin,'productos/P-1'),{estado:'agotado'},{merge:true})));
// avisos del admin (Fase 4)
await t('admin consulta vencidos', assertSucceeds(getDocs(query(collection(admin,'pedidos'), where('expira','<',Timestamp.now())))));
await t('admin consulta nuevos desde visto', assertSucceeds(getDocs(query(collection(admin,'pedidos'), where('creado','>',Timestamp.fromMillis(0)), orderBy('creado','desc')))));
await t('admin borra pedido', assertSucceeds(deleteDoc(doc(admin,'pedidos/SC-AAAAAA'))));
await t('admin guarda avisos/estado', assertSucceeds(setDoc(doc(admin,'avisos/estado'),{visto:serverTimestamp()})));
await t('dome NO lee avisos', assertFails(getDoc(doc(dome,'avisos/estado'))));
await t('anon NO consulta pedidos', assertFails(getDocs(query(collection(anon,'pedidos'), where('estado','==','sin_confirmar')))));
// comisiones (Fase 6)
await t('admin guarda resumen de dome', assertSucceeds(setDoc(doc(admin,'resumenes/dome_2026-11'),{sellerId:'dome',mes:'2026-11',comisionPagada:true})));
await t('admin guarda resumen de salo', assertSucceeds(setDoc(doc(admin,'resumenes/salo_2026-11'),{sellerId:'salo',mes:'2026-11'})));
await t('dome lista SUS resumenes', assertSucceeds(getDocs(query(collection(dome,'resumenes'), where('sellerId','==','dome')))));
await t('dome NO lista resumenes de salo', assertFails(getDocs(query(collection(dome,'resumenes'), where('sellerId','==','salo')))));
await t('admin registra pago', assertSucceeds(setDoc(doc(admin,'pagos/p1'),{sellerId:'dome',mes:'2026-11',monto:2.38,comprobante:'TX-1'})));
await t('admin consulta pagos del mes', assertSucceeds(getDocs(query(collection(admin,'pagos'), where('mes','==','2026-11')))));
await t('dome NO ve pagos/comprobantes', assertFails(getDocs(query(collection(dome,'pagos'), where('sellerId','==','dome')))));
await t('admin guarda config/negocio', assertSucceeds(setDoc(doc(admin,'config/negocio'),{pctCodigo:5,meta:50})));
await t('dome NO cambia reglas', assertFails(setDoc(doc(dome,'config/negocio'),{pctCodigo:50})));
await t('admin cambia pct de un codigo', assertSucceeds(setDoc(doc(admin,'codigos/DOME'),{pct:6},{merge:true})));
// auditoría final (Fase 8)
await t('anon crea pedido con vendedor activo', assertSucceeds(setDoc(doc(anon,'pedidos/SC-DDDDDD'),pedido({codigo:'SC-DDDDDD',sellerId:'dome'}))));
await t('anon NO atribuye pedido a vendedor inexistente', assertFails(setDoc(doc(anon,'pedidos/SC-EEEEEE'),pedido({codigo:'SC-EEEEEE',sellerId:'inventado'}))));
await t('anon NO atribuye pedido a vendedor inactivo', assertFails(setDoc(doc(anon,'pedidos/SC-FFFFFF'),pedido({codigo:'SC-FFFFFF',sellerId:'salo'}))));
await t('anon crea pedido sin vendedor (null)', assertSucceeds(setDoc(doc(anon,'pedidos/SC-GGGGGG'),pedido({codigo:'SC-GGGGGG',sellerId:null}))));
await t('dome NO lee config/privado', assertFails(getDoc(doc(dome,'config/privado'))));
await t('admin lee config/privado', assertSucceeds(getDoc(doc(admin,'config/privado'))));
await t('anon NO lee config', assertFails(getDoc(doc(anon,'config/negocio'))));
await t('anon NO lee vendedores', assertFails(getDoc(doc(anon,'vendedores/dome'))));
await t('anon NO lee resumenes', assertFails(getDocs(query(collection(anon,'resumenes'), where('sellerId','==','dome')))));
await t('dome NO escribe codigos', assertFails(setDoc(doc(dome,'codigos/DOME'),{pct:50})));
await t('dome NO escribe costos', assertFails(setDoc(doc(dome,'costos/P-1'),{costo:0})));
console.log(`\n${ok} ok / ${bad} fallos`);
await env.cleanup();
