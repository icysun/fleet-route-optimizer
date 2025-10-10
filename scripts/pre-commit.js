#!/usr/bin/env node

/**
 * Fast Pre-commit Checks
 * Runs essential checks quickly before commits (no Docker tests)
 */

const { runCommand, log, logSuccess, logError } = require('./scripts/local-ci.js');

function main() {
  const startTime = Date.now();
  
  log('\n⚡ Fast Pre-commit Checks', 'magenta');
  log('Running essential checks before commit...', 'white');
  log('='.repeat(40), 'magenta');

  // Quick lint
  log('\n🔍 Linting...', 'cyan');
  runCommand('npm run lint', 'ESLint checks');

  // Type checking
  log('\n🔍 Type checking...', 'cyan');
  runCommand('npm run typecheck', 'TypeScript compilation');

  // Quick tests (no coverage to be faster)
  log('\n🔍 Running tests...', 'cyan');
  runCommand('npm test', 'Jest tests');

  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  
  log('\n✅ Pre-commit checks passed!', 'green');
  logSuccess(`Completed in ${duration}s - Ready to commit!`);
}

if (require.main === module) {
  main();
}