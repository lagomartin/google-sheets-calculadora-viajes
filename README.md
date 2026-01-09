# 🚗 Calculadora de Recorridos y Costos para Google Sheets

Este proyecto contiene un script de **Google Apps Script** diseñado para automatizar el cálculo de distancias, tiempos estimados, consumo de combustible y costos de viaje directamente en Google Sheets.

## 📋 Características

* **Cálculo de Distancia Real:** Utiliza la fórmula *Haversine* para calcular la distancia entre dos coordenadas GPS (Latitud, Longitud) sin necesidad de APIs externas de pago.
* **Detección de Vehículos:** Permite seleccionar entre Moto, Auto o Camioneta, aplicando diferentes velocidades y consumos.
* **Cálculo de Costos:** Se conecta a una hoja de "Precios" para calcular el costo del viaje basándose en el precio actual de la Nafta o Diesel.
* **Robustez:** Capaz de leer coordenadas con formatos sucios (con comillas, espacios, etc.).

## 🚀 Instalación

1.  Abre tu documento de Google Sheets.
2.  Ve a **Extensiones** > **Apps Script**.
3.  Borra cualquier código existente y pega el contenido del archivo `Codigo.gs` de este repositorio.
4.  Guarda el proyecto.
5.  Recarga tu hoja de cálculo. Verás un nuevo menú llamado **"Calculadora Viajes"**.

## ⚙️ Configuración de la Hoja

Para que el script funcione, tu Google Sheet debe tener la siguiente estructura:

### Hoja 1: "Precios"
Debe contener los precios en la fila 2:
* **Celda A2:** Precio de la Nafta.
* **Celda B2:** Precio del Diesel.

### Hoja 2: "Calculadora"
Debe tener los encabezados en la fila 1 y los datos a partir de la fila 2:
* **Columna A:** Coordenadas Origen (ej: `-23.123, -65.123`).
* **Columna B:** Coordenadas Destino.
* **Columna C:** Ida y vuelta (Casilla de verificación).
* **Columna D:** Moto (Casilla de verificación).
* **Columna E:** Auto (Casilla de verificación).
* **Columna F:** Camioneta (Casilla de verificación).

El script llenará automáticamente las columnas G (Km), H (Tiempo), I (Litros) y J (Costo).

## 🛠 Personalización

Puedes modificar la constante `CONFIG` al inicio del script para ajustar los consumos y velocidades de tus vehículos:

```javascript
const CONFIG = {
  moto: { velocidad: 60, consumo: 5, tipo: 'nafta' },       
  auto: { velocidad: 80, consumo: 10, tipo: 'nafta' },      
  camioneta: { velocidad: 70, consumo: 12, tipo: 'diesel' } 
};
