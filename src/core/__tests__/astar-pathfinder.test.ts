import { AStarPathfinder } from '../openroute-astar'
import { Position } from '../openroute-types'

// Minimal in-memory road network implementing required interface
interface RoadNode { id: string; position: Position; distance: number }
interface RoadNetwork { getNeighbors(nodeId: string): RoadNode[] }

function makeRoadNetwork(edges: Array<[string, string, number]>, coords: Record<string, Position>): RoadNetwork {
  const adjacency: Record<string, RoadNode[]> = {}
  for (const [from, to, dist] of edges) {
    if (!adjacency[from]) adjacency[from] = []
    adjacency[from].push({ id: to, position: coords[to], distance: dist })
  }
  return {
    getNeighbors(nodeId: string) {
      return adjacency[nodeId] || []
    }
  }
}

describe('AStarPathfinder', () => {
  const coords: Record<string, Position> = {
    a: [40, -74],
    b: [40.01, -74.01],
    c: [40.02, -74.02]
  }

  it('finds a path between connected nodes', () => {
    const network = makeRoadNetwork([
      ['40.000000,-74.000000', '40.010000,-74.010000', 1.5],
      ['40.010000,-74.010000', '40.020000,-74.020000', 1.5]
    ], {
      '40.000000,-74.000000': coords.a,
      '40.010000,-74.010000': coords.b,
      '40.020000,-74.020000': coords.c
    })
    const pf = new AStarPathfinder(network as any)
    const path = pf.findPath(coords.a, coords.c)
    expect(path.length).toBeGreaterThan(0)
    expect(path[0].start).toEqual(coords.a)
    expect(path[path.length - 1].end).toEqual(coords.c)
  })

  it('throws when no path exists', () => {
    const network = makeRoadNetwork([], {})
    const pf = new AStarPathfinder(network as any)
    expect(() => pf.findPath(coords.a, coords.c)).toThrow()
  })
})
