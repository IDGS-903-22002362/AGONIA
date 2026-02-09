'use client';

import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';

/**
 * Utilidades para decodificar códigos en identificaciones (PDF417 y QR)
 */

let reader: BrowserMultiFormatReader | null = null;

function getReader() {
  if (typeof window !== 'undefined' && !reader) {
    const hints = new Map();
    // Permitimos múltiples formatos para soportar INEs viejas (PDF417) y nuevas (QR)
    const formats = [
      BarcodeFormat.PDF_417, 
      BarcodeFormat.QR_CODE, 
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.AZTEC
    ];
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
    hints.set(DecodeHintType.TRY_HARDER, true); // Aumenta la precisión en imágenes difíciles
    
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
    const result = await zxing.decodeOnceFromVideoElement(videoElement);
    return result ? result.getText() : null;
  } catch (err) {
    return null;
  }
}

/**
 * Decodifica un código desde una imagen (archivo subido).
 */
export async function decodePDF417FromImage(imageSrc: string): Promise<string | null> {
  const zxing = getReader();
  if (!zxing) return null;

  try {
    const result = await zxing.decodeFromImageUrl(imageSrc);
    return result ? result.getText() : null;
  } catch (err) {
    console.warn("ZXing: No se detectó código en la imagen subida. Reintentando con configuraciones base...");
    try {
      // Intento sin hints específicos por si acaso
      const fallbackReader = new BrowserMultiFormatReader();
      const result = await fallbackReader.decodeFromImageUrl(imageSrc);
      return result ? result.getText() : null;
    } catch (e) {
      return null;
    }
  }
}

/**
 * Intenta limpiar el texto decodificado y extraer campos comunes de la INE.
 * Soporta tanto el formato PDF417 antiguo como el contenido de los nuevos QR.
 */
export function parseINEData(rawText: string) {
  const data: Record<string, string> = { raw: rawText };
  
  try {
    // Buscar patrones comunes de CURP (18 caracteres)
    const curpMatch = rawText.match(/[A-Z]{4}\d{6}[A-Z]{6}[A-Z\d]{2}/);
    if (curpMatch) data.curp = curpMatch[0];

    // Buscar Clave de Elector (18 caracteres)
    const claveMatch = rawText.match(/[A-Z]{6}\d{8}[A-Z]\d{3}/);
    if (claveMatch) data.claveElector = claveMatch[0];

    // Buscar CIC (Común en el texto del reverso e IDs)
    const cicMatch = rawText.match(/(?:IDMEX|CIC)\s*(\d{9,10})/i);
    if (cicMatch) data.cic = cicMatch[1];

    // Intentar extraer nombre si viene en formato MRZ (línea 3 de la zona legible)
    if (rawText.includes('<<')) {
      const parts = rawText.split('<<');
      if (parts.length > 1) {
        // Lógica simple de limpieza para el prototipo
        data.posibleNombre = parts[parts.length - 1].replace(/<+/g, ' ').trim();
      }
    }
  } catch (e) {
    console.warn("Error en el parseo best-effort de INE:", e);
  }

  return data;
}
