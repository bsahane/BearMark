# 🐳 BearMark Docker Setup

BearMark can be easily containerized using Docker for consistent deployment across different environments.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## 🚀 Quick Start

### Production Deployment

1. **Build and run with Docker Compose:**
```bash
npm run docker:prod
```

2. **Or build and run manually:**
```bash
npm run docker:build
npm run docker:run
```

3. **Access the application:**
   - Open http://localhost:8080

### Development with Hot Reload

1. **Run development container:**
```bash
npm run docker:dev
```

2. **Access the development server:**
   - Open http://localhost:3000

## 🛠️ Docker Commands

### NPM Scripts
```bash
# Build production image
npm run docker:build

# Run production container
npm run docker:run

# Start development environment
npm run docker:dev

# Start production environment
npm run docker:prod

# Stop all containers
npm run docker:stop

# Clean up Docker system
npm run docker:clean
```

### Manual Docker Commands
```bash
# Build production image
docker build -t bearmark .

# Build development image
docker build -f Dockerfile.dev -t bearmark:dev .

# Run production container
docker run -p 8080:80 bearmark

# Run development container with volume mount
docker run -p 3000:3000 -v $(pwd):/app -v /app/node_modules bearmark:dev
```

### Docker Compose Commands
```bash
# Start production services
docker-compose up -d

# Start development services
docker-compose --profile dev up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and start
docker-compose up --build
```

## 📁 Container Structure

### Production Container
- **Base Image:** nginx:alpine
- **Port:** 80 (mapped to 8080 on host)
- **Health Check:** `/health` endpoint
- **Features:**
  - Gzip compression
  - Security headers
  - Static asset caching
  - SPA routing support

### Development Container
- **Base Image:** node:18-alpine
- **Port:** 3000
- **Features:**
  - Hot reload
  - Volume mounting for live development
  - All development dependencies

## 🔧 Configuration

### Environment Variables
- `NODE_ENV`: Set to `production` for production builds
- Custom environment variables can be added to `docker-compose.yml`

### Nginx Configuration
The production container uses a custom nginx configuration (`nginx.conf`) with:
- Gzip compression for better performance
- Security headers for enhanced security
- Proper SPA routing configuration
- Static asset caching

### Health Checks
Both containers include health checks:
- **Production:** `curl -f http://localhost/health`
- **Development:** `curl -f http://localhost:3000/`

## 🚦 Container Management

### Viewing Container Status
```bash
docker ps
docker-compose ps
```

### Viewing Logs
```bash
docker logs bearmark-app
docker-compose logs bearmark
```

### Accessing Container Shell
```bash
docker exec -it bearmark-app sh
```

### Stopping and Cleaning Up
```bash
# Stop specific container
docker stop bearmark-app

# Remove container
docker rm bearmark-app

# Remove image
docker rmi bearmark

# Clean up everything
docker system prune -af
```

## 🔒 Security Features

- Non-root user execution
- Minimal attack surface with Alpine Linux
- Security headers in nginx configuration
- Health checks for monitoring
- Proper file permissions

## 📊 Performance Optimizations

- Multi-stage build for smaller image size
- Gzip compression enabled
- Static asset caching
- Efficient layer caching with .dockerignore

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Change ports in docker-compose.yml or use different ports
   docker run -p 8081:80 bearmark
   ```

2. **Permission issues:**
   ```bash
   # Ensure proper file permissions
   chmod +x scripts/*
   ```

3. **Container won't start:**
   ```bash
   # Check logs for errors
   docker logs bearmark-app
   ```

4. **Build failures:**
   ```bash
   # Clean Docker cache and rebuild
   docker builder prune
   npm run docker:build
   ```

### Health Check Failures
If health checks fail, check:
- Application is running on correct port
- curl is available in container
- Network connectivity

## 📈 Monitoring

The containers include health checks that can be integrated with:
- Docker Swarm
- Kubernetes
- Docker Compose health checks
- External monitoring tools

## 🔄 Updates and Maintenance

To update the application:
1. Pull latest code
2. Rebuild containers: `npm run docker:build`
3. Restart services: `npm run docker:prod`

For maintenance:
- Regular cleanup: `npm run docker:clean`
- Image updates: Check for base image updates
- Security scanning: Use `docker scan bearmark`
