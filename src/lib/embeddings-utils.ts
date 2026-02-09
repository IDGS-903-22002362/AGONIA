
/**
 * Utilidades para el manejo de descriptores faciales (embeddings).
 */

/**
 * Calcula la distancia euclidiana entre dos vectores.
 * Menor distancia implica mayor similitud.
 */
export function euclideanDistance(v1: number[] | Float32Array, v2: number[] | Float32Array): number {
  if (v1.length !== v2.length) {
    throw new Error('Los vectores deben tener la misma longitud');
  }
  return Math.sqrt(
    v1.reduce((sum, val, i) => sum + Math.pow(val - v2[i], 2), 0)
  );
}

/**
 * Umbral de coincidencia sugerido para la demo.
 * Valores típicos están entre 0.4 y 0.6.
 * 0.55 es un buen punto de partida para prototipos.
 */
export const FACE_MATCH_THRESHOLD = 0.55;

/**
 * Convierte un Float32Array (formato de face-api.js) a un array de números estándar para Firestore.
 */
export function descriptorToArray(descriptor: Float32Array | number[]): number[] {
  return Array.from(descriptor);
}
