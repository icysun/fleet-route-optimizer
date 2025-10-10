#!/usr/bin/env node

/**
 * Setup Development Environment
 * Configures git hooks and development tools
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function log(message, color = 'white') {
  const colors = {
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function main() {
  log('🔧 Setting up development environment...', 'cyan');
  
  // Create git hooks directory if it doesn't exist
  const hooksDir = path.join(process.cwd(), '.git', 'hooks');
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }

  // Copy pre-commit hook
  const preCommitSource = path.join(__dirname, '..', 'scripts', 'git-hooks', 'pre-commit');
  const preCommitTarget = path.join(hooksDir, 'pre-commit');
  
  const preCommitContent = `#!/bin/sh
# Git pre-commit hook
# Runs fast checks before allowing commits

echo "🔍 Running pre-commit checks..."

# Run the fast pre-commit checks
node scripts/pre-commit.js

# Exit with the same exit code as the pre-commit script
exit $?`;

  fs.writeFileSync(preCommitTarget, preCommitContent);
  
  // Make hook executable (on Unix-like systems)
  try {
    execSync(`chmod +x "${preCommitTarget}"`, { stdio: 'ignore' });
  } catch (e) {
    // On Windows, this may fail, but that's okay
  }

  log('✅ Development environment setup complete!', 'green');
  log('\n📋 Available commands:', 'cyan');
  log('   npm run verify          - Full CI pipeline locally');
  log('   npm run precommit       - Fast pre-commit checks');
  log('   npm run ci:local        - Complete local CI');
  log('   ./local-ci.bat          - Windows batch script');
  log('   node scripts/local-ci.js - Direct Node.js execution');
  log('\n💡 Git hooks are now active - commits will run automatic checks!', 'green');
}

if (require.main === module) {
  main();
}