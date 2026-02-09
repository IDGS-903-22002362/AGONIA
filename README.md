
# OMNIA Fitness - Biometría Facial e Identidad

Este prototipo incluye registro facial, verificación y validación de documentos oficiales (INE) mediante embeddings persistidos en Firestore.

## Características Principales

1. **Registro Biométrico**: Captura de embeddings faciales de 128 dimensiones.
2. **Validación de Identidad (INE)**: 
   - Escaneo de código PDF417 (reverso).
   - Extracción de datos (best-effort).
   - Selfie biométrica y comparación (1:1).
3. **Persistencia**: Todos los registros se guardan en Cloud Firestore.

## Configuración de Modelos

Para que la detección funcione, el sistema utiliza un CDN de respaldo por defecto, pero puedes colocar los modelos de `face-api.js` en la carpeta `/public/models` para mayor velocidad.

### Archivos requeridos:
- `ssd_mobilenetv1_model-weights_manifest.json` y sus shards.
- `face_landmark_68_model-weights_manifest.json` y sus shards.
- `face_recognition_model-weights_manifest.json` y sus shards.

## Instrucciones de Uso

1. **Registro**: Ve a `/enroll`. Ingresa un ID de usuario, alinea tu rostro y presiona "Capturar".
2. **Verificación**: Ve a `/verify`. Compara tu rostro actual con un ID registrado.
3. **Validación INE**: Ve a `/ine`.
   - Escanea el reverso de tu INE o sube una imagen clara.
   - Tómate una selfie.
   - (Opcional) Ingresa tu ID de registro previo para validar que eres la misma persona.

## Parámetros Técnicos
- **Detección**: MediaPipe Face Landmarker.
- **Embeddings**: face-api.js.
- **Código de Barras**: @zxing/library (PDF417).
- **Umbral (Threshold)**: 0.55 (configurable en `src/lib/embeddings-utils.ts`).

## Limitaciones del Prototipo
- El parseo de PDF417 es "best-effort". Algunas versiones de INE pueden requerir ajustes en las expresiones regulares.
- No se realiza validación de liveness avanzada (parpadeo, movimiento) en esta versión.
- El almacenamiento de imágenes utiliza Base64 en Firestore por simplicidad del prototipo.
