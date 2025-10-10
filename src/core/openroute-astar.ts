import { Position, Vehicle, Delivery, RouteSegment } from './openroute-types'

/**
 * A* pathfinding algorithm implementation for road networks
 * More efficient than Dijkstra for point-to-point routing with geographic heuristics
 */
export class AStarPathfinder {
  private nodes: Map<string, AStarNode> = new Map()
  private openSet: AStarNode[] = []
  private closedSet: Set<string> = new Set()

  constructor(private roadNetwork: RoadNetwork) {}

  /**
   * Find optimal path between two points using A* algorithm
   * @param start Starting coordinates
   * @param goal Target coordinates
   * @param vehicle Vehicle with specific constraints
   * @returns Optimal route with turn-by-turn directions
   */
  findPath(start: Position, goal: Position, vehicle?: Vehicle): RouteSegment[] {
    this.reset()
    
    const startNode = this.getOrCreateNode(this.positionToNodeId(start))
    const goalNode = this.getOrCreateNode(this.positionToNodeId(goal))
    
    startNode.gScore = 0
    startNode.fScore = this.heuristic(start, goal)
    startNode.position = start
    
    this.openSet.push(startNode)
    
    while (this.openSet.length > 0) {
      // Get node with lowest fScore
      const current = this.openSet.reduce((min, node) => 
        node.fScore < min.fScore ? node : min
      )
      
      if (current.id === goalNode.id) {
        return this.reconstructPath(current, goal)
      }
      
      this.removeFromOpenSet(current)
      this.closedSet.add(current.id)
      
      // Explore neighbors
      const neighbors = this.roadNetwork.getNeighbors(current.id, vehicle)
      
      for (const neighbor of neighbors) {
        if (this.closedSet.has(neighbor.id)) continue
        
        const tentativeGScore = current.gScore + neighbor.distance
        const neighborNode = this.getOrCreateNode(neighbor.id)
        
        if (!this.openSet.includes(neighborNode)) {
          this.openSet.push(neighborNode)
        } else if (tentativeGScore >= neighborNode.gScore) {
          continue
        }
        
        neighborNode.cameFrom = current
        neighborNode.gScore = tentativeGScore
        neighborNode.fScore = tentativeGScore + this.heuristic(neighbor.position, goal)
        neighborNode.position = neighbor.position
      }
    }
    
    throw new Error('No path found between start and goal')
  }
  
  /**
   * Geographic distance heuristic (Haversine formula)
   * Admissible heuristic for A* optimality guarantee
   */
  private heuristic(pos1: Position, pos2: Position): number {
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
  
  private positionToNodeId(position: Position): string {
    return `${position[0].toFixed(6)},${position[1].toFixed(6)}`
  }
  
  private getOrCreateNode(id: string): AStarNode {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, {
        id,
        gScore: Infinity,
        fScore: Infinity,
        cameFrom: null,
        position: [0, 0]
      })
    }
    return this.nodes.get(id)!
  }
  
  private removeFromOpenSet(node: AStarNode): void {
    const index = this.openSet.indexOf(node)
    if (index > -1) {
      this.openSet.splice(index, 1)
    }
  }
  
  private reconstructPath(goalNode: AStarNode, goalPosition: Position): RouteSegment[] {
    const path: RouteSegment[] = []
    let current: AStarNode | null = goalNode
    
    while (current && current.cameFrom) {
      const segment: RouteSegment = {
        start: current.cameFrom.position,
        end: current.position,
        distance: this.heuristic(current.cameFrom.position, current.position),
        duration: this.calculateDuration(current.cameFrom.position, current.position),
        instruction: this.generateInstruction(current.cameFrom.position, current.position)
      }
      path.unshift(segment)
      current = current.cameFrom
    }
    
    return path
  }
  
  private calculateDuration(start: Position, end: Position): number {
    const distance = this.heuristic(start, end)
    const averageSpeed = 50 // km/h - can be made dynamic based on road type
    return (distance / averageSpeed) * 60 // Convert to minutes
  }
  
  private generateInstruction(start: Position, end: Position): string {
    // Simplified instruction generation - in production, use road network data
    const bearing = this.calculateBearing(start, end)
    
    if (bearing >= 315 || bearing < 45) return 'Continue north'
    if (bearing >= 45 && bearing < 135) return 'Continue east'
    if (bearing >= 135 && bearing < 225) return 'Continue south'
    return 'Continue west'
  }
  
  private calculateBearing(start: Position, end: Position): number {
    const dLon = this.toRadians(end[1] - start[1])
    const lat1 = this.toRadians(start[0])
    const lat2 = this.toRadians(end[0])
    
    const y = Math.sin(dLon) * Math.cos(lat2)
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
    
    let bearing = Math.atan2(y, x) * (180 / Math.PI)
    return (bearing + 360) % 360
  }
  
  private reset(): void {
    this.nodes.clear()
    this.openSet = []
    this.closedSet.clear()
  }
}

interface AStarNode {
  id: string
  gScore: number      // Cost from start to this node
  fScore: number      // gScore + heuristic cost to goal
  cameFrom: AStarNode | null
  position: Position
}

interface RoadNetwork {
  getNeighbors(nodeId: string, vehicle?: Vehicle): RoadNode[]
}

interface RoadNode {
  id: string
  position: Position
  distance: number
  roadType?: 'highway' | 'arterial' | 'local' | 'service'
  speedLimit?: number
  restrictions?: string[]
}