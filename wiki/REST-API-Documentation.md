# REST API Documentation

Complete reference for the Fleet Route Optimizer REST API with PostgreSQL + PostGIS backend.

## 🔗 Base URL

```
http://localhost:3001/api
```

## 🔐 Authentication

Currently, the API uses open access for development. In production, implement JWT tokens:

```javascript
// Future authentication header
Authorization: Bearer <jwt_token>
```

## 📊 Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "timestamp": "2025-10-10T14:42:34.412Z",
    "version": "1.0.0",
    "requestId": "req_123456"
  }
}
```

## 🚚 Vehicles API

### Get All Vehicles
Retrieve all vehicles from the PostgreSQL database with spatial coordinates.

```http
GET /api/vehicles
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Truck-001",
      "vehicleType": "truck",
      "capacity": 2000,
      "position": [37.7749, -122.4194],
      "status": "available",
      "driverName": "John Doe",
      "currentLoad": 850,
      "fuelLevel": 85,
      "maxRange": 500
    }
  ],
  "count": 3
}
```

### Add New Vehicle
Add a vehicle to the PostgreSQL database with PostGIS location storage.

```http
POST /api/vehicles
```

**Request Body:**
```json
{
  "name": "Truck-004",
  "vehicleType": "truck",
  "capacity": 2000,
  "position": [37.7749, -122.4194],
  "driverName": "Jane Smith"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "4",
    "name": "Truck-004",
    "vehicleType": "truck",
    "capacity": 2000,
    "position": [37.7749, -122.4194],
    "status": "available"
  }
}
```

### Update Vehicle Location
Update vehicle GPS coordinates using PostGIS spatial operations.

```http
PATCH /api/vehicles/{id}/location
```

**Request Body:**
```json
{
  "position": [37.7849, -122.4094],
  "speed": 45.5,
  "heading": 180,
  "timestamp": "2025-10-10T14:42:34.412Z"
}
```

## 📦 Deliveries API

### Get All Deliveries
Retrieve deliveries with pickup and delivery coordinates from PostGIS.

```http
GET /api/deliveries
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "pickupLocation": [37.7749, -122.4194],
      "position": [37.7849, -122.4094],
      "pickupAddress": "Distribution Center",
      "address": "456 Mission St, San Francisco",
      "weight": 100,
      "priority": "medium",
      "timeWindow": {
        "start": "09:00",
        "end": "17:00"
      },
      "status": "pending"
    }
  ],
  "count": 5
}
```

### Create New Delivery
Add delivery with PostGIS coordinate storage.

```http
POST /api/deliveries
```

**Request Body:**
```json
{
  "pickupAddress": "Warehouse A",
  "address": "123 Market St, San Francisco",
  "pickupLocation": [37.7749, -122.4194],
  "position": [37.7849, -122.4094],
  "weight": 50,
  "priority": "high",
  "timeWindow": {
    "start": "10:00",
    "end": "16:00"
  }
}
```

## 🎯 Route Optimization API

### Optimize Routes
Run VRP algorithms with PostGIS spatial calculations.

```http
POST /api/optimize
```

**Request Body:**
```json
{
  "algorithm": "clarke-wright",
  "constraints": {
    "maxDistance": 100,
    "timeWindows": true,
    "capacityLimits": true,
    "maxRouteDistance": 150
  },
  "objectives": [
    "minimize_distance",
    "minimize_time",
    "maximize_efficiency"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "routes": [
      {
        "vehicleId": "1",
        "sequence": ["delivery_1", "delivery_3", "delivery_5"],
        "deliveries": [...],
        "load": 350,
        "distance": 45.2,
        "duration": 180,
        "violations": []
      }
    ],
    "totalDistance": 120.5,
    "totalDuration": 480,
    "feasible": true,
    "optimizationInfo": {
      "algorithm": "clarke-wright",
      "iterations": 150,
      "converged": true,
      "executionTime": 1250
    }
  },
  "metadata": {
    "algorithm": "clarke-wright",
    "optimizationTime": 1250,
    "vehiclesUsed": 3,
    "deliveriesOptimized": 8,
    "databaseStored": true,
    "cacheStored": true
  }
}
```

### Get Optimization History
Retrieve past optimization results from database.

```http
GET /api/optimization/history
```

**Query Parameters:**
- `limit` (number): Maximum results to return
- `algorithm` (string): Filter by algorithm type
- `startDate` (string): Start date filter (ISO 8601)
- `endDate` (string): End date filter (ISO 8601)

## 📊 Fleet Analytics API

### Fleet Statistics
Get comprehensive fleet statistics with PostGIS spatial analysis.

```http
GET /api/fleet/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalVehicles": 10,
    "activeVehicles": 8,
    "totalDeliveries": 45,
    "pendingDeliveries": 12,
    "utilizationRate": 85,
    "averageCapacity": 1200,
    "coverageArea": 250.5,
    "performance": {
      "avgDeliveryTime": 35,
      "avgDistance": 12.5,
      "fuelEfficiency": 8.2
    }
  }
}
```

### Vehicle Performance
Get individual vehicle performance metrics.

```http
GET /api/vehicles/{id}/performance
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vehicleId": "1",
    "totalDeliveries": 15,
    "totalDistance": 485.2,
    "averageSpeed": 42.5,
    "fuelConsumption": 58.6,
    "utilizationRate": 78,
    "onTimePerformance": 94.2,
    "lastMaintenance": "2025-09-15",
    "nextMaintenance": "2025-11-15"
  }
}
```

## 🗺️ Spatial Analysis API

### Proximity Search
Find deliveries within radius of a vehicle using PostGIS.

```http
GET /api/spatial/proximity
```

**Query Parameters:**
- `vehicleId` (string): Vehicle ID for center point
- `radius` (number): Search radius in kilometers
- `deliveryStatus` (string): Filter by delivery status

**Response:**
```json
{
  "success": true,
  "data": {
    "centerPoint": [37.7749, -122.4194],
    "radius": 10,
    "deliveries": [
      {
        "id": "5",
        "address": "Market St, San Francisco",
        "distance": 2.5,
        "weight": 25,
        "priority": "medium"
      }
    ]
  }
}
```

### Distance Matrix
Calculate distance matrix between locations using PostGIS.

```http
POST /api/spatial/distance-matrix
```

**Request Body:**
```json
{
  "origins": [
    [37.7749, -122.4194],
    [37.7849, -122.4094]
  ],
  "destinations": [
    [37.7649, -122.4294],
    [37.7949, -122.3994]
  ],
  "units": "kilometers"
}
```

## 📍 GPS Tracking API

### Update Vehicle Location
Real-time GPS coordinate updates with PostGIS storage.

```http
POST /api/tracking/update
```

**Request Body:**
```json
{
  "vehicleId": "1",
  "location": [37.7749, -122.4194],
  "speed": 45.5,
  "heading": 180,
  "timestamp": "2025-10-10T14:42:34.412Z",
  "accuracy": 3.2
}
```

### Get Vehicle Track History
Retrieve GPS tracking history from PostGIS.

```http
GET /api/tracking/{vehicleId}/history
```

**Query Parameters:**
- `startTime` (string): Start time (ISO 8601)
- `endTime` (string): End time (ISO 8601)
- `limit` (number): Maximum points to return

## 🔄 Real-time Events API

### Get Live Fleet Status
Current status of all vehicles and deliveries.

```http
GET /api/live/fleet-status
```

### Route Deviations
Get route deviations and incidents.

```http
GET /api/live/deviations
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "vehicleId": "2",
      "plannedLocation": [37.7749, -122.4194],
      "actualLocation": [37.7759, -122.4184],
      "deviationDistance": 1.2,
      "incidentType": "traffic_delay",
      "description": "Traffic congestion on Market St",
      "timestamp": "2025-10-10T14:42:34.412Z"
    }
  ]
}
```

## 🏥 System Health API

### Health Check
Comprehensive system health including database connections.

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-10T14:42:34.412Z",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "postGIS": "3.3 USE_GEOS=1 USE_PROJ=1 USE_STATS=1",
    "redis": "connected",
    "vrp": "operational",
    "pathfinding": "operational",
    "realtime": "operational"
  },
  "performance": {
    "uptime": 86400,
    "memoryUsage": 245.6,
    "cpuUsage": 15.2,
    "databaseConnections": 8
  }
}
```

## 📝 Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid vehicle capacity",
    "details": {
      "field": "capacity",
      "value": -100,
      "constraint": "must be positive"
    }
  },
  "requestId": "req_123456"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `NOT_FOUND` | 404 | Resource not found |
| `DATABASE_ERROR` | 500 | Database connection or query error |
| `OPTIMIZATION_FAILED` | 500 | Route optimization algorithm failed |
| `SPATIAL_ERROR` | 500 | PostGIS spatial operation error |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |

## 🔧 Rate Limiting

### Default Limits
- **General API**: 1000 requests per hour per IP
- **Optimization API**: 60 requests per hour per IP
- **GPS Tracking**: 3600 requests per hour per vehicle

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1633024800
```

## 📊 Pagination

### Query Parameters
```http
GET /api/deliveries?page=2&limit=50&sort=created_at&order=desc
```

### Response Format
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 234,
    "pages": 5,
    "hasNext": true,
    "hasPrev": true
  }
}
```

## 🔍 Filtering and Sorting

### Advanced Filtering
```http
GET /api/vehicles?status=available&type=truck&capacity_gte=1000
```

### Spatial Filtering
```http
GET /api/deliveries?within_radius=37.7749,-122.4194,10km&status=pending
```

### Date Range Filtering
```http
GET /api/routes?created_after=2025-10-01&created_before=2025-10-31
```

## 🌐 WebSocket Events

### Connection
```javascript
const ws = new WebSocket('ws://localhost:3002');
```

### Event Types
- `fleet_status` - Complete fleet status update
- `vehicle_location` - Individual vehicle GPS update
- `route_optimized` - New optimization completed
- `delivery_assigned` - Delivery assigned to vehicle
- `incident_reported` - Route deviation or incident

## 📈 Performance Tips

### Database Optimization
- Use spatial indices for location-based queries
- Implement connection pooling
- Cache frequently accessed data in Redis

### API Best Practices
- Use pagination for large datasets
- Implement proper error handling
- Use compression for large responses
- Monitor API performance with metrics

---

**🔗 Integration Examples:**
- [**JavaScript SDK**](JavaScript-SDK) - Client library
- [**Python Integration**](Python-Integration) - Server-side integration
- [**Mobile Apps**](Mobile-Integration) - iOS/Android development
- [**Webhook Configuration**](Webhook-Configuration) - Event-driven updates