import type { Owner, Driver, Vehicle, Fill, Alert } from './types'

const KEYS = {
  OWNERS: 'cng_owners',
  DRIVERS: 'cng_drivers',
  VEHICLES: 'cng_vehicles',
  FILLS: 'cng_fills',
  ALERTS: 'cng_alerts',
  OFFLINE_QUEUE: 'cng_offline_queue',
  SESSION: 'cng_session',
  LANGUAGE: 'cng_language',
}

function initDemoData() {
  if (!localStorage.getItem(KEYS.OWNERS)) {
    const owners: Owner[] = [
      {
        id: 'own1',
        name: 'Rajesh Patel',
        email: 'owner@demo.com',
        phone: '9876543210',
        business: 'Patel Transport',
        password: 'demo123',
        status: 'active',
        createdAt: new Date().toISOString(),
      },
    ]
    localStorage.setItem(KEYS.OWNERS, JSON.stringify(owners))
  }

  if (!localStorage.getItem(KEYS.DRIVERS)) {
    const drivers: Driver[] = [
      {
        id: 'drv1',
        name: 'Amit Kumar',
        code: '1234',
        assignedVehicleId: 'veh1',
        ownerId: 'own1',
        status: 'active',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'drv2',
        name: 'Suresh Singh',
        code: '5678',
        assignedVehicleId: 'veh2',
        ownerId: 'own1',
        status: 'active',
        createdAt: new Date().toISOString(),
      },
    ]
    localStorage.setItem(KEYS.DRIVERS, JSON.stringify(drivers))
  }

  if (!localStorage.getItem(KEYS.VEHICLES)) {
    const vehicles: Vehicle[] = [
      {
        id: 'veh1',
        plate: 'GJ-01-AB-1234',
        model: 'Tata Ace CNG',
        initialOdo: 45000,
        currentOdo: 47820,
        capacity: 60,
        ownerId: 'own1',
        status: 'active',
      },
      {
        id: 'veh2',
        plate: 'GJ-05-XY-5678',
        model: 'Ashok Leyland Dost',
        initialOdo: 32000,
        currentOdo: 34150,
        capacity: 75,
        ownerId: 'own1',
        status: 'active',
      },
    ]
    localStorage.setItem(KEYS.VEHICLES, JSON.stringify(vehicles))
  }

  if (!localStorage.getItem(KEYS.FILLS)) {
    const fills: Fill[] = [
      {
        id: 'fill1',
        vehicleId: 'veh1',
        driverId: 'drv1',
        time: new Date(Date.now() - 86400000 * 2).toISOString(),
        station: 'VGL',
        kgs: 12.5,
        rate: 78.5,
        total: 981.25,
        videoUrl: '',
        pumpPhotoUrl: '',
        receiptPhotoUrl: '',
        odoPhotoUrl: '',
        pumpGPS: { lat: 23.0225, lng: 72.5714 },
        receiptGPS: { lat: 23.0226, lng: 72.5715 },
        odoGPS: { lat: 23.0224, lng: 72.5713 },
        odoReading: 47650,
        distanceDiff: 15,
        mismatch: false,
        fuelDropPercent: 0,
        ownerId: 'own1',
        verified: true,
      },
    ]
    localStorage.setItem(KEYS.FILLS, JSON.stringify(fills))
  }

  if (!localStorage.getItem(KEYS.ALERTS)) {
    localStorage.setItem(KEYS.ALERTS, JSON.stringify([]))
  }
}

initDemoData()

export const storage = {
  getOwners: (): Owner[] => JSON.parse(localStorage.getItem(KEYS.OWNERS) || '[]'),
  saveOwners: (owners: Owner[]) => localStorage.setItem(KEYS.OWNERS, JSON.stringify(owners)),
  
  getDrivers: (): Driver[] => JSON.parse(localStorage.getItem(KEYS.DRIVERS) || '[]'),
  saveDrivers: (drivers: Driver[]) => localStorage.setItem(KEYS.DRIVERS, JSON.stringify(drivers)),
  
  getVehicles: (): Vehicle[] => JSON.parse(localStorage.getItem(KEYS.VEHICLES) || '[]'),
  saveVehicles: (vehicles: Vehicle[]) => localStorage.setItem(KEYS.VEHICLES, JSON.stringify(vehicles)),
  
  getFills: (): Fill[] => {
    const fills: Fill[] = JSON.parse(localStorage.getItem(KEYS.FILLS) || '[]')
    return fills.map(f => ({
      ...f,
      pumpGPS: parseGPS(f.pumpGPS),
      receiptGPS: parseGPS(f.receiptGPS),
      odoGPS: parseGPS(f.odoGPS),
    }))
  },
  saveFills: (fills: Fill[]) => {
    try {
      localStorage.setItem(KEYS.FILLS, JSON.stringify(fills))
    } catch (e) {
      // Quota exceeded - remove data URLs and keep only metadata
      const trimmed = fills.map(f => ({
        ...f,
        videoUrl: f.videoUrl?.startsWith('data:') ? '' : f.videoUrl,
        pumpPhotoUrl: f.pumpPhotoUrl?.startsWith('data:') ? '' : f.pumpPhotoUrl,
        receiptPhotoUrl: f.receiptPhotoUrl?.startsWith('data:') ? '' : f.receiptPhotoUrl,
        odoPhotoUrl: f.odoPhotoUrl?.startsWith('data:') ? '' : f.odoPhotoUrl,
      }))
      try {
        localStorage.setItem(KEYS.FILLS, JSON.stringify(trimmed.slice(-50))) // Keep last 50
      } catch (e2) {
        // Last resort - clear and keep only recent
        localStorage.setItem(KEYS.FILLS, JSON.stringify(trimmed.slice(-10)))
      }
    }
  },
  
  getAlerts: (): Alert[] => JSON.parse(localStorage.getItem(KEYS.ALERTS) || '[]'),
  saveAlerts: (alerts: Alert[]) => localStorage.setItem(KEYS.ALERTS, JSON.stringify(alerts)),
  
  getOfflineQueue: (): Fill[] => JSON.parse(localStorage.getItem(KEYS.OFFLINE_QUEUE) || '[]'),
  addToOfflineQueue: (fill: Fill) => {
    const queue = JSON.parse(localStorage.getItem(KEYS.OFFLINE_QUEUE) || '[]')
    queue.push(fill)
    localStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(queue))
  },
  clearOfflineQueue: () => localStorage.setItem(KEYS.OFFLINE_QUEUE, '[]'),
  
  getSession: () => JSON.parse(localStorage.getItem(KEYS.SESSION) || 'null'),
  setSession: (session: any) => localStorage.setItem(KEYS.SESSION, JSON.stringify(session)),
  clearSession: () => localStorage.removeItem(KEYS.SESSION),
  
  getLanguage: (): string => localStorage.getItem(KEYS.LANGUAGE) || 'en',
  setLanguage: (lang: string) => localStorage.setItem(KEYS.LANGUAGE, lang),
}

function parseGPS(v: any): {lat: number; lng: number} | null {
  if (!v) return null
  if (typeof v === 'object' && 'lat' in v && 'lng' in v) return v
  if (typeof v === 'string') {
    const parts = v.split(',').map(Number)
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) return {lat: parts[0], lng: parts[1]}
  }
  return null
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3
  const φ1 = lat1 * Math.PI/180
  const φ2 = lat2 * Math.PI/180
  const Δφ = (lat2-lat1) * Math.PI/180
  const Δλ = (lon2-lon1) * Math.PI/180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c
}