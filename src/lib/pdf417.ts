'use client';

import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';

/**
 * Utilidades para decodificar códigos en identificaciones (PDF417 y QR)
 * Optimizadas para dispositivos móviles con cámaras de alta resolución.
 */

let reader: BrowserMultiFormatReader | null = null;

function getReader() {
  if (typeof window !== 'undefined' && !reader) {
    const hints = new Map();
    // Configuración exhaustiva para códigos de seguridad
    const formats = [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.PDF_417,
      BarcodeFormat.AZTEC,
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.CODE_128
    ];
    
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.CHARACTER_SET, 'UTF-8');
    hints.set(DecodeHintType.ASSUME_GS1, false);
    
    reader = new BrowserMultiFormatReader(hints);
  }
  return reader;
}

/**
 * Decodifica capturando una instantánea del video para mayor claridad en móviles.
 */
export async function decodePDF417FromVideo(videoElement: HTMLVideoElement): Promise<string | null> {
  const zxing = getReader();
  if (!zxing || !videoElement || videoElement.readyState < 2) return null;

  try {
    // En móviles, capturar el frame en un canvas y procesarlo suele ser más estable
    // que dejar que ZXing maneje el stream de video directamente si hay otros procesos (MediaPipe)
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return null;
    
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    const result = await zxing.decodeFromCanvas(canvas);
    return result ? result.getText() : null;
  } catch (err) {
    // Si falla el método del canvas, intentamos el directo como fallback
    try {
      const result = await zxing.decodeOnceFromVideoElement(videoElement);
      return result ? result.getText() : null;
    } catch (e) {
      return null;
    }
  }
}

/**
 * Decodifica un código desde una imagen (archivo subido).
 */
export async function decodePDF417FromImage(imageSrc: string): Promise<string | null> {
  const zxing = getReader();
  if (!zxing) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      try {
        // Usar un canvas para asegurar que la imagen tenga el tamaño y formato correcto
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const result = await zxing.decodeFromCanvas(canvas);
        resolve(result ? result.getText() : null);
      } catch (err) {
        console.warn("ZXing: Error decodificando imagen subida", err);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageSrc;
  });
}

/**
 * Parsea los datos de la INE de forma robusta.
 */
export function parseINEData(rawText: string) {
  const data: Record<string, string> = { raw: rawText };
  
  try {
    // 1. Extraer CURP
    const curpRegex = /[A-Z]{4}\d{6}[A-Z]{6}[A-Z\d]{2}/;
    const curpMatch = rawText.match(curpRegex);
    if (curpMatch) data.curp = curpMatch[0];

    // 2. Extraer Clave de Elector
    const claveRegex = /[A-Z]{6}\d{8}[A-Z]\d{3}/;
    const claveMatch = rawText.match(claveRegex);
    if (claveMatch) data.claveElector = claveMatch[0];

    // 3. Extraer CIC
    const cicRegex = /(?:IDMEX|CIC)\s*(\d{9,10})/i;
    const cicMatch = rawText.match(cicRegex);
    if (cicMatch) data.cic = cicMatch[1];

    // 4. Si es una URL (INEs modelo G/H), extraer parámetros
    if (rawText.includes('ine.mx') || rawText.includes('?')) {
      const paramsPart = rawText.split('?')[1];
      if (paramsPart) {
        const urlParams = new URLSearchParams(paramsPart);
        if (urlParams.has('curp')) data.curp = urlParams.get('curp')!;
        if (urlParams.has('cve')) data.claveElector = urlParams.get('cve')!;
        if (urlParams.has('cic')) data.cic = urlParams.get('cic')!;
      }
    }
  } catch (e) {
    console.warn("Error en el parseo de datos INE:", e);
  }

  return data;
}
