#!/usr/bin/env node

/**
 * Deployment Readiness Check Script
 * Verifies that the application is ready for production deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🚀 Crash Game Frontend - Deployment Readiness Check\n');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function checkPassed(message) {
  console.log(`✅ ${message}`);
  checks.passed++;
}

function checkFailed(message) {
  console.log(`❌ ${message}`);
  checks.failed++;
}

function checkWarning(message) {
  console.log(`⚠️  ${message}`);
  checks.warnings++;
}

// Check 1: Build artifacts exist
console.log('📦 Checking build artifacts...');
const distPath = path.join(projectRoot, 'dist');
if (fs.existsSync(distPath)) {
  checkPassed('Build directory exists');
  
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    checkPassed('index.html exists');
  } else {
    checkFailed('index.html missing');
  }
  
  const assetsPath = path.join(distPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    checkPassed('Assets directory exists');
    
    // Check JS files in assets/js subdirectory
    const jsPath = path.join(assetsPath, 'js');
    if (fs.existsSync(jsPath)) {
      const jsFiles = fs.readdirSync(jsPath).filter(f => f.endsWith('.js') && !f.endsWith('.gz') && !f.endsWith('.br'));
      if (jsFiles.length > 0) {
        checkPassed(`JavaScript files found (${jsFiles.length})`);
      } else {
        checkFailed('No JavaScript files found');
      }
    } else {
      // Fallback: check in main assets directory
      const files = fs.readdirSync(assetsPath);
      const jsFiles = files.filter(f => f.endsWith('.js'));
      if (jsFiles.length > 0) {
        checkPassed(`JavaScript files found (${jsFiles.length})`);
      } else {
        checkFailed('No JavaScript files found');
      }
    }
    
    // Check CSS files in assets/css subdirectory
    const cssPath = path.join(assetsPath, 'css');
    if (fs.existsSync(cssPath)) {
      const cssFiles = fs.readdirSync(cssPath).filter(f => f.endsWith('.css') && !f.endsWith('.gz') && !f.endsWith('.br'));
      if (cssFiles.length > 0) {
        checkPassed(`CSS files found (${cssFiles.length})`);
      } else {
        checkFailed('No CSS files found');
      }
    } else {
      // Fallback: check in main assets directory
      const files = fs.readdirSync(assetsPath);
      const cssFiles = files.filter(f => f.endsWith('.css'));
      if (cssFiles.length > 0) {
        checkPassed(`CSS files found (${cssFiles.length})`);
      } else {
        checkFailed('No CSS files found');
      }
    }
  } else {
    checkFailed('Assets directory missing');
  }
} else {
  checkFailed('Build directory missing - run npm run build first');
}

// Check 2: Environment configuration
console.log('\n🔧 Checking environment configuration...');
const envProdPath = path.join(projectRoot, '.env.production');
if (fs.existsSync(envProdPath)) {
  checkPassed('Production environment file exists');
  
  const envContent = fs.readFileSync(envProdPath, 'utf8');
  const requiredVars = [
    'VITE_API_URL',
    'VITE_WALLET_API_URL',
    'VITE_KEYCLOAK_URL',
    'VITE_KEYCLOAK_REALM',
    'VITE_KEYCLOAK_CLIENT_ID',
    'VITE_WS_URL'
  ];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      checkPassed(`${varName} configured`);
    } else {
      checkFailed(`${varName} missing`);
    }
  });
} else {
  checkWarning('Production environment file missing');
}

// Check 3: Package.json scripts
console.log('\n📋 Checking package.json scripts...');
const packagePath = path.join(projectRoot, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredScripts = ['build', 'preview', 'test', 'lint'];
  
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      checkPassed(`${script} script exists`);
    } else {
      checkFailed(`${script} script missing`);
    }
  });
} else {
  checkFailed('package.json missing');
}

// Check 4: Deployment configuration files
console.log('\n🌐 Checking deployment configuration...');
const deploymentFiles = [
  { name: 'vercel.json', required: false },
  { name: 'netlify.toml', required: false },
  { name: 'Dockerfile', required: false },
  { name: 'nginx.conf', required: false }
];

deploymentFiles.forEach(file => {
  const filePath = path.join(projectRoot, file.name);
  if (fs.existsSync(filePath)) {
    checkPassed(`${file.name} exists`);
  } else if (file.required) {
    checkFailed(`${file.name} missing`);
  } else {
    checkWarning(`${file.name} not found (optional)`);
  }
});

// Check 5: Security files
console.log('\n🔒 Checking security configuration...');
const securityFiles = [
  '.env.example',
  'docs/DEPLOYMENT_GUIDE.md',
  'docs/DEPLOYMENT_CHECKLIST.md'
];

securityFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    checkPassed(`${file} exists`);
  } else {
    checkWarning(`${file} missing`);
  }
});

// Check 6: Bundle size analysis
console.log('\n📊 Analyzing bundle size...');
if (fs.existsSync(distPath)) {
  const getDirectorySize = (dirPath) => {
    let totalSize = 0;
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        totalSize += getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    });
    
    return totalSize;
  };
  
  const totalSize = getDirectorySize(distPath);
  const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  if (totalSize < 5 * 1024 * 1024) { // 5MB
    checkPassed(`Bundle size: ${sizeMB}MB (within limits)`);
  } else if (totalSize < 10 * 1024 * 1024) { // 10MB
    checkWarning(`Bundle size: ${sizeMB}MB (consider optimization)`);
  } else {
    checkFailed(`Bundle size: ${sizeMB}MB (too large)`);
  }
}

// Final summary
console.log('\n📋 Deployment Readiness Summary');
console.log('================================');
console.log(`✅ Passed: ${checks.passed}`);
console.log(`❌ Failed: ${checks.failed}`);
console.log(`⚠️  Warnings: ${checks.warnings}`);

if (checks.failed === 0) {
  console.log('\n🎉 Application is ready for deployment!');
  
  console.log('\n🚀 Next steps:');
  console.log('1. Deploy to staging environment');
  console.log('2. Run smoke tests');
  console.log('3. Deploy to production');
  console.log('4. Monitor application health');
  
  process.exit(0);
} else {
  console.log('\n🚨 Application is NOT ready for deployment!');
  console.log('Please fix the failed checks before deploying.');
  process.exit(1);
}