// Core types for the OpenRoute Optimizer system

export type Position = [number, number] // [latitude, longitude]

export interface Vehicle {
  id: string
  name: string
  position: Position
  capacity: number
  currentLoad: number
  maxRange: number
  fuelLevel: number
  status: 'active' | 'idle' | 'maintenance' | 'out_of_service'
  vehicleType: 'truck' | 'van' | 'car' | 'motorcycle'
  restrictions?: VehicleRestrictions
  driver?: Driver
}

export interface VehicleRestrictions {
  maxWeight: number
  maxVolume: number
  hazmatAllowed: boolean
  refrigerated: boolean
  tollRoadsAllowed: boolean
  accessRestrictions: string[]
}

export interface Driver {
  id: string
  name: string
  licenseType: string
  workingHours: WorkingHours
  currentShift: {
    start: Date
    maxDuration: number // minutes
    breaksTaken: number
  }
}

export interface WorkingHours {
  dailyLimit: number // minutes
  weeklyLimit: number // minutes
  mandatoryBreakInterval: number // minutes
  mandatoryBreakDuration: number // minutes
}

export interface Delivery {
  id: string
  address: string
  position: Position
  priority: 'low' | 'medium' | 'high' | 'urgent'
  timeWindow?: TimeWindow
  serviceTime: number // minutes required for delivery
  weight: number
  volume: number
  specialRequirements?: DeliveryRequirements
  customerInfo?: Customer
}

export interface TimeWindow {
  earliest: Date
  latest: Date
  preferredTime?: Date
  start?: Date
  end?: Date
}

export interface DeliveryRequirements {
  refrigerated: boolean
  fragile: boolean
  hazardous: boolean
  signatureRequired: boolean
  accessNotes?: string
}

export interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  instructions?: string
}

export interface RouteSegment {
  start: Position
  end: Position
  distance: number // kilometers
  duration: number // minutes
  instruction: string
  roadType?: 'highway' | 'arterial' | 'local' | 'service'
  speedLimit?: number
  tollCost?: number
}

export interface OptimizedRoute {
  id: string
  vehicleId: string
  segments: RouteSegment[]
  deliveries: Delivery[]
  totalDistance: number
  totalDuration: number
  totalCost: number
  efficiency: number // 0-1 score
  constraints: RouteConstraints
}

export interface RouteConstraints {
  maxDistance?: number
  maxDuration?: number
  maxStops?: number
  timeWindows: boolean
  vehicleCapacity: boolean
  driverHours: boolean
}

export interface OptimizationOptions {
  algorithm: 'dijkstra' | 'astar' | 'genetic' | 'clarke_wright' | 'or_tools'
  objectives: OptimizationObjective[]
  constraints: RouteConstraints
  timeHorizon: {
    start: Date
    end: Date
  }
  allowPartialSolution: boolean
}

export interface OptimizationObjective {
  type: 'minimize_distance' | 'minimize_time' | 'minimize_cost' | 'maximize_efficiency' | 'balance_load'
  weight: number // relative importance 0-1
}

export interface OptimizationResult {
  routes: OptimizedRoute[]
  unassignedDeliveries: Delivery[]
  statistics: OptimizationStatistics
  metadata: {
    algorithm: string
    computationTime: number
    iterations: number
    convergence: boolean
  }
}

export interface OptimizationStatistics {
  totalDistance: number
  totalDuration: number
  totalCost: number
  averageEfficiency: number
  vehicleUtilization: number
  deliverySuccess: number
  constraintViolations: ConstraintViolation[]
}

export interface ConstraintViolation {
  type: string
  severity: 'warning' | 'error'
  description: string
  affectedRoutes: string[]
  suggestedAction?: string
}

// Vehicle Routing Problem (VRP) specific types
export interface VRPInstance {
  depot: Position
  vehicles: Vehicle[]
  deliveries: Delivery[]
  distanceMatrix?: number[][]
  timeMatrix?: number[][]
  objectives?: string[]
  constraints: VRPConstraints
}

export interface VRPConstraints {
  capacityConstraints: boolean
  timeWindowConstraints: boolean
  maxRouteDistance?: number
  maxRouteDuration?: number
  maxVehicles?: number
  allowSplitDeliveries: boolean
  driverHoursConstraints?: boolean
  vehicleCapacity?: boolean
}

export interface VRPSolution {
  routes: VRPRoute[]
  objectiveValue: number
  feasible: boolean
  computationTime: number
}

export interface VRPRoute {
  vehicleId: string
  sequence: string[] // delivery IDs in order
  load: number
  distance: number
  duration: number
  violations: ConstraintViolation[]
}

// Real-time tracking types
export interface GPSUpdate {
  vehicleId: string
  position: Position
  timestamp: Date
  speed: number
  heading: number
  accuracy: number
}

export interface TrafficUpdate {
  segmentId: string
  congestionLevel: 'free' | 'light' | 'moderate' | 'heavy' | 'severe'
  averageSpeed: number
  estimatedDelay: number
  incidentReported: boolean
}

export interface RouteDeviation {
  routeId: string
  vehicleId: string
  deviationType: 'off_route' | 'delayed' | 'early' | 'stopped'
  severity: 'minor' | 'moderate' | 'major'
  estimatedImpact: number // minutes
  suggestedAction: string
}