
"use client";

import { UserProfile } from '@/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Calendar, CreditCard, Clock, User as UserIcon, CheckCircle, AlertCircle, History } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import Image from 'next/image';

export default function UserDashboard({ user, onLogout }: { user: UserProfile, onLogout: () => void }) {
  const isPending = user.status === 'PENDING';
  const isActive = user.status === 'ACTIVE' && user.membership?.status === 'ACTIVE';
  const isExpired = user.status === 'EXPIRED' || (user.membership?.status === 'EXPIRED');

  const getStatusBadge = () => {
    if (isPending) return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 px-3 py-1">Pendiente de Aprobación</Badge>;
    if (isActive) return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1">Suscripción Activa</Badge>;
    if (isExpired) return <Badge variant="destructive" className="px-3 py-1">Suscripción Vencida</Badge>;
    return <Badge className="px-3 py-1">{user.status}</Badge>;
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      {/* App Bar */}
      <div className="p-4 bg-primary text-white flex items-center justify-between sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
            <UserIcon size={20} />
          </div>
          <div>
            <p className="text-xs opacity-80">Bienvenido,</p>
            <p className="font-bold leading-none">{user.name.split(' ')[0]}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onLogout}>
          <LogOut size={20} />
        </Button>
      </div>

      <div className="p-4 space-y-6 pb-20">
        {/* Status Card */}
        <Card className="rounded-3xl border-none shadow-xl overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              {getStatusBadge()}
              {isActive && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Días restantes</p>
                  <p className="text-2xl font-bold text-primary">{user.membership?.daysRemaining}</p>
                </div>
              )}
            </div>

            {isPending ? (
              <div className="py-4 text-center">
                <div className="h-16 w-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock size={32} className="animate-pulse" />
                </div>
                <h3 className="font-bold text-lg">Validación en curso</h3>
                <p className="text-sm text-muted-foreground mt-1">Estamos revisando tus documentos. Te notificaremos pronto.</p>
              </div>
            ) : isActive ? (
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Progreso de plan {user.membership?.plan}</span>
                  <span className="font-medium">Vence: {user.membership?.endDate}</span>
                </div>
                <Progress value={(user.membership!.daysRemaining / 365) * 100} className="h-3 bg-gray-100" />
                <Button className="w-full h-12 rounded-xl mt-2 bg-accent hover:bg-accent/90">
                  <CreditCard className="mr-2 h-4 w-4" /> Renovar Ahora
                </Button>
              </div>
            ) : (
              <div className="py-4 text-center">
                <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} />
                </div>
                <h3 className="font-bold text-lg">Suscripción Inactiva</h3>
                <p className="text-sm text-muted-foreground mt-1">Tu plan ha vencido. Renueva para seguir disfrutando.</p>
                <Button className="w-full h-12 rounded-xl mt-4">Renovar Plan</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validation Status */}
        <div className="space-y-3">
          <h3 className="font-bold px-1">Estatus de Documentación</h3>
          <div className="grid gap-3">
            <div className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 text-green-600 p-2 rounded-lg">
                  <CheckCircle size={18} />
                </div>
                <span className="text-sm font-medium">Credencial Oficial</span>
              </div>
              <span className="text-xs text-muted-foreground">Verificado</span>
            </div>
            <div className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`${user.facialRegStatus === 'COMPLETED' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'} p-2 rounded-lg`}>
                  {user.facialRegStatus === 'COMPLETED' ? <CheckCircle size={18} /> : <Clock size={18} />}
                </div>
                <span className="text-sm font-medium">Registro Facial</span>
              </div>
              <span className="text-xs text-muted-foreground">{user.facialRegStatus === 'COMPLETED' ? 'Completado' : 'Pendiente'}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold">Historial de Pagos</h3>
            <Button variant="link" className="text-primary text-xs h-auto p-0">Ver todo</Button>
          </div>
          {user.payments.length > 0 ? (
            <div className="space-y-2">
              {user.payments.map((p) => (
                <div key={p.id} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-2 rounded-full">
                      <History size={16} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Plan {p.plan}</p>
                      <p className="text-xs text-muted-foreground">{p.date}</p>
                    </div>
                  </div>
                  <p className="font-bold text-primary">${p.amount}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/50 border-2 border-dashed rounded-2xl p-8 text-center">
              <p className="text-sm text-muted-foreground italic">No hay pagos registrados aún.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
