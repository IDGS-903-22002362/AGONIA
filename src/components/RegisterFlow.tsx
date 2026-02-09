
"use client";

import { useState, useEffect, useRef } from 'react';
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
  Upload, 
  Scan, 
  Loader2 
} from 'lucide-react';
import Image from 'next/image';
import { Progress } from "@/components/ui/progress";
import { CameraView } from '@/components/CameraView';
import { loadFaceApiModels, getFaceLandmarker } from '@/lib/face-loader';
import * as faceapi from 'face-api.js';
import { descriptorToArray } from '@/lib/embeddings-utils';
import { useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";

export default function RegisterFlow({ onCancel }: { onCancel: () => void }) {
  const { registerUser } = useDemoState();
  const firestore = useFirestore();
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
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    if (step === 3) {
      const init = async () => {
        await loadFaceApiModels();
        await getFaceLandmarker();
        setIsModelsReady(true);
      };
      init();
    }
  }, [step]);

  const handleVideoReady = (video: HTMLVideoElement) => {
    videoElementRef.current = video;
    detectLoop();
  };

  const detectLoop = async () => {
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
  };

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

  const handleFinalize = () => {
    registerUser({
      ...formData,
      faceEnrollmentStatus: 'completed',
      livenessStatus: 'ok'
    });
  };

  const simulateIdCapture = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setFormData({ ...formData, idCardUrl: 'https://picsum.photos/seed/demo-id/400/250' });
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      <div className="p-4 flex items-center border-b bg-white sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={step === 1 ? onCancel : () => setStep(step - 1)}>
          <ChevronLeft />
        </Button>
        <div className="flex-1 text-center font-bold">Registro OMNIA</div>
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
              Siguiente
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-bold mb-2">Identificación</h2>
              <p className="text-muted-foreground text-sm">Sube una foto de tu credencial oficial.</p>
            </div>
            
            <div className="aspect-[1.6/1] bg-muted rounded-3xl border-2 border-dashed border-[#bbd300]/20 flex flex-col items-center justify-center text-center p-6 overflow-hidden relative">
              {formData.idCardUrl ? (
                <>
                  <Image src={formData.idCardUrl} alt="ID Card" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Button variant="outline" className="bg-white" onClick={() => setFormData({...formData, idCardUrl: ''})}>
                      Cambiar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-[#bbd300] mb-2" />
                  <p className="font-bold">Capturar ID</p>
                  <p className="text-xs text-muted-foreground mt-1">Frente de la identificación</p>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-14 rounded-xl border-gray-200" onClick={simulateIdCapture} disabled={isProcessing}>
                <CameraIcon className="mr-2 h-4 w-4" /> Cámara
              </Button>
              <Button variant="outline" className="h-14 rounded-xl border-gray-200" onClick={simulateIdCapture} disabled={isProcessing}>
                Galería
              </Button>
            </div>

            {formData.idCardUrl && (
              <Button className="w-full h-14 rounded-xl bg-[#bbd300] text-[#1e1e1e] font-bold" onClick={() => setStep(3)}>
                Continuar
              </Button>
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
              {!isModelsReady ? (
                <div className="flex-1 bg-black rounded-[3rem] flex flex-col items-center justify-center text-white p-10 text-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-[#bbd300]" />
                  <p className="text-sm font-bold uppercase tracking-widest">Cargando Motores Biométricos...</p>
                </div>
              ) : (
                <div className="flex-1 relative">
                  <CameraView 
                    onVideoReady={handleVideoReady} 
                    isFaceDetected={faceCount === 1}
                    isFaceCentered={isFaceCentered}
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
              )}
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
              <h2 className="text-3xl font-bold mb-2">¡Evolución Lista!</h2>
              <p className="text-muted-foreground px-4 text-sm">
                Tu registro biométrico ha sido validado satisfactoriamente.
              </p>
            </div>

            <div className="bg-muted/50 p-6 rounded-[2rem] text-left space-y-3 border border-gray-100">
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Resumen de Cuenta</p>
              <div>
                <p className="font-bold text-lg leading-tight">{formData.name}</p>
                <p className="text-xs text-muted-foreground">{formData.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <p className="text-[10px] font-bold uppercase text-blue-600">Estatus: Pendiente de Activación</p>
              </div>
            </div>

            <Button 
              className="w-full h-16 rounded-2xl text-lg font-bold bg-[#bbd300] text-[#1e1e1e] shadow-xl shadow-[#bbd300]/20" 
              onClick={handleFinalize}
            >
              Completar Registro
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
