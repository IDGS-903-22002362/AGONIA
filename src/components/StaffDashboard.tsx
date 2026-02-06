
"use client";

import { useState } from 'react';
import { useDemoState } from '@/hooks/use-demo-state';
import { UserProfile, MembershipPlan } from '@/types';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Users, FileCheck, Search, Filter, Check, X, Info, ExternalLink, Calendar, ShieldCheck } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from 'next/image';

export default function StaffDashboard({ onLogout }: { onLogout: () => void }) {
  const { users, updateStatus, toggleSubscription } = useDemoState();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan>('Mensual');
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const pendingUsers = users.filter(u => u.status === 'PENDING');
  const activeUsers = users.filter(u => u.status === 'ACTIVE' || u.status === 'EXPIRED');

  const filteredActive = activeUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApprove = () => {
    if (selectedUser) {
      updateStatus(selectedUser.id, 'ACTIVE', selectedPlan);
      setIsApproveModalOpen(false);
      setSelectedUser(null);
    }
  };

  const handleReject = () => {
    if (selectedUser) {
      updateStatus(selectedUser.id, 'REJECTED', undefined, rejectionReason);
      setIsRejectModalOpen(false);
      setSelectedUser(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Staff Bar */}
      <div className="p-4 bg-gray-900 text-white flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-xs opacity-80 font-bold uppercase tracking-wider">Staff Admin</p>
            <p className="font-bold leading-none">GymCentral</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={onLogout}>
          <LogOut size={20} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="pending" className="w-full">
          <div className="bg-white border-b px-4">
            <TabsList className="w-full grid grid-cols-2 bg-muted/50 mt-4 h-12 p-1 rounded-xl">
              <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Pendientes ({pendingUsers.length})
              </TabsTrigger>
              <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Gestionar
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pending" className="p-4 m-0 space-y-4">
            {pendingUsers.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <FileCheck size={48} className="mx-auto mb-4 opacity-20" />
                <p>No hay solicitudes pendientes.</p>
              </div>
            ) : (
              pendingUsers.map(user => (
                <div key={user.id} className="bg-white rounded-2xl p-4 shadow-sm border flex flex-col gap-4 animate-in fade-in slide-in-from-left-2">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">{user.phone}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                      Nuevo
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 rounded-lg border-blue-100 text-blue-600"
                      onClick={() => setSelectedUser(user)}
                    >
                      <Info size={16} className="mr-2" /> Detalles
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 rounded-lg bg-green-600 hover:bg-green-700"
                      onClick={() => { setSelectedUser(user); setIsApproveModalOpen(true); }}
                    >
                      <Check size={16} className="mr-2" /> Aprobar
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="flex-none rounded-lg p-2"
                      onClick={() => { setSelectedUser(user); setIsRejectModalOpen(true); }}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="p-4 m-0 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar usuarios..." 
                className="pl-10 h-11 rounded-xl bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid gap-3">
              {filteredActive.map(user => (
                <div key={user.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white shadow-inner ${user.status === 'ACTIVE' ? 'bg-primary' : 'bg-red-400'}`}>
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground leading-none">{user.membership?.plan || 'Sin plan'} • Vence {user.membership?.endDate || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.status === 'ACTIVE' ? 'default' : 'destructive'} className="text-[10px] px-2 py-0">
                      {user.status === 'ACTIVE' ? 'Activo' : 'Vencido'}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full hover:bg-gray-100"
                      onClick={() => {
                        const nextState = user.status !== 'ACTIVE';
                        toggleSubscription(user.id, nextState);
                      }}
                    >
                      {user.status === 'ACTIVE' ? <X size={14} className="text-red-500" /> : <Check size={14} className="text-green-500" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Modal */}
      {selectedUser && !isApproveModalOpen && !isRejectModalOpen && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-[90vw] rounded-3xl p-0 overflow-hidden border-none sm:max-w-md">
            <DialogHeader className="p-6 bg-primary text-white text-left">
              <DialogTitle className="text-2xl font-bold">{selectedUser.name}</DialogTitle>
              <DialogDescription className="text-white/80">Revisión de documentos y registro facial.</DialogDescription>
            </DialogHeader>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
              <div>
                <Label className="text-xs uppercase text-muted-foreground font-bold mb-2 block">Identificación Oficial</Label>
                <div className="aspect-[1.6/1] bg-muted rounded-2xl relative overflow-hidden shadow-inner">
                  <Image src={selectedUser.idCardUrl} alt="ID Card" fill className="object-cover" />
                  <div className="absolute top-2 right-2">
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/80 backdrop-blur">
                      <ExternalLink size={14} />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="bg-accent/10 text-accent p-2 rounded-lg">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Registro Facial</p>
                    <p className="text-xs text-muted-foreground">Verificación de vida simulada</p>
                  </div>
                </div>
                <Badge className="bg-accent/10 text-accent border-accent/20">OK (Simulado)</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium break-all">{selectedUser.email}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{selectedUser.phone}</p>
                </div>
              </div>
            </div>
            <DialogFooter className="p-4 bg-gray-50 grid grid-cols-2 gap-4">
              <Button variant="outline" className="rounded-xl h-12" onClick={() => setIsRejectModalOpen(true)}>
                Rechazar
              </Button>
              <Button className="rounded-xl h-12" onClick={() => setIsApproveModalOpen(true)}>
                Continuar con Aprobación
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Approve Modal */}
      <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <DialogContent className="max-w-[90vw] rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="text-primary" /> Asignar Plan
            </DialogTitle>
            <DialogDescription>
              Selecciona el plan para activar la membresía de {selectedUser?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Membresía</Label>
              <Select defaultValue="Mensual" onValueChange={(val) => setSelectedPlan(val as MembershipPlan)}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Seleccionar plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mensual">Mensual - $350</SelectItem>
                  <SelectItem value="Trimestral">Trimestral - $900</SelectItem>
                  <SelectItem value="Anual">Anual - $3,200</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-primary/5 p-4 rounded-2xl space-y-2">
              <div className="flex justify-between text-sm">
                <span>Fecha Inicio</span>
                <span className="font-bold">Hoy</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Fecha Vencimiento</span>
                <span className="font-bold">
                  {selectedPlan === 'Mensual' ? 'En 30 días' : selectedPlan === 'Trimestral' ? 'En 90 días' : 'En 365 días'}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleApprove}>Confirmar y Activar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="max-w-[90vw] rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Rechazar Solicitud</DialogTitle>
            <DialogDescription>
              Indica el motivo por el cual no se puede validar este usuario.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Motivo de rechazo</Label>
              <Input 
                placeholder="Ej. Imagen de credencial borrosa" 
                className="h-12 rounded-xl"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject}>Confirmar Rechazo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
