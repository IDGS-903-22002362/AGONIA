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
  IdCard,
  AlertCircle
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
  const lastScanTimeRef = useRef(0);

  useEffect(() => {
    const init = async () => {
      await loadFaceApiModels();
      await getFaceLandmarker();
      setIsModelsReady(true);
    };
    init();
    return () => { loopsActiveRef.current = false; };
  }, []);

  const startMainLoop = useCallback(async () => {
    if (loopsActiveRef.current) return;
    loopsActiveRef.current = true;

    const landmarker = await getFaceLandmarker();
    
    const run = async (time: number) => {
      if (!loopsActiveRef.current) return;

      if (videoElementRef.current && videoElementRef.current.readyState === 4) {
        // Escaneo de INE (Throttled a 500ms para ahorrar CPU en móviles)
        if (step === 2 && !pdf417Result && !isProcessing) {
          if (time - lastScanTimeRef.current > 500) {
            lastScanTimeRef.current = time;
            try {
              const text = await decodePDF417FromVideo(videoElementRef.current);
              if (text) {
                const parsed = parseINEData(text);
                setPdf417Result({ raw: text, parsed });
                toast({ 
                  title: "Documento Detectado", 
                  description: "Datos extraídos correctamente." 
                });
              }
            } catch (e) {
              // Error silencioso en el loop
            }
          }
        }

        // Detección Facial
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
            // Ignorar errores menores
          }
        }
      }
      
      if (loopsActiveRef.current) {
        requestAnimationFrame(run);
      }
    };
    
    requestAnimationFrame(run);
  }, [step, pdf417Result, isProcessing, toast]);

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    videoElementRef.current = video;
    startMainLoop();
  }, [startMainLoop]);

  const handleCaptureFacial = async () => {
    if (!videoElementRef.current || faceCount !== 1) return;

    setIsProcessing(true);
    setScanProgress(15);
    
    try {
      const video = videoElementRef.current;
      const detection = await faceapi
        .detectSingleFace(video)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        throw new Error("Detección incompleta. Mantén el rostro quieto y centrado.");
      }

      setScanProgress(100);
      setTimeout(() => {
        setIsProcessing(false);
        setStep(4);
      }, 500);

    } catch (error: any) {
      toast({ title: "Error Biométrico", description: error.message, variant: "destructive" });
      setIsProcessing(false);
      setScanProgress(0);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setScanProgress(30);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const src = event.target?.result as string;
      setScanProgress(60);
      
      const text = await decodePDF417FromImage(src);
      if (text) {
        const parsed = parseINEData(text);
        setPdf417Result({ raw: text, parsed });
        setFormData(prev => ({ ...prev, idCardUrl: src }));
        toast({ title: "INE Validada", description: "Datos extraídos de la foto." });
        setScanProgress(100);
      } else {
        toast({ 
          title: "Lectura Fallida", 
          description: "No se detectó el código. Prueba con una foto más clara y bien iluminada.", 
          variant: "destructive" 
        });
        setScanProgress(0);
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
            <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">Sincronizando Sistemas...</p>
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
                  <h2 className="text-xl font-bold">{step === 2 ? 'Valida tu Identidad' : 'Registro Facial'}</h2>
                  <p className="text-muted-foreground text-xs uppercase font-bold tracking-tight">
                    {step === 2 ? 'Muestra el reverso de tu INE' : 'Alinea tu rostro con el óvalo'}
                  </p>
                </div>

                <div className="relative flex-1 bg-black rounded-[2rem] overflow-hidden shadow-2xl">
                  <CameraView 
                    onVideoReady={handleVideoReady} 
                    showChecklist={step === 3}
                    showFacialGuide={step === 3}
                    isFaceDetected={faceCount === 1}
                    isFaceCentered={isFaceCentered}
                    initialFacingMode={step === 2 ? 'environment' : 'user'}
                    className="h-full"
                  />

                  {step === 2 && !pdf417Result && (
                    <div className="absolute inset-0 border-2 border-[#bbd300]/30 border-dashed m-10 rounded-3xl pointer-events-none flex flex-col items-center justify-center gap-2">
                      <div className="bg-black/60 p-4 rounded-2xl text-center">
                        <Scan className="h-8 w-8 text-[#bbd300] mx-auto mb-2 animate-pulse" />
                        <Badge className="bg-[#bbd300] text-[#1e1e1e] uppercase text-[10px]">Buscando Códigos...</Badge>
                        <p className="text-[10px] text-white/70 mt-2">Coloca el reverso de tu INE frente a la cámara</p>
                      </div>
                    </div>
                  )}

                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-10 text-center text-white">
                      <Loader2 className="h-12 w-12 animate-spin text-[#bbd300] mb-4" />
                      <p className="font-bold uppercase tracking-widest text-sm">Analizando datos...</p>
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
                  <div className="bg-white p-4 rounded-2xl border border-green-100 space-y-4 animate-in zoom-in-95">
                    <div className="flex items-center gap-3 text-green-600">
                      <CheckCircle2 size={24} />
                      <div>
                        <p className="font-bold text-sm">Identidad Validada</p>
                        <p className="text-[10px] uppercase text-muted-foreground">Datos extraídos correctamente</p>
                      </div>
                    </div>
                    <Button className="w-full h-12 rounded-xl bg-[#bbd300] text-[#1e1e1e] font-bold" onClick={() => setStep(3)}>
                      Siguiente: Registro Facial
                    </Button>
                  </div>
                )}
                
                {step === 2 && !pdf417Result && !isProcessing && (
                  <div className="text-center py-2 flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-4 opacity-60">
                      <div className="h-px flex-1 bg-border"></div>
                      <span className="text-[10px] font-bold uppercase">O sube una foto</span>
                      <div className="h-px flex-1 bg-border"></div>
                    </div>
                    <Input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" id="file-upload" />
                    <Button variant="ghost" className="text-xs uppercase font-bold h-10" asChild>
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <History className="mr-2 h-4 w-4" /> Seleccionar del Carrete
                      </label>
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
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter uppercase">¡Verificado!</h2>
                  <p className="text-muted-foreground text-sm px-6">Tu identidad ha sido procesada con éxito. Bienvenido al equipo.</p>
                </div>
                <div className="w-full bg-muted/30 p-4 rounded-2xl border border-dashed text-left space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Resultados</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs">INE (Código Detectado)</span>
                    <Badge variant="outline" className="text-green-600 bg-green-50 border-green-100">OK</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Embedding Facial</span>
                    <Badge variant="outline" className="text-green-600 bg-green-50 border-green-100">Generado</Badge>
                  </div>
                </div>
                <Button className="w-full h-16 rounded-2xl text-lg font-bold bg-[#bbd300] text-[#1e1e1e] shadow-xl shadow-[#bbd300]/20" onClick={handleFinalize}>
                  Finalizar Inscripción
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
