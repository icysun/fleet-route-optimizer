#!/usr/bin/env node

/**
 * Local CI Pipeline Runner
 * Runs the same checks as GitHub Actions locally to catch issues before pushing
 */

const { execSync } = require('child_process');
const process = require('process');

// ANSI color codes for pretty output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, description) {
  log(`\n🔍 Step ${step}: ${description}`, 'cyan');
  log('='.repeat(50), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function runCommand(command, description, optional = false) {
  try {
    log(`Running: ${command}`, 'blue');
    const result = execSync(command, { 
      stdio: 'inherit', 
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1' }
    });
    logSuccess(`${description} completed successfully`);
    return true;
  } catch (error) {
    if (optional) {
      logWarning(`${description} failed (optional): ${error.message}`);
      return false;
    } else {
      logError(`${description} failed: ${error.message}`);
      process.exit(1);
    }
  }
}

function main() {
  const startTime = Date.now();
  
  log('\n🚀 Fleet Route Optimizer - Local CI Pipeline', 'magenta');
  log('This mirrors the GitHub Actions workflow exactly', 'white');
  log('='.repeat(60), 'magenta');

  // Step 1: Install dependencies
  logStep(1, 'Installing dependencies');
  runCommand('npm ci', 'Dependency installation');

  // Step 2: Lint
  logStep(2, 'Linting code');
  runCommand('npm run lint', 'ESLint checks');

  // Step 3: Type checking
  logStep(3, 'Type checking');
  runCommand('npm run typecheck', 'TypeScript compilation');

  // Step 4: Unit and integration tests
  logStep(4, 'Running tests with coverage');
  runCommand('npm run test:coverage', 'Jest tests');

  // Step 5: Docker integration tests
  logStep(5, 'Docker integration tests');
  log('Building and testing Docker containers...', 'blue');
  runCommand('docker compose -f docker-compose.test.yml down', 'Cleanup previous containers', true);
  runCommand('docker compose -f docker-compose.test.yml up --build --abort-on-container-exit --exit-code-from api', 'Docker integration tests');

  // Success summary
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  
  log('\n🎉 ALL CHECKS PASSED!', 'green');
  log('='.repeat(30), 'green');
  logSuccess(`Local CI pipeline completed in ${duration}s`);
  logSuccess('Your code is ready to push to GitHub!');
  log('\n💡 Next steps:', 'cyan');
  log('   git add .', 'white');
  log('   git commit -m "your commit message"', 'white');
  log('   git push origin feature/add-postgis-integration-and-docs', 'white');
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  log('\n\n🛑 Local CI pipeline interrupted', 'yellow');
  log('Cleaning up Docker containers...', 'yellow');
  try {
    execSync('docker compose -f docker-compose.test.yml down', { stdio: 'inherit' });
  } catch (e) {
    // Ignore cleanup errors
  }
  process.exit(0);
});

if (require.main === module) {
  main();
}

module.exports = { runCommand, log, logSuccess, logError, logWarning };