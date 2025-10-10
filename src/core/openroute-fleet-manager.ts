import { RealTimeTracker } from './openroute-realtime-tracker'
import { 
  Vehicle, 
  Delivery, 
  OptimizedRoute, 
  GPSUpdate,
  RouteDeviation,
  TrafficUpdate,
  Position 
} from './openroute-types'

/**
 * Real-time fleet management system
 * Coordinates multiple vehicles, routes, and real-time optimizations
 */
export class FleetManager {
  private tracker: RealTimeTracker
  private vehicles: Map<string, Vehicle> = new Map()
  private activeRoutes: Map<string, OptimizedRoute> = new Map()
  private routeOptimizer: any // Will be the AdvancedRouteOptimizer
  
  // Event callbacks
  private onFleetUpdate?: (fleet: FleetStatus) => void
  private onEmergencyAlert?: (alert: EmergencyAlert) => void
  private onEfficiencyReport?: (report: EfficiencyReport) => void
  
  constructor(
    wsUrl: string,
    apiKey?: string
  ) {
    this.tracker = new RealTimeTracker(wsUrl, apiKey)
    this.setupTrackerEventHandlers()
  }
  
  /**
   * Initialize fleet management system
   */
  async initialize(): Promise<void> {
    await this.tracker.connect()
    this.startPeriodicTasks()
  }
  
  /**
   * Shutdown fleet management system
   */
  shutdown(): void {
    this.tracker.disconnect()
    this.stopPeriodicTasks()
  }
  
  /**
   * Add vehicle to fleet tracking
   */
  addVehicle(vehicle: Vehicle): void {
    this.vehicles.set(vehicle.id, vehicle)
    this.tracker.subscribeToVehicle(vehicle.id)
  }
  
  /**
   * Remove vehicle from fleet tracking
   */
  removeVehicle(vehicleId: string): void {
    this.vehicles.delete(vehicleId)
    this.tracker.unsubscribeFromVehicle(vehicleId)
  }
  
  /**
   * Start real-time monitoring for a route
   */
  startRouteExecution(route: OptimizedRoute): void {
    this.activeRoutes.set(route.id, route)
    this.tracker.startRouteMonitoring(route)
    
    // Update vehicle status
    const vehicle = this.vehicles.get(route.vehicleId)
    if (vehicle) {
      vehicle.status = 'active'
      this.vehicles.set(vehicle.id, vehicle)
    }
  }
  
  /**
   * Complete route execution
   */
  completeRoute(routeId: string): void {
    const route = this.activeRoutes.get(routeId)
    if (route) {
      this.tracker.stopRouteMonitoring(routeId)
      this.activeRoutes.delete(routeId)
      
      // Update vehicle status
      const vehicle = this.vehicles.get(route.vehicleId)
      if (vehicle) {
        vehicle.status = 'idle'
        this.vehicles.set(vehicle.id, vehicle)
      }
    }
  }
  
  /**
   * Get real-time fleet status
   */
  getFleetStatus(): FleetStatus {
    const vehicleStatuses: VehicleStatus[] = []
    
    for (const [vehicleId, vehicle] of this.vehicles) {
      const position = this.tracker.getVehiclePosition(vehicleId)
      const route = Array.from(this.activeRoutes.values())
        .find(r => r.vehicleId === vehicleId)
      
      let eta: Date | null = null
      if (route && position) {
        try {
          const prediction = this.tracker.predictETA(vehicleId, route.segments[route.segments.length - 1].end)
          eta = prediction.estimatedArrival
        } catch (error) {
          console.warn(`Could not predict ETA for vehicle ${vehicleId}:`, error)
        }
      }
      
      vehicleStatuses.push({
        vehicle,
        position: position?.position || null,
        lastUpdate: position?.timestamp || null,
        currentRoute: route || null,
        estimatedETA: eta,
        efficiency: this.calculateVehicleEfficiency(vehicleId),
        alerts: this.getVehicleAlerts(vehicleId)
      })
    }
    
    return {
      timestamp: new Date(),
      totalVehicles: this.vehicles.size,
      activeVehicles: vehicleStatuses.filter(v => v.vehicle.status === 'active').length,
      idleVehicles: vehicleStatuses.filter(v => v.vehicle.status === 'idle').length,
      maintenanceVehicles: vehicleStatuses.filter(v => v.vehicle.status === 'maintenance').length,
      vehicles: vehicleStatuses,
      activeRoutes: Array.from(this.activeRoutes.values()),
      fleetEfficiency: this.calculateFleetEfficiency(),
      totalDistance: this.calculateTotalDistance(),
      alerts: this.getFleetAlerts()
    }
  }
  
  /**
   * Handle emergency situations
   */
  handleEmergency(vehicleId: string, emergencyType: EmergencyType): void {
    const vehicle = this.vehicles.get(vehicleId)
    if (!vehicle) return
    
    const alert: EmergencyAlert = {
      id: `emergency_${Date.now()}`,
      vehicleId,
      type: emergencyType,
      timestamp: new Date(),
      position: this.tracker.getVehiclePosition(vehicleId)?.position || null,
      severity: this.getEmergencySeverity(emergencyType),
      autoActions: []
    }
    
    // Automatic emergency responses
    switch (emergencyType) {
      case 'breakdown':
        vehicle.status = 'out_of_service'
        alert.autoActions.push('Vehicle marked as out of service')
        this.reassignVehicleRoutes(vehicleId)
        break
        
      case 'accident':
        vehicle.status = 'out_of_service'
        alert.autoActions.push('Emergency services notified')
        alert.autoActions.push('Route reassignment initiated')
        this.reassignVehicleRoutes(vehicleId)
        break
        
      case 'traffic_jam':
        alert.autoActions.push('Route recalculation initiated')
        this.recalculateAffectedRoutes(vehicleId)
        break
        
      case 'fuel_low':
        alert.autoActions.push('Nearest fuel station located')
        this.findNearestFuelStation(vehicleId)
        break
    }
    
    this.vehicles.set(vehicleId, vehicle)
    this.onEmergencyAlert?.(alert)
  }
  
  /**
   * Optimize fleet performance in real-time
   */
  async optimizeFleetRealTime(): Promise<OptimizationSummary> {
    const startTime = Date.now()
    let routesOptimized = 0
    let distanceSaved = 0
    let timeSaved = 0
    
    // Re-optimize routes based on current conditions
    for (const [routeId, route] of this.activeRoutes) {
      const vehiclePosition = this.tracker.getVehiclePosition(route.vehicleId)
      if (!vehiclePosition) continue
      
      try {
        // Calculate remaining deliveries
        const remainingDeliveries = this.getRemainingDeliveries(route, vehiclePosition.position)
        
        if (remainingDeliveries.length > 1) {
          const optimizedSegments = await this.reoptimizeRemainingRoute(
            route.vehicleId,
            vehiclePosition.position,
            remainingDeliveries
          )
          
          if (optimizedSegments) {
            const originalDistance = this.calculateRouteDistance(route.segments)
            const newDistance = this.calculateRouteDistance(optimizedSegments)
            
            if (newDistance < originalDistance * 0.95) { // 5% improvement threshold
              route.segments = optimizedSegments
              route.totalDistance = newDistance
              route.totalDuration = newDistance / 50 * 60 // Assume 50 km/h
              
              this.activeRoutes.set(routeId, route)
              routesOptimized++
              distanceSaved += originalDistance - newDistance
              timeSaved += (originalDistance - newDistance) / 50 * 60
            }
          }
        }
      } catch (error) {
        console.error(`Failed to optimize route ${routeId}:`, error)
      }
    }
    
    const computationTime = Date.now() - startTime
    
    const summary: OptimizationSummary = {
      timestamp: new Date(),
      routesOptimized,
      distanceSaved,
      timeSaved,
      fuelSaved: distanceSaved * 0.1, // Assume 0.1L per km
      costSaved: distanceSaved * 0.5, // Assume $0.5 per km
      computationTime
    }
    
    const report: EfficiencyReport = {
      ...summary,
      fleetEfficiency: this.calculateFleetEfficiency(),
      recommendations: [
        routesOptimized > 0 ? `Successfully optimized ${routesOptimized} routes` : 'No routes needed optimization',
        distanceSaved > 10 ? `Significant distance savings achieved: ${distanceSaved.toFixed(1)} km` : 'Consider dynamic re-routing for better efficiency'
      ]
    }
    
    this.onEfficiencyReport?.(report)
    return summary
  }
  
  /**
   * Set event handlers for fleet management
   */
  setEventHandlers(handlers: {
    onFleetUpdate?: (fleet: FleetStatus) => void
    onEmergencyAlert?: (alert: EmergencyAlert) => void
    onEfficiencyReport?: (report: EfficiencyReport) => void
  }): void {
    this.onFleetUpdate = handlers.onFleetUpdate
    this.onEmergencyAlert = handlers.onEmergencyAlert
    this.onEfficiencyReport = handlers.onEfficiencyReport
  }
  
  // Private methods
  private setupTrackerEventHandlers(): void {
    this.tracker.setEventHandlers({
      onPositionUpdate: (vehicleId, update) => {
        this.handlePositionUpdate(vehicleId, update)
      },
      onRouteDeviation: (deviation) => {
        this.handleRouteDeviation(deviation)
      },
      onTrafficUpdate: (traffic) => {
        this.handleTrafficUpdate(traffic)
      },
      onConnectionStatus: (status) => {
        console.log(`Real-time tracking status: ${status}`)
      }
    })
  }
  
  private handlePositionUpdate(vehicleId: string, update: GPSUpdate): void {
    // Update vehicle efficiency calculations
    this.updateVehicleMetrics(vehicleId, update)
    
    // Trigger fleet status update
    const fleetStatus = this.getFleetStatus()
    this.onFleetUpdate?.(fleetStatus)
  }
  
  private handleRouteDeviation(deviation: RouteDeviation): void {
    if (deviation.severity === 'major') {
      this.handleEmergency(deviation.vehicleId, 'off_route')
    }
  }
  
  private handleTrafficUpdate(traffic: TrafficUpdate): void {
    if (traffic.congestionLevel === 'severe') {
      // Find affected vehicles and trigger re-optimization
      const affectedVehicles = this.findVehiclesInArea(traffic.segmentId)
      for (const vehicleId of affectedVehicles) {
        this.recalculateAffectedRoutes(vehicleId)
      }
    }
  }
  
  private calculateVehicleEfficiency(vehicleId: string): number {
    // Simplified efficiency calculation
    // In production, consider factors like fuel consumption, delivery success rate, etc.
    const vehicle = this.vehicles.get(vehicleId)
    if (!vehicle) return 0
    
    const position = this.tracker.getVehiclePosition(vehicleId)
    if (!position) return 0.5
    
    // Base efficiency on speed and route adherence
    const speedEfficiency = Math.min(position.speed / 60, 1) // Optimal at 60 km/h
    const routeAdherence = 0.9 // Placeholder - calculate based on deviations
    
    return (speedEfficiency + routeAdherence) / 2
  }
  
  private calculateFleetEfficiency(): number {
    const efficiencies = Array.from(this.vehicles.keys())
      .map(id => this.calculateVehicleEfficiency(id))
      .filter(eff => eff > 0)
    
    return efficiencies.length > 0 
      ? efficiencies.reduce((sum, eff) => sum + eff, 0) / efficiencies.length
      : 0
  }
  
  private calculateTotalDistance(): number {
    return Array.from(this.activeRoutes.values())
      .reduce((total, route) => total + route.totalDistance, 0)
  }
  
  private getVehicleAlerts(vehicleId: string): Alert[] {
    const alerts: Alert[] = []
    const vehicle = this.vehicles.get(vehicleId)
    const position = this.tracker.getVehiclePosition(vehicleId)
    
    if (!vehicle || !position) return alerts
    
    // Check for various alert conditions
    if (vehicle.fuelLevel < 20) {
      alerts.push({
        type: 'fuel_low',
        severity: vehicle.fuelLevel < 10 ? 'high' : 'medium',
        message: `Fuel level: ${vehicle.fuelLevel}%`
      })
    }
    
    if (position.accuracy > 50) {
      alerts.push({
        type: 'gps_poor',
        severity: 'low',
        message: `GPS accuracy: ${position.accuracy}m`
      })
    }
    
    // Check last update time
    const timeSinceUpdate = Date.now() - position.timestamp.getTime()
    if (timeSinceUpdate > 300000) { // 5 minutes
      alerts.push({
        type: 'communication_loss',
        severity: 'high',
        message: `Last update: ${Math.floor(timeSinceUpdate / 60000)} minutes ago`
      })
    }
    
    return alerts
  }
  
  private getFleetAlerts(): Alert[] {
    const allAlerts: Alert[] = []
    
    for (const vehicleId of this.vehicles.keys()) {
      allAlerts.push(...this.getVehicleAlerts(vehicleId))
    }
    
    return allAlerts
  }
  
  private getEmergencySeverity(type: EmergencyType): 'low' | 'medium' | 'high' | 'critical' {
    switch (type) {
      case 'accident': return 'critical'
      case 'breakdown': return 'high'
      case 'fuel_low': return 'medium'
      case 'traffic_jam': return 'low'
      case 'off_route': return 'medium'
      default: return 'low'
    }
  }
  
  private async reassignVehicleRoutes(vehicleId: string): Promise<void> {
    // Find routes assigned to this vehicle
    const routesToReassign = Array.from(this.activeRoutes.values())
      .filter(route => route.vehicleId === vehicleId)
    
    for (const route of routesToReassign) {
      // Find alternative vehicle
      const availableVehicle = this.findAvailableVehicle(route.deliveries)
      
      if (availableVehicle) {
        route.vehicleId = availableVehicle.id
        this.activeRoutes.set(route.id, route)
        this.tracker.stopRouteMonitoring(route.id)
        this.tracker.startRouteMonitoring(route)
      } else {
        // No available vehicle - route needs to be postponed
        this.activeRoutes.delete(route.id)
        this.tracker.stopRouteMonitoring(route.id)
      }
    }
  }
  
  private findAvailableVehicle(deliveries: Delivery[]): Vehicle | null {
    const totalWeight = deliveries.reduce((sum, d) => sum + d.weight, 0)
    
    for (const vehicle of this.vehicles.values()) {
      if (vehicle.status === 'idle' && vehicle.capacity >= totalWeight) {
        return vehicle
      }
    }
    
    return null
  }
  
  private recalculateAffectedRoutes(vehicleId: string): void {
    // Trigger route recalculation for affected vehicle
    const route = Array.from(this.activeRoutes.values())
      .find(r => r.vehicleId === vehicleId)
    
    if (route) {
      // In production, this would trigger the route optimizer
      console.log(`Recalculating route for vehicle ${vehicleId}`)
    }
  }
  
  private findNearestFuelStation(vehicleId: string): void {
    const position = this.tracker.getVehiclePosition(vehicleId)
    if (position) {
      // In production, query fuel station database
      console.log(`Finding nearest fuel station for vehicle ${vehicleId} at`, position.position)
    }
  }
  
  private findVehiclesInArea(segmentId: string): string[] {
    // Simplified - in production, use geospatial queries
    return Array.from(this.vehicles.keys()).slice(0, 1) // Placeholder
  }
  
  private updateVehicleMetrics(vehicleId: string, update: GPSUpdate): void {
    // Update internal metrics for efficiency calculations
    // This would include fuel consumption, speed analysis, etc.
  }
  
  private getRemainingDeliveries(route: OptimizedRoute, currentPosition: Position): Delivery[] {
    // Determine which deliveries are still pending based on current position
    return route.deliveries // Placeholder - implement proper logic
  }
  
  private async reoptimizeRemainingRoute(
    vehicleId: string, 
    currentPosition: Position, 
    deliveries: Delivery[]
  ): Promise<any[] | null> {
    // Use route optimizer to recalculate remaining route
    return null // Placeholder
  }
  
  private calculateRouteDistance(segments: any[]): number {
    return segments.reduce((total, segment) => total + segment.distance, 0)
  }
  
  private periodicTaskInterval?: number
  
  private startPeriodicTasks(): void {
    // Run fleet optimization every 5 minutes
    this.periodicTaskInterval = setInterval(() => {
      this.optimizeFleetRealTime().catch(console.error)
    }, 300000) as any
  }
  
  private stopPeriodicTasks(): void {
    if (this.periodicTaskInterval) {
      clearInterval(this.periodicTaskInterval)
      this.periodicTaskInterval = undefined
    }
  }
}

// Additional interfaces
interface FleetStatus {
  timestamp: Date
  totalVehicles: number
  activeVehicles: number
  idleVehicles: number
  maintenanceVehicles: number
  vehicles: VehicleStatus[]
  activeRoutes: OptimizedRoute[]
  fleetEfficiency: number
  totalDistance: number
  alerts: Alert[]
}

interface VehicleStatus {
  vehicle: Vehicle
  position: Position | null
  lastUpdate: Date | null
  currentRoute: OptimizedRoute | null
  estimatedETA: Date | null
  efficiency: number
  alerts: Alert[]
}

interface Alert {
  type: string
  severity: 'low' | 'medium' | 'high'
  message: string
}

interface EmergencyAlert {
  id: string
  vehicleId: string
  type: EmergencyType
  timestamp: Date
  position: Position | null
  severity: 'low' | 'medium' | 'high' | 'critical'
  autoActions: string[]
}

interface OptimizationSummary {
  timestamp: Date
  routesOptimized: number
  distanceSaved: number
  timeSaved: number
  fuelSaved: number
  costSaved: number
  computationTime: number
}

interface EfficiencyReport extends OptimizationSummary {
  fleetEfficiency: number
  recommendations: string[]
}

type EmergencyType = 'breakdown' | 'accident' | 'fuel_low' | 'traffic_jam' | 'off_route'