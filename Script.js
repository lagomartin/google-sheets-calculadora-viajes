/**
 * CONFIGURACIÓN
 */
const CONFIG = {
  moto: { velocidad: 60, consumo: 5, tipo: 'nafta' },       
  auto: { velocidad: 80, consumo: 10, tipo: 'nafta' },      
  camioneta: { velocidad: 70, consumo: 12, tipo: 'diesel' } 
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Calculadora Viajes')
    .addItem('1. PROBAR FILA 2 (Diagnóstico)', 'PROBAR_PRIMERA_FILA')
    .addItem('2. CALCULAR TODO', 'EJECUTAR_TODO')
    .addToUi();
}

/**
 * FUNCIÓN DE DIAGNÓSTICO: Analiza solo la fila 2 y muestra qué está pasando.
 */
function PROBAR_PRIMERA_FILA() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const hojaCalc = ss.getSheetByName("Calculadora");
  const hojaPrecios = ss.getSheetByName("Precios");

  if (!hojaCalc || !hojaPrecios) {
    ui.alert("❌ ERROR CRÍTICO", "No encuentro las hojas. Revisa que se llamen 'Calculadora' y 'Precios' exactamente.", ui.ButtonSet.OK);
    return;
  }
  
  // Activar la hoja para que veas lo que pasa
  hojaCalc.activate();

  // Leer datos crudos de la fila 2
  const rango = hojaCalc.getRange("A2:F2");
  const valores = rango.getValues()[0];
  const origenRaw = valores[0];
  const destinoRaw = valores[1];

  // Intentar extraer números
  const c1 = extraerLatLon(origenRaw);
  const c2 = extraerLatLon(destinoRaw);

  let mensaje = `🔎 ANÁLISIS DE FILA 2:\n\n`;
  mensaje += `Celda A2 (Origen): "${origenRaw}"\n`;
  mensaje += `Celda B2 (Destino): "${destinoRaw}"\n`;
  mensaje += `--------------------------------\n`;

  if (c1 && c2) {
    mensaje += `✅ Coordenadas detectadas:\n   Lat1: ${c1.lat}, Lon1: ${c1.lon}\n   Lat2: ${c2.lat}, Lon2: ${c2.lon}\n\n`;
    
    // Simular cálculo
    const dist = calcularHaversine(c1.lat, c1.lon, c2.lat, c2.lon);
    mensaje += `📏 Distancia calculada: ${dist.toFixed(2)} km\n`;
    mensaje += `\nSi estos datos se ven bien, ejecuta 'CALCULAR TODO'.`;
  } else {
    mensaje += `❌ ERROR: No pude extraer números de las coordenadas.\n`;
    mensaje += `El script espera algo como: "-23.123, -65.123".\n`;
    mensaje += `Posible causa: ¿Están vacías? ¿Tienen formato extraño?`;
  }

  ui.alert("DIAGNÓSTICO", mensaje, ui.ButtonSet.OK);
}

/**
 * FUNCIÓN PRINCIPAL: Procesa toda la hoja.
 */
function EJECUTAR_TODO() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojaCalc = ss.getSheetByName("Calculadora");
  const hojaPrecios = ss.getSheetByName("Precios");

  // Leer precios
  const pNafta = limpiarPrecio(hojaPrecios.getRange("A2").getValue());
  const pDiesel = limpiarPrecio(hojaPrecios.getRange("B2").getValue());

  // Leer datos
  const ultimaFila = hojaCalc.getLastRow();
  if (ultimaFila < 2) return;

  const datos = hojaCalc.getRange(2, 1, ultimaFila - 1, 6).getValues();
  const resultados = [];

  for (let i = 0; i < datos.length; i++) {
    const fila = datos[i];
    const c1 = extraerLatLon(fila[0]);
    const c2 = extraerLatLon(fila[1]);

    if (!c1 || !c2) {
      resultados.push(["Error Coord", "", 0, 0]);
      continue;
    }

    try {
      const idaVuelta = checkBool(fila[2]);
      const moto = checkBool(fila[3]);
      const camioneta = checkBool(fila[5]); // Columna F es índice 5

      // Cálculo Distancia
      let dist = calcularHaversine(c1.lat, c1.lon, c2.lat, c2.lon);
      if (idaVuelta) dist *= 2;

      // Selección Vehículo
      let v = CONFIG.auto;
      if (moto) v = CONFIG.moto;
      else if (camioneta) v = CONFIG.camioneta;

      // Cálculos Finales
      const tiempo = dist / v.velocidad;
      const litros = (dist / 100) * v.consumo;
      const precio = (v.tipo === 'diesel') ? pDiesel : pNafta;
      const costo = litros * precio;

      resultados.push([
        Number(dist.toFixed(2)),
        fmtTiempo(tiempo),
        Number(litros.toFixed(2)),
        Math.round(costo)
      ]);

    } catch (e) {
      resultados.push(["Error Calc", "", 0, 0]);
    }
  }

  // Escribir Resultados
  if (resultados.length > 0) {
    hojaCalc.getRange(2, 7, resultados.length, 4).setValues(resultados);
    // Formatos solicitados
    hojaCalc.getRange(2, 9, resultados.length, 1).setNumberFormat("0.00"); // Litros
    hojaCalc.getRange(2, 10, resultados.length, 1).setNumberFormat("$#,##0"); // Dinero
    
    SpreadsheetApp.getActiveSpreadsheet().toast("Cálculo completado exitosamente.");
  }
}

// --- HERRAMIENTAS ---

function extraerLatLon(val) {
  if (!val) return null;
  const txt = String(val);
  // Regex poderosa: busca cualquier secuencia de números, puntos o comas
  // Ejemplo: captura -23.456 y -65.789 ignorando comillas
  const matches = txt.match(/-?\d+[.,]?\d*/g);
  
  if (matches && matches.length >= 2) {
    // Reemplaza coma por punto para asegurar compatibilidad
    const lat = parseFloat(matches[0].replace(',', '.'));
    const lon = parseFloat(matches[1].replace(',', '.'));
    if (!isNaN(lat) && !isNaN(lon)) return { lat, lon };
  }
  return null;
}

function calcularHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function limpiarPrecio(val) {
  const v = String(val).replace(/[^\d.,]/g, '').replace(',', '.');
  return parseFloat(v) || 0;
}

function checkBool(val) {
  if (!val) return false;
  const s = String(val).toUpperCase();
  return s === 'TRUE' || s === 'VERDADERO' || val === true || val === 1;
}

function fmtTiempo(h) {
  const horas = Math.floor(h);
  const mins = Math.round((h - horas) * 60);
  return `${horas} hs ${mins} mins`;
}
