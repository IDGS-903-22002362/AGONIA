
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CameraView } from '@/components/CameraView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { loadFaceApiModels, getFaceLandmarker } from '@/lib/face-loader';
import * as faceapi from 'face-api.js';
import { descriptorToArray } from '@/lib/embeddings-utils';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function EnrollPage() {
  const [userId, setUserId] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
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

  const handleEnroll = async () => {
    if (!userId) {
      toast({ title: "Error", description: "Por favor, ingresa un ID de Usuario", variant: "destructive" });
      return;
    }
    if (faceCount !== 1) return;

    setIsProcessing(true);
    try {
      const video = videoElementRef.current!;
      const detection = await faceapi
        .detectSingleFace(video)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        throw new Error("No se pudo extraer el descriptor del rostro.");
      }

      const embeddingDoc = {
        userId,
        descriptor: descriptorToArray(detection.descriptor),
        model: "faceapi-ssd-mobilenetv1-v1",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(firestore, 'face_embeddings', userId), embeddingDoc);

      toast({
        title: "¡Éxito!",
        description: `Rostro registrado correctamente para el usuario: ${userId}`,
      });
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6 bg-background">
      <Card className="max-w-md mx-auto w-full rounded-3xl overflow-hidden shadow-xl border-none">
        <CardHeader className="bg-[#1e1e1e] text-white">
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="text-[#bbd300]" /> Registro Facial
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="userId">ID de Usuario</Label>
            <Input 
              id="userId" 
              placeholder="Ej: juan_perez_123" 
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>

          {!isReady ? (
            <div className="aspect-video bg-muted rounded-2xl flex flex-col items-center justify-center text-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Cargando modelos biométricos...</p>
            </div>
          ) : (
            <>
              <CameraView onVideoReady={handleVideoReady} className="shadow-inner" />
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border">
                <span className="text-sm font-medium">Estatus de Detección:</span>
                {faceCount === 0 && <span className="text-xs text-red-500 font-bold flex items-center gap-1"><AlertCircle size={14}/> Sin rostro</span>}
                {faceCount === 1 && <span className="text-xs text-green-600 font-bold flex items-center gap-1"><CheckCircle2 size={14}/> 1 rostro detectado</span>}
                {faceCount > 1 && <span className="text-xs text-orange-500 font-bold flex items-center gap-1"><AlertCircle size={14}/> Múltiples rostros</span>}
              </div>

              <Button 
                className="w-full h-14 rounded-xl bg-[#bbd300] text-[#1e1e1e] hover:bg-[#a8bd00] shadow-lg shadow-[#bbd300]/20 font-bold"
                onClick={handleEnroll}
                disabled={isProcessing || faceCount !== 1}
              >
                {isProcessing ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Procesando...</>
                ) : (
                  "Capturar y Registrar"
                )}
              </Button>
            </>
          )}

          <div className="text-center">
            <Link href="/" className="text-xs text-muted-foreground hover:underline">Volver al inicio</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
