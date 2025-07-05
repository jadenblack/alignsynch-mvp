#!/usr/bin/env node

/**
 * Build Diagnostics Script
 * Helps diagnose common build issues in the AlignSynch MVP
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 AlignSynch Build Diagnostics\n');

// Check Node.js and package manager versions
console.log('📋 Environment Information:');
try {
  console.log(`Node.js: ${process.version}`);
  console.log(`PNPM: ${execSync('pnpm --version', { encoding: 'utf8' }).trim()}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Architecture: ${process.arch}\n`);
} catch (error) {
  console.log('❌ Error checking environment:', error.message);
}

// Check package.json files
console.log('📦 Package Configuration:');
const packagePaths = [
  'package.json',
  'apps/app/package.json'
];

packagePaths.forEach(pkgPath => {
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      console.log(`✅ ${pkgPath}: ${pkg.name || 'unnamed'}`);
    } catch (error) {
      console.log(`❌ ${pkgPath}: Invalid JSON - ${error.message}`);
    }
  } else {
    console.log(`⚠️  ${pkgPath}: Not found`);
  }
});

// Check for common build issues
console.log('\n🔧 Common Issue Checks:');

// Check if analytics package is still referenced
const appPackagePath = 'apps/app/package.json';
if (fs.existsSync(appPackagePath)) {
  const appPackage = JSON.parse(fs.readFileSync(appPackagePath, 'utf8'));
  const hasAnalytics = appPackage.dependencies?.['@repo/analytics'] || 
                      appPackage.devDependencies?.['@repo/analytics'];
  
  if (hasAnalytics) {
    console.log('❌ @repo/analytics still in package.json - should be removed');
  } else {
    console.log('✅ @repo/analytics correctly removed from package.json');
  }
}

// Check lockfile status
if (fs.existsSync('pnpm-lock.yaml')) {
  console.log('✅ pnpm-lock.yaml exists');
} else {
  console.log('⚠️  pnpm-lock.yaml missing - run pnpm install');
}

// Check TypeScript config
if (fs.existsSync('tsconfig.json')) {
  console.log('✅ TypeScript config found');
} else {
  console.log('⚠️  tsconfig.json missing');
}

// Check Next.js config
if (fs.existsSync('apps/app/next.config.js') || fs.existsSync('apps/app/next.config.mjs')) {
  console.log('✅ Next.js config found');
} else {
  console.log('⚠️  Next.js config missing');
}

console.log('\n🚀 Suggested Actions:');
console.log('1. Run: pnpm install --no-frozen-lockfile');
console.log('2. Run: pnpm build --filter=app');
console.log('3. Check build logs for specific errors');
console.log('4. Verify all workspace packages are available');

console.log('\n📝 For more help, check the GitHub Actions logs or run:');
console.log('   pnpm build --filter=app --verbose');
