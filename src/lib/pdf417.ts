
'use client';

import { BrowserPDF417Reader } from '@zxing/library';

/**
 * Utilidades para decodificar códigos PDF417 (Reverso de INE)
 */

const reader = new BrowserPDF417Reader();

export async function decodePDF417FromVideo(videoElement: HTMLVideoElement): Promise<string | null> {
  try {
    const result = await reader.decodeFromVideoElement(videoElement);
    return result ? result.getText() : null;
  } catch (err) {
    // Si no detecta nada en el frame actual, devolvemos null sin error
    return null;
  }
}

export async function decodePDF417FromImage(imageSrc: string): Promise<string | null> {
  try {
    const result = await reader.decodeFromImageUrl(imageSrc);
    return result ? result.getText() : null;
  } catch (err) {
    console.error("Error decodificando PDF417 de imagen:", err);
    return null;
  }
}

/**
 * Intenta limpiar el texto PDF417 y extraer campos comunes.
 * Formato típico de INE puede variar, pero suele contener bloques separados por caracteres especiales.
 */
export function parseINEData(rawText: string) {
  const data: Record<string, string> = {};
  
  // Guardamos el texto crudo por si acaso
  data.raw = rawText;

  // Ejemplo de parseo best-effort basado en patrones comunes de PDF417 de INE
  // Los campos suelen estar en posiciones fijas o precedidos por etiquetas
  // Nota: Esto es altamente dependiente de la versión de la INE
  
  try {
    // Intento de extraer CURP (18 caracteres: 4 letras, 6 números, 6 letras, 2 números/letras)
    const curpMatch = rawText.match(/[A-Z]{4}\d{6}[A-Z]{6}\d{2}/);
    if (curpMatch) data.curp = curpMatch[0];

    // Intento de extraer Clave de Elector (18 caracteres)
    const claveMatch = rawText.match(/[A-Z]{6}\d{8}[A-Z]\d{3}/);
    if (claveMatch) data.claveElector = claveMatch[0];

    // Intento de extraer CIC (9-10 dígitos)
    const cicMatch = rawText.match(/IDMEX\d{9,10}/);
    if (cicMatch) data.cic = cicMatch[0];

    // El nombre suele venir en bloques de texto plano después de ciertos identificadores
    // En un prototipo, si no podemos parsearlo estructuralmente, el "rawText" es lo más valioso
  } catch (e) {
    console.warn("Error en el parseo best-effort de INE:", e);
  }

  return data;
}
