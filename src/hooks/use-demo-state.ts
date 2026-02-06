
"use client";

import { useState, useEffect } from 'react';
import { UserProfile, AppRole, UserStatus, MembershipPlan } from '@/types';
import { INITIAL_USERS } from '@/lib/mock-data';

export function useDemoState() {
  const [role, setRole] = useState<AppRole | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUsers = localStorage.getItem('gym_demo_users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      setUsers(INITIAL_USERS);
      localStorage.setItem('gym_demo_users', JSON.stringify(INITIAL_USERS));
    }
    setIsLoading(false);
  }, []);

  const saveUsers = (newUsers: UserProfile[]) => {
    setUsers(newUsers);
    localStorage.setItem('gym_demo_users', JSON.stringify(newUsers));
  };

  const loginAsUser = (email: string) => {
    const user = users.find(u => u.email === email);
    if (user) {
      setCurrentUser(user);
      setRole('USER');
    }
  };

  const loginAsStaff = () => {
    setRole('STAFF');
  };

  const registerUser = (userData: Partial<UserProfile>) => {
    const newUser: UserProfile = {
      id: Math.random().toString(36).substr(2, 9),
      name: userData.name || '',
      email: userData.email || '',
      phone: userData.phone || '',
      idCardUrl: userData.idCardUrl || 'https://picsum.photos/seed/newid/400/250',
      facialRegStatus: 'COMPLETED',
      faceEnrollmentStatus: 'completed',
      livenessStatus: 'ok',
      status: 'PENDING',
      payments: [],
      ...userData
    };
    const updatedUsers = [...users, newUser];
    saveUsers(updatedUsers);
    setCurrentUser(newUser);
    setRole('USER');
  };

  const updateStatus = (userId: string, status: UserStatus, plan?: MembershipPlan, rejectionReason?: string) => {
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        let membership = u.membership;
        if (status === 'ACTIVE' && plan) {
          const start = new Date();
          const end = new Date();
          let days = 30;
          if (plan === 'Trimestral') days = 90;
          if (plan === 'Anual') days = 365;
          end.setDate(start.getDate() + days);
          
          membership = {
            id: Math.random().toString(),
            plan,
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            daysRemaining: days,
            status: 'ACTIVE'
          };
        }
        return { ...u, status, membership, rejectionReason };
      }
      return u;
    });
    saveUsers(updatedUsers);
  };

  const toggleSubscription = (userId: string, activate: boolean) => {
    const updatedUsers = users.map(u => {
      if (u.id === userId && u.membership) {
        return { 
          ...u, 
          status: activate ? 'ACTIVE' : 'EXPIRED',
          membership: { ...u.membership, status: activate ? 'ACTIVE' : 'EXPIRED' } 
        };
      }
      return u;
    });
    saveUsers(updatedUsers);
  };

  const logout = () => {
    setRole(null);
    setCurrentUser(null);
  };

  return {
    role,
    users,
    currentUser,
    isLoading,
    loginAsUser,
    loginAsStaff,
    registerUser,
    updateStatus,
    toggleSubscription,
    logout,
    setRole
  };
}
