/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Liberty Ride NKY Transit - Application Context
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TransitRide, TransitDriver, UserRole, RiderTab } from '../types/transit';
import { INITIAL_RIDES, INITIAL_DRIVERS } from '../data/mockData';
import {
  RideStatus,
  formatEasternTime,
  canCancelRide,
  deriveDriverReference,
  formatScheduledDateTime,
} from '../utils/transit';

interface TransitContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  // Rider navigation
  riderTab: RiderTab;
  setRiderTab: (tab: RiderTab) => void;
  // Owner navigation & auth
  ownerTab: 'dashboard' | 'rides' | 'drivers' | 'security';
  setOwnerTab: (tab: 'dashboard' | 'rides' | 'drivers' | 'security') => void;
  isOwnerUnlocked: boolean;
  unlockOwnerConsole: (key: string) => boolean;
  lockOwnerConsole: () => void;
  // Driver navigation & auth
  driverTab: 'signin' | 'offers' | 'active-ride' | 'earnings';
  setDriverTab: (tab: 'signin' | 'offers' | 'active-ride' | 'earnings') => void;
  loggedDriverPhone: string | null;
  currentDriver: TransitDriver | null;
  loginDriver: (phone: string) => boolean;
  logoutDriver: () => void;
  // Core Data
  rides: TransitRide[];
  drivers: TransitDriver[];
  selectedRideId: string;
  setSelectedRideId: (id: string) => void;
  activeRide: TransitRide | undefined;
  scheduledRides: TransitRide[];
  completedRides: TransitRide[];
  // Actions
  createNewRide: (ride: Partial<TransitRide>) => TransitRide;
  scheduleRide: (ride: Partial<TransitRide>) => TransitRide;
  updateRideStatus: (id: string, status: RideStatus, note?: string) => void;
  cancelRide: (id: string, reason: string, notes?: string) => { success: boolean; error?: string };
  registerNewDriver: (name: string, phone: string) => TransitDriver;
  acceptRideOffer: (rideId: string, driverId?: string) => void;
  declineRideOffer: (rideId: string) => void;
  // Audio notification simulation
  audioAlertsEnabled: boolean;
  toggleAudioAlerts: () => void;
  playAlertPing: () => void;
  // Scenario simulation switcher for demo
  simulateScenario: (scenario: 'no_driver' | 'declined' | 'expired' | 'reset') => void;
}

const TransitContext = createContext<TransitContextType | null>(null);

export const TransitProvider: React.FC<{ children: React.ReactNode; initialRole?: UserRole }> = ({ children, initialRole = 'public' }) => {
  // Portal Role
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem('lr_current_role');
    return (saved as UserRole) || 'public';
  });

  const setRole = (r: UserRole) => {
    setRoleState(r);
    localStorage.setItem('lr_current_role', r);
  };

  // Sub-tabs
  const [riderTab, setRiderTab] = useState<RiderTab>('ride');
  const [ownerTab, setOwnerTab] = useState<'dashboard' | 'rides' | 'drivers' | 'security'>('dashboard');
  const [driverTab, setDriverTab] = useState<'signin' | 'offers' | 'active-ride' | 'earnings'>('offers');

  // Auth states
  const [isOwnerUnlocked, setIsOwnerUnlocked] = useState<boolean>(() => {
    return localStorage.getItem('lr_owner_unlocked') === 'true';
  });

  const [loggedDriverPhone, setLoggedDriverPhone] = useState<string | null>(() => {
    return localStorage.getItem('lr_driver_phone') || '+1 (859) 537-1827';
  });

  // Data Collections
  const [rides, setRides] = useState<TransitRide[]>(() => {
    const saved = localStorage.getItem('lr_rides_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_RIDES;
  });

  const [drivers, setDrivers] = useState<TransitDriver[]>(() => {
    const saved = localStorage.getItem('lr_drivers_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_DRIVERS;
  });

  const [selectedRideId, setSelectedRideId] = useState<string>('LR-84920');
  const [audioAlertsEnabled, setAudioAlertsEnabled] = useState<boolean>(true);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('lr_rides_data', JSON.stringify(rides));
  }, [rides]);

  useEffect(() => {
    localStorage.setItem('lr_drivers_data', JSON.stringify(drivers));
  }, [drivers]);

  const activeRide = rides.find((r) => r.id === selectedRideId) || rides[0];

  const currentDriver = drivers.find(
    (d) =>
      deriveDriverReference(d.phone) === (loggedDriverPhone ? deriveDriverReference(loggedDriverPhone) : '')
  ) || drivers[0];

  // Owner Auth
  const unlockOwnerConsole = (key: string): boolean => {
    const cleanKey = key.trim().toLowerCase();
    // Accept standard owner vault keys: 'owner859', 'liberty2026', 'admin', '8595371827'
    if (
      cleanKey === 'owner859' ||
      cleanKey === 'liberty2026' ||
      cleanKey === 'admin' ||
      cleanKey === '8595371827' ||
      cleanKey === 'owner'
    ) {
      setIsOwnerUnlocked(true);
      localStorage.setItem('lr_owner_unlocked', 'true');
      setOwnerTab('dashboard');
      return true;
    }
    return false;
  };

  const lockOwnerConsole = () => {
    setIsOwnerUnlocked(false);
    localStorage.removeItem('lr_owner_unlocked');
    setOwnerTab('security');
  };

  // Driver Auth
  const loginDriver = (phone: string): boolean => {
    const cleanDigits = phone.replace(/\D/g, '');
    const matched = drivers.find((d) => deriveDriverReference(d.phone) === cleanDigits);
    if (matched || cleanDigits.endsWith('1827')) {
      setLoggedDriverPhone(phone);
      localStorage.setItem('lr_driver_phone', phone);
      setDriverTab('offers');
      return true;
    }
    return false;
  };

  const logoutDriver = () => {
    setLoggedDriverPhone(null);
    localStorage.removeItem('lr_driver_phone');
    setDriverTab('signin');
  };

  const playAlertPing = () => {
    if (!audioAlertsEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.15); // E6
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // AudioContext might be restricted until user interaction
    }
  };

  const toggleAudioAlerts = () => {
    setAudioAlertsEnabled((prev) => !prev);
  };

  // Computed Collections
  const scheduledRides = rides.filter(
    (r) => r.isScheduled && r.status !== 'completed' && r.status !== 'cancelled'
  );
  const completedRides = rides.filter((r) => r.status === 'completed');

  // Ride Creation & Scheduling
  const createNewRide = (rideData: Partial<TransitRide>): TransitRide => {
    const count = rides.length + 1;
    const newId = `LR-${84920 + count}`;
    const newUuid = `${Math.random().toString(36).substring(2, 10)}-${Math.random().toString(36).substring(2, 6)}-49f1-b76e-${Math.random().toString(36).substring(2, 14)}`;

    const isScheduled = Boolean(rideData.isScheduled);
    const scheduledFor =
      rideData.scheduledFor ||
      (isScheduled && rideData.pickupDate
        ? formatScheduledDateTime(rideData.pickupDate, rideData.pickupTime || '04:30 PM')
        : undefined);

    const newRide: TransitRide = {
      id: newId,
      uuid: newUuid,
      riderName: rideData.riderName || 'David Miller',
      riderPhone: rideData.riderPhone || '+1 (859) 555-0142',
      pickup: rideData.pickup || '3038 Dixie Hwy, Erlanger, KY 41018',
      dropoff: rideData.dropoff || 'CVG Airport Terminal 3, Hebron, KY 41048',
      pickupTime: rideData.pickupTime || formatEasternTime(),
      pickupDate: rideData.pickupDate || new Date().toISOString().split('T')[0],
      isScheduled,
      scheduledFor,
      category: rideData.category || 'cvg',
      fareEstimate: rideData.fareEstimate || 35.0,
      baseFare: rideData.baseFare || 35.0,
      meteredRate: rideData.meteredRate || 0.0,
      surcharges: 0.0,
      distanceMiles: rideData.distanceMiles || 11.42,
      estimatedMinutes: rideData.estimatedMinutes || 16,
      zone: rideData.zone || 'Zone 1',
      status: 'request_confirmed',
      driverId: 'drv-01',
      driverName: 'Marcus Vance',
      driverPhone: '+1 (859) 537-1827',
      vehicleInfo: 'Toyota Camry Hybrid #11',
      flightNumber: rideData.flightNumber,
      flightStatus: rideData.flightStatus,
      notes: rideData.notes || '',
      createdAt: formatEasternTime(),
      updatedAt: formatEasternTime(),
      auditTrail: [
        {
          state: 'requested',
          label: isScheduled ? 'Future Transit Scheduled' : 'Requested — waiting for dispatch',
          timestamp: formatEasternTime(),
          note: isScheduled
            ? `Advance booking registered for ${scheduledFor || rideData.pickupTime}`
            : 'Direct booking intake confirmed',
        },
        {
          state: 'request_confirmed',
          label: isScheduled ? 'Scheduled — Dispatch Reserved' : 'Request confirmed — finding your driver',
          timestamp: formatEasternTime(),
          note: isScheduled
            ? 'Regional vehicle reserved for scheduled pickup window'
            : 'Matching nearest certified driver in Erlanger sector',
        },
      ],
    };

    setRides((prev) => [newRide, ...prev]);
    setSelectedRideId(newId);
    playAlertPing();
    return newRide;
  };

  const scheduleRide = (rideData: Partial<TransitRide>): TransitRide => {
    return createNewRide({ ...rideData, isScheduled: true });
  };

  // Update Ride Status
  const updateRideStatus = (id: string, status: RideStatus, note?: string) => {
    setRides((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const now = formatEasternTime();
        let statusLabel = status as string;
        if (status === 'requested') statusLabel = 'Requested — waiting for dispatch';
        if (status === 'request_confirmed') statusLabel = 'Request confirmed — finding your driver';
        if (status === 'driver_offer_sent') statusLabel = 'Driver offer sent';
        if (status === 'driver_confirmed') statusLabel = 'Driver confirmed';
        if (status === 'driver_en_route') statusLabel = 'Driver en route';
        if (status === 'completed') statusLabel = 'Completed';
        if (status === 'no_driver_available') statusLabel = 'No driver available';
        if (status === 'driver_declined') statusLabel = 'Driver declined — finding another driver';
        if (status === 'offer_expired') statusLabel = 'Offer expired — owner notified';
        if (status === 'cancelled') statusLabel = 'Cancelled';

        const updatedAudit = [
          ...r.auditTrail,
          {
            state: status,
            label: statusLabel,
            timestamp: now,
            note: note || `State transitioned to ${statusLabel}`,
          },
        ];

        return {
          ...r,
          status,
          updatedAt: now,
          auditTrail: updatedAudit,
        };
      })
    );
    playAlertPing();
  };

  // Cancel Ride
  const cancelRide = (id: string, reason: string, notes?: string) => {
    const ride = rides.find((r) => r.id === id);
    if (!ride) {
      return { success: false, error: 'Ride record not found.' };
    }
    if (!canCancelRide(ride.status)) {
      return {
        success: false,
        error: 'Cancellation is strictly prohibited once the driver is en route or the ride is completed.',
      };
    }

    updateRideStatus(id, 'cancelled', `Cancelled: ${reason}${notes ? ` - ${notes}` : ''}`);
    return { success: true };
  };

  // Register Driver
  const registerNewDriver = (name: string, phone: string): TransitDriver => {
    const refId = deriveDriverReference(phone);
    const newDriver: TransitDriver = {
      id: `drv-${Date.now().toString().slice(-4)}`,
      refId,
      name,
      phone,
      vehicle: 'Commercial Fleet Vehicle (KY DOT Inspected)',
      licensePlate: `KY-${Math.floor(1000 + Math.random() * 9000)}-TR`,
      rating: 5.0,
      totalTrips: 0,
      status: 'active',
      assignedDepot: 'Erlanger Central',
    };

    setDrivers((prev) => [newDriver, ...prev]);
    return newDriver;
  };

  // Driver Offer Interactions
  const acceptRideOffer = (rideId: string, driverId?: string) => {
    const drv = drivers.find((d) => d.id === driverId) || currentDriver;
    setRides((prev) =>
      prev.map((r) => {
        if (r.id !== rideId) return r;
        const now = formatEasternTime();
        return {
          ...r,
          status: 'driver_confirmed',
          driverId: drv.id,
          driverName: drv.name,
          driverPhone: drv.phone,
          vehicleInfo: drv.vehicle,
          updatedAt: now,
          auditTrail: [
            ...r.auditTrail,
            {
              state: 'driver_confirmed',
              label: 'Driver confirmed',
              timestamp: now,
              note: `Offer accepted by operator ${drv.name} (${drv.phone})`,
            },
          ],
        };
      })
    );
    setDriverTab('active-ride');
    playAlertPing();
  };

  const declineRideOffer = (rideId: string) => {
    updateRideStatus(rideId, 'driver_declined', 'Declined by driver - returned to dispatch matching');
  };

  // Simulation Helpers for Demonstrating Contingency States
  const simulateScenario = (scenario: 'no_driver' | 'declined' | 'expired' | 'reset') => {
    if (!activeRide) return;
    if (scenario === 'no_driver') {
      updateRideStatus(activeRide.id, 'no_driver_available', 'High demand in Erlanger corridor. No units available.');
    } else if (scenario === 'declined') {
      updateRideStatus(activeRide.id, 'driver_declined', 'Initial operator unable to accept. Auto-requeued.');
    } else if (scenario === 'expired') {
      updateRideStatus(activeRide.id, 'offer_expired', 'The 45s driver response lease elapsed.');
    } else if (scenario === 'reset') {
      updateRideStatus(activeRide.id, 'request_confirmed', 'Dispatch looking for available driver in Erlanger sector.');
    }
  };

  return (
    <TransitContext.Provider
      value={{
        role,
        setRole,
        riderTab,
        setRiderTab,
        ownerTab,
        setOwnerTab,
        isOwnerUnlocked,
        unlockOwnerConsole,
        lockOwnerConsole,
        driverTab,
        setDriverTab,
        loggedDriverPhone,
        currentDriver,
        loginDriver,
        logoutDriver,
        rides,
        drivers,
        selectedRideId,
        setSelectedRideId,
        activeRide,
        scheduledRides,
        completedRides,
        createNewRide,
        scheduleRide,
        updateRideStatus,
        cancelRide,
        registerNewDriver,
        acceptRideOffer,
        declineRideOffer,
        audioAlertsEnabled,
        toggleAudioAlerts,
        playAlertPing,
        simulateScenario,
      }}
    >
      {children}
    </TransitContext.Provider>
  );
};

export const useTransit = () => {
  const context = useContext(TransitContext);
  if (!context) {
    throw new Error('useTransit must be used within a TransitProvider');
  }
  return context;
};
