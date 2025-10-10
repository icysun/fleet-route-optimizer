# Fleet Route Manager FAQ

This is a collection of answers to the most frequently asked questions about Fleet Route Manager.

 1. [Getting Started](#getting-started)
 2. [Route Optimization](#route-optimization)
 3. [Database and Spatial Features](#database-and-spatial-features)
 4. [Performance](#performance)
 5. [Commercial Use and Licensing](#commercial-use-and-licensing)
 6. [Integration and APIs](#integration-and-apis)

## Getting Started

#### How do I get started with Fleet Route Manager?

The fastest way is using Docker:
```bash
git clone https://github.com/vkondepati/fleet-route-optimizer.git
cd fleet-route-optimizer
docker compose up -d
```

Then visit http://localhost:5173/ for the main interface or http://localhost:8080/fleet-demo.html for demos.

Check out our [Quick Start Guide](wiki/Quick-Start-Guide.md) for detailed setup instructions.

#### What are the system requirements?

**Minimum:**
- 4GB RAM, 2GB free disk space
- Docker Desktop (recommended) OR Node.js 18+, PostgreSQL 13+ with PostGIS, Redis 6+

**Recommended:**
- 8GB+ RAM, 5GB+ free disk space
- Modern web browser with WebGL support for mapping

#### Can I test changes locally instead of waiting for CI/CD?

Yes! We have a 30-second local testing infrastructure:
```bash
npm run quick-test    # Essential checks (30 seconds vs 5-10 min CI/CD)
npm run verify        # Full local CI pipeline
./local-ci.bat       # Windows batch script
```

See [Local Testing Guide](LOCAL-TESTING-GUIDE.md) for complete setup.

## Route Optimization

#### What optimization algorithms are supported?

Fleet Route Manager includes multiple Vehicle Routing Problem (VRP) algorithms:

- **Clarke-Wright Savings Algorithm**: Classic, reliable approach
- **A* Pathfinding**: Geographic-aware routing with obstacles
- **Genetic Algorithm**: Evolutionary optimization for complex scenarios
- **Multi-Objective**: Balance distance, time, cost, and capacity constraints

Check our [Algorithm Documentation](wiki/Vehicle-Routing-Problem.md) for details.

#### How accurate are the route calculations?

Routes use PostGIS spatial calculations with meter-precision accuracy:
- Real geographic distances (not straight-line)
- Support for road networks and turn restrictions
- Integration with OpenStreetMap data
- Spatial indexing for high performance

#### Can I add custom constraints?

Yes! Fleet Route Manager supports:
- Vehicle capacity limits (weight/volume)
- Time windows for deliveries
- Driver work hour restrictions  
- Vehicle type restrictions (e.g., refrigerated trucks)
- Custom cost functions

See [Configuration Guide](wiki/Configuration.md) for implementation details.

## Database and Spatial Features

#### What database does Fleet Route Manager use?

PostgreSQL 15+ with PostGIS 3.3 extensions for spatial operations:
- Geographic point storage with SRID 4326 (WGS84)
- Spatial indexing using GiST
- Distance calculations in meters/kilometers
- Polygon support for delivery zones

#### How do I connect my existing data?

Fleet Route Manager provides multiple integration options:
- REST API endpoints for vehicles/deliveries
- CSV import/export functionality  
- Direct database connection for ETL processes
- WebSocket real-time updates

Check [Database Schema](wiki/Database-Schema.md) and [API Documentation](wiki/REST-API-Documentation.md).

#### Can I use different map providers?

Yes! While we use OpenStreetMap by default, you can integrate:
- Mapbox (custom styles and satellite imagery)
- Bing Maps (commercial usage)
- ArcGIS (enterprise features)
- Google Maps (via plugins)

Always check the terms of use for your chosen provider.

## Performance

#### How many vehicles/deliveries can the system handle?

Fleet Route Manager is designed for enterprise scale:
- **Vehicles**: 1000+ concurrent vehicles
- **Deliveries**: 10,000+ daily deliveries
- **API Requests**: 10,000+ per second with Redis caching
- **WebSocket Connections**: 1000+ concurrent real-time updates

#### I have performance issues with large datasets. Any tips?

1. **Use spatial indexing** - PostGIS GiST indexes are automatic
2. **Enable Redis caching** - Reduces database load by 80%+
3. **Optimize delivery batches** - Group by geographic zones
4. **Use background processing** - Async route optimization
5. **Scale horizontally** - Multiple API instances with load balancer

See [Performance Tuning Guide](wiki/Performance-Tuning.md) for detailed optimization.

#### Why is my route optimization slow?

Common causes and solutions:
- **Large datasets**: Use geographic clustering to reduce problem size
- **Complex constraints**: Simplify time windows or vehicle restrictions
- **Algorithm choice**: Clarke-Wright is faster than Genetic for simple cases
- **Database performance**: Check PostGIS spatial indexes

## Commercial Use and Licensing

#### Can I use Fleet Route Manager in commercial applications?

Yes! Fleet Route Manager is open source under the MIT License:
- ✅ Commercial use allowed
- ✅ Modification and distribution permitted  
- ✅ Private use allowed
- ✅ No attribution required (but appreciated)

Just ensure you comply with any third-party service terms (map providers, etc.).

#### What about enterprise support?

While Fleet Route Manager is open source, you can:
- Get community support via [GitHub Discussions](https://github.com/vkondepati/fleet-route-optimizer/discussions)
- Join our [Discord server](https://discord.gg/fleet-optimizer) for real-time help
- Review [Contributing Guidelines](wiki/Contributing-Guidelines.md) for priority support

For enterprise consulting, check our [Enterprise Services](wiki/Enterprise-Services.md) page.

## Integration and APIs

#### How do I integrate Fleet Route Manager with my existing system?

Multiple integration approaches:
1. **REST API**: Full CRUD operations for vehicles/deliveries
2. **WebSocket API**: Real-time fleet status updates
3. **Database Direct**: Connect to PostgreSQL directly
4. **Webhook Events**: Push notifications for route changes

See [Integration Guide](wiki/Third-party-Integrations.md) and [API Documentation](wiki/REST-API-Documentation.md).

#### Can I customize the web interface?

Yes! The frontend is built with React and can be customized:
- Modify existing components in `src/` directory
- Add custom dashboards and visualizations
- Integrate with your branding/styling
- Deploy as embedded widget

See [Frontend Development Guide](wiki/React-Dashboard.md) for details.

#### Does it work with mobile devices?

Fleet Route Manager includes:
- ✅ Responsive web design for mobile browsers
- ✅ Touch-friendly map interactions
- ✅ Progressive Web App (PWA) support
- ✅ Offline capability for route viewing

For native mobile apps, use our REST API with your preferred mobile framework.

---

**Need more help?** Check our [Wiki](https://github.com/vkondepati/fleet-route-optimizer/wiki) or join the [community discussion](https://github.com/vkondepati/fleet-route-optimizer/discussions)!
