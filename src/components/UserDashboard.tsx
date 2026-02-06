"use client";

import { UserProfile } from '@/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LogOut, 
  CreditCard, 
  Clock, 
  User as UserIcon, 
  CheckCircle, 
  AlertCircle, 
  History, 
  Info,
  AlertTriangle,
  Trophy
} from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  label: string;
  description: string;
}

const STEPS: Step[] = [
  { id: 1, label: 'Registro', description: 'Datos personales' },
  { id: 2, label: 'Documentos', description: 'ID Oficial' },
  { id: 3, label: 'Biometría', description: 'Registro facial' },
  { id: 4, label: 'Revisión', description: 'Validación de Staff' },
  { id: 5, label: 'Activo', description: 'Acceso total' },
];

export default function UserDashboard({ user, onLogout }: { user: UserProfile, onLogout: () => void }) {
  const isPending = user.status === 'PENDING';
  const isActive = user.status === 'ACTIVE' && user.membership?.status === 'ACTIVE';
  const isExpired = user.status === 'EXPIRED' || (user.membership?.status === 'EXPIRED');
  const isRejected = user.status === 'REJECTED';

  const getCurrentStep = () => {
    if (isRejected) return 4;
    if (isActive) return 5;
    if (isPending) return 4;
    return 1;
  };

  const currentStep = getCurrentStep();

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      {isRejected && (
        <div className="bg-destructive text-destructive-foreground p-4 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <AlertTriangle className="shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold">Solicitud Rechazada</p>
            <p className="text-xs opacity-90">{user.rejectionReason || "Por favor, revisa tus documentos."}</p>
          </div>
          <Button variant="outline" size="sm" className="bg-white/10 border-white/20 hover:bg-white/20">Reintentar</Button>
        </div>
      )}

      {isActive && user.membership?.daysRemaining && user.membership.daysRemaining > 30 && (
        <div className="bg-green-600 text-white p-4 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <Trophy className="shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold">¡Bienvenido al equipo!</p>
            <p className="text-xs opacity-90">Tu suscripción ha sido aprobada con éxito.</p>
          </div>
        </div>
      )}

      <div className="p-4 bg-primary text-white flex items-center justify-between sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center border border-white/10">
            <UserIcon size={20} />
          </div>
          <div>
            <p className="text-xs opacity-80 leading-none mb-1">Usuario Miembro</p>
            <p className="font-bold leading-none">{user.name}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onLogout}>
          <LogOut size={20} />
        </Button>
      </div>

      <div className="p-4 space-y-6 pb-20">
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-lg">Proceso de Ingreso</h3>
            <Badge variant="outline" className={cn(
              isRejected ? "text-destructive border-destructive" : 
              isActive ? "text-green-600 border-green-600" : "text-primary border-primary"
            )}>
              {isRejected ? "Rechazado" : isActive ? "Completado" : "En progreso"}
            </Badge>
          </div>
          
          <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary before:via-primary/20 before:to-transparent">
            {STEPS.map((step) => {
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;
              const isFailed = isRejected && step.id === 4;

              return (
                <div key={step.id} className="relative flex items-start gap-4 animate-in fade-in slide-in-from-left duration-500">
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full shrink-0 z-10 border-2 transition-colors",
                    isCompleted ? "bg-primary border-primary text-white" : 
                    isFailed ? "bg-destructive border-destructive text-white" :
                    isCurrent ? "bg-white border-primary text-primary" : "bg-white border-gray-200 text-gray-400"
                  )}>
                    {isCompleted ? <CheckCircle size={20} /> : 
                     isFailed ? <AlertCircle size={20} /> : 
                     <span>{step.id}</span>}
                  </div>
                  <div className="flex flex-col pt-1">
                    <span className={cn("font-bold text-sm", isCurrent ? "text-primary" : "text-foreground")}>
                      {step.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{step.description}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <Card className="rounded-3xl border-none shadow-xl overflow-hidden bg-white">
          <CardContent className="p-6">
            {isPending ? (
              <div className="text-center space-y-3">
                <div className="h-14 w-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock size={28} className="animate-pulse" />
                </div>
                <h3 className="font-bold text-lg">Casi listo, {user.name.split(' ')[0]}</h3>
                <p className="text-sm text-muted-foreground">Estamos revisando tu identidad. Normalmente toma menos de 2 horas en horario laboral.</p>
                <div className="pt-2">
                  <Button variant="outline" className="w-full rounded-xl">
                    <Info className="mr-2 h-4 w-4" /> Ayuda con el registro
                  </Button>
                </div>
              </div>
            ) : isActive ? (
              <div className="space-y-4">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Plan Vigente</p>
                    <p className="text-xl font-bold text-primary">{user.membership?.plan}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Vence</p>
                    <p className="font-bold">{user.membership?.endDate}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Vigencia</span>
                    <span className="font-medium">{user.membership?.daysRemaining} días restantes</span>
                  </div>
                  <Progress value={(user.membership!.daysRemaining / 365) * 100} className="h-3 rounded-full" />
                </div>

                <Button className="w-full h-12 rounded-xl mt-2 bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20">
                  <CreditCard className="mr-2 h-4 w-4" /> Ver Credencial Digital
                </Button>
              </div>
            ) : isRejected ? (
              <div className="text-center space-y-3">
                <div className="h-14 w-14 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-2">
                  <AlertCircle size={28} />
                </div>
                <h3 className="font-bold text-lg">Requiere Acción</h3>
                <p className="text-sm text-muted-foreground">Tu solicitud fue rechazada. Motivo: <span className="text-destructive font-medium">{user.rejectionReason}</span></p>
                <Button className="w-full h-12 rounded-xl mt-2">
                  Corregir Documentos
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="h-14 w-14 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <AlertCircle size={28} />
                </div>
                <h3 className="font-bold text-lg">Plan Vencido</h3>
                <p className="text-sm text-muted-foreground">Tu suscripción ha finalizado. Renueva para volver al gimnasio.</p>
                <Button className="w-full h-12 rounded-xl mt-2 shadow-lg">Renovar Membresía</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h3 className="font-bold px-1">Tus Pagos Recientes</h3>
          {user.payments && user.payments.length > 0 ? (
            <div className="space-y-2">
              {user.payments.slice(0, 2).map((p) => (
                <div key={p.id} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <History size={16} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Membresía {p.plan}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">{p.date}</p>
                    </div>
                  </div>
                  <p className="font-bold text-primary">${p.amount}</p>
                </div>
              ))}
              <Button variant="ghost" className="w-full text-xs text-muted-foreground h-8">Ver historial completo</Button>
            </div>
          ) : (
            <div className="bg-white/50 border border-dashed rounded-2xl p-6 text-center">
              <p className="text-sm text-muted-foreground">No tienes pagos registrados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
