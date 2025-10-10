-- Initialize Fleet Route Optimizer Database
-- This script runs when the PostgreSQL container starts

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Create main tables for Fleet Route Optimizer

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) DEFAULT 'truck',
    capacity_kg INTEGER DEFAULT 1000,
    fuel_type VARCHAR(50) DEFAULT 'diesel',
    current_location GEOMETRY(POINT, 4326),
    status VARCHAR(50) DEFAULT 'available',
    driver_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
    id SERIAL PRIMARY KEY,
    pickup_location GEOMETRY(POINT, 4326) NOT NULL,
    delivery_location GEOMETRY(POINT, 4326) NOT NULL,
    pickup_address TEXT,
    delivery_address TEXT,
    weight_kg INTEGER DEFAULT 0,
    priority INTEGER DEFAULT 1,
    time_window_start TIMESTAMP,
    time_window_end TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    assigned_vehicle_id INTEGER REFERENCES vehicles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id) NOT NULL,
    route_data JSONB NOT NULL,
    total_distance_km DECIMAL(10,2),
    estimated_duration_minutes INTEGER,
    optimization_algorithm VARCHAR(100),
    status VARCHAR(50) DEFAULT 'planned',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GPS tracking table
CREATE TABLE IF NOT EXISTS gps_tracking (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id) NOT NULL,
    location GEOMETRY(POINT, 4326) NOT NULL,
    speed_kmh DECIMAL(5,2),
    heading_degrees INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accuracy_meters DECIMAL(8,2)
);

-- Route deviations table
CREATE TABLE IF NOT EXISTS route_deviations (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id) NOT NULL,
    route_id INTEGER REFERENCES routes(id) NOT NULL,
    deviation_distance_meters DECIMAL(10,2),
    deviation_location GEOMETRY(POINT, 4326),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON vehicles USING GIST(current_location);
CREATE INDEX IF NOT EXISTS idx_deliveries_pickup ON deliveries USING GIST(pickup_location);
CREATE INDEX IF NOT EXISTS idx_deliveries_delivery ON deliveries USING GIST(delivery_location);
CREATE INDEX IF NOT EXISTS idx_gps_tracking_vehicle_time ON gps_tracking(vehicle_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_gps_tracking_location ON gps_tracking USING GIST(location);

-- Insert sample data for development
INSERT INTO vehicles (name, type, capacity_kg, fuel_type, current_location, driver_name) VALUES
('Truck-001', 'truck', 2000, 'diesel', ST_GeomFromText('POINT(-122.4194 37.7749)', 4326), 'John Smith'),
('Van-001', 'van', 800, 'petrol', ST_GeomFromText('POINT(-122.4094 37.7849)', 4326), 'Jane Doe'),
('Motorcycle-001', 'motorcycle', 50, 'petrol', ST_GeomFromText('POINT(-122.4294 37.7649)', 4326), 'Mike Johnson')
ON CONFLICT DO NOTHING;

INSERT INTO deliveries (pickup_location, delivery_location, pickup_address, delivery_address, weight_kg, priority) VALUES
(ST_GeomFromText('POINT(-122.4194 37.7749)', 4326), ST_GeomFromText('POINT(-122.4094 37.7849)', 4326), '123 Market St, San Francisco', '456 Mission St, San Francisco', 100, 1),
(ST_GeomFromText('POINT(-122.4094 37.7849)', 4326), ST_GeomFromText('POINT(-122.3994 37.7949)', 4326), '789 Powell St, San Francisco', '321 Union St, San Francisco', 150, 2),
(ST_GeomFromText('POINT(-122.3994 37.7949)', 4326), ST_GeomFromText('POINT(-122.4294 37.7649)', 4326), '654 Lombard St, San Francisco', '987 Pier 39, San Francisco', 75, 1)
ON CONFLICT DO NOTHING;

-- Create a view for easier querying
CREATE OR REPLACE VIEW vehicle_summary AS
SELECT 
    v.id,
    v.name,
    v.type,
    v.capacity_kg,
    v.status,
    v.driver_name,
    ST_AsText(v.current_location) as current_location_wkt,
    COUNT(d.id) as assigned_deliveries,
    COALESCE(SUM(d.weight_kg), 0) as total_weight
FROM vehicles v
LEFT JOIN deliveries d ON v.id = d.assigned_vehicle_id AND d.status = 'assigned'
GROUP BY v.id, v.name, v.type, v.capacity_kg, v.status, v.driver_name, v.current_location;

-- Grant permissions (works for both postgres and test_user)
DO $$
BEGIN
    -- Grant to postgres user if it exists (production environment)
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
    END IF;
    
    -- Grant to test_user if it exists (test environment)
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'test_user') THEN
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_user;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test_user;
    END IF;
END
$$;