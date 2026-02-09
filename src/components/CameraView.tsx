'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Camera, RefreshCw, Sun, Target, Glasses, Check, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CameraViewProps {
  onVideoReady?: (videoElement: HTMLVideoElement) => void;
  className?: string;
  showChecklist?: boolean;
  showFacialGuide?: boolean;
  isFaceDetected?: boolean;
  isFaceCentered?: boolean;
  initialFacingMode?: 'user' | 'environment';
}

export function CameraView({ 
  onVideoReady, 
  className, 
  showChecklist = true,
  showFacialGuide = true,
  isFaceDetected = false,
  isFaceCentered = false,
  initialFacingMode = 'environment'
}: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(initialFacingMode);
  const onVideoReadyRef = useRef(onVideoReady);

  useEffect(() => {
    onVideoReadyRef.current = onVideoReady;
  }, [onVideoReady]);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const getCameraPermission = async () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach(track => track.stop());
      }

      try {
        // Solicitamos resolución más alta (1080p ideal) para escaneo de códigos densos
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1920, min: 1280 }, 
            height: { ideal: 1080, min: 720 },
            facingMode: facingMode,
            frameRate: { ideal: 30 }
          } 
        });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current && onVideoReadyRef.current) {
              onVideoReadyRef.current(videoRef.current);
            }
          };
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };

    getCameraPermission();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const toggleCamera = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  if (hasCameraPermission === false) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <Camera className="h-4 w-4" />
          <AlertTitle>Error de Cámara</AlertTitle>
          <AlertDescription>
            No se pudo acceder a la cámara. Asegúrate de usar HTTPS y dar permisos.
            <Button variant="outline" size="sm" className="mt-2 block" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-[3rem] bg-black aspect-[3/4] sm:aspect-auto sm:h-[500px]", className)}>
      <video
        ref={videoRef}
        className={cn(
          "w-full h-full object-cover transition-transform duration-500",
          facingMode === 'user' && "scale-x-[-1]"
        )}
        autoPlay
        muted
        playsInline
      />
      
      <Button 
        variant="secondary" 
        size="icon" 
        className="absolute bottom-6 right-6 h-12 w-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white z-30 hover:bg-black/60 shadow-lg"
        onClick={toggleCamera}
      >
        <RefreshCcw className="h-6 w-6" />
      </Button>

      {showChecklist && (
        <div className="absolute top-6 left-4 right-4 flex justify-between gap-2 z-20">
          {[
            { icon: Sun, label: "Buena luz", active: isFaceDetected },
            { icon: Target, label: "Centrado", active: isFaceCentered },
            { icon: Glasses, label: "Sin lentes", active: isFaceDetected }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className={cn(
                "bg-black/60 backdrop-blur-md px-3 py-2 rounded-full flex items-center gap-2 border border-white/10 transition-all duration-300",
                item.active ? "border-[#bbd300]/50" : "opacity-70"
              )}
            >
              <item.icon className={cn("h-3.5 w-3.5", item.active ? "text-[#bbd300]" : "text-white")} />
              <span className="text-[11px] text-white font-bold">{item.label}</span>
              {item.active && <Check className="h-3.5 w-3.5 text-[#bbd300]" />}
            </div>
          ))}
        </div>
      )}

      {showFacialGuide && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          <div className={cn(
            "facial-guide border-2 transition-all duration-300",
            isFaceCentered ? "border-[#bbd300] shadow-[0_0_20px_rgba(187,211,0,0.3)]" : "border-white/30 border-dashed"
          )}></div>
        </div>
      )}

      {showFacialGuide && (
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_0_1000px_rgba(0,0,0,0.4)] z-0"></div>
      )}
    </div>
  );
}
