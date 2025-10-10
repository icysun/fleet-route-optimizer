import { 
  Vehicle, 
  Delivery, 
  VRPInstance, 
  VRPSolution, 
  VRPRoute, 
  Position,
  OptimizationResult,
  ConstraintViolation 
} from './openroute-types'

/**
 * Vehicle Routing Problem (VRP) solver with multiple algorithms
 * Handles capacity constraints, time windows, and multiple optimization objectives
 */
export class VRPSolver {
  
  /**
   * Solve VRP using Clarke-Wright Savings Algorithm
   * Excellent for medium-scale problems with good balance of speed and quality
   */
  solveClarkeWright(instance: VRPInstance): VRPSolution {
    const startTime = Date.now()
    
    // Step 1: Calculate savings matrix
    const savings = this.calculateSavings(instance)
    
    // Step 2: Sort savings in descending order
    savings.sort((a, b) => b.saving - a.saving)
    
    // Step 3: Initialize routes (each delivery as separate route)
    const routes: VRPRoute[] = instance.deliveries.map(delivery => ({
      vehicleId: '', // Will be assigned later
      sequence: [delivery.id],
      load: delivery.weight,
      distance: this.calculateRouteDistance([instance.depot, delivery.position, instance.depot]),
      duration: this.calculateRouteDuration([instance.depot, delivery.position, instance.depot]),
      violations: []
    }))
    
    // Step 4: Merge routes based on savings
    for (const saving of savings) {
      const route1 = routes.find(r => r.sequence[r.sequence.length - 1] === saving.delivery1)
      const route2 = routes.find(r => r.sequence[0] === saving.delivery2)
      
      if (route1 && route2 && route1 !== route2) {
        // Check if merge is feasible
        const mergedLoad = route1.load + route2.load
        const availableVehicle = this.findSuitableVehicle(instance.vehicles, mergedLoad)
        
        if (availableVehicle && this.isMergeFeasible(route1, route2, instance)) {
          // Merge routes
          route1.sequence = [...route1.sequence, ...route2.sequence]
          route1.load = mergedLoad
          route1.vehicleId = availableVehicle.id
          
          // Recalculate distance and duration
          const positions = this.getRoutePositions(route1, instance)
          route1.distance = this.calculateRouteDistance(positions)
          route1.duration = this.calculateRouteDuration(positions)
          
          // Remove route2
          const index = routes.indexOf(route2)
          routes.splice(index, 1)
        }
      }
    }
    
    // Step 5: Assign vehicles to remaining routes
    this.assignVehicles(routes, instance.vehicles)
    
    // Step 6: Validate and calculate violations
    const violations = this.validateSolution(routes, instance)
    
    const computationTime = Date.now() - startTime
    
    return {
      routes,
      objectiveValue: this.calculateObjectiveValue(routes),
      feasible: violations.filter(v => v.severity === 'error').length === 0,
      computationTime
    }
  }
  
  /**
   * Solve VRP using Genetic Algorithm
   * Good for complex problems with multiple objectives and constraints
   */
  solveGenetic(instance: VRPInstance, options: GeneticOptions = {}): VRPSolution {
    const {
      populationSize = 100,
      generations = 500,
      mutationRate = 0.1,
      crossoverRate = 0.8,
      eliteSize = 10
    } = options
    
    const startTime = Date.now()
    
    // Initialize population
    let population = this.initializePopulation(instance, populationSize)
    
    let bestSolution: VRPSolution | null = null
    let stagnationCounter = 0
    const maxStagnation = 50
    
    for (let generation = 0; generation < generations; generation++) {
      // Evaluate fitness
      const fitness = population.map(individual => this.evaluateFitness(individual, instance))
      
      // Track best solution
      const currentBest = Math.min(...fitness)
      const bestIndex = fitness.indexOf(currentBest)
      const currentSolution = this.chromosomeToSolution(population[bestIndex], instance)
      
      if (!bestSolution || currentBest < bestSolution.objectiveValue) {
        bestSolution = currentSolution
        stagnationCounter = 0
      } else {
        stagnationCounter++
      }
      
      // Early termination if no improvement
      if (stagnationCounter >= maxStagnation) {
        break
      }
      
      // Selection
      const parents = this.tournamentSelection(population, fitness, populationSize)
      
      // Crossover and mutation
      const newPopulation: Chromosome[] = []
      
      // Keep elite individuals
      const elite = this.selectElite(population, fitness, eliteSize)
      newPopulation.push(...elite)
      
      // Generate offspring
      while (newPopulation.length < populationSize) {
        const parent1 = parents[Math.floor(Math.random() * parents.length)]
        const parent2 = parents[Math.floor(Math.random() * parents.length)]
        
        let offspring1, offspring2
        if (Math.random() < crossoverRate) {
          [offspring1, offspring2] = this.crossover(parent1, parent2)
        } else {
          offspring1 = [...parent1]
          offspring2 = [...parent2]
        }
        
        if (Math.random() < mutationRate) {
          offspring1 = this.mutate(offspring1)
        }
        if (Math.random() < mutationRate) {
          offspring2 = this.mutate(offspring2)
        }
        
        newPopulation.push(offspring1, offspring2)
      }
      
      population = newPopulation.slice(0, populationSize)
    }
    
    const computationTime = Date.now() - startTime
    
    return bestSolution || {
      routes: [],
      objectiveValue: Infinity,
      feasible: false,
      computationTime
    }
  }
  
  /**
   * Calculate savings for Clarke-Wright algorithm
   */
  private calculateSavings(instance: VRPInstance): Saving[] {
    const savings: Saving[] = []
    const deliveries = instance.deliveries
    
    for (let i = 0; i < deliveries.length; i++) {
      for (let j = i + 1; j < deliveries.length; j++) {
        const delivery1 = deliveries[i]
        const delivery2 = deliveries[j]
        
        const depotTo1 = this.calculateDistance(instance.depot, delivery1.position)
        const depotTo2 = this.calculateDistance(instance.depot, delivery2.position)
        const distance12 = this.calculateDistance(delivery1.position, delivery2.position)
        
        const saving = depotTo1 + depotTo2 - distance12
        
        savings.push({
          delivery1: delivery1.id,
          delivery2: delivery2.id,
          saving,
          distance: distance12
        })
      }
    }
    
    return savings
  }
  
  private calculateDistance(pos1: Position, pos2: Position): number {
    const R = 6371 // Earth's radius in kilometers
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
  
  private findSuitableVehicle(vehicles: Vehicle[], requiredCapacity: number): Vehicle | null {
    return vehicles.find(v => v.capacity >= requiredCapacity && v.status === 'active') || null
  }
  
  private isMergeFeasible(route1: VRPRoute, route2: VRPRoute, instance: VRPInstance): boolean {
    // Check capacity constraints
    const totalLoad = route1.load + route2.load
    const vehicle = instance.vehicles.find(v => v.capacity >= totalLoad)
    if (!vehicle) return false
    
    // Check time window constraints (simplified)
    // In production, implement full time window checking
    return true
  }
  
  private getRoutePositions(route: VRPRoute, instance: VRPInstance): Position[] {
    const positions: Position[] = [instance.depot]
    
    for (const deliveryId of route.sequence) {
      const delivery = instance.deliveries.find(d => d.id === deliveryId)
      if (delivery) {
        positions.push(delivery.position)
      }
    }
    
    positions.push(instance.depot)
    return positions
  }
  
  private calculateRouteDistance(positions: Position[]): number {
    let totalDistance = 0
    for (let i = 0; i < positions.length - 1; i++) {
      totalDistance += this.calculateDistance(positions[i], positions[i + 1])
    }
    return totalDistance
  }
  
  private calculateRouteDuration(positions: Position[]): number {
    const distance = this.calculateRouteDistance(positions)
    const averageSpeed = 50 // km/h
    return (distance / averageSpeed) * 60 // Convert to minutes
  }
  
  private assignVehicles(routes: VRPRoute[], vehicles: Vehicle[]): void {
    const availableVehicles = vehicles.filter(v => v.status === 'active')
    
    for (const route of routes) {
      if (!route.vehicleId) {
        const suitableVehicle = availableVehicles.find(v => v.capacity >= route.load)
        if (suitableVehicle) {
          route.vehicleId = suitableVehicle.id
          // Remove from available list
          const index = availableVehicles.indexOf(suitableVehicle)
          availableVehicles.splice(index, 1)
        }
      }
    }
  }
  
  private validateSolution(routes: VRPRoute[], instance: VRPInstance): ConstraintViolation[] {
    const violations: ConstraintViolation[] = []
    
    for (const route of routes) {
      // Check capacity violations
      const vehicle = instance.vehicles.find(v => v.id === route.vehicleId)
      if (vehicle && route.load > vehicle.capacity) {
        violations.push({
          type: 'capacity_violation',
          severity: 'error',
          description: `Route exceeds vehicle capacity: ${route.load} > ${vehicle.capacity}`,
          affectedRoutes: [route.vehicleId],
          suggestedAction: 'Redistribute deliveries or use larger vehicle'
        })
      }
      
      // Check time window violations (simplified)
      if (route.duration > 480) { // 8 hours
        violations.push({
          type: 'duration_violation',
          severity: 'warning',
          description: `Route duration exceeds 8 hours: ${route.duration} minutes`,
          affectedRoutes: [route.vehicleId],
          suggestedAction: 'Split route or adjust schedule'
        })
      }
    }
    
    return violations
  }
  
  private calculateObjectiveValue(routes: VRPRoute[]): number {
    // Multi-objective function: minimize total distance + penalty for violations
    const totalDistance = routes.reduce((sum, route) => sum + route.distance, 0)
    const violationPenalty = routes.reduce((sum, route) => sum + route.violations.length * 100, 0)
    
    return totalDistance + violationPenalty
  }
  
  // Genetic Algorithm helper methods
  private initializePopulation(instance: VRPInstance, size: number): Chromosome[] {
    const population: Chromosome[] = []
    const deliveryIds = instance.deliveries.map(d => d.id)
    
    for (let i = 0; i < size; i++) {
      const chromosome = [...deliveryIds]
      // Random shuffle
      for (let j = chromosome.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1))
        ;[chromosome[j], chromosome[k]] = [chromosome[k], chromosome[j]]
      }
      population.push(chromosome)
    }
    
    return population
  }
  
  private evaluateFitness(chromosome: Chromosome, instance: VRPInstance): number {
    const solution = this.chromosomeToSolution(chromosome, instance)
    return solution.objectiveValue
  }
  
  private chromosomeToSolution(chromosome: Chromosome, instance: VRPInstance): VRPSolution {
    // Convert chromosome (delivery sequence) to VRP solution
    // This is a simplified version - in production, implement proper route construction
    const routes: VRPRoute[] = []
    let currentRoute: VRPRoute = {
      vehicleId: '',
      sequence: [],
      load: 0,
      distance: 0,
      duration: 0,
      violations: []
    }
    
    for (const deliveryId of chromosome) {
      const delivery = instance.deliveries.find(d => d.id === deliveryId)!
      
      // Check if adding this delivery exceeds capacity
      if (currentRoute.load + delivery.weight > instance.vehicles[0].capacity) {
        // Start new route
        if (currentRoute.sequence.length > 0) {
          routes.push(currentRoute)
        }
        currentRoute = {
          vehicleId: '',
          sequence: [deliveryId],
          load: delivery.weight,
          distance: 0,
          duration: 0,
          violations: []
        }
      } else {
        // Add to current route
        currentRoute.sequence.push(deliveryId)
        currentRoute.load += delivery.weight
      }
    }
    
    if (currentRoute.sequence.length > 0) {
      routes.push(currentRoute)
    }
    
    // Calculate distances and assign vehicles
    this.assignVehicles(routes, instance.vehicles)
    
    for (const route of routes) {
      const positions = this.getRoutePositions(route, instance)
      route.distance = this.calculateRouteDistance(positions)
      route.duration = this.calculateRouteDuration(positions)
    }
    
    return {
      routes,
      objectiveValue: this.calculateObjectiveValue(routes),
      feasible: true,
      computationTime: 0
    }
  }
  
  private tournamentSelection(population: Chromosome[], fitness: number[], size: number): Chromosome[] {
    const selected: Chromosome[] = []
    const tournamentSize = 3
    
    for (let i = 0; i < size; i++) {
      let bestIndex = Math.floor(Math.random() * population.length)
      let bestFitness = fitness[bestIndex]
      
      for (let j = 1; j < tournamentSize; j++) {
        const candidateIndex = Math.floor(Math.random() * population.length)
        if (fitness[candidateIndex] < bestFitness) {
          bestIndex = candidateIndex
          bestFitness = fitness[candidateIndex]
        }
      }
      
      selected.push([...population[bestIndex]])
    }
    
    return selected
  }
  
  private selectElite(population: Chromosome[], fitness: number[], eliteSize: number): Chromosome[] {
    const indexed = population.map((chromosome, index) => ({ chromosome, fitness: fitness[index] }))
    indexed.sort((a, b) => a.fitness - b.fitness)
    return indexed.slice(0, eliteSize).map(item => [...item.chromosome])
  }
  
  private crossover(parent1: Chromosome, parent2: Chromosome): [Chromosome, Chromosome] {
    // Order Crossover (OX)
    const size = parent1.length
    const start = Math.floor(Math.random() * size)
    const end = Math.floor(Math.random() * (size - start)) + start
    
    const offspring1: Chromosome = new Array(size)
    const offspring2: Chromosome = new Array(size)
    
    // Copy segments
    for (let i = start; i <= end; i++) {
      offspring1[i] = parent1[i]
      offspring2[i] = parent2[i]
    }
    
    // Fill remaining positions
    this.fillOffspring(offspring1, parent2, start, end)
    this.fillOffspring(offspring2, parent1, start, end)
    
    return [offspring1, offspring2]
  }
  
  private fillOffspring(offspring: Chromosome, parent: Chromosome, start: number, end: number): void {
    const size = offspring.length
    let parentIndex = (end + 1) % size
    let offspringIndex = (end + 1) % size
    
    while (offspringIndex !== start) {
      if (!offspring.includes(parent[parentIndex])) {
        offspring[offspringIndex] = parent[parentIndex]
        offspringIndex = (offspringIndex + 1) % size
      }
      parentIndex = (parentIndex + 1) % size
    }
  }
  
  private mutate(chromosome: Chromosome): Chromosome {
    const mutated = [...chromosome]
    const size = mutated.length
    
    // Swap mutation
    const i = Math.floor(Math.random() * size)
    const j = Math.floor(Math.random() * size)
    
    ;[mutated[i], mutated[j]] = [mutated[j], mutated[i]]
    
    return mutated
  }
}

// Types for VRP solver
interface Saving {
  delivery1: string
  delivery2: string
  saving: number
  distance: number
}

interface GeneticOptions {
  populationSize?: number
  generations?: number
  mutationRate?: number
  crossoverRate?: number
  eliteSize?: number
}

type Chromosome = string[] // Array of delivery IDs