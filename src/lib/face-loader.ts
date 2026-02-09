
'use client';

import * as faceapi from 'face-api.js';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

/**
 * Cargador de modelos para face-api.js y MediaPipe.
 */

let landmarker: FaceLandmarker | null = null;
let modelsLoaded = false;

/**
 * Carga los modelos de face-api.js desde /models.
 */
export async function loadFaceApiModels() {
  if (modelsLoaded) return;
  
  const MODEL_URL = '/models';
  try {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
    console.log('Face-api.js models loaded');
  } catch (error) {
    console.error('Error loading face-api models:', error);
    // Intentar desde CDN si local falla (solo para robustez del prototipo)
    // await faceapi.nets.ssdMobilenetv1.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
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
