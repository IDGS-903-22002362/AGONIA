"use client";

import { useState } from 'react';
import { useDemoState } from '@/hooks/use-demo-state';
import { UserProfile, MembershipPlan } from '@/types';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LogOut, 
  Users, 
  FileCheck, 
  Search, 
  Filter, 
  Check, 
  X, 
  Info, 
  ExternalLink, 
  Calendar, 
  ShieldCheck, 
  Clock, 
  RefreshCcw, 
  Ban,
  Phone,
  CheckCircle2
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from 'next/image';
import { cn } from "@/lib/utils";

export default function StaffDashboard({ onLogout }: { onLogout: () => void }) {
  const { users, updateStatus, toggleSubscription, extendMembership, changePlan } = useDemoState();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan>('Mensual');
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  const pendingUsers = users.filter(u => u.status === 'PENDING');
  const activeMembers = users.filter(u => u.status === 'ACTIVE');
  const expiredMembers = users.filter(u => u.status === 'EXPIRED' || u.status === 'REJECTED');

  const filterUsers = (userList: UserProfile[]) => {
    return userList.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery)
    );
  };

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

  const handleExtend = (userId: string) => {
    extendMembership(userId, 7);
    const updated = users.find(u => u.id === userId);
    if (updated) setSelectedUser(updated);
  };

  const handleDeactivate = (userId: string) => {
    toggleSubscription(userId, false);
    const updated = users.find(u => u.id === userId);
    if (updated) setSelectedUser(updated);
  };

  const handleChangePlanSubmit = () => {
    if (selectedUser) {
      changePlan(selectedUser.id, selectedPlan);
      setIsChangePlanOpen(false);
      const updated = users.find(u => u.id === selectedUser.id);
      if (updated) setSelectedUser(updated);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Staff Bar */}
      <div className="p-4 bg-[#1e1e1e] text-white flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#bbd300] flex items-center justify-center text-[#1e1e1e]">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] text-[#bbd300] font-bold uppercase tracking-widest">Staff Portal</p>
            <p className="font-bold leading-none">OMNIA Fitness</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={onLogout}>
          <LogOut size={20} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-white border-b px-4 sticky top-0 z-10">
            <TabsList className="w-full grid grid-cols-3 bg-muted/50 mt-4 h-12 p-1 rounded-xl">
              <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-[#1e1e1e] data-[state=active]:text-[#bbd300] data-[state=active]:shadow-sm text-xs">
                Pendientes ({pendingUsers.length})
              </TabsTrigger>
              <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-[#1e1e1e] data-[state=active]:text-[#bbd300] data-[state=active]:shadow-sm text-xs">
                Activos ({activeMembers.length})
              </TabsTrigger>
              <TabsTrigger value="expired" className="rounded-lg data-[state=active]:bg-[#1e1e1e] data-[state=active]:text-[#bbd300] data-[state=active]:shadow-sm text-xs">
                Vencidos
              </TabsTrigger>
            </TabsList>
            
            <div className="py-4 relative">
              <Search className="absolute left-3 top-7 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Nombre, email o teléfono..." 
                className="pl-10 h-11 rounded-xl bg-muted/30 border-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <TabsContent value="pending" className="p-4 m-0 space-y-4">
            {filterUsers(pendingUsers).length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <FileCheck size={48} className="mx-auto mb-4 opacity-20" />
                <p>No hay solicitudes pendientes.</p>
              </div>
            ) : (
              filterUsers(pendingUsers).map(user => (
                <div key={user.id} className="bg-white rounded-2xl p-4 shadow-sm border flex flex-col gap-4 animate-in fade-in slide-in-from-left-2">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className="h-12 w-12 rounded-xl bg-[#bbd300]/10 text-[#bbd300] flex items-center justify-center font-bold text-lg">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                          <Phone size={10} /> {user.phone}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-[#bbd300]/10 text-[#1e1e1e] border-[#bbd300]/30">
                      Nuevo
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 rounded-lg border-gray-200 text-[#1e1e1e]"
                      onClick={() => setSelectedUser(user)}
                    >
                      <Info size={16} className="mr-2" /> Detalles
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 rounded-lg bg-[#bbd300] text-[#1e1e1e] hover:bg-[#a8bd00]"
                      onClick={() => { setSelectedUser(user); setIsApproveModalOpen(true); }}
                    >
                      <Check size={16} className="mr-2" /> Aprobar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="active" className="p-4 m-0 space-y-3">
            {filterUsers(activeMembers).map(user => (
              <div 
                key={user.id} 
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
                onClick={() => setSelectedUser(user)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-[#1e1e1e] shadow-inner bg-[#bbd300]">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground leading-none">
                      {user.membership?.plan} • Vence {user.membership?.endDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#bbd300] text-[#1e1e1e] text-[10px] px-2 py-0">Activo</Badge>
                  <Info size={14} className="text-muted-foreground" />
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="expired" className="p-4 m-0 space-y-3">
            {filterUsers(expiredMembers).map(user => (
              <div 
                key={user.id} 
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center font-bold text-white shadow-inner",
                    user.status === 'REJECTED' ? 'bg-red-500' : 'bg-gray-400'
                  )}>
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground leading-none">
                      {user.status === 'REJECTED' ? 'Rechazado' : `Vencido (${user.membership?.endDate || 'N/A'})`}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={cn(
                  "text-[10px] px-2 py-0",
                  user.status === 'REJECTED' ? 'text-red-600 border-red-200' : 'text-gray-600 border-gray-200'
                )}>
                  {user.status === 'REJECTED' ? 'Rechazado' : 'Vencido'}
                </Badge>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Modal */}
      {selectedUser && !isApproveModalOpen && !isRejectModalOpen && !isChangePlanOpen && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-[95vw] rounded-3xl p-0 overflow-hidden border-none sm:max-w-md">
            <DialogHeader className="p-6 bg-[#1e1e1e] text-white text-left relative">
              <div className="flex justify-between items-start">
                <div>
                  <DialogTitle className="text-2xl font-bold">{selectedUser.name}</DialogTitle>
                  <DialogDescription className="text-white/80">Gestión de usuario OMNIA Fitness.</DialogDescription>
                </div>
                <Badge className={cn(
                  "bg-white/20 text-white border-white/20",
                  selectedUser.status === 'ACTIVE' && "bg-[#bbd300] text-[#1e1e1e]",
                  selectedUser.status === 'PENDING' && "bg-blue-500/30",
                  selectedUser.status === 'REJECTED' && "bg-red-500/30"
                )}>
                  {selectedUser.status}
                </Badge>
              </div>
            </DialogHeader>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              {/* Profile Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 p-3 rounded-xl border">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Email</p>
                  <p className="font-medium break-all">{selectedUser.email}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Teléfono</p>
                  <p className="font-medium">{selectedUser.phone}</p>
                </div>
              </div>

              {/* ID Card */}
              <div>
                <Label className="text-xs uppercase text-muted-foreground font-bold mb-2 block">Documentación</Label>
                <div className="aspect-[1.6/1] bg-muted rounded-2xl relative overflow-hidden shadow-inner border">
                  <Image src={selectedUser.idCardUrl} alt="ID Card" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/10"></div>
                </div>
              </div>

              {/* Biometrics Status */}
              <div className="flex items-center justify-between p-4 bg-[#bbd300]/5 rounded-2xl border border-[#bbd300]/10">
                <div className="flex items-center gap-3">
                  <div className="bg-[#bbd300] text-[#1e1e1e] p-2 rounded-lg">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Biometría Facial</p>
                    <p className="text-[10px] text-muted-foreground">Liveness: {selectedUser.livenessStatus || 'OK'}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[#1e1e1e] border-[#bbd300]/20 bg-[#bbd300]/10">VALIDADO</Badge>
              </div>

              {/* Quick Actions Section */}
              {selectedUser.status !== 'PENDING' && (
                <div className="space-y-3">
                  <Label className="text-xs uppercase text-muted-foreground font-bold">Acciones Rápidas</Label>
                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start h-12 rounded-xl border-gray-100 text-[#1e1e1e] hover:bg-gray-50"
                      onClick={() => handleExtend(selectedUser.id)}
                    >
                      <Clock size={18} className="mr-3 text-[#bbd300]" /> Extender 7 días
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start h-12 rounded-xl border-gray-100 text-[#1e1e1e] hover:bg-gray-50"
                      onClick={() => setIsChangePlanOpen(true)}
                    >
                      <RefreshCcw size={18} className="mr-3 text-[#bbd300]" /> Cambiar plan
                    </Button>
                    {selectedUser.status === 'ACTIVE' && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start h-12 rounded-xl border-red-100 text-red-600 hover:bg-red-50"
                        onClick={() => handleDeactivate(selectedUser.id)}
                      >
                        <Ban size={18} className="mr-3" /> Desactivar acceso
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="p-4 bg-gray-50 flex flex-row gap-3">
              {selectedUser.status === 'PENDING' ? (
                <>
                  <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={() => setIsRejectModalOpen(true)}>
                    Rechazar
                  </Button>
                  <Button className="flex-1 rounded-xl h-12 bg-[#bbd300] text-[#1e1e1e] hover:bg-[#a8bd00]" onClick={() => setIsApproveModalOpen(true)}>
                    Aprobar Registro
                  </Button>
                </>
              ) : (
                <Button variant="secondary" className="w-full rounded-xl h-12" onClick={() => setSelectedUser(null)}>
                  Cerrar
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Change Plan Modal */}
      <Dialog open={isChangePlanOpen} onOpenChange={setIsChangePlanOpen}>
        <DialogContent className="max-w-[90vw] rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Plan</DialogTitle>
            <DialogDescription>Selecciona el nuevo plan para {selectedUser?.name}.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Select defaultValue={selectedUser?.membership?.plan || "Mensual"} onValueChange={(val) => setSelectedPlan(val as MembershipPlan)}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="Seleccionar nuevo plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mensual">Mensual - $350</SelectItem>
                <SelectItem value="Trimestral">Trimestral - $900</SelectItem>
                <SelectItem value="Anual">Anual - $3,200</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setIsChangePlanOpen(false)}>Cancelar</Button>
            <Button className="bg-[#bbd300] text-[#1e1e1e] hover:bg-[#a8bd00]" onClick={handleChangePlanSubmit}>Actualizar Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <DialogContent className="max-w-[90vw] rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="text-[#bbd300]" /> Asignar Plan Inicial
            </DialogTitle>
            <DialogDescription>
              Selecciona el plan para activar la membresía en OMNIA Fitness.
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
          </div>
          <DialogFooter className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setIsApproveModalOpen(false)}>Cancelar</Button>
            <Button className="bg-[#bbd300] text-[#1e1e1e] hover:bg-[#a8bd00]" onClick={handleApprove}>Confirmar y Activar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="max-w-[90vw] rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Rechazar Solicitud</DialogTitle>
            <DialogDescription>
              Indica el motivo del rechazo para {selectedUser?.name}.
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
          <DialogFooter className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject}>Confirmar Rechazo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
