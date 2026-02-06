"use client";

import { useState, useEffect } from 'react';
import { UserProfile, AppRole, UserStatus, MembershipPlan, Membership } from '@/types';
import { useAuth, useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, orderBy, serverTimestamp, setDoc } from 'firebase/firestore';
import { signInAnonymously, signOut } from 'firebase/auth';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export function useDemoState() {
  const { auth, firestore } = useFirebaseServices();
  const { user, isUserLoading } = useUser();
  const [role, setRole] = useState<AppRole | null>(null);

  // Memoized query for users (staff view)
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || role !== 'STAFF') return null;
    return query(collection(firestore, 'users'), orderBy('name'));
  }, [firestore, role]);

  const { data: users = [], isLoading: isUsersLoading } = useCollection<UserProfile>(usersQuery);

  // Memoized doc for current user
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: currentUserDoc } = useDoc<UserProfile>(userDocRef);

  // Memoized memberships for current user
  const userMembershipsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    // For MVP, we assume membershipId = userId as per rules prototyping assumption
    return doc(firestore, 'memberships', user.uid);
  }, [firestore, user?.uid]);

  const { data: currentMembership } = useDoc<Membership>(userMembershipsQuery);

  // Combine user doc with membership for the UI
  const currentUser: UserProfile | null = currentUserDoc ? {
    ...currentUserDoc,
    membership: currentMembership || undefined,
    // Payments would ideally be a subcollection or separate fetch
    payments: [] 
  } : null;

  // Determine role based on existence in roles_staff
  useEffect(() => {
    if (user?.uid && firestore) {
      // Simple check for staff role - in a real app, this would be a doc fetch
      // For demo, we'll use local state triggered by "Login as Staff"
    }
  }, [user, firestore]);

  const loginAsUser = async (email: string) => {
    // For demo/simulated realism, we use anonymous sign-in
    // In a real app, you'd use signInWithEmailAndPassword
    if (auth) {
      await signInAnonymously(auth);
      setRole('USER');
    }
  };

  const loginAsStaff = async () => {
    if (auth) {
      await signInAnonymously(auth);
      setRole('STAFF');
    }
  };

  const registerUser = async (userData: Partial<UserProfile>) => {
    if (!auth || !firestore) return;

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

    setDocumentNonBlocking(doc(firestore, 'users', userId), newUser, { merge: true });
    
    // Create a request record
    const requestId = Math.random().toString(36).substr(2, 9);
    setDocumentNonBlocking(doc(firestore, 'requests', requestId), {
      id: requestId,
      userId: userId,
      status: 'PENDING',
      requestDate: new Date().toISOString()
    }, { merge: true });

    setRole('USER');
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
        id: userId, // Prototyping assumption: 1:1 match
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
    if (!firestore || !currentMembership && userId === user?.uid) return;
    
    // This function needs to fetch the membership if not available locally (for staff)
    // For simplicity, we assume staff can update directly if they have the ID
    const membershipRef = doc(firestore, 'memberships', userId);
    // In a real scenario, we'd read first, but here we simulate the logic
    // Normally you'd use a server action or a transaction for increments
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

// Helper to get services safely
function useFirebaseServices() {
  try {
    const { auth, firestore } = useFirestore() ? { auth: useAuth(), firestore: useFirestore() } : { auth: null, firestore: null };
    return { auth, firestore };
  } catch {
    return { auth: null, firestore: null };
  }
}
