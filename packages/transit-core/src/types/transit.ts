/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Liberty Ride NKY Transit - Type Definitions
 */

import { RideStatus, ServiceCategory } from '../utils/transit';

export type UserRole = 'public' | 'rider' | 'owner' | 'driver';

export type RiderTab = 'ride' | 'quote' | 'tracking' | 'airport-cvg' | 'history' | 'support';

export interface TransitRide {
  id: string; // e.g. "LR-84920"
  uuid: string; // e.g. "e7b8c24a-89f1-4d32-b76e-91a329d50124"
  riderName: string;
  riderPhone: string;
  pickup: string;
  dropoff: string;
  pickupTime: string; // e.g. "Today, 03:30 PM EDT"
  pickupDate: string;
  isScheduled?: boolean;
  scheduledFor?: string; // formatted scheduled date/time
  category: ServiceCategory;
  fareEstimate: number;
  baseFare: number;
  meteredRate: number;
  surcharges: number;
  distanceMiles: number;
  estimatedMinutes: number;
  zone: string;
  status: RideStatus;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleInfo?: string;
  flightNumber?: string;
  flightStatus?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  auditTrail: {
    state: RideStatus;
    label: string;
    timestamp: string;
    note: string;
  }[];
}

export interface TransitDriver {
  id: string;
  refId: string; // e.g. "8595371827"
  name: string;
  phone: string;
  vehicle: string;
  licensePlate: string;
  rating: number;
  totalTrips: number;
  status: 'on_shift' | 'active' | 'offline';
  assignedDepot: string;
}

export interface OperationalMetrics {
  activeRides: number;
  requestsAwaitingDriver: number;
  completedToday: number;
  estimatedRevenue: number;
}
