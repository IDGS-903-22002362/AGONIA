
import { UserProfile, PaymentRecord } from '@/types';

const generatePayments = (plan: string): PaymentRecord[] => [
  { id: Math.random().toString(), date: '2024-01-15', amount: plan === 'Anual' ? 3600 : 350, plan: plan as any },
  { id: Math.random().toString(), date: '2023-12-15', amount: 350, plan: 'Mensual' },
];

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'u1',
    name: 'Juan Pérez',
    email: 'juan@example.com',
    phone: '555-0101',
    idCardUrl: 'https://picsum.photos/seed/id1/400/250',
    facialRegStatus: 'COMPLETED',
    status: 'ACTIVE',
    membership: {
      id: 'm1',
      plan: 'Anual',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      daysRemaining: 300,
      status: 'ACTIVE'
    },
    payments: generatePayments('Anual')
  },
  {
    id: 'u2',
    name: 'Maria Garcia',
    email: 'maria@example.com',
    phone: '555-0102',
    idCardUrl: 'https://picsum.photos/seed/id2/400/250',
    facialRegStatus: 'COMPLETED',
    status: 'PENDING',
    payments: []
  },
  {
    id: 'u3',
    name: 'Carlos Ruiz',
    email: 'carlos@example.com',
    phone: '555-0103',
    idCardUrl: 'https://picsum.photos/seed/id3/400/250',
    facialRegStatus: 'PENDING',
    status: 'PENDING',
    payments: []
  },
  {
    id: 'u4',
    name: 'Ana Belén',
    email: 'ana@example.com',
    phone: '555-0104',
    idCardUrl: 'https://picsum.photos/seed/id4/400/250',
    facialRegStatus: 'COMPLETED',
    status: 'EXPIRED',
    membership: {
      id: 'm4',
      plan: 'Mensual',
      startDate: '2024-01-01',
      endDate: '2024-02-01',
      daysRemaining: 0,
      status: 'EXPIRED'
    },
    payments: generatePayments('Mensual')
  },
  {
    id: 'u5',
    name: 'Roberto Solis',
    email: 'roberto@example.com',
    phone: '555-0105',
    idCardUrl: 'https://picsum.photos/seed/id5/400/250',
    facialRegStatus: 'COMPLETED',
    status: 'ACTIVE',
    membership: {
      id: 'm5',
      plan: 'Trimestral',
      startDate: '2024-02-15',
      endDate: '2024-05-15',
      daysRemaining: 65,
      status: 'ACTIVE'
    },
    payments: generatePayments('Trimestral')
  },
  {
    id: 'u6',
    name: 'Lucia Mendez',
    email: 'lucia@example.com',
    phone: '555-0106',
    idCardUrl: 'https://picsum.photos/seed/id6/400/250',
    facialRegStatus: 'COMPLETED',
    status: 'PENDING',
    payments: []
  },
  {
    id: 'u7',
    name: 'David Ortiz',
    email: 'david@example.com',
    phone: '555-0107',
    idCardUrl: 'https://picsum.photos/seed/id7/400/250',
    facialRegStatus: 'COMPLETED',
    status: 'ACTIVE',
    membership: {
      id: 'm7',
      plan: 'Mensual',
      startDate: '2024-03-01',
      endDate: '2024-04-01',
      daysRemaining: 22,
      status: 'ACTIVE'
    },
    payments: generatePayments('Mensual')
  },
  {
    id: 'u8',
    name: 'Sofia Lara',
    email: 'sofia@example.com',
    phone: '555-0108',
    idCardUrl: 'https://picsum.photos/seed/id8/400/250',
    facialRegStatus: 'COMPLETED',
    status: 'ACTIVE',
    membership: {
      id: 'm8',
      plan: 'Anual',
      startDate: '2024-03-10',
      endDate: '2025-03-10',
      daysRemaining: 360,
      status: 'ACTIVE'
    },
    payments: generatePayments('Anual')
  }
];
