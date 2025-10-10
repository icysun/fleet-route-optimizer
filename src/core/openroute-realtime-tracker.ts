import { 
  GPSUpdate, 
  TrafficUpdate, 
  RouteDeviation, 
  Vehicle, 
  OptimizedRoute,
  Position 
} from './openroute-types'

/**
 * Real-time GPS tracking and route monitoring system
 * Handles live vehicle position updates, traffic monitoring, and dynamic route adjustments
 */
export class RealTimeTracker {
  private websocket: WebSocket | null = null
  private vehiclePositions: Map<string, GPSUpdate> = new Map()
  private activeRoutes: Map<string, OptimizedRoute> = new Map()
  private trafficConditions: Map<string, TrafficUpdate> = new Map()
  private deviationThreshold: number = 100 // meters
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectDelay: number = 1000 // ms
  
  // Event handlers
  private onPositionUpdate?: (vehicleId: string, update: GPSUpdate) => void
  private onRouteDeviation?: (deviation: RouteDeviation) => void
  private onTrafficUpdate?: (traffic: TrafficUpdate) => void
  private onConnectionStatus?: (status: 'connected' | 'disconnected' | 'error') => void
  
  constructor(
    private wsUrl: string,
    private apiKey?: string
  ) {}
  
  /**
   * Initialize real-time tracking connection
   */
  async connect(): Promise<void> {
    try {
      const wsUrlWithAuth = this.apiKey 
        ? `${this.wsUrl}?auth=${this.apiKey}`
        : this.wsUrl
        
      this.websocket = new WebSocket(wsUrlWithAuth)
      
      this.websocket.onopen = this.handleWebSocketOpen.bind(this)
      this.websocket.onmessage = this.handleWebSocketMessage.bind(this)
      this.websocket.onclose = this.handleWebSocketClose.bind(this)
      this.websocket.onerror = this.handleWebSocketError.bind(this)
      
      // Set up heartbeat to keep connection alive
      this.startHeartbeat()
      
    } catch (error) {
      console.error('Failed to connect to real-time tracking:', error)
      this.onConnectionStatus?.('error')
      throw error
    }
  }
  
  /**
   * Disconnect from real-time tracking
   */
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close(1000, 'Client disconnect')
      this.websocket = null
    }
    this.stopHeartbeat()
    this.onConnectionStatus?.('disconnected')
  }
  
  /**
   * Subscribe to vehicle position updates
   */
  subscribeToVehicle(vehicleId: string): void {
    this.sendMessage({
      type: 'subscribe',
      channel: 'vehicle_positions',
      vehicleId
    })
  }
  
  /**
   * Unsubscribe from vehicle position updates
   */
  unsubscribeFromVehicle(vehicleId: string): void {
    this.sendMessage({
      type: 'unsubscribe',
      channel: 'vehicle_positions',
      vehicleId
    })
  }
  
  /**
   * Subscribe to traffic updates for a specific area
   */
  subscribeToTraffic(bounds: GeoBounds): void {
    this.sendMessage({
      type: 'subscribe',
      channel: 'traffic_updates',
      bounds
    })
  }
  
  /**
   * Start monitoring a route for deviations
   */
  startRouteMonitoring(route: OptimizedRoute): void {
    this.activeRoutes.set(route.id, route)
    
    this.sendMessage({
      type: 'monitor_route',
      routeId: route.id,
      vehicleId: route.vehicleId,
      expectedPath: route.segments.map(s => [s.start, s.end]).flat(),
      deviationThreshold: this.deviationThreshold
    })
  }
  
  /**
   * Stop monitoring a route
   */
  stopRouteMonitoring(routeId: string): void {
    this.activeRoutes.delete(routeId)
    
    this.sendMessage({
      type: 'stop_monitoring',
      routeId
    })
  }
  
  /**
   * Update vehicle position manually (for testing or backup)
   */
  updateVehiclePosition(vehicleId: string, position: Position, metadata?: any): void {
    const update: GPSUpdate = {
      vehicleId,
      position,
      timestamp: new Date(),
      speed: metadata?.speed || 0,
      heading: metadata?.heading || 0,
      accuracy: metadata?.accuracy || 10
    }
    
    this.processPositionUpdate(update)
  }
  
  /**
   * Get latest position for a vehicle
   */
  getVehiclePosition(vehicleId: string): GPSUpdate | null {
    return this.vehiclePositions.get(vehicleId) || null
  }
  
  /**
   * Get all tracked vehicle positions
   */
  getAllVehiclePositions(): Map<string, GPSUpdate> {
    return new Map(this.vehiclePositions)
  }
  
  /**
   * Check if vehicle is deviating from route
   */
  checkRouteDeviation(vehicleId: string, currentPosition: Position): RouteDeviation | null {
    const route = Array.from(this.activeRoutes.values())
      .find(r => r.vehicleId === vehicleId)
    
    if (!route) return null
    
    const nearestSegment = this.findNearestRouteSegment(currentPosition, route)
    if (!nearestSegment) return null
    
    const distanceFromRoute = this.calculateDistanceToLineSegment(
      currentPosition,
      nearestSegment.start,
      nearestSegment.end
    )
    
    if (distanceFromRoute > this.deviationThreshold) {
      return {
        routeId: route.id,
        vehicleId,
        deviationType: 'off_route',
        severity: distanceFromRoute > this.deviationThreshold * 2 ? 'major' : 'moderate',
        estimatedImpact: this.estimateDeviationImpact(distanceFromRoute),
        suggestedAction: 'Recalculate route to nearest waypoint'
      }
    }
    
    return null
  }
  
  /**
   * Predict ETA based on current position and traffic
   */
  predictETA(vehicleId: string, destination: Position): PredictedETA {
    const currentPos = this.vehiclePositions.get(vehicleId)
    if (!currentPos) {
      throw new Error(`No position data for vehicle ${vehicleId}`)
    }
    
    const route = Array.from(this.activeRoutes.values())
      .find(r => r.vehicleId === vehicleId)
    
    if (!route) {
      // Direct distance calculation
      const distance = this.calculateDistance(currentPos.position, destination)
      const estimatedSpeed = Math.max(currentPos.speed, 30) // Assume 30 km/h minimum
      
      return {
        vehicleId,
        estimatedArrival: new Date(Date.now() + (distance / estimatedSpeed) * 60 * 60 * 1000),
        confidence: 0.6,
        factors: ['direct_calculation']
      }
    }
    
    // Calculate based on route and traffic conditions
    const remainingSegments = this.getRemainingRouteSegments(currentPos.position, route)
    let totalTime = 0
    let confidence = 0.9
    const factors: string[] = []
    
    for (const segment of remainingSegments) {
      const segmentId = `${segment.start[0]}_${segment.start[1]}_${segment.end[0]}_${segment.end[1]}`
      const traffic = this.trafficConditions.get(segmentId)
      
      if (traffic) {
        const adjustedSpeed = traffic.averageSpeed
        const segmentTime = (segment.distance / adjustedSpeed) * 60 // minutes
        totalTime += segmentTime + (traffic.estimatedDelay || 0)
        factors.push(`traffic_${traffic.congestionLevel}`)
        
        if (traffic.congestionLevel === 'heavy' || traffic.congestionLevel === 'severe') {
          confidence *= 0.8
        }
      } else {
        // No traffic data, use estimated speed
        const estimatedSpeed = segment.speedLimit || 50
        totalTime += (segment.distance / estimatedSpeed) * 60
        confidence *= 0.9
        factors.push('estimated_speed')
      }
    }
    
    return {
      vehicleId,
      estimatedArrival: new Date(Date.now() + totalTime * 60 * 1000),
      confidence: Math.max(confidence, 0.3),
      factors
    }
  }
  
  /**
   * Set up event handlers for real-time updates
   */
  setEventHandlers(handlers: {
    onPositionUpdate?: (vehicleId: string, update: GPSUpdate) => void
    onRouteDeviation?: (deviation: RouteDeviation) => void
    onTrafficUpdate?: (traffic: TrafficUpdate) => void
    onConnectionStatus?: (status: 'connected' | 'disconnected' | 'error') => void
  }): void {
    this.onPositionUpdate = handlers.onPositionUpdate
    this.onRouteDeviation = handlers.onRouteDeviation
    this.onTrafficUpdate = handlers.onTrafficUpdate
    this.onConnectionStatus = handlers.onConnectionStatus
  }
  
  // Private methods
  private handleWebSocketOpen(): void {
    console.log('Real-time tracking connected')
    this.reconnectAttempts = 0
    this.onConnectionStatus?.('connected')
  }
  
  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'position_update':
          this.processPositionUpdate(data.payload)
          break
          
        case 'traffic_update':
          this.processTrafficUpdate(data.payload)
          break
          
        case 'route_deviation':
          this.processRouteDeviation(data.payload)
          break
          
        case 'heartbeat':
          this.sendMessage({ type: 'heartbeat_ack' })
          break
          
        default:
          console.warn('Unknown message type:', data.type)
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error)
    }
  }
  
  private handleWebSocketClose(event: CloseEvent): void {
    console.log('WebSocket connection closed:', event.code, event.reason)
    this.onConnectionStatus?.('disconnected')
    
    // Attempt to reconnect if not a clean close
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++
        console.log(`Reconnection attempt ${this.reconnectAttempts}`)
        this.connect().catch(console.error)
      }, this.reconnectDelay * this.reconnectAttempts)
    }
  }
  
  private handleWebSocketError(error: Event): void {
    console.error('WebSocket error:', error)
    this.onConnectionStatus?.('error')
  }
  
  private sendMessage(message: any): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, message not sent:', message)
    }
  }
  
  private processPositionUpdate(update: GPSUpdate): void {
    this.vehiclePositions.set(update.vehicleId, update)
    this.onPositionUpdate?.(update.vehicleId, update)
    
    // Check for route deviations
    const deviation = this.checkRouteDeviation(update.vehicleId, update.position)
    if (deviation) {
      this.onRouteDeviation?.(deviation)
    }
  }
  
  private processTrafficUpdate(update: TrafficUpdate): void {
    this.trafficConditions.set(update.segmentId, update)
    this.onTrafficUpdate?.(update)
  }
  
  private processRouteDeviation(deviation: RouteDeviation): void {
    this.onRouteDeviation?.(deviation)
  }
  
  private heartbeatInterval?: number
  
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendMessage({ type: 'heartbeat' })
    }, 30000) // 30 seconds
  }
  
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = undefined
    }
  }
  
  private findNearestRouteSegment(position: Position, route: OptimizedRoute) {
    let nearestSegment = null
    let minDistance = Infinity
    
    for (const segment of route.segments) {
      const distance = this.calculateDistanceToLineSegment(
        position,
        segment.start,
        segment.end
      )
      
      if (distance < minDistance) {
        minDistance = distance
        nearestSegment = segment
      }
    }
    
    return nearestSegment
  }
  
  private calculateDistanceToLineSegment(point: Position, lineStart: Position, lineEnd: Position): number {
    // Calculate perpendicular distance from point to line segment
    const A = point[0] - lineStart[0]
    const B = point[1] - lineStart[1]
    const C = lineEnd[0] - lineStart[0]
    const D = lineEnd[1] - lineStart[1]
    
    const dot = A * C + B * D
    const lenSq = C * C + D * D
    
    if (lenSq === 0) return this.calculateDistance(point, lineStart)
    
    let param = dot / lenSq
    
    let xx, yy
    if (param < 0) {
      xx = lineStart[0]
      yy = lineStart[1]
    } else if (param > 1) {
      xx = lineEnd[0]
      yy = lineEnd[1]
    } else {
      xx = lineStart[0] + param * C
      yy = lineStart[1] + param * D
    }
    
    return this.calculateDistance(point, [xx, yy])
  }
  
  private calculateDistance(pos1: Position, pos2: Position): number {
    const R = 6371000 // Earth's radius in meters
    const dLat = this.toRadians(pos2[0] - pos1[0])
    const dLon = this.toRadians(pos2[1] - pos1[1])
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(pos1[0])) * Math.cos(this.toRadians(pos2[0])) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }
  
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
  
  private estimateDeviationImpact(distanceFromRoute: number): number {
    // Estimate additional time in minutes based on deviation distance
    const baseImpact = (distanceFromRoute / 1000) * 2 // 2 minutes per km deviation
    return Math.min(baseImpact, 30) // Cap at 30 minutes
  }
  
  private getRemainingRouteSegments(currentPosition: Position, route: OptimizedRoute) {
    // Find current position in route and return remaining segments
    let nearestSegmentIndex = 0
    let minDistance = Infinity
    
    for (let i = 0; i < route.segments.length; i++) {
      const segment = route.segments[i]
      const distance = this.calculateDistanceToLineSegment(
        currentPosition,
        segment.start,
        segment.end
      )
      
      if (distance < minDistance) {
        minDistance = distance
        nearestSegmentIndex = i
      }
    }
    
    return route.segments.slice(nearestSegmentIndex)
  }
}

// Additional interfaces for real-time tracking
interface GeoBounds {
  north: number
  south: number
  east: number
  west: number
}

interface PredictedETA {
  vehicleId: string
  estimatedArrival: Date
  confidence: number // 0-1
  factors: string[]
}