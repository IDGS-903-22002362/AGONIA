
# OMNIA Fitness - Biometría Facial

Este prototipo incluye registro y verificación facial mediante embeddings persistidos en Firestore.

## Configuración de Modelos

Para que la detección funcione, debes colocar los modelos de `face-api.js` en la carpeta `/public/models`. 

### Archivos requeridos:
- `ssd_mobilenetv1_model-weights_manifest.json` y sus shards.
- `face_landmark_68_model-weights_manifest.json` y sus shards.
- `face_recognition_model-weights_manifest.json` y sus shards.

Puedes descargarlos desde el repositorio oficial de [face-api.js](https://github.com/justadudewhohacks/face-api.js/tree/master/weights).

## Instrucciones de Uso

1. **Registro**: Ve a `/enroll`. Ingresa un ID de usuario, alinea tu rostro y presiona "Capturar". El embedding (vector de 128 números) se guardará en Firestore.
2. **Verificación**: Ve a `/verify`. Ingresa el ID que registraste. El sistema comparará tu rostro actual con el guardado usando la distancia euclidiana.

## Parámetros Técnicos
- **Detección**: MediaPipe Face Landmarker (vía WASM).
- **Embeddings**: face-api.js (SsdMobilenetv1 + FaceRecognitionNet).
- **Umbral (Threshold)**: 0.55 (configurable en `src/lib/embeddings-utils.ts`).
