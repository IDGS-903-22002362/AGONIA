'use client';

import { BrowserPDF417Reader } from '@zxing/library';

/**
 * Utilidades para decodificar códigos PDF417 (Reverso de INE)
 */

// Mantenemos una instancia única para evitar múltiples inicializaciones
let reader: BrowserPDF417Reader | null = null;

function getReader() {
  if (typeof window !== 'undefined' && !reader) {
    reader = new BrowserPDF417Reader();
  }
  return reader;
}

/**
 * Intenta decodificar un frame de video.
 * Usamos un método no bloqueante que no tome el control total del video.
 */
export async function decodePDF417FromVideo(videoElement: HTMLVideoElement): Promise<string | null> {
  const zxing = getReader();
  if (!zxing) return null;

  try {
    // decodeOnceFromVideoElement intenta decodificar el frame actual
    const result = await zxing.decodeOnceFromVideoElement(videoElement);
    return result ? result.getText() : null;
  } catch (err) {
    // Es normal que falle si no hay código en el frame, no logueamos error
    return null;
  }
}

export async function decodePDF417FromImage(imageSrc: string): Promise<string | null> {
  const zxing = getReader();
  if (!zxing) return null;

  try {
    const result = await zxing.decodeFromImageUrl(imageSrc);
    return result ? result.getText() : null;
  } catch (err) {
    console.error("Error decodificando PDF417 de imagen:", err);
    return null;
  }
}

/**
 * Intenta limpiar el texto PDF417 y extraer campos comunes.
 */
export function parseINEData(rawText: string) {
  const data: Record<string, string> = { raw: rawText };
  
  try {
    // CURP (18 caracteres)
    const curpMatch = rawText.match(/[A-Z]{4}\d{6}[A-Z]{6}\d{2}/);
    if (curpMatch) data.curp = curpMatch[0];

    // Clave de Elector (18 caracteres)
    const claveMatch = rawText.match(/[A-Z]{6}\d{8}[A-Z]\d{3}/);
    if (claveMatch) data.claveElector = claveMatch[0];

    // CIC (IDMEX + 9-10 dígitos)
    const cicMatch = rawText.match(/IDMEX\d{9,10}/);
    if (cicMatch) data.cic = cicMatch[0];
  } catch (e) {
    console.warn("Error en el parseo best-effort de INE:", e);
  }

  return data;
}
