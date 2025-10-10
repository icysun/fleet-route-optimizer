# Local Development & Testing Guide

This guide helps you test thoroughly on your local PC before pushing to GitHub, saving time on GitHub Actions.

## 🚀 Quick Start

### 1. One-time setup
```bash
npm run setup:dev
```

### 2. Before each push - Full CI pipeline locally
```bash
# Option 1: Use the convenient batch script (Windows)
./local-ci.bat

# Option 2: Use npm script
npm run verify

# Option 3: Use Node.js directly
node scripts/local-ci.js
```

### 3. Before each commit - Fast checks
```bash
npm run precommit
```

## 📋 Available Commands

| Command | Description | Time | When to Use |
|---------|-------------|------|-------------|
| `npm run verify` | Complete CI pipeline locally | ~2-3 min | Before pushing to GitHub |
| `npm run precommit` | Fast lint + typecheck + tests | ~30 sec | Before each commit |
| `npm run ci:local` | Full pipeline (same as verify) | ~2-3 min | Comprehensive testing |
| `./local-ci.bat` | Windows batch script | ~2-3 min | Windows users preference |
| `./test-docker.bat` | Docker tests only | ~1-2 min | Test Docker integration |

## 🔍 What Each Command Does

### `npm run verify` (Recommended before push)
1. **Install dependencies** - `npm ci`
2. **Lint code** - `npm run lint`
3. **Type check** - `npm run typecheck`
4. **Run tests with coverage** - `npm run test:coverage`
5. **Docker integration tests** - Full Docker Compose test suite

### `npm run precommit` (Fast checks)
1. **Lint code** - `npm run lint`
2. **Type check** - `npm run typecheck`  
3. **Run tests** - `npm test` (no coverage for speed)

### Git Hooks (Automatic)
- **Pre-commit hook** - Automatically runs `npm run precommit` before each commit
- Prevents broken code from being committed
- Can be bypassed with `git commit --no-verify` if needed

## 🐳 Docker Testing

### Local Docker Tests
```bash
# Quick Docker test
./test-docker.bat

# Or manually
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit --exit-code-from api
```

### What Docker Tests Cover
- PostgreSQL + PostGIS integration
- Redis caching
- API endpoints
- Database migrations
- Environment variable configuration

## ⚡ Performance Tips

### Fast Development Workflow
1. **During development**: Use `npm run precommit` for quick feedback
2. **Before committing**: Git hooks run automatically
3. **Before pushing**: Use `npm run verify` for full confidence

### Skip Checks (when needed)
```bash
# Skip git pre-commit hook
git commit --no-verify -m "WIP: quick fix"

# Skip specific tests during development
npm test -- --watchAll=false
npm run lint -- --quiet
```

## 🛠️ Troubleshooting

### Common Issues

#### Docker not running
```
❌ Docker is not running. Please start Docker Desktop.
```
**Solution**: Start Docker Desktop and wait for it to be ready

#### Port conflicts
```
Error: Port 5432 already in use
```
**Solution**: Stop local PostgreSQL or change port in docker-compose.test.yml

#### Out of memory
```
Docker build failed: not enough memory
```
**Solution**: Increase Docker Desktop memory allocation (Settings > Resources)

### Environment Setup
```bash
# Verify Node.js version
node --version  # Should be >= 18.0.0

# Verify npm version  
npm --version   # Should be >= 8.0.0

# Verify Docker
docker --version
docker compose version
```

## 📊 Time Comparison

| Testing Method | Time | Confidence | When to Use |
|----------------|------|------------|-------------|
| No testing | 0 sec | 😰 Low | Never recommended |
| `npm run precommit` | ~30 sec | 😊 Good | Every commit |
| `npm run verify` | ~2-3 min | 😍 Excellent | Before push |
| GitHub Actions only | ~5-10 min | 😍 Excellent | After push (too late!) |

## 🎯 Best Practices

1. **Always run `npm run verify` before pushing** - Catches 99% of CI failures
2. **Use `npm run precommit` frequently** - Fast feedback during development  
3. **Let git hooks work** - Don't bypass unless absolutely necessary
4. **Fix issues locally** - Much faster than debugging in GitHub Actions
5. **Run Docker tests** - Catches environment-specific issues

## 🔧 Customization

### Modify Scripts
- Edit `scripts/local-ci.js` to add/remove checks
- Edit `scripts/pre-commit.js` to change fast checks
- Edit `.git/hooks/pre-commit` to modify git hook behavior

### Add Custom Checks
```javascript
// In scripts/local-ci.js
runCommand('npm run custom-check', 'Custom validation');
```

---

## 💡 Pro Tips

1. **Use the Windows batch scripts** if you prefer double-clicking
2. **Keep Docker Desktop running** during development for faster tests
3. **Check terminal colors** - Red = failure, Green = success
4. **Use Ctrl+C** to cancel long-running tests safely
5. **Monitor memory usage** during Docker tests

With this setup, you'll catch issues in seconds/minutes locally instead of waiting 5-10 minutes for GitHub Actions! 🚀