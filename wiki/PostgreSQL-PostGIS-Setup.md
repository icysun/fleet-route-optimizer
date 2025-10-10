# PostgreSQL + PostGIS Setup

Complete guide to setting up the spatial database backend for Fleet Route Optimizer.

## 🎯 Overview

Fleet Route Optimizer uses **PostgreSQL 15** with **PostGIS 3.3** extensions to provide enterprise-grade spatial database capabilities. This setup enables:

- ✅ **Geographic calculations** with meter-precision accuracy
- ✅ **Spatial indexing** for high-performance queries
- ✅ **Complex spatial operations** for route optimization
- ✅ **Standards compliance** with OGC spatial standards

## 🗄️ Database Architecture

### Core Spatial Tables

```sql
-- Vehicles with real-time geographic locations
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    capacity_kg INTEGER NOT NULL,
    current_location GEOMETRY(POINT, 4326),  -- PostGIS spatial column
    status VARCHAR(20) DEFAULT 'available',
    driver_name VARCHAR(100),
    fuel_type VARCHAR(20) DEFAULT 'diesel',
    fuel_level INTEGER DEFAULT 100,
    max_range INTEGER DEFAULT 500,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Deliveries with pickup and delivery coordinates
CREATE TABLE deliveries (
    id SERIAL PRIMARY KEY,
    pickup_location GEOMETRY(POINT, 4326),    -- PostGIS pickup point
    delivery_location GEOMETRY(POINT, 4326),  -- PostGIS delivery point
    pickup_address TEXT,
    delivery_address TEXT NOT NULL,
    weight_kg DECIMAL(10,2) NOT NULL,
    volume_m3 DECIMAL(10,2),
    priority INTEGER DEFAULT 1,
    time_window_start TIME,
    time_window_end TIME,
    status VARCHAR(20) DEFAULT 'pending',
    assigned_vehicle_id INTEGER REFERENCES vehicles(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Optimized routes with spatial data
CREATE TABLE routes (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    route_data JSONB,  -- Complete route information
    route_geometry GEOMETRY(LINESTRING, 4326),  -- Spatial route path
    optimization_algorithm VARCHAR(50),
    total_distance DECIMAL(10,2),
    total_duration INTEGER,
    status VARCHAR(20) DEFAULT 'planned',
    created_at TIMESTAMP DEFAULT NOW()
);

-- GPS tracking with spatial history
CREATE TABLE gps_tracking (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    location GEOMETRY(POINT, 4326),  -- Real-time GPS coordinates
    speed_kmh DECIMAL(5,2),
    heading INTEGER,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Route deviations and incidents
CREATE TABLE route_deviations (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    planned_location GEOMETRY(POINT, 4326),
    actual_location GEOMETRY(POINT, 4326),
    deviation_distance DECIMAL(10,2),
    incident_type VARCHAR(50),
    description TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

### Spatial Indexes for Performance

```sql
-- High-performance spatial indices using GIST
CREATE INDEX idx_vehicles_location ON vehicles USING GIST (current_location);
CREATE INDEX idx_deliveries_pickup ON deliveries USING GIST (pickup_location);
CREATE INDEX idx_deliveries_delivery ON deliveries USING GIST (delivery_location);
CREATE INDEX idx_routes_geometry ON routes USING GIST (route_geometry);
CREATE INDEX idx_gps_tracking_location ON gps_tracking USING GIST (location);

-- Composite indices for complex queries
CREATE INDEX idx_gps_tracking_vehicle_time ON gps_tracking (vehicle_id, timestamp);
CREATE INDEX idx_deliveries_status_priority ON deliveries (status, priority);
```

## 🚀 PostGIS Extensions

### Required Extensions
```sql
-- Enable PostGIS spatial capabilities
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder;
```

### Verify Installation
```sql
-- Check PostGIS version and capabilities
SELECT PostGIS_Version();
SELECT PostGIS_Full_Version();

-- Verify spatial reference systems
SELECT srid, auth_name, auth_srid, srtext 
FROM spatial_ref_sys 
WHERE srid = 4326;
```

## 📍 Spatial Data Types

### GEOMETRY vs GEOGRAPHY

```sql
-- GEOMETRY: Planar coordinates (faster, less accurate over long distances)
ALTER TABLE vehicles 
ADD COLUMN location_planar GEOMETRY(POINT, 4326);

-- GEOGRAPHY: Spherical coordinates (slower, more accurate)
ALTER TABLE vehicles 
ADD COLUMN location_spherical GEOGRAPHY(POINT, 4326);

-- Distance comparison
SELECT 
    -- Planar distance (degrees)
    ST_Distance(
        ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326),
        ST_SetSRID(ST_MakePoint(-122.4094, 37.7849), 4326)
    ) as planar_distance,
    
    -- Spherical distance (meters)
    ST_Distance(
        ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography,
        ST_SetSRID(ST_MakePoint(-122.4094, 37.7849), 4326)::geography
    ) as spherical_distance_meters;
```

## 🔧 Essential Spatial Queries

### Distance Calculations
```sql
-- Calculate distance between vehicles and deliveries
SELECT 
    v.name as vehicle_name,
    d.delivery_address,
    ST_Distance(
        v.current_location::geography,
        d.delivery_location::geography
    ) / 1000 as distance_km
FROM vehicles v
CROSS JOIN deliveries d
WHERE v.status = 'available' 
  AND d.status = 'pending'
ORDER BY distance_km;

-- Find nearest vehicles to delivery locations
SELECT DISTINCT ON (d.id)
    d.id as delivery_id,
    d.delivery_address,
    v.name as nearest_vehicle,
    ST_Distance(
        v.current_location::geography,
        d.delivery_location::geography
    ) / 1000 as distance_km
FROM deliveries d
CROSS JOIN vehicles v
WHERE d.status = 'pending' 
  AND v.status = 'available'
ORDER BY d.id, distance_km;
```

### Proximity Searches
```sql
-- Find all deliveries within 10km of a vehicle
SELECT 
    d.delivery_address,
    d.weight_kg,
    ST_Distance(
        v.current_location::geography,
        d.delivery_location::geography
    ) / 1000 as distance_km
FROM vehicles v, deliveries d
WHERE v.name = 'Truck-001'
  AND ST_DWithin(
    v.current_location::geography,
    d.delivery_location::geography,
    10000  -- 10km in meters
  )
ORDER BY distance_km;

-- Find vehicles within service area
SELECT 
    v.name,
    v.type,
    v.capacity_kg
FROM vehicles v
WHERE ST_Within(
    v.current_location,
    ST_GeomFromText('POLYGON((-122.5 37.7, -122.3 37.7, -122.3 37.8, -122.5 37.8, -122.5 37.7))', 4326)
);
```

### Route Analysis
```sql
-- Calculate total route distances
SELECT 
    vehicle_id,
    optimization_algorithm,
    total_distance,
    ST_Length(route_geometry::geography) / 1000 as calculated_distance_km
FROM routes
WHERE status = 'active';

-- Analyze route efficiency
WITH route_stats AS (
    SELECT 
        r.vehicle_id,
        COUNT(d.id) as delivery_count,
        SUM(d.weight_kg) as total_weight,
        r.total_distance,
        v.capacity_kg
    FROM routes r
    JOIN vehicles v ON r.vehicle_id = v.id
    LEFT JOIN deliveries d ON d.assigned_vehicle_id = v.id
    GROUP BY r.vehicle_id, r.total_distance, v.capacity_kg
)
SELECT 
    vehicle_id,
    delivery_count,
    total_weight,
    capacity_kg,
    (total_weight::float / capacity_kg * 100) as capacity_utilization_pct,
    (total_distance / delivery_count) as distance_per_delivery
FROM route_stats
ORDER BY capacity_utilization_pct DESC;
```

## 🏗️ Advanced Spatial Operations

### Buffer Operations
```sql
-- Create service areas around vehicles
SELECT 
    v.name,
    ST_AsGeoJSON(ST_Buffer(v.current_location::geography, 5000)::geometry) as service_area_5km
FROM vehicles v
WHERE v.status = 'available';

-- Find overlapping service areas
SELECT 
    v1.name as vehicle1,
    v2.name as vehicle2,
    ST_Area(
        ST_Intersection(
            ST_Buffer(v1.current_location::geography, 5000),
            ST_Buffer(v2.current_location::geography, 5000)
        )
    ) / 1000000 as overlap_area_km2
FROM vehicles v1, vehicles v2
WHERE v1.id < v2.id
  AND ST_DWithin(v1.current_location::geography, v2.current_location::geography, 10000);
```

### Spatial Aggregations
```sql
-- Calculate fleet coverage area
SELECT 
    ST_Area(ST_ConvexHull(ST_Collect(current_location))::geography) / 1000000 as coverage_area_km2,
    ST_AsText(ST_Centroid(ST_Collect(current_location))) as fleet_center
FROM vehicles
WHERE current_location IS NOT NULL;

-- Delivery density analysis
SELECT 
    ST_AsText(ST_SnapToGrid(delivery_location, 0.01)) as grid_cell,
    COUNT(*) as delivery_count,
    AVG(weight_kg) as avg_weight
FROM deliveries
WHERE delivery_location IS NOT NULL
GROUP BY ST_SnapToGrid(delivery_location, 0.01)
HAVING COUNT(*) > 1
ORDER BY delivery_count DESC;
```

## 🔍 Spatial Indexing Strategy

### Index Types and Performance
```sql
-- GIST index for general spatial queries
CREATE INDEX idx_vehicles_location_gist ON vehicles USING GIST (current_location);

-- SPGIST index for point data (alternative)
CREATE INDEX idx_deliveries_location_spgist ON deliveries USING SPGIST (delivery_location);

-- Partial indices for active data
CREATE INDEX idx_active_vehicles_location ON vehicles USING GIST (current_location)
WHERE status IN ('available', 'en_route');

CREATE INDEX idx_pending_deliveries_location ON deliveries USING GIST (delivery_location)
WHERE status = 'pending';
```

### Query Optimization
```sql
-- Use EXPLAIN ANALYZE to check query performance
EXPLAIN ANALYZE
SELECT v.name, d.delivery_address
FROM vehicles v, deliveries d
WHERE ST_DWithin(v.current_location::geography, d.delivery_location::geography, 5000)
  AND v.status = 'available'
  AND d.status = 'pending';

-- Enable parallel processing for large datasets
SET max_parallel_workers_per_gather = 4;
SET parallel_tuple_cost = 0.1;
SET parallel_setup_cost = 1000;
```

## 📊 Database Views for Analytics

### Fleet Performance View
```sql
CREATE VIEW fleet_performance AS
SELECT 
    v.id,
    v.name,
    v.type,
    v.capacity_kg,
    COUNT(d.id) as total_deliveries,
    SUM(d.weight_kg) as total_weight_delivered,
    AVG(ST_Distance(d.pickup_location::geography, d.delivery_location::geography)) / 1000 as avg_delivery_distance_km,
    SUM(r.total_distance) as total_distance_traveled
FROM vehicles v
LEFT JOIN deliveries d ON d.assigned_vehicle_id = v.id
LEFT JOIN routes r ON r.vehicle_id = v.id
GROUP BY v.id, v.name, v.type, v.capacity_kg;
```

### Spatial Analytics View
```sql
CREATE VIEW spatial_analytics AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as delivery_count,
    AVG(weight_kg) as avg_weight,
    ST_AsText(ST_Centroid(ST_Collect(delivery_location))) as delivery_center,
    ST_Area(ST_ConvexHull(ST_Collect(delivery_location))::geography) / 1000000 as coverage_area_km2
FROM deliveries
WHERE delivery_location IS NOT NULL
GROUP BY DATE(created_at)
ORDER BY date;
```

## 🔧 Maintenance and Optimization

### Regular Maintenance Tasks
```sql
-- Update table statistics
ANALYZE vehicles;
ANALYZE deliveries;
ANALYZE routes;

-- Reindex spatial indices
REINDEX INDEX idx_vehicles_location;
REINDEX INDEX idx_deliveries_pickup;
REINDEX INDEX idx_deliveries_delivery;

-- Clean up old GPS tracking data
DELETE FROM gps_tracking 
WHERE timestamp < NOW() - INTERVAL '30 days';
```

### Performance Monitoring
```sql
-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Monitor spatial query performance
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
WHERE query LIKE '%ST_%'
ORDER BY total_time DESC;
```

## 🌐 Connection Configuration

### Docker Compose Setup
```yaml
postgres:
  image: postgis/postgis:15-3.3
  environment:
    POSTGRES_DB: fleet_optimizer
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: fleet123
  ports:
    - "5432:5432"
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
```

### Connection Parameters
```javascript
// Node.js connection with PostGIS support
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'fleet_optimizer',
  user: 'postgres',
  password: 'fleet123',
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## 🔒 Security Best Practices

### Database Security
```sql
-- Create application-specific user
CREATE USER fleet_app WITH PASSWORD 'secure_password';

-- Grant minimal required permissions
GRANT CONNECT ON DATABASE fleet_optimizer TO fleet_app;
GRANT USAGE ON SCHEMA public TO fleet_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO fleet_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO fleet_app;

-- Enable row-level security if needed
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY vehicle_access ON vehicles FOR ALL TO fleet_app;
```

### Connection Security
```bash
# Use SSL connections in production
export PGSSLMODE=require
export PGSSLCERT=client-cert.pem
export PGSSLKEY=client-key.pem
export PGSSLROOTCERT=ca-cert.pem
```

## 🚀 Next Steps

- **[Database Schema](Database-Schema)** - Complete table relationships
- **[Spatial Queries](Spatial-Queries)** - Advanced PostGIS operations
- **[Performance Tuning](Performance-Tuning)** - Optimization for scale
- **[Backup and Recovery](Database-Backup-Recovery)** - Data protection strategies

---

**🎯 Ready to leverage the power of spatial databases for fleet optimization!** The PostgreSQL + PostGIS setup provides the foundation for accurate, high-performance geographic calculations that make Fleet Route Optimizer a world-class solution.