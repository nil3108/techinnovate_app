import type { Fill } from './types'
import { storage } from './storage'

// Your deployed Apps Script
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzUpsxThHu-3tE509FcKe6TyMRsqXX2k6t7_F-FPjN7P6dD6j4ZWyBmCwNxjUX59tu2gA/exec'

export const googleSync = {
  enabled: true,
  
  async uploadMedia(blob: Blob, fileName: string, folderName: string): Promise<string> {
    const localUrl = await blobToBase64(blob)
    
    if (!this.enabled) return localUrl

    try {
      const base64Data = localUrl.split(',')[1] || localUrl
      const parts = folderName.split('_')
      const vehiclePlate = parts.slice(0, -1).join('_') || parts[0] || 'Unassigned'
      const fillDate = parts[parts.length - 1] || new Date().toISOString().split('T')[0]
      
      const payload = {
        action: 'uploadMedia',
        fileName: fileName,
        vehiclePlate: vehiclePlate,
        fillDate: fillDate,
        mimeType: blob.type || 'image/jpeg',
        base64Data: base64Data,
      }
      
      console.log('Uploading to Drive:', fileName, Math.round(base64Data.length/1024)+'KB', 'type:', blob.type)
      
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        headers: {'Content-Type': 'text/plain;charset=utf-8'},
        body: JSON.stringify(payload),
      })
      
      const text = await response.text()
      console.log('Raw response for', fileName, ':', text.substring(0, 200))
      
      const result = JSON.parse(text)
      
      if (result.success && result.fileUrl) {
        console.log('✓ Uploaded:', fileName, '→', result.fileUrl)
        return result.fileUrl
      } else {
        console.error('Upload failed for', fileName, ':', result)
        // Return local as fallback but log error
        return localUrl
      }
    } catch (error) {
      console.error('Upload error for', fileName, ':', error)
      return localUrl
    }
  },

  async saveFill(fill: Fill): Promise<boolean> {
    // DON'T save full media to localStorage - only save metadata
    // Media is in Google Drive, localStorage is just for cache
    const fills = storage.getFills()
    const fillForLocal = {
      ...fill,
      // Strip out large data URLs to avoid quota
      videoUrl: fill.videoUrl ? '[DRIVE]' : '',
      pumpPhotoUrl: fill.pumpPhotoUrl ? '[DRIVE]' : '',
      receiptPhotoUrl: fill.receiptPhotoUrl ? '[DRIVE]' : '',
      odoPhotoUrl: fill.odoPhotoUrl ? '[DRIVE]' : '',
    }
    
    try {
      storage.saveFills([...fills, fillForLocal])
    } catch (e) {
      // If still exceeds, keep only last 20 fills locally
      console.warn('LocalStorage full, trimming old fills')
      const recent = [...fills, fillForLocal].slice(-20)
      localStorage.setItem('cng_fills', JSON.stringify(recent))
    }
    
    if (!this.enabled) return true

    try {
      // Your script expects: action: 'addFill'
      const payload = {
        action: 'addFill',
        id: fill.id,
        vehicleId: fill.vehicleId,
        driverId: fill.driverId,
        time: fill.time,
        station: fill.station,
        kgs: fill.kgs,
        rate: fill.rate,
        total: fill.total,
        videoUrl: fill.videoUrl,
        pumpPhotoUrl: fill.pumpPhotoUrl,
        receiptPhotoUrl: fill.receiptPhotoUrl,
        odoPhotoUrl: fill.odoPhotoUrl,
        pumpGPS: fill.pumpGPS ? `${fill.pumpGPS.lat},${fill.pumpGPS.lng}` : '',
        receiptGPS: fill.receiptGPS ? `${fill.receiptGPS.lat},${fill.receiptGPS.lng}` : '',
        odoGPS: fill.odoGPS ? `${fill.odoGPS.lat},${fill.odoGPS.lng}` : '',
        odoReading: fill.odoReading,
        distanceDiff: fill.distanceDiff,
        mismatch: fill.mismatch,
        fuelDropPercent: fill.fuelDropPercent,
        ownerId: fill.ownerId,
        verified: fill.verified,
      }
      
      console.log('Saving fill to Sheets:', payload.id, payload.kgs + 'kg')
      
      // Use proper CORS, not no-cors
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      })
      
      const text = await response.text()
      console.log('Fill save response:', text.substring(0, 200))
      
      // Also sync alerts if needed
      if (fill.mismatch || fill.fuelDropPercent > 20) {
        const alertPayload = {
          action: 'addAlert',
          time: fill.time,
          event: fill.mismatch 
            ? `Location mismatch: ${Math.round(fill.distanceDiff)}m` 
            : `Fuel drop ${fill.fuelDropPercent.toFixed(1)}%`,
          user: fill.driverId,
          type: fill.mismatch ? 'location_mismatch' : 'fuel_drop',
          ownerId: fill.ownerId,
        }
        
        fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify(alertPayload),
        }).catch(() => {})
      }
      
      return true
    } catch (error) {
      console.error('Sheets sync error:', error)
      return true
    }
  },

  async syncOfflineQueue(): Promise<void> {
    if (!this.enabled || !navigator.onLine) return
    
    const queue = storage.getOfflineQueue()
    if (queue.length === 0) return

    for (const fill of queue) {
      const success = await this.saveFill(fill)
      if (!success) break // Stop if fails
    }
    
    if (navigator.onLine) {
      storage.clearOfflineQueue()
    }
  },

  async fetchAllData(): Promise<any> {
    if (!this.enabled) return null
    try {
      const response = await fetch(APPS_SCRIPT_URL + '?action=getData', {
        method: 'GET',
        redirect: 'follow'
      })
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch (e) {
        console.log('Parse error:', text.substring(0, 200))
        return { success: false }
      }
    } catch (error) {
      console.error('Fetch failed:', error)
      return { success: false }
    }
  },
  
  // Additional methods matching your API
  async registerOwner(owner: any): Promise<boolean> {
    if (!this.enabled) return true
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ action: 'registerOwner', ...owner }),
      })
      return true
    } catch { return false }
  },
  
  async addDriver(driver: any): Promise<boolean> {
    if (!this.enabled) return true
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ action: 'addDriver', ...driver }),
      })
      return true
    } catch { return false }
  },
  
  async addVehicle(vehicle: any): Promise<boolean> {
    if (!this.enabled) return true
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ action: 'addVehicle', ...vehicle }),
      })
      return true
    } catch { return false }
  },
  
  async updateOdometer(vehicleId: string, odo: number): Promise<boolean> {
    if (!this.enabled) return true
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ 
          action: 'updateVehicleOdometer', 
          vehicleId, 
          odometer: odo 
        }),
      })
      return true
    } catch { return false }
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Auto-sync when online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    googleSync.syncOfflineQueue()
  })
}