
export type UserStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'REJECTED';

export type MembershipPlan = 'Mensual' | 'Trimestral' | 'Anual';

export interface Membership {
  id: string;
  plan: MembershipPlan;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  status: UserStatus;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  idCardUrl: string;
  facialRegStatus: 'COMPLETED' | 'PENDING';
  status: UserStatus;
  rejectionReason?: string;
  membership?: Membership;
  payments: PaymentRecord[];
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  plan: MembershipPlan;
}

export type AppRole = 'USER' | 'STAFF';
