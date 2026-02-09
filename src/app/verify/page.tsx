
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CameraView } from '@/components/CameraView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { loadFaceApiModels, getFaceLandmarker } from '@/lib/face-loader';
import * as faceapi from 'face-api.js';
import { euclideanDistance, FACE_MATCH_THRESHOLD } from '@/lib/embeddings-utils';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function VerifyPage() {
  const [userId, setUserId] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{ match: boolean; distance: number } | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
    const init = async () => {
      await loadFaceApiModels();
      await getFaceLandmarker();
      setIsReady(true);
    };
    init();
  }, []);

  const handleVideoReady = (video: HTMLVideoElement) => {
    videoElementRef.current = video;
    detectLoop();
  };

  const detectLoop = async () => {
    if (!videoElementRef.current) return;
    const landmarker = await getFaceLandmarker();
    const runDetection = async () => {
      if (videoElementRef.current && videoElementRef.current.readyState === 4) {
        const results = landmarker.detectForVideo(videoElementRef.current, performance.now());
        setFaceCount(results.faceLandmarks.length);
      }
      requestAnimationFrame(runDetection);
    };
    runDetection();
  };

  const handleVerify = async () => {
    if (!userId) {
      toast({ title: "Error", description: "Ingresa el ID de Usuario", variant: "destructive" });
      return;
    }
    if (faceCount !== 1) return;

    setIsVerifying(true);
    setResult(null);
    try {
      // 1. Obtener embedding guardado
      const docRef = doc(firestore, 'face_embeddings', userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Usuario no encontrado en la base de datos biométrica.");
      }

      const storedData = docSnap.data();
      const storedDescriptor = storedData.descriptor;

      // 2. Capturar rostro actual
      const video = videoElementRef.current!;
      const detection = await faceapi
        .detectSingleFace(video)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        throw new Error("No se pudo detectar el rostro para verificación.");
      }

      // 3. Comparar
      const distance = euclideanDistance(detection.descriptor, storedDescriptor);
      const isMatch = distance < FACE_MATCH_THRESHOLD;

      setResult({ match: isMatch, distance });

      if (isMatch) {
        toast({ title: "Acceso Concedido", description: "Identidad verificada con éxito." });
      } else {
        toast({ title: "Acceso Denegado", description: "No se ha podido verificar la identidad.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6 bg-background">
      <Card className="max-w-md mx-auto w-full rounded-3xl overflow-hidden shadow-xl border-none">
        <CardHeader className="bg-[#1e1e1e] text-white">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="text-[#bbd300]" /> Verificación Facial
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="userId">ID de Usuario a Verificar</Label>
            <Input 
              id="userId" 
              placeholder="Ingresa tu ID" 
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>

          {!isReady ? (
            <div className="aspect-video bg-muted rounded-2xl flex flex-col items-center justify-center text-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Inicializando seguridad...</p>
            </div>
          ) : (
            <>
              <CameraView onVideoReady={handleVideoReady} />
              
              {result && (
                <div className={`p-4 rounded-2xl border flex items-center gap-4 animate-in fade-in zoom-in ${
                  result.match ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  {result.match ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                  <div>
                    <p className="font-bold text-lg">{result.match ? "COINCIDE" : "NO COINCIDE"}</p>
                    <p className="text-xs opacity-80 font-mono">Distancia: {result.distance.toFixed(4)} (Umbral: {FACE_MATCH_THRESHOLD})</p>
                  </div>
                </div>
              )}

              <Button 
                className="w-full h-14 rounded-xl bg-[#1e1e1e] text-white hover:bg-black font-bold"
                onClick={handleVerify}
                disabled={isVerifying || faceCount !== 1}
              >
                {isVerifying ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verificando...</>
                ) : (
                  "Verificar Identidad"
                )}
              </Button>
            </>
          )}

          <div className="text-center pt-2">
            <Link href="/" className="text-xs text-muted-foreground hover:underline">Volver al inicio</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
