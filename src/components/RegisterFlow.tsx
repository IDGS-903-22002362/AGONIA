"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDemoState } from '@/hooks/use-demo-state';
import { 
  Camera as CameraIcon, 
  ChevronLeft, 
  CheckCircle2, 
  User, 
  Mail, 
  Phone, 
  Scan, 
  Loader2,
  ChevronRight,
  History,
  IdCard
} from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { CameraView } from '@/components/CameraView';
import { loadFaceApiModels, getFaceLandmarker } from '@/lib/face-loader';
import { decodePDF417FromVideo, decodePDF417FromImage, parseINEData } from '@/lib/pdf417';
import * as faceapi from 'face-api.js';
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function RegisterFlow({ onCancel }: { onCancel: () => void }) {
  const { registerUser } = useDemoState();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    idCardUrl: ''
  });
  
  const [isModelsReady, setIsModelsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [isFaceCentered, setIsFaceCentered] = useState(false);
  const [pdf417Result, setPdf417Result] = useState<{ raw: string; parsed: any } | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const loopsActiveRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      await loadFaceApiModels();
      await getFaceLandmarker();
      setIsModelsReady(true);
    };
    init();
    return () => { loopsActiveRef.current = false; };
  }, []);

  // Loop unificado para evitar colisiones de hardware
  const startMainLoop = useCallback(async () => {
    if (loopsActiveRef.current) return;
    loopsActiveRef.current = true;

    const landmarker = await getFaceLandmarker();
    
    const run = async () => {
      if (!loopsActiveRef.current) return;

      if (videoElementRef.current && videoElementRef.current.readyState === 4) {
        // Solo escaneamos INE en el paso 2 y si no hay resultado
        if (step === 2 && !pdf417Result) {
          const text = await decodePDF417FromVideo(videoElementRef.current);
          if (text) {
            const parsed = parseINEData(text);
            setPdf417Result({ raw: text, parsed });
            toast({ title: "INE Detectada", description: "Código leído correctamente." });
          }
        }

        // Solo detectamos rostro en el paso 3
        if (step === 3 && !isProcessing) {
          try {
            const results = landmarker.detectForVideo(videoElementRef.current, performance.now());
            const count = results.faceLandmarks.length;
            setFaceCount(count);
            
            if (count === 1) {
              const landmark = results.faceLandmarks[0][0];
              const centered = landmark.x > 0.3 && landmark.x < 0.7 && landmark.y > 0.2 && landmark.y < 0.8;
              setIsFaceCentered(centered);
            } else {
              setIsFaceCentered(false);
            }
          } catch (e) {
            // Ignorar errores de detección momentáneos
          }
        }
      }
      
      if (loopsActiveRef.current) {
        requestAnimationFrame(run);
      }
    };
    
    run();
  }, [step, pdf417Result, isProcessing, toast]);

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    videoElementRef.current = video;
    startMainLoop();
  }, [startMainLoop]);

  const handleCaptureFacial = async () => {
    if (!videoElementRef.current || faceCount !== 1) return;

    setIsProcessing(true);
    setScanProgress(10);
    
    try {
      const video = videoElementRef.current;
      const detection = await faceapi
        .detectSingleFace(video)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        throw new Error("No se detectó el rostro claramente. Intenta de nuevo.");
      }

      setScanProgress(100);
      setTimeout(() => {
        setIsProcessing(false);
        setStep(4);
      }, 500);

    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setIsProcessing(false);
      setScanProgress(0);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const src = event.target?.result as string;
      const text = await decodePDF417FromImage(src);
      if (text) {
        const parsed = parseINEData(text);
        setPdf417Result({ raw: text, parsed });
        setFormData(prev => ({ ...prev, idCardUrl: src }));
        toast({ title: "INE Detectada", description: "Imagen procesada con éxito." });
      } else {
        toast({ title: "Error", description: "No se encontró un código válido.", variant: "destructive" });
      }
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFinalize = () => {
    registerUser({
      ...formData,
      faceEnrollmentStatus: 'completed',
      livenessStatus: 'ok',
      status: 'PENDING'
    });
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="p-4 flex items-center border-b bg-white sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={step === 1 ? onCancel : () => setStep(step - 1)}>
          <ChevronLeft />
        </Button>
        <div className="flex-1 text-center font-bold uppercase tracking-tighter">OMNIA <span className="text-[#bbd300]">Fitness</span></div>
        <div className="w-10"></div>
      </div>

      <div className="p-4 flex-1 flex flex-col overflow-y-auto">
        <div className="mb-6">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            <span>Paso {step} de 4</span>
            <span>{Math.round((step / 4) * 100)}%</span>
          </div>
          <Progress value={(step / 4) * 100} className="h-1.5" />
        </div>

        {!isModelsReady ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#bbd300]" />
            <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">Cargando Motores...</p>
          </div>
        ) : (
          <>
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-2xl font-bold">Datos Personales</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo</Label>
                    <Input id="name" placeholder="Juan Pérez" className="h-12 rounded-xl" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="juan@ejemplo.com" className="h-12 rounded-xl" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" placeholder="555-123-4567" className="h-12 rounded-xl" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                  </div>
                </div>
                <Button className="w-full h-14 rounded-xl bg-[#bbd300] text-[#1e1e1e] font-bold" onClick={() => setStep(2)} disabled={!formData.name || !formData.email || !formData.phone}>
                  Continuar
                </Button>
              </div>
            )}

            {(step === 2 || step === 3) && (
              <div className="flex-1 flex flex-col space-y-4">
                <div className="px-2">
                  <h2 className="text-xl font-bold">{step === 2 ? 'Escanea tu INE' : 'Registro Facial'}</h2>
                  <p className="text-muted-foreground text-xs uppercase font-bold tracking-tight">
                    {step === 2 ? 'Muestra el reverso de tu identificación' : 'Alinea tu rostro con el óvalo'}
                  </p>
                </div>

                <div className="relative flex-1 bg-black rounded-[2rem] overflow-hidden shadow-2xl">
                  {/* Mantenemos la cámara montada para evitar el parpadeo en negro */}
                  <CameraView 
                    onVideoReady={handleVideoReady} 
                    showChecklist={step === 3}
                    showFacialGuide={step === 3}
                    isFaceDetected={faceCount === 1}
                    isFaceCentered={isFaceCentered}
                    className="h-full"
                  />

                  {step === 2 && !pdf417Result && (
                    <div className="absolute inset-0 border-2 border-[#bbd300]/30 border-dashed m-10 rounded-3xl pointer-events-none flex items-center justify-center">
                      <Badge className="bg-black/60 text-white uppercase text-[10px]">Buscando PDF417...</Badge>
                    </div>
                  )}

                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-10 text-center text-white">
                      <Loader2 className="h-12 w-12 animate-spin text-[#bbd300] mb-4" />
                      <p className="font-bold">Procesando Biometría...</p>
                      <Progress value={scanProgress} className="h-2 w-full mt-4" />
                    </div>
                  )}
                  
                  {step === 3 && !isProcessing && (
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20">
                      <button 
                        className={cn(
                          "h-20 w-20 rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-95",
                          faceCount === 1 && isFaceCentered ? "bg-white scale-110" : "bg-white/20 border-2 border-white/40 grayscale pointer-events-none"
                        )}
                        onClick={handleCaptureFacial}
                      >
                        <div className={cn("h-16 w-16 rounded-full", faceCount === 1 && isFaceCentered ? "bg-white border-4 border-[#bbd300]" : "bg-white/10")} />
                      </button>
                    </div>
                  )}
                </div>

                {step === 2 && pdf417Result && (
                  <div className="bg-white p-4 rounded-2xl border space-y-4 animate-in zoom-in-95">
                    <div className="flex items-center gap-3 text-green-600">
                      <CheckCircle2 size={24} />
                      <p className="font-bold text-sm">Identificación Validada</p>
                    </div>
                    <Button className="w-full h-12 rounded-xl bg-[#bbd300] text-[#1e1e1e] font-bold" onClick={() => setStep(3)}>
                      Continuar a Biometría
                    </Button>
                  </div>
                )}
                
                {step === 2 && !pdf417Result && (
                  <div className="text-center py-2">
                    <Input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" id="file-upload" />
                    <Button variant="ghost" className="text-xs uppercase font-bold" asChild>
                      <label htmlFor="file-upload" className="cursor-pointer">Subir foto del reverso</label>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8 py-10">
                <div className="h-24 w-24 bg-[#bbd300]/20 text-[#bbd300] rounded-full flex items-center justify-center">
                  <CheckCircle2 size={64} className="animate-in zoom-in duration-500" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold tracking-tighter">¡IDENTIDAD VALIDADA!</h2>
                  <p className="text-muted-foreground text-sm mt-2 px-6">Tu biometría y documentos han sido procesados correctamente.</p>
                </div>
                <Button className="w-full h-16 rounded-2xl text-lg font-bold bg-[#bbd300] text-[#1e1e1e]" onClick={handleFinalize}>
                  Finalizar Registro
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
