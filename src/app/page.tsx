
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDemoState } from '@/hooks/use-demo-state';
import { User, ShieldCheck, Dumbbell, Loader2, IdCard } from 'lucide-react';
import UserDashboard from '@/components/UserDashboard';
import StaffDashboard from '@/components/StaffDashboard';
import RegisterFlow from '@/components/RegisterFlow';
import Link from 'next/link';

export default function Home() {
  const { role, currentUser, isLoading, loginAsUser, loginAsStaff, logout } = useDemoState();
  const [showRegister, setShowRegister] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-[#bbd300]" />
        <p className="mt-4 text-muted-foreground font-bold uppercase tracking-widest text-xs">Cargando OMNIA Fitness...</p>
      </div>
    );
  }

  if (showRegister) {
    return <RegisterFlow onCancel={() => setShowRegister(false)} />;
  }

  if (role === 'USER' && currentUser) {
    return <UserDashboard user={currentUser} onLogout={logout} />;
  }

  if (role === 'STAFF') {
    return <StaffDashboard onLogout={logout} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="mb-8">
        <div className="bg-[#1e1e1e] text-[#bbd300] p-4 rounded-full inline-block mb-4 shadow-xl animate-bounce">
          <Dumbbell size={48} />
        </div>
        <h1 className="text-4xl font-bold text-[#1e1e1e] mb-2 uppercase tracking-tighter">OMNIA <span className="text-[#bbd300]">Fitness</span></h1>
        <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Evolutionary Training</p>
      </div>

      <Card className="w-full max-w-sm border-none shadow-none bg-transparent">
        <CardContent className="grid gap-4 p-0">
          <Button 
            className="h-16 text-md font-bold justify-start px-6 rounded-2xl shadow-xl bg-[#bbd300] text-[#1e1e1e] hover:bg-[#a8bd00] transition-all active:scale-95" 
            onClick={() => setShowRegister(true)}
          >
            <User className="mr-4 h-6 w-6" />
            Nuevo Registro
          </Button>

          <Button 
            variant="outline"
            className="h-16 text-md font-bold justify-start px-6 rounded-2xl shadow-md bg-white border-[#1e1e1e] text-[#1e1e1e] hover:bg-gray-50 active:scale-95 transition-all" 
            onClick={() => loginAsUser('demo@example.com')}
          >
            <User className="mr-4 h-6 w-6" />
            Acceso Miembro
          </Button>

          <Button 
            variant="outline"
            className="h-16 text-md font-bold justify-start px-6 rounded-2xl shadow-md bg-[#1e1e1e] text-white border-transparent hover:bg-black active:scale-95 transition-all" 
            onClick={() => loginAsStaff()}
          >
            <ShieldCheck className="mr-4 h-6 w-6 text-[#bbd300]" />
            Panel de Staff
          </Button>
        </CardContent>
      </Card>

      <div className="mt-16 text-[10px] text-muted-foreground font-black tracking-[0.2em] uppercase">
        PODER • DISCIPLINA • RESULTADOS
      </div>
    </div>
  );
}
