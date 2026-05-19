export type Language = 'en' | 'hi' | 'gu'

export type Role = 'driver' | 'owner' | 'admin'

export interface Owner {
  id: string
  name: string
  email: string
  phone: string
  business: string
  password: string
  status: 'active' | 'inactive'
  createdAt: string
}

export interface Driver {
  id: string
  name: string
  code: string
  assignedVehicleId: string | null
  ownerId: string
  status: 'active' | 'inactive'
  createdAt: string
}

export interface Vehicle {
  id: string
  plate: string
  model: string
  initialOdo: number
  currentOdo: number
  capacity: number
  ownerId: string
  status: 'active' | 'inactive'
}

export interface Fill {
  id: string
  vehicleId: string
  driverId: string
  time: string
  station: 'VGL' | 'Adani' | 'Gujarat Gas'
  kgs: number
  rate: number
  total: number
  videoUrl: string
  pumpPhotoUrl: string
  receiptPhotoUrl: string
  odoPhotoUrl: string
  pumpGPS: { lat: number; lng: number } | null
  receiptGPS: { lat: number; lng: number } | null
  odoGPS: { lat: number; lng: number } | null
  odoReading: number
  distanceDiff: number
  mismatch: boolean
  fuelDropPercent: number
  ownerId: string
  verified: boolean
  pendingVehicleApproval?: boolean
}

export interface Alert {
  id: string
  time: string
  event: string
  user: string
  type: 'location_mismatch' | 'fuel_drop' | 'vehicle_override' | 'other'
  ownerId: string
  resolved: boolean
}

export interface CameraCapture {
  blob: Blob
  dataUrl: string
  timestamp: number
  gps?: { lat: number; lng: number }
}