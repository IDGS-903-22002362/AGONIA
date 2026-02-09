'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CameraView } from '@/components/CameraView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { loadFaceApiModels, getFaceLandmarker } from '@/lib/face-loader';
import { decodePDF417FromVideo, decodePDF417FromImage, parseINEData } from '@/lib/pdf417';
import * as faceapi from 'face-api.js';
import { descriptorToArray, euclideanDistance, FACE_MATCH_THRESHOLD } from '@/lib/embeddings-utils';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  IdCard, 
  Scan, 
  Camera as CameraIcon, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  ChevronRight,
  ChevronLeft,
  XCircle,
  History
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type Step = 'SCAN_INE' | 'SELFIE' | 'RESULT';

export default function INEVerificationPage() {
  const [step, setStep] = useState<Step>('SCAN_INE');
  const [isModelsReady, setIsModelsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdf417Result, setPdf417Result] = useState<{ raw: string; parsed: any } | null>(null);
  const [selfieDescriptor, setSelfieDescriptor] = useState<number[] | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [userIdToMatch, setUserIdToMatch] = useState('');
  const [matchResult, setMatchResult] = useState<{ distance: number; match: boolean } | null>(null);
  
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

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

  const handleVideoReady = (video: HTMLVideoElement) => {
    videoElementRef.current = video;
    if (step === 'SCAN_INE') {
      startScanning();
    }
  };

  const startScanning = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    scanIntervalRef.current = setInterval(async () => {
      if (videoElementRef.current && step === 'SCAN_INE' && !pdf417Result) {
        const text = await decodePDF417FromVideo(videoElementRef.current);
        if (text) {
          const parsed = parseINEData(text);
          setPdf417Result({ raw: text, parsed });
          toast({ title: "INE Detectada", description: "Código PDF417 leído correctamente." });
          if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        }
      }
    }, 400);
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
        toast({ title: "INE Detectada", description: "Imagen procesada con éxito." });
      } else {
        toast({ title: "Error", description: "No se encontró un código PDF417 válido en la imagen.", variant: "destructive" });
      }
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCaptureSelfie = async () => {
    if (!videoElementRef.current) return;

    setIsProcessing(true);
    try {
      const video = videoElementRef.current;
      const detection = await faceapi
        .detectSingleFace(video)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        throw new Error("No se pudo detectar el rostro. Asegúrate de estar en un lugar iluminado.");
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      setSelfieUrl(canvas.toDataURL('image/jpeg'));
      setSelfieDescriptor(descriptorToArray(detection.descriptor));
      
      setStep('RESULT');
    } catch (error: any) {
      toast({ title: "Error Biométrico", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompareWithUser = async () => {
    if (!userIdToMatch || !selfieDescriptor) return;

    setIsProcessing(true);
    try {
      const docRef = doc(firestore, 'face_embeddings', userIdToMatch);
      const snap = await getDoc(docRef);

      if (!snap.exists()) {
        throw new Error("ID de usuario no encontrado en los registros de enrolamiento.");
      }

      const storedDescriptor = snap.data().descriptor;
      const distance = euclideanDistance(selfieDescriptor, storedDescriptor);
      const isMatch = distance < FACE_MATCH_THRESHOLD;

      setMatchResult({ distance, match: isMatch });
      toast({ 
        title: isMatch ? "¡Coincide!" : "No coincide", 
        description: `Similitud calculada: ${(1 - distance).toFixed(2)}`,
        variant: isMatch ? "default" : "destructive"
      });
    } catch (error: any) {
      toast({ title: "Error de Comparación", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const saveVerification = async () => {
    setIsProcessing(true);
    try {
      const verificationData = {
        userId: userIdToMatch || (user?.uid || 'anonymous'),
        pdf417: pdf417Result,
        selfie: {
          descriptor: selfieDescriptor,
          imageUrl: selfieUrl 
        },
        match: matchResult ? {
          comparedTo: "enroll_embedding",
          distance: matchResult.distance,
          threshold: FACE_MATCH_THRESHOLD,
          result: matchResult.match ? "match" : "no_match"
        } : {
          comparedTo: "none",
          result: "manual_review"
        },
        createdAt: serverTimestamp()
      };

      await addDoc(collection(firestore, 'ine_verifications'), verificationData);
      toast({ title: "Éxito", description: "Verificación guardada correctamente." });
      setStep('SCAN_INE');
      setPdf417Result(null);
      setSelfieDescriptor(null);
      setMatchResult(null);
      setUserIdToMatch('');
    } catch (error: any) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-4 bg-background">
      <div className="max-w-md mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/"><ChevronLeft /></Link>
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <IdCard className="text-[#bbd300]" /> Validación INE
          </h1>
          <div className="w-10"></div>
        </div>

        {!isModelsReady ? (
          <Card className="rounded-3xl border-none shadow-xl">
            <CardContent className="p-10 flex flex-col items-center justify-center text-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-[#bbd300]" />
              <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">Iniciando motores de visión...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              {[
                { id: 'SCAN_INE', label: 'Escanear', icon: Scan },
                { id: 'SELFIE', label: 'Selfie', icon: CameraIcon },
                { id: 'RESULT', label: 'Resultado', icon: UserCheck }
              ].map((s, idx) => (
                <div key={s.id} className="flex flex-col items-center gap-1">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                    step === s.id ? "bg-[#bbd300] text-[#1e1e1e]" : "bg-muted text-muted-foreground"
                  )}>
                    <s.icon size={16} />
                  </div>
                  <span className="text-[10px] font-bold uppercase">{s.label}</span>
                </div>
              ))}
            </div>

            {step === 'SCAN_INE' && (
              <Card className="rounded-3xl border-none shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                <CardHeader className="bg-[#1e1e1e] text-white py-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Scan className="text-[#bbd300]" size={16} /> Reverso de Identificación
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {!pdf417Result ? (
                    <>
                      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-inner group">
                        <CameraView 
                          onVideoReady={handleVideoReady} 
                          showChecklist={false} 
                          showFacialGuide={false}
                        />
                        <div className="absolute inset-0 border-2 border-[#bbd300]/30 border-dashed m-8 rounded-xl pointer-events-none group-hover:border-[#bbd300] transition-colors"></div>
                        <div className="absolute bottom-4 left-0 right-0 text-center">
                          <span className="bg-black/60 backdrop-blur-md text-white border-none text-[10px] px-3 py-1 rounded-full uppercase">Buscando código PDF417...</span>
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
                    <div className="space-y-4 animate-in zoom-in-95 duration-300">
                      <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3">
                        <CheckCircle2 className="text-green-500 shrink-0" size={24} />
                        <div>
                          <p className="font-bold text-green-800 text-sm">Código Detectado</p>
                          <p className="text-[10px] text-green-600 uppercase font-bold">Datos extraídos con éxito</p>
                        </div>
                      </div>
                      
                      <div className="bg-muted/30 p-4 rounded-2xl space-y-2 max-h-48 overflow-auto border">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Datos Parseados</p>
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
                          <p className="text-[10px] font-mono break-all opacity-70 leading-tight">{pdf417Result.raw}</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={() => setPdf417Result(null)}>
                          Reintentar
                        </Button>
                        <Button className="flex-1 rounded-xl h-12 bg-[#bbd300] text-[#1e1e1e] font-bold" onClick={() => setStep('SELFIE')}>
                          Continuar <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {step === 'SELFIE' && (
              <Card className="rounded-3xl border-none shadow-xl overflow-hidden animate-in fade-in slide-in-from-right-4">
                <CardHeader className="bg-[#1e1e1e] text-white py-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CameraIcon className="text-[#bbd300]" size={16} /> Captura de Selfie
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <CameraView onVideoReady={handleVideoReady} showFacialGuide={true} />
                  <Button 
                    className="w-full h-14 rounded-xl bg-[#bbd300] text-[#1e1e1e] font-bold shadow-lg shadow-[#bbd300]/20"
                    onClick={handleCaptureSelfie}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
                    ) : (
                      "Capturar Selfie Biométrica"
                    )}
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => setStep('SCAN_INE')}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Volver al Escaneo
                  </Button>
                </CardContent>
              </Card>
            )}

            {step === 'RESULT' && (
              <Card className="rounded-3xl border-none shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                <CardHeader className="bg-[#1e1e1e] text-white py-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <UserCheck className="text-[#bbd300]" size={16} /> Resultado de Validación
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-4">
                    {selfieUrl && (
                      <div className="relative h-20 w-20 rounded-2xl overflow-hidden shadow-md border-2 border-[#bbd300]">
                        <Image src={selfieUrl} alt="Selfie" fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Estatus de Validación</p>
                      <div className="flex items-center gap-2 mt-1">
                        {matchResult?.match ? (
                          <div className="bg-green-500 text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">COINCIDENCIA EXITOSA</div>
                        ) : matchResult ? (
                          <div className="bg-destructive text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">NO COINCIDE</div>
                        ) : (
                          <div className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">PENDIENTE DE REVISIÓN</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 bg-muted/20 p-4 rounded-2xl border">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Comparar con Usuario Registrado (Opcional)</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="ID de Usuario (Ej: juan_123)" 
                        value={userIdToMatch}
                        onChange={(e) => setUserIdToMatch(e.target.value)}
                        className="h-11 rounded-xl"
                      />
                      <Button 
                        size="sm" 
                        className="h-11 rounded-xl px-4 bg-[#1e1e1e] text-white"
                        onClick={handleCompareWithUser}
                        disabled={!userIdToMatch || isProcessing}
                      >
                        {isProcessing ? <Loader2 className="animate-spin h-4 w-4" /> : "Validar"}
                      </Button>
                    </div>
                    {matchResult && (
                      <div className={cn(
                        "mt-2 p-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2",
                        matchResult.match ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      )}>
                        {matchResult.match ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        <p className="text-[10px] font-bold uppercase">
                          Distancia: {matchResult.distance.toFixed(4)} (Umbral: {FACE_MATCH_THRESHOLD})
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground px-1">Resumen de Identificación</p>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="p-3 bg-white border rounded-xl flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">PDF417 Leído</span>
                        <CheckCircle2 size={16} className="text-[#bbd300]" />
                      </div>
                      <div className="p-3 bg-white border rounded-xl flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Biometría Capturada</span>
                        <CheckCircle2 size={16} className="text-[#bbd300]" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button 
                      className="w-full h-14 rounded-xl bg-[#bbd300] text-[#1e1e1e] font-bold"
                      onClick={saveVerification}
                      disabled={isProcessing}
                    >
                      {isProcessing ? <Loader2 className="animate-spin mr-2" /> : "Guardar y Finalizar"}
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={() => setStep('SELFIE')}>
                      <ChevronLeft className="mr-2 h-4 w-4" /> Volver a Selfie
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}