# 🚀 Local Development Setup Guide

> **New**: ⚡ 30-second local testing vs 5-10 minute GitHub Actions wait! See [Local Testing Guide](LOCAL-TESTING-GUIDE.md)

## 📋 Prerequisites

Before running Fleet Route Optimizer locally, make sure you have these installed:

### Required Software
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **PostgreSQL 13+ with PostGIS** - [Download here](https://www.postgresql.org/download/)
- **Redis 6+** - [Download here](https://redis.io/download/)
- **Git** - [Download here](https://git-scm.com/)

### Optional (Recommended)
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
- **Visual Studio Code** - [Download here](https://code.visualstudio.com/)

## 🔧 Option 1: Docker Setup (Recommended)

### Step 1: Clone the Repository
```bash
git clone https://github.com/vkondepati/fleet-route-optimizer.git
cd fleet-route-optimizer
```

### Step 2: Create Environment File
```bash
# Copy the example environment file
cp .env.example .env

# Edit the environment file with your preferred editor
# On Windows:
notepad .env
# On macOS/Linux:
nano .env
```

### Step 3: Configure Environment Variables
Add these to your `.env` file:
```env
# Application
NODE_ENV=development
PORT=3000
API_PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fleet_optimizer
DB_USER=postgres
DB_PASSWORD=your_password_here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-here

# Map Configuration
LEAFLET_ACCESS_TOKEN=your_mapbox_token_here
```

### Step 4: Start with Docker Compose
```bash
# Start all services (database, redis, api, web)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Step 5: Access the Application
- **Web Dashboard**: http://localhost:3000
- **API Documentation**: http://localhost:3001/docs
- **API Health Check**: http://localhost:3001/health

## 🛠️ Option 2: Manual Setup (Local Development)

### Step 1: Clone and Install Dependencies
```bash
# Clone repository
git clone https://github.com/vkondepati/fleet-route-optimizer.git
cd fleet-route-optimizer

# Install dependencies
npm install
```

### Step 2: Set Up PostgreSQL Database
```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database and user
CREATE DATABASE fleet_optimizer;
CREATE USER fleet_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE fleet_optimizer TO fleet_user;

-- Enable PostGIS extension
\c fleet_optimizer
CREATE EXTENSION postgis;
```

### Step 3: Set Up Redis
```bash
# On Windows (using Redis installer)
# Start Redis service from Services.msc

# On macOS (using Homebrew)
brew install redis
brew services start redis

# On Ubuntu/Linux
sudo apt-get install redis-server
sudo systemctl start redis-server
```

### Step 4: Configure Environment
Create `.env` file with your local configuration:
```env
NODE_ENV=development
PORT=3000
API_PORT=3001

DB_HOST=localhost
DB_PORT=5432
DB_NAME=fleet_optimizer
DB_USER=fleet_user
DB_PASSWORD=your_password

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-local-development-secret
```

### Step 5: Initialize Database
```bash
# Run database migrations
npm run db:setup

# Seed with sample data
npm run db:seed
```

### Step 6: Start Development Servers
```bash
# Start both API and web servers
npm run dev

# Or start them separately:
# Terminal 1 - API Server
npm run dev:api

# Terminal 2 - Web Server
npm run dev:web
```

### Step 7: Access Your Application
- **Web Dashboard**: http://localhost:3000
- **API Server**: http://localhost:3001
- **API Documentation**: http://localhost:3001/docs

## 🧪 Verify Installation

### Check API Health
```bash
# Test API health endpoint
curl http://localhost:3001/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "dependencies": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

### Test Route Optimization
```bash
# Test VRP solver endpoint
curl -X POST http://localhost:3001/api/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "vehicles": [
      {"id": "truck1", "capacity": 1000, "location": [0, 0]}
    ],
    "deliveries": [
      {"id": "delivery1", "location": [1, 1], "demand": 100}
    ]
  }'
```

### Run Tests
```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e
```

## 🔍 Troubleshooting

### Common Issues

#### Database Connection Error
```bash
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:**
- Ensure PostgreSQL is running
- Check connection details in `.env`
- Verify database exists and user has permissions

#### Redis Connection Error
```bash
Error: Redis connection failed
```
**Solution:**
- Start Redis service
- Check Redis is running: `redis-cli ping`
- Verify Redis configuration in `.env`

#### Port Already in Use
```bash
Error: listen EADDRINUSE :::3000
```
**Solution:**
```bash
# Find process using port
netstat -ano | findstr :3000

# Kill process (Windows)
taskkill /PID <process_id> /F

# Or change port in .env file
PORT=3002
```

#### Node.js Version Error
```bash
Error: Node.js version 16.x.x is not supported
```
**Solution:**
- Install Node.js 18+ from [nodejs.org](https://nodejs.org/)
- Or use Node Version Manager (nvm):
```bash
# Install and use Node 18
nvm install 18
nvm use 18
```

### Performance Issues

#### Slow Database Queries
```sql
-- Check database performance
SELECT * FROM pg_stat_activity;

-- Add indexes for better performance
CREATE INDEX idx_vehicles_location ON vehicles USING GIST(current_location);
```

#### High Memory Usage
```bash
# Monitor memory usage
# Windows
tasklist /fi "imagename eq node.exe"

# macOS/Linux
ps aux | grep node

# Increase Node.js memory if needed
node --max-old-space-size=4096 server.js
```

## 📊 Development Tools

### Recommended VS Code Extensions
- TypeScript and JavaScript Language Features
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- GitLens
- Thunder Client (API testing)

### Useful Commands
```bash
# Development
npm run dev          # Start both API and web servers
npm run build        # Build for production
npm run typecheck    # Check TypeScript types
npm run lint         # Run ESLint

# Quick Local Testing (NEW!) ⚡
npm run quick-test   # 30-second essential checks
npm run verify       # Full local CI pipeline
./local-ci.bat       # Windows batch script
npm run precommit    # Pre-commit checks

# Database with PostGIS
npm run db:setup     # Initialize PostgreSQL + PostGIS
npm run db:migrate   # Run spatial migrations
npm run db:seed      # Add sample spatial data

# Traditional Testing
npm test             # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report

# Docker Testing
./test-docker.bat    # Local Docker integration tests
docker compose up -d # Start all services (V2 syntax)
docker compose down  # Stop services
```

## ⚡ Local Testing Benefits

The new local testing infrastructure provides:

- **30 seconds** vs 5-10 minutes GitHub Actions wait
- **Pre-commit hooks** that prevent broken commits
- **Fast feedback loop** for development
- **Reliable CI/CD pipeline** testing locally

See [LOCAL-TESTING-GUIDE.md](LOCAL-TESTING-GUIDE.md) for complete details.

## 🎯 Next Steps

Once you have the application running:

1. **Explore the Web Interface** - Navigate to http://localhost:5173
2. **Try Demo Dashboards** - Check http://localhost:8080/fleet-demo.html
3. **Test API Endpoints** - API server at http://localhost:3001
4. **Run Quick Tests** - Execute `npm run quick-test` for 30-second validation
5. **Try Route Optimization** - Create vehicles and deliveries with PostGIS
6. **Check Real-time Features** - Test GPS tracking with spatial coordinates

## 🛠️ Development Workflow

Recommended development process:

1. **Make code changes**
2. **Run quick tests**: `npm run quick-test` (30 seconds)
3. **Fix any issues locally** (much faster than CI/CD)
4. **Commit with automatic pre-commit hooks**
5. **Push with confidence** - 90% of issues caught locally

## 🤝 Need Help?

If you encounter any issues:

1. **Check the Local Testing Guide** - [LOCAL-TESTING-GUIDE.md](LOCAL-TESTING-GUIDE.md)
2. **Review logs** - Look at console output for error messages
3. **Test locally first** - Use `npm run quick-test` before pushing
4. **Search existing issues** - [GitHub Issues](https://github.com/vkondepati/fleet-route-optimizer/issues)
5. **Create a new issue** - Report bugs or ask questions

Happy coding! 🚀