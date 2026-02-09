'use client';

import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';

/**
 * Utilidades para decodificar códigos en identificaciones (PDF417 y QR)
 * Optimizadas para alta densidad y condiciones de luz variables.
 */

let reader: BrowserMultiFormatReader | null = null;

function getReader() {
  if (typeof window !== 'undefined' && !reader) {
    const hints = new Map();
    // Soporte para todos los formatos de seguridad de identificaciones
    const formats = [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.PDF_417,
      BarcodeFormat.AZTEC,
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.CODE_128
    ];
    
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
    hints.set(DecodeHintType.TRY_HARDER, true); // Búsqueda exhaustiva
    hints.set(DecodeHintType.CHARACTER_SET, 'UTF-8');
    
    reader = new BrowserMultiFormatReader(hints);
  }
  return reader;
}

/**
 * Intenta decodificar un frame de video en vivo.
 */
export async function decodePDF417FromVideo(videoElement: HTMLVideoElement): Promise<string | null> {
  const zxing = getReader();
  if (!zxing) return null;

  try {
    // decodeOnceFromVideoElement es más estable para flujos continuos
    const result = await zxing.decodeOnceFromVideoElement(videoElement);
    return result ? result.getText() : null;
  } catch (err) {
    return null;
  }
}

/**
 * Decodifica un código desde una imagen (archivo subido).
 * Utiliza un método más robusto para procesar imágenes estáticas.
 */
export async function decodePDF417FromImage(imageSrc: string): Promise<string | null> {
  const zxing = getReader();
  if (!zxing) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      try {
        // Intentamos decodificar directamente desde el elemento imagen
        const result = await zxing.decodeFromImageElement(img);
        resolve(result ? result.getText() : null);
      } catch (err) {
        console.warn("ZXing: Error en decodificación primaria, intentando fallback...");
        // Reintento con el lector base si el especializado falla
        try {
          const fallback = new BrowserMultiFormatReader();
          const result = await fallback.decodeFromImageElement(img);
          resolve(result ? result.getText() : null);
        } catch (e) {
          resolve(null);
        }
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageSrc;
  });
}

/**
 * Parsea los datos de la INE de forma robusta.
 * Maneja formatos PDF417 antiguos y los nuevos códigos QR con URLs.
 */
export function parseINEData(rawText: string) {
  const data: Record<string, string> = { raw: rawText };
  
  try {
    // 1. Extraer CURP (18 caracteres: 4 letras, 6 números, 6 letras, 2 caracteres)
    const curpRegex = /[A-Z]{4}\d{6}[A-Z]{6}[A-Z\d]{2}/;
    const curpMatch = rawText.match(curpRegex);
    if (curpMatch) data.curp = curpMatch[0];

    // 2. Extraer Clave de Elector (18 caracteres)
    const claveRegex = /[A-Z]{6}\d{8}[A-Z]\d{3}/;
    const claveMatch = rawText.match(claveRegex);
    if (claveMatch) data.claveElector = claveMatch[0];

    // 3. Extraer CIC (Código Identificador de Credencial)
    const cicRegex = /(?:IDMEX|CIC)\s*(\d{9,10})/i;
    const cicMatch = rawText.match(cicRegex);
    if (cicMatch) data.cic = cicMatch[1];

    // 4. Si es una URL (INEs nuevas), intentar extraer parámetros
    if (rawText.includes('app.ine.mx') || rawText.includes('?')) {
      const urlParams = new URLSearchParams(rawText.split('?')[1]);
      if (urlParams.has('curp')) data.curp = urlParams.get('curp')!;
      if (urlParams.has('cve')) data.claveElector = urlParams.get('cve')!;
    }

    // 5. Parseo de MRZ (Zona legible por máquina) si existe
    if (rawText.includes('IDMEX')) {
      const mrzLines = rawText.split('\n').filter(l => l.length > 10);
      if (mrzLines.length >= 3) {
        // La línea 3 suele contener el nombre
        const namePart = mrzLines[2].replace(/<+/g, ' ').trim();
        if (namePart) data.posibleNombre = namePart;
      }
    }
  } catch (e) {
    console.warn("Error en el parseo de datos INE:", e);
  }

  return data;
}
