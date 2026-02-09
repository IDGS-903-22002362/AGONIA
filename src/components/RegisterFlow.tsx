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
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const init = async () => {
      await loadFaceApiModels();
      await getFaceLandmarker();
      setIsModelsReady(true);
    };
    init();
    
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, []);

  const startIneScanning = useCallback(() => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    scanIntervalRef.current = setInterval(async () => {
      if (videoElementRef.current && step === 2 && !pdf417Result) {
        const text = await decodePDF417FromVideo(videoElementRef.current);
        if (text) {
          const parsed = parseINEData(text);
          setPdf417Result({ raw: text, parsed });
          toast({ title: "INE Detectada", description: "Código PDF417 leído correctamente." });
          if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        }
      }
    }, 400);
  }, [step, pdf417Result, toast]);

  const detectFaceLoop = useCallback(async () => {
    if (!videoElementRef.current) return;
    const landmarker = await getFaceLandmarker();
    
    const runDetection = async () => {
      if (videoElementRef.current && videoElementRef.current.readyState === 4) {
        try {
          const results = landmarker.detectForVideo(videoElementRef.current, performance.now());
          setFaceCount(results.faceLandmarks.length);
          
          if (results.faceLandmarks.length === 1) {
            const landmark = results.faceLandmarks[0][0];
            const isCentered = landmark.x > 0.35 && landmark.x < 0.65 && landmark.y > 0.3 && landmark.y < 0.7;
            setIsFaceCentered(isCentered);
          } else {
            setIsFaceCentered(false);
          }
        } catch (e) {
          // Detectión error ignored
        }
      }
      if (step === 3) requestAnimationFrame(runDetection);
    };
    
    runDetection();
  }, [step]);

  const handleVideoReady = useCallback((video: HTMLVideoElement) => {
    videoElementRef.current = video;
    if (step === 2) {
      startIneScanning();
    } else if (step === 3) {
      detectFaceLoop();
    }
  }, [step, startIneScanning, detectFaceLoop]);

  const handleCaptureFacial = async () => {
    if (!videoElementRef.current || faceCount !== 1) return;

    setIsProcessing(true);
    setScanProgress(10);
    
    try {
      const video = videoElementRef.current;
      setScanProgress(40);
      
      const detection = await faceapi
        .detectSingleFace(video)
        .withFaceLandmarks()
        .withFaceDescriptor();

      setScanProgress(80);

      if (!detection) {
        throw new Error("No se pudo extraer el descriptor del rostro. Asegúrate de estar bien iluminado.");
      }

      setScanProgress(100);
      
      setTimeout(() => {
        setIsProcessing(false);
        setStep(4);
      }, 500);

    } catch (error: any) {
      console.error(error);
      toast({ title: "Error Biométrico", description: error.message, variant: "destructive" });
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
        toast({ title: "Error", description: "No se encontró un código PDF417 válido.", variant: "destructive" });
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
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      <div className="p-4 flex items-center border-b bg-white sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={step === 1 ? onCancel : () => setStep(step - 1)}>
          <ChevronLeft />
        </Button>
        <div className="flex-1 text-center font-bold uppercase tracking-tighter">OMNIA <span className="text-[#bbd300]">Fitness</span></div>
        <div className="w-10"></div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
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
            <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">Iniciando motores de seguridad...</p>
          </div>
        ) : (
          <>
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Datos Personales</h2>
                  <p className="text-muted-foreground text-sm">Comienza tu evolución en OMNIA Fitness.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="name" 
                        placeholder="Juan Pérez" 
                        className="pl-10 h-12 rounded-xl"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="juan@ejemplo.com" 
                        className="pl-10 h-12 rounded-xl"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="phone" 
                        placeholder="555-123-4567" 
                        className="pl-10 h-12 rounded-xl"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <Button 
                  className="w-full h-14 rounded-xl bg-[#bbd300] text-[#1e1e1e] font-bold" 
                  onClick={() => setStep(2)}
                  disabled={!formData.name || !formData.email || !formData.phone}
                >
                  Continuar a Validación INE
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Validación INE</h2>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-tight">Escanea el reverso de tu identificación.</p>
                </div>
                
                {!pdf417Result ? (
                  <>
                    <div className="relative aspect-video rounded-3xl overflow-hidden bg-black shadow-inner">
                      <CameraView 
                        onVideoReady={handleVideoReady} 
                        showChecklist={false} 
                        showFacialGuide={false}
                      />
                      <div className="absolute inset-0 border-2 border-[#bbd300]/30 border-dashed m-10 rounded-xl pointer-events-none"></div>
                      <div className="absolute bottom-4 left-0 right-0 text-center">
                        <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">Buscando PDF417...</span>
                      </div>
                    </div>

                    <div className="text-center space-y-4">
                      <div className="flex items-center gap-2 py-2">
                        <div className="h-px flex-1 bg-border"></div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">O sube una imagen</span>
                        <div className="h-px flex-1 bg-border"></div>
                      </div>
                      <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileUpload}
                        className="hidden" 
                        id="file-upload"
                      />
                      <Button variant="outline" className="w-full h-12 rounded-xl border-dashed" asChild>
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <History className="mr-2 h-4 w-4" /> Seleccionar Archivo
                        </label>
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 animate-in zoom-in-95">
                    <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3">
                      <CheckCircle2 className="text-green-500 shrink-0" size={24} />
                      <div>
                        <p className="font-bold text-green-800 text-sm">Identidad Detectada</p>
                        <p className="text-[10px] text-green-600 uppercase font-bold">PDF417 validado correctamente</p>
                      </div>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-2xl space-y-2 border">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Datos Extraídos</p>
                      {Object.entries(pdf417Result.parsed).length > 1 ? (
                        Object.entries(pdf417Result.parsed).map(([key, val]) => (
                          key !== 'raw' && (
                            <div key={key} className="flex justify-between border-b border-white/10 pb-1">
                              <span className="text-[10px] uppercase text-muted-foreground">{key}:</span>
                              <span className="text-[10px] font-mono break-all text-right">{val as string}</span>
                            </div>
                          )
                        ))
                      ) : (
                        <p className="text-[10px] font-mono break-all opacity-70 leading-tight">{pdf417Result.raw.substring(0, 100)}...</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={() => setPdf417Result(null)}>
                        Reintentar
                      </Button>
                      <Button className="flex-1 rounded-xl h-12 bg-[#bbd300] text-[#1e1e1e] font-bold" onClick={() => setStep(3)}>
                        Siguiente <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 flex-1 flex flex-col">
                <div className="px-2">
                  <h2 className="text-2xl font-bold mb-1">Registro Facial</h2>
                  <p className="text-muted-foreground text-xs font-medium">Alinea tu rostro para la biometría.</p>
                </div>
                
                <div className="flex-1 relative flex flex-col">
                  <div className="flex-1 relative">
                    <CameraView 
                      onVideoReady={handleVideoReady} 
                      isFaceDetected={faceCount === 1}
                      isFaceCentered={isFaceCentered}
                      showFacialGuide={true}
                      className="h-full shadow-2xl"
                    />
                    
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-white p-10 text-center">
                        <Scan className="h-16 w-16 mb-6 animate-pulse text-[#bbd300]" />
                        <p className="text-xl font-bold mb-4">Analizando Biometría...</p>
                        <Progress value={scanProgress} className="h-2 w-full max-w-xs bg-white/20" />
                        <p className="text-[10px] mt-2 opacity-70 font-bold uppercase">{scanProgress}% Completado</p>
                      </div>
                    )}

                    {!isProcessing && (
                      <div className="absolute bottom-10 left-0 right-0 flex justify-center z-20">
                        <button 
                          className={cn(
                            "h-20 w-20 rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-90",
                            faceCount === 1 && isFaceCentered 
                              ? "bg-white scale-110" 
                              : "bg-white/20 border-2 border-white/40 grayscale pointer-events-none"
                          )}
                          onClick={handleCaptureFacial}
                        >
                          <div className={cn(
                            "h-16 w-16 rounded-full flex items-center justify-center",
                            faceCount === 1 && isFaceCentered ? "bg-white border-4 border-[#bbd300]" : "bg-white/10"
                          )}>
                            <CameraIcon className={cn("h-8 w-8", faceCount === 1 && isFaceCentered ? "text-[#bbd300]" : "text-white/40")} />
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center flex-1 flex flex-col justify-center">
                <div className="flex justify-center">
                  <div className="h-24 w-24 bg-[#bbd300]/10 text-[#bbd300] rounded-full flex items-center justify-center shadow-inner">
                    <CheckCircle2 size={64} className="animate-in zoom-in duration-500" />
                  </div>
                </div>
                
                <div>
                  <h2 className="text-3xl font-bold mb-2 uppercase tracking-tighter">¡Identidad <span className="text-[#bbd300]">Validada</span>!</h2>
                  <p className="text-muted-foreground px-4 text-sm font-medium">
                    Tu identificación oficial y biometría facial han sido procesadas satisfactoriamente.
                  </p>
                </div>

                <div className="bg-muted/50 p-6 rounded-[2rem] text-left space-y-4 border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Resumen de Registro</p>
                      <p className="font-bold text-lg leading-tight mt-1">{formData.name}</p>
                      <p className="text-xs text-muted-foreground">{formData.email}</p>
                    </div>
                    <Badge className="bg-[#bbd300] text-[#1e1e1e] border-none font-bold text-[8px] uppercase">Verificado</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <IdCard size={12} className="text-[#bbd300]" />
                      <span className="text-[9px] font-bold uppercase">INE validada</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CameraIcon size={12} className="text-[#bbd300]" />
                      <span className="text-[9px] font-bold uppercase">Biometría OK</span>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full h-16 rounded-2xl text-lg font-bold bg-[#bbd300] text-[#1e1e1e] shadow-xl shadow-[#bbd300]/20" 
                  onClick={handleFinalize}
                >
                  Finalizar Evolución
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
