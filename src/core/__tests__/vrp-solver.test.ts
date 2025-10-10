import { VRPSolver } from '../openroute-vrp'
import { VRPInstance, Vehicle, Delivery, Position, VRPConstraints } from '../openroute-types'

describe('VRPSolver - Clarke Wright', () => {
  const depot: Position = [40.0, -74.0]
  const vehicles: Vehicle[] = [
    { id: 'v1', name: 'Truck 1', position: depot, capacity: 200, currentLoad: 0, maxRange: 500, fuelLevel: 100, status: 'active', vehicleType: 'truck' },
    { id: 'v2', name: 'Truck 2', position: depot, capacity: 200, currentLoad: 0, maxRange: 500, fuelLevel: 100, status: 'active', vehicleType: 'truck' }
  ]
  const deliveries: Delivery[] = [
    { id: 'd1', address: 'A', position: [40.01, -74.01], priority: 'medium', serviceTime: 10, weight: 20, volume: 5 },
    { id: 'd2', address: 'B', position: [40.02, -74.02], priority: 'medium', serviceTime: 10, weight: 25, volume: 5 },
    { id: 'd3', address: 'C', position: [40.015, -74.015], priority: 'medium', serviceTime: 10, weight: 15, volume: 5 }
  ]
  const constraints: VRPConstraints = {
    capacityConstraints: true,
    timeWindowConstraints: false,
    allowSplitDeliveries: false,
    driverHoursConstraints: false,
    vehicleCapacity: true
  }

  const instance: VRPInstance = {
    depot,
    vehicles,
    deliveries,
    constraints
  }

  it('produces a valid solution with routes covering all deliveries', () => {
    const solver = new VRPSolver()
    const solution = solver.solveClarkeWright(instance)
    const allDelivered = new Set(solution.routes.flatMap(r => r.sequence))
    expect(allDelivered.size).toBe(deliveries.length)
    expect(solution.feasible).toBe(true)
  })
})
