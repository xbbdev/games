import * as THREE from 'three'

export interface RoadSegment {
  id: string
  start: THREE.Vector3
  end: THREE.Vector3
  direction: THREE.Vector3
  length: number
  laneWidth: number
  lanes: number // e.g. 2 lanes each way
  isEastWest: boolean
}

export interface Intersection {
  id: string
  center: THREE.Vector3
  radius: number
  trafficState: 'NS_GREEN' | 'NS_YELLOW' | 'EW_GREEN' | 'EW_YELLOW'
  timer: number
}

export interface Waypoint {
  id: string
  position: THREE.Vector3
  nextWaypointIds: string[]
  isSidewalk: boolean
}

export class RoadNetwork {
  public roadSegments: RoadSegment[] = []
  public intersections: Intersection[] = []
  public carWaypoints: Waypoint[] = []
  public pedestrianWaypoints: Waypoint[] = []

  // Grid configuration
  public readonly gridSize = 100 // Distance between street avenues
  public readonly streetWidth = 18 // Width of 4-lane avenue
  public readonly sidewalkWidth = 4 // Width of pedestrian sidewalk
  public readonly extent = 300 // From -300 to +300 (600m x 600m city)

  constructor() {
    this.buildRoadNetwork()
  }

  private buildRoadNetwork() {
    const coords: number[] = []
    for (let c = -this.extent + this.gridSize; c <= this.extent - this.gridSize; c += this.gridSize) {
      coords.push(c)
    }

    // 1. Create Intersections at all grid crossings
    for (const x of coords) {
      for (const z of coords) {
        this.intersections.push({
          id: `int_${x}_${z}`,
          center: new THREE.Vector3(x, 0.05, z),
          radius: this.streetWidth * 0.75,
          trafficState: (Math.abs(x + z) / this.gridSize) % 2 === 0 ? 'NS_GREEN' : 'EW_GREEN',
          timer: Math.random() * 8, // slight jitter for realism
        })
      }
    }

    // 2. Create Road Segments between intersections
    // East-West streets
    for (const z of coords) {
      for (let i = 0; i < coords.length - 1; i++) {
        const x1 = coords[i]
        const x2 = coords[i + 1]
        const start = new THREE.Vector3(x1, 0.05, z)
        const end = new THREE.Vector3(x2, 0.05, z)
        const dir = new THREE.Vector3().subVectors(end, start).normalize()
        const length = start.distanceTo(end)

        this.roadSegments.push({
          id: `road_ew_${x1}_${x2}_${z}`,
          start,
          end,
          direction: dir,
          length,
          laneWidth: 4.5,
          lanes: 4,
          isEastWest: true,
        })
      }
    }

    // North-South avenues
    for (const x of coords) {
      for (let i = 0; i < coords.length - 1; i++) {
        const z1 = coords[i]
        const z2 = coords[i + 1]
        const start = new THREE.Vector3(x, 0.05, z1)
        const end = new THREE.Vector3(x, 0.05, z2)
        const dir = new THREE.Vector3().subVectors(end, start).normalize()
        const length = start.distanceTo(end)

        this.roadSegments.push({
          id: `road_ns_${x}_${z1}_${z2}`,
          start,
          end,
          direction: dir,
          length,
          laneWidth: 4.5,
          lanes: 4,
          isEastWest: false,
        })
      }
    }

    // 3. Generate Waypoints for Autonomous Traffic & Pedestrians
    this.generateWaypoints(coords)
  }

  private generateWaypoints(coords: number[]) {
    // Generate driving waypoints in two opposite lanes on each road
    const laneOffset = 4.0 // offset from road center line

    for (const segment of this.roadSegments) {
      const { start, end, isEastWest } = segment

      // Lane A (Forward direction)
      const wpA1 = new THREE.Vector3()
      const wpA2 = new THREE.Vector3()

      // Lane B (Reverse direction)
      const wpB1 = new THREE.Vector3()
      const wpB2 = new THREE.Vector3()

      if (isEastWest) {
        // start is at x1, end is at x2
        wpA1.set(start.x + 12, 0.1, start.z - laneOffset)
        wpA2.set(end.x - 12, 0.1, end.z - laneOffset)

        wpB1.set(end.x - 12, 0.1, end.z + laneOffset)
        wpB2.set(start.x + 12, 0.1, start.z + laneOffset)
      } else {
        // North-South
        wpA1.set(start.x + laneOffset, 0.1, start.z + 12)
        wpA2.set(end.x + laneOffset, 0.1, end.z - 12)

        wpB1.set(end.x - laneOffset, 0.1, end.z - 12)
        wpB2.set(start.x - laneOffset, 0.1, start.z + 12)
      }

      const idA1 = `car_wp_${segment.id}_A1`
      const idA2 = `car_wp_${segment.id}_A2`
      const idB1 = `car_wp_${segment.id}_B1`
      const idB2 = `car_wp_${segment.id}_B2`

      this.carWaypoints.push(
        { id: idA1, position: wpA1, nextWaypointIds: [idA2], isSidewalk: false },
        { id: idA2, position: wpA2, nextWaypointIds: [], isSidewalk: false },
        { id: idB1, position: wpB1, nextWaypointIds: [idB2], isSidewalk: false },
        { id: idB2, position: wpB2, nextWaypointIds: [], isSidewalk: false }
      )
    }

    // Connect Car Waypoints at Intersections
    for (const intersection of this.intersections) {
      const nearWps = this.carWaypoints.filter(
        (wp) => wp.position.distanceTo(intersection.center) < intersection.radius + 15
      )

      // Connect endpoints to entrance points of continuing or turning roads
      for (const wp of nearWps) {
        if (wp.nextWaypointIds.length === 0) {
          // Find candidates that go away from intersection
          const candidates = nearWps.filter((other) => {
            if (other.id === wp.id) return false
            const dist = other.position.distanceTo(intersection.center)
            return dist > 5 && other.nextWaypointIds.length > 0
          })

          candidates.forEach((c) => {
            if (!wp.nextWaypointIds.includes(c.id)) {
              wp.nextWaypointIds.push(c.id)
            }
          })
        }
      }
    }

    // 4. Generate Pedestrian Sidewalk Waypoints along city blocks
    const sidewalkOffset = this.streetWidth / 2 + 2.0
    for (const x of coords) {
      for (const z of coords) {
        // 4 corners around each intersection
        const corners = [
          new THREE.Vector3(x + sidewalkOffset, 0.25, z + sidewalkOffset),
          new THREE.Vector3(x - sidewalkOffset, 0.25, z + sidewalkOffset),
          new THREE.Vector3(x - sidewalkOffset, 0.25, z - sidewalkOffset),
          new THREE.Vector3(x + sidewalkOffset, 0.25, z - sidewalkOffset),
        ]

        corners.forEach((pos, idx) => {
          const id = `ped_wp_${x}_${z}_${idx}`
          this.pedestrianWaypoints.push({
            id,
            position: pos,
            nextWaypointIds: [],
            isSidewalk: true,
          })
        })
      }
    }

    // Link pedestrian waypoints along sidewalks
    for (let i = 0; i < this.pedestrianWaypoints.length; i++) {
      const p1 = this.pedestrianWaypoints[i]
      for (let j = 0; j < this.pedestrianWaypoints.length; j++) {
        if (i === j) continue
        const p2 = this.pedestrianWaypoints[j]
        const dist = p1.position.distanceTo(p2.position)
        // Link neighbors along the block (approx gridSize - streetWidth)
        if (dist > 10 && dist < this.gridSize - 5) {
          // Check if parallel to axis
          const dx = Math.abs(p1.position.x - p2.position.x)
          const dz = Math.abs(p1.position.z - p2.position.z)
          if (dx < 3 || dz < 3) {
            p1.nextWaypointIds.push(p2.id)
          }
        }
      }
    }
  }

  // Update traffic lights logic
  public update(deltaTime: number) {
    const cycleTime = 12.0 // 12 seconds per phase
    const yellowTime = 2.5

    for (const int of this.intersections) {
      int.timer += deltaTime
      if (int.trafficState === 'NS_GREEN' && int.timer > cycleTime) {
        int.trafficState = 'NS_YELLOW'
        int.timer = 0
      } else if (int.trafficState === 'NS_YELLOW' && int.timer > yellowTime) {
        int.trafficState = 'EW_GREEN'
        int.timer = 0
      } else if (int.trafficState === 'EW_GREEN' && int.timer > cycleTime) {
        int.trafficState = 'EW_YELLOW'
        int.timer = 0
      } else if (int.trafficState === 'EW_YELLOW' && int.timer > yellowTime) {
        int.trafficState = 'NS_GREEN'
        int.timer = 0
      }
    }
  }

  // Find nearest driving waypoint
  public getNearestCarWaypoint(pos: THREE.Vector3): Waypoint | null {
    let best: Waypoint | null = null
    let bestDist = Infinity
    for (const wp of this.carWaypoints) {
      const dist = pos.distanceTo(wp.position)
      if (dist < bestDist) {
        bestDist = dist
        best = wp
      }
    }
    return best
  }

  // Find nearest pedestrian waypoint
  public getNearestPedestrianWaypoint(pos: THREE.Vector3): Waypoint | null {
    let best: Waypoint | null = null
    let bestDist = Infinity
    for (const wp of this.pedestrianWaypoints) {
      const dist = pos.distanceTo(wp.position)
      if (dist < bestDist) {
        bestDist = dist
        best = wp
      }
    }
    return best
  }
}
