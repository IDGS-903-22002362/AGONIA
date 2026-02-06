
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDemoState } from '@/hooks/use-demo-state';
import { Camera, ChevronLeft, CheckCircle2, User, Mail, Phone, Upload, Scan, Sun, Target, Glasses, Check } from 'lucide-react';
import Image from 'next/image';
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function RegisterFlow({ onCancel }: { onCancel: () => void }) {
  const { registerUser } = useDemoState();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    idCardUrl: ''
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(Math.max(1, step - 1));

  const handleRegister = () => {
    setIsSimulating(true);
    setTimeout(() => {
      registerUser(formData);
      setIsSimulating(false);
    }, 1500);
  };

  const simulateCapture = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setFormData({ ...formData, idCardUrl: 'https://picsum.photos/seed/demo-id/400/250' });
      setIsSimulating(false);
    }, 1000);
  };

  const startFacialScan = () => {
    setIsSimulating(true);
    setScanProgress(0);
  };

  useEffect(() => {
    if (isSimulating && step === 3) {
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsSimulating(false);
              nextStep();
            }, 500);
            return 100;
          }
          return prev + 5;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isSimulating, step]);

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      {/* Header */}
      <div className="p-4 flex items-center border-b bg-white sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={step === 1 ? onCancel : prevStep}>
          <ChevronLeft />
        </Button>
        <div className="flex-1 text-center font-bold">Registro</div>
        <div className="w-10"></div>
      </div>

      <div className="p-4 flex-1">
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Paso {step} de 4</span>
            <span>{Math.round((step / 4) * 100)}% Completado</span>
          </div>
          <Progress value={(step / 4) * 100} className="h-2" />
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <h2 className="text-2xl font-bold mb-2">Datos Personales</h2>
              <p className="text-muted-foreground text-sm">Ingresa tu información para crear tu cuenta.</p>
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
              className="w-full h-12 rounded-xl" 
              onClick={nextStep}
              disabled={!formData.name || !formData.email || !formData.phone}
            >
              Siguiente
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-bold mb-2">Credencial Oficial</h2>
              <p className="text-muted-foreground text-sm">Sube una foto clara de tu identificación oficial para validación.</p>
            </div>
            
            <div className="aspect-[1.6/1] bg-muted rounded-2xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center text-center p-6 overflow-hidden relative">
              {formData.idCardUrl ? (
                <>
                  <Image 
                    src={formData.idCardUrl} 
                    alt="ID Card" 
                    fill 
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Button variant="outline" className="bg-white" onClick={() => setFormData({...formData, idCardUrl: ''})}>
                      Cambiar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-primary mb-2" />
                  <p className="font-medium">Presiona para capturar</p>
                  <p className="text-xs text-muted-foreground mt-1">Frente de la identificación</p>
                </>
              )}
            </div>

            {!formData.idCardUrl && (
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-14 rounded-xl" onClick={simulateCapture} disabled={isSimulating}>
                  <Camera className="mr-2 h-4 w-4" /> Cámara
                </Button>
                <Button variant="outline" className="h-14 rounded-xl" onClick={simulateCapture} disabled={isSimulating}>
                  Galería
                </Button>
              </div>
            )}

            {formData.idCardUrl && (
              <Button className="w-full h-12 rounded-xl" onClick={nextStep}>
                Continuar
              </Button>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
            <div>
              <h2 className="text-2xl font-bold mb-2">Registro Facial</h2>
              <p className="text-muted-foreground text-sm">Alinea tu rostro dentro del óvalo para la verificación.</p>
            </div>
            
            <div className="flex-1 relative bg-black rounded-3xl overflow-hidden min-h-[400px]">
              <Image 
                src="https://picsum.photos/seed/facecam/400/600" 
                alt="Camera Stream" 
                fill 
                className="object-cover opacity-80"
              />
              <div className="facial-guide"></div>
              
              {/* Checklist Overlay */}
              <div className="absolute top-4 left-4 right-4 flex justify-between gap-2">
                {[
                  { icon: Sun, label: "Buena luz" },
                  { icon: Target, label: "Centrado" },
                  { icon: Glasses, label: "Sin lentes" }
                ].map((item, idx) => (
                  <div key={idx} className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/20">
                    <item.icon className="h-3 w-3 text-white" />
                    <span className="text-[10px] text-white font-medium">{item.label}</span>
                    <Check className="h-3 w-3 text-green-400" />
                  </div>
                ))}
              </div>

              {isSimulating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white p-6 text-center">
                  <div className="w-48 space-y-4">
                    <Scan className="h-16 w-16 mb-4 mx-auto animate-pulse text-primary" />
                    <p className="text-xl font-bold">Analizando...</p>
                    <div className="space-y-1">
                      <Progress value={scanProgress} className="h-1.5 bg-white/20" />
                      <p className="text-[10px] text-white/70">{scanProgress}% Completado</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-6">
                   <Button 
                    variant="secondary" 
                    size="lg" 
                    className="rounded-full h-20 w-20 p-0 shadow-2xl border-4 border-white/20" 
                    onClick={startFacialScan}
                  >
                    <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center">
                      <Camera className="h-8 w-8 text-primary" />
                    </div>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
            <div className="flex justify-center">
              <div className="h-24 w-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <CheckCircle2 size={64} />
              </div>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold mb-2">¡Todo Listo!</h2>
              <p className="text-muted-foreground px-4">
                Tu rostro ha sido capturado correctamente.
              </p>
              <div className="mt-6 flex flex-col gap-2 items-center">
                <div className="inline-block bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium border border-green-200">
                  Verificación de vida: OK (Simulada)
                </div>
                <div className="inline-block bg-blue-50 text-blue-700 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                  Face Enrollment: COMPLETED
                </div>
              </div>
            </div>

            <div className="bg-muted p-6 rounded-2xl text-left space-y-2">
              <p className="text-xs uppercase font-bold text-muted-foreground">Resumen del registro</p>
              <p className="font-bold">{formData.name}</p>
              <p className="text-sm">{formData.email}</p>
              <p className="text-sm">Estatus: <span className="text-primary font-bold">PENDIENTE DE VALIDACIÓN</span></p>
            </div>

            <Button 
              className="w-full h-14 rounded-xl text-lg shadow-lg" 
              onClick={handleRegister}
              disabled={isSimulating}
            >
              {isSimulating ? "Finalizando..." : "Completar Registro"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
