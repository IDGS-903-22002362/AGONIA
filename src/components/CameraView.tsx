
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Camera, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CameraViewProps {
  onVideoReady?: (videoElement: HTMLVideoElement) => void;
  className?: string;
}

export function CameraView({ onVideoReady, className }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 }, 
            height: { ideal: 480 },
            facingMode: 'user'
          } 
        });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          if (onVideoReady) {
            onVideoReady(videoRef.current);
          }
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };

    getCameraPermission();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onVideoReady]);

  if (hasCameraPermission === false) {
    return (
      <Alert variant="destructive" className="mb-4">
        <Camera className="h-4 w-4" />
        <AlertTitle>Error de Cámara</AlertTitle>
        <AlertDescription>
          No se pudo acceder a la cámara. Por favor, asegúrate de dar los permisos necesarios en tu navegador.
          <Button variant="outline" size="sm" className="mt-2 block" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-black ${className}`}>
      <video
        ref={videoRef}
        className="w-full aspect-video object-cover"
        autoPlay
        muted
        playsInline
      />
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="facial-guide opacity-40 border-dashed border-[#bbd300]"></div>
      </div>
    </div>
  );
}
