# Quick Build Performance Tips

## Fast Build Commands (use these instead):

# 1. Build with parallel processing
docker-compose build --parallel

# 2. Use build cache effectively  
docker-compose build --no-cache nginx  # only when needed
docker-compose build backend frontend  # cache others

# 3. Start without rebuild if images exist
docker-compose up -d

# 4. Incremental builds
docker-compose build nginx    # ~3 seconds
docker-compose build backend  # ~30-60 seconds  
docker-compose build frontend # ~60-120 seconds

## Performance Optimizations Applied:

✅ Added .dockerignore files (reduced context size)
✅ Optimized layer caching in Dockerfiles
✅ Used npm ci instead of npm install
✅ Added build environment variables to reduce logs
✅ Cleaned Docker build cache (freed 1.1GB)

## Expected Build Times:

- Nginx: 3-10 seconds (lightweight)
- Backend: 30-90 seconds (TypeScript compilation + dependencies)
- Frontend: 60-180 seconds (large React/MUI dependency tree)

## Speed up further:

1. Use Docker layer caching
2. Use multi-stage builds for production
3. Consider using prebuilt base images with dependencies
4. Use npm ci --only=production for smaller installs