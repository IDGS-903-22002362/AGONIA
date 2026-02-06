"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDemoState } from '@/hooks/use-demo-state';
import { User, ShieldCheck, Dumbbell, Loader2 } from 'lucide-react';
import UserDashboard from '@/components/UserDashboard';
import StaffDashboard from '@/components/StaffDashboard';
import RegisterFlow from '@/components/RegisterFlow';

export default function Home() {
  const { role, currentUser, isLoading, loginAsUser, loginAsStaff, logout } = useDemoState();
  const [showRegister, setShowRegister] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando GymCentral...</p>
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
        <div className="bg-primary text-white p-4 rounded-full inline-block mb-4 shadow-lg animate-bounce">
          <Dumbbell size={48} />
        </div>
        <h1 className="text-4xl font-bold text-primary mb-2">GymCentral</h1>
        <p className="text-muted-foreground">Tu entrenamiento, digitalizado.</p>
      </div>

      <Card className="w-full max-w-sm border-none shadow-none bg-transparent">
        <CardContent className="grid gap-4 p-0">
          <Button 
            className="h-16 text-lg justify-start px-6 rounded-2xl shadow-md" 
            onClick={() => setShowRegister(true)}
          >
            <User className="mr-4 h-6 w-6" />
            Nuevo Registro
          </Button>

          <Button 
            variant="outline"
            className="h-16 text-lg justify-start px-6 rounded-2xl shadow-md bg-white" 
            onClick={() => loginAsUser('demo@example.com')}
          >
            <User className="mr-4 h-6 w-6 text-primary" />
            Entrar como Usuario
          </Button>

          <Button 
            variant="outline"
            className="h-16 text-lg justify-start px-6 rounded-2xl shadow-md bg-white" 
            onClick={() => loginAsStaff()}
          >
            <ShieldCheck className="mr-4 h-6 w-6 text-accent" />
            Panel de Staff
          </Button>
        </CardContent>
      </Card>

      <div className="mt-12 text-xs text-muted-foreground italic">
        * Entorno Real con Firebase - Persistencia Activada
      </div>
    </div>
  );
}
