# Quick Start Guide

Get your Fleet Route Optimizer running in under 5 minutes with our complete Docker setup!

## 🎯 What You'll Get

After following this guide, you'll have:
- ✅ **PostgreSQL + PostGIS** spatial database running
- ✅ **Redis** caching for high performance
- ✅ **Real-time API server** with WebSocket support
- ✅ **Interactive web interface** with mapping
- ✅ **Sample fleet data** ready for testing

## 📋 Prerequisites

### System Requirements
- **Docker & Docker Compose** installed ([Get Docker](https://docker.com/get-started))
- **8GB RAM** minimum (16GB recommended)
- **5GB free disk space**
- **Internet connection** for downloading containers

### Port Requirements
Ensure these ports are available:
- `3001` - API Server
- `3002` - WebSocket Server  
- `5432` - PostgreSQL Database
- `6379` - Redis Cache

## ⚡ 5-Minute Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/vkondepati/fleet-route-optimizer.git
cd fleet-route-optimizer
```

### Step 2: Start All Services
```bash
# Start the complete stack
docker-compose up -d

# This will start:
# - PostgreSQL 15 + PostGIS 3.3
# - Redis 7 for caching
# - Node.js API server
# - Sample data initialization
```

### Step 3: Verify Everything is Running
```bash
# Check service status
docker-compose ps

# Expected output:
# ✅ fleet-optimizer-db     (PostgreSQL + PostGIS) - Healthy
# ✅ fleet-optimizer-redis  (Redis Cache)          - Healthy  
# ✅ fleet-optimizer-api    (API Server)           - Healthy
```

### Step 4: Access Your Application
Open your browser and navigate to:

- **🌐 Main Application**: http://localhost:3001
- **🏥 Health Check**: http://localhost:3001/health
- **📚 API Documentation**: http://localhost:3001/docs

## 🎮 First Steps

### Explore the Sample Data
Your system comes with pre-loaded sample data:
- **3 Vehicles**: Truck, Van, Motorcycle (San Francisco area)
- **3 Deliveries**: Real pickup/delivery coordinates
- **Geographic locations**: All stored as PostGIS spatial data

### Try Route Optimization
1. **Open the main application** at http://localhost:3001
2. **Click "Optimize Routes with PostGIS"**
3. **Choose an algorithm**: Clarke-Wright, A*, Genetic, or Multi-objective
4. **Watch the optimization** happen in real-time with spatial calculations

### Add Your Own Data
1. **Add a new vehicle**: Use the form in the left panel
2. **Add deliveries**: Click anywhere on the map to create a delivery
3. **Re-optimize**: See how new data affects the routes

## 🗄️ Database Deep Dive

### PostgreSQL + PostGIS Integration
Your database includes:

```sql
-- Vehicles with spatial locations
SELECT name, type, capacity_kg, ST_AsText(current_location) 
FROM vehicles;

-- Deliveries with pickup/delivery coordinates  
SELECT delivery_address, weight_kg, 
       ST_AsText(pickup_location), 
       ST_AsText(delivery_location)
FROM deliveries;

-- Calculate distances using PostGIS
SELECT ST_Distance(
  pickup_location::geography,
  delivery_location::geography
) / 1000 as distance_km
FROM deliveries;
```

### Verify Database Connection
```bash
# Connect to the database directly
docker-compose exec postgres psql -U postgres -d fleet_optimizer

# Check PostGIS version
SELECT PostGIS_Version();

# View all tables
\dt
```

## 🔧 API Testing

### Health Check
```bash
curl http://localhost:3001/health
```

### Get Fleet Data
```bash
# Get all vehicles from PostgreSQL
curl http://localhost:3001/api/vehicles

# Get all deliveries with spatial data
curl http://localhost:3001/api/deliveries

# Get fleet statistics with PostGIS analysis
curl http://localhost:3001/api/fleet/stats
```

### Add New Vehicle
```bash
curl -X POST http://localhost:3001/api/vehicles \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Truck-004",
    "vehicleType": "truck",
    "capacity": 2000,
    "position": [37.7749, -122.4194],
    "driverName": "Jane Smith"
  }'
```

### Run Route Optimization
```bash
curl -X POST http://localhost:3001/api/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "algorithm": "clarke-wright"
  }'
```

## 🌐 WebSocket Real-time Updates

### Test WebSocket Connection
```javascript
// Connect to real-time fleet updates
const ws = new WebSocket('ws://localhost:3002');

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  if (data.type === 'fleet_status') {
    console.log('Fleet update:', data.data);
  }
};
```

## 🎯 What's Next?

### Explore Advanced Features
- **[Algorithm Deep Dive](Clarke-Wright-Algorithm)** - Understand optimization techniques
- **[Database Schema](Database-Schema)** - Complete table relationships
- **[Production Deployment](Production-Deployment)** - Scale for enterprise use

### Integration Options
- **[REST API Documentation](REST-API-Documentation)** - Complete endpoint reference
- **[WebSocket API](WebSocket-API)** - Real-time integration
- **[Third-party Integrations](Third-party-Integrations)** - Connect external systems

### Customization
- **[Configuration](Configuration)** - Environment settings
- **[Custom Algorithms](Vehicle-Routing-Problem)** - Implement your own VRP solvers
- **[Frontend Development](React-Dashboard)** - Customize the interface

## 🐛 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Stop conflicting services
docker-compose down
sudo lsof -i :3001 :3002 :5432 :6379
```

**Database Connection Failed**
```bash
# Check PostgreSQL status
docker-compose logs postgres
docker-compose restart postgres
```

**API Server Not Responding**
```bash
# Check API logs
docker-compose logs api
docker-compose restart api
```

### Need Help?
- **[Common Issues](Common-Issues)** - Detailed troubleshooting
- **[Community Forum](https://github.com/vkondepati/fleet-route-optimizer/discussions)** - Ask questions
- **[Discord Server](https://discord.gg/fleet-optimizer)** - Real-time support

## 🎉 Success!

You now have a fully functional Fleet Route Optimizer with:
- ✅ **Spatial database** with real geographic calculations
- ✅ **Real-time optimization** using advanced algorithms
- ✅ **Interactive mapping** with live fleet tracking
- ✅ **Production-ready architecture** with Docker containers

**Ready to build amazing fleet management solutions!** 🚛📍🗺️

---

**Next Steps**: Check out our [PostgreSQL + PostGIS Setup](PostgreSQL-PostGIS-Setup) guide to understand the spatial database architecture, or explore the [REST API Documentation](REST-API-Documentation) to integrate with your existing systems.