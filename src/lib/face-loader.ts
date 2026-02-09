'use client';

import * as faceapi from 'face-api.js';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

/**
 * Cargador de modelos para face-api.js y MediaPipe.
 */

let landmarker: FaceLandmarker | null = null;
let modelsLoaded = false;

/**
 * Carga los modelos de face-api.js.
 * Intenta cargar desde /models localmente, y si falla (como el 404 detectado), 
 * utiliza el CDN oficial como respaldo para el prototipo.
 */
export async function loadFaceApiModels() {
  if (modelsLoaded) return;
  
  // Usamos el CDN oficial de face-api.js para asegurar que el prototipo funcione sin archivos locales.
  const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
  
  try {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
    console.log('Face-api.js models loaded from CDN');
  } catch (error) {
    console.error('Error loading face-api models:', error);
    // Reintento local por si acaso el CDN falla pero los archivos locales sí existen
    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      ]);
      modelsLoaded = true;
      console.log('Face-api.js models loaded from local /models');
    } catch (localError) {
      console.error('Final fallback: Error loading models locally:', localError);
    }
  }
}

/**
 * Inicializa el Face Landmarker de MediaPipe.
 */
export async function getFaceLandmarker() {
  if (landmarker) return landmarker;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm"
  );
  
  landmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
      delegate: "GPU"
    },
    outputFaceBlendshapes: true,
    runningMode: "VIDEO",
    numFaces: 1
  });

  return landmarker;
}
