"use client";

import { useState, useEffect } from 'react';
import { UserProfile, AppRole, UserStatus, MembershipPlan, Membership } from '@/types';
import { useAuth, useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy, setDoc, getDoc } from 'firebase/firestore';
import { signInAnonymously, signOut } from 'firebase/auth';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export function useDemoState() {
  const { auth, firestore } = useSafeFirebase();
  const { user, isUserLoading } = useUser();
  const [role, setRole] = useState<AppRole | null>(null);

  // Consulta de usuarios para el staff
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || role !== 'STAFF') return null;
    return query(collection(firestore, 'users'), orderBy('name'));
  }, [firestore, role]);

  const { data: usersData, isLoading: isUsersLoading } = useCollection<UserProfile>(usersQuery);
  const users = usersData || [];

  // Documento del usuario actual
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: currentUserDoc } = useDoc<UserProfile>(userDocRef);

  // Membresía del usuario actual
  const userMembershipsRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'memberships', user.uid);
  }, [firestore, user?.uid]);

  const { data: currentMembership } = useDoc<Membership>(userMembershipsRef);

  // Verificar si el usuario es staff en el backend
  useEffect(() => {
    const checkStaffRole = async () => {
      if (user?.uid && firestore) {
        const staffDoc = await getDoc(doc(firestore, 'roles_staff', user.uid));
        if (staffDoc.exists()) {
          setRole('STAFF');
        }
      }
    };
    checkStaffRole();
  }, [user, firestore]);

  const currentUser: UserProfile | null = currentUserDoc ? {
    ...currentUserDoc,
    membership: currentMembership || undefined,
    payments: [] 
  } : null;

  const loginAsUser = async (email: string) => {
    if (!auth || !firestore) return;
    try {
      const creds = await signInAnonymously(auth);
      const userId = creds.user.uid;
      
      // Si el usuario no existe en Firestore, creamos uno de demo
      const userRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        const demoUser: UserProfile = {
          id: userId,
          name: 'Usuario Demo',
          email: email,
          phone: '555-1234',
          idCardUrl: 'https://picsum.photos/seed/demo/400/250',
          facialRegStatus: 'COMPLETED',
          status: 'ACTIVE',
          payments: []
        };
        await setDoc(userRef, demoUser);
        
        // Crear membresía activa para la demo
        const start = new Date();
        const end = new Date();
        end.setDate(start.getDate() + 30);
        
        await setDoc(doc(firestore, 'memberships', userId), {
          id: userId,
          plan: 'Mensual',
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          daysRemaining: 30,
          status: 'ACTIVE'
        });
      }
      
      setRole('USER');
    } catch (error) {
      console.error("Error en loginAsUser:", error);
    }
  };

  const loginAsStaff = async () => {
    if (!auth || !firestore) return;
    try {
      const creds = await signInAnonymously(auth);
      const userId = creds.user.uid;
      
      // En el prototipo, permitimos que el usuario se asigne el rol de staff
      await setDoc(doc(firestore, 'roles_staff', userId), { userId });
      setRole('STAFF');
    } catch (error) {
      console.error("Error en loginAsStaff:", error);
    }
  };

  const registerUser = async (userData: Partial<UserProfile>) => {
    if (!auth || !firestore) return;
    try {
      const creds = await signInAnonymously(auth);
      const userId = creds.user.uid;

      const newUser: UserProfile = {
        id: userId,
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        idCardUrl: userData.idCardUrl || 'https://picsum.photos/seed/newid/400/250',
        facialRegStatus: 'COMPLETED',
        faceEnrollmentStatus: 'completed',
        livenessStatus: 'ok',
        status: 'PENDING',
        payments: []
      };

      await setDoc(doc(firestore, 'users', userId), newUser);
      
      const requestId = Math.random().toString(36).substr(2, 9);
      await setDoc(doc(firestore, 'requests', requestId), {
        id: requestId,
        userId: userId,
        status: 'PENDING',
        requestDate: new Date().toISOString()
      });

      setRole('USER');
    } catch (error) {
      console.error("Error en registerUser:", error);
    }
  };

  const updateStatus = (userId: string, status: UserStatus, plan?: MembershipPlan, rejectionReason?: string) => {
    if (!firestore) return;

    const userRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userRef, { status, rejectionReason: rejectionReason || null });

    if (status === 'ACTIVE' && plan) {
      const start = new Date();
      const end = new Date();
      let days = 30;
      if (plan === 'Trimestral') days = 90;
      if (plan === 'Anual') days = 365;
      end.setDate(start.getDate() + days);

      const membership: Membership = {
        id: userId,
        plan,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        daysRemaining: days,
        status: 'ACTIVE'
      };

      setDocumentNonBlocking(doc(firestore, 'memberships', userId), membership, { merge: true });
    }
  };

  const toggleSubscription = (userId: string, activate: boolean) => {
    if (!firestore) return;
    const nextStatus = activate ? 'ACTIVE' : 'EXPIRED';
    updateDocumentNonBlocking(doc(firestore, 'users', userId), { status: nextStatus });
    updateDocumentNonBlocking(doc(firestore, 'memberships', userId), { status: nextStatus });
  };

  const extendMembership = (userId: string, days: number) => {
    if (!firestore) return;
    // Lógica simplificada de extensión para el prototipo
    const membershipRef = doc(firestore, 'memberships', userId);
    getDoc(membershipRef).then(snap => {
      if (snap.exists()) {
        const data = snap.data() as Membership;
        const currentEnd = new Date(data.endDate);
        currentEnd.setDate(currentEnd.getDate() + days);
        updateDocumentNonBlocking(membershipRef, { 
          endDate: currentEnd.toISOString().split('T')[0],
          daysRemaining: (data.daysRemaining || 0) + days
        });
      }
    });
  };

  const changePlan = (userId: string, plan: MembershipPlan) => {
    if (!firestore) return;
    updateStatus(userId, 'ACTIVE', plan);
  };

  const logout = () => {
    if (auth) signOut(auth);
    setRole(null);
  };

  return {
    role,
    users,
    currentUser,
    isLoading: isUserLoading || isUsersLoading,
    loginAsUser,
    loginAsStaff,
    registerUser,
    updateStatus,
    toggleSubscription,
    extendMembership,
    changePlan,
    logout,
    setRole
  };
}

function useSafeFirebase() {
  const [services, setServices] = useState<{ auth: any, firestore: any }>({ auth: null, firestore: null });
  const auth = useAuth();
  const firestore = useFirestore();

  useEffect(() => {
    if (auth && firestore) {
      setServices({ auth, firestore });
    }
  }, [auth, firestore]);

  return services;
}