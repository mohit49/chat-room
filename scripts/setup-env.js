#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);
const setupType = args[0]; // 'local' or 'prod'

if (!setupType || !['local', 'prod'].includes(setupType)) {
  console.log('❌ Usage: node setup-env.js [local|prod]');
  console.log('   local - Create .env.local for development');
  console.log('   prod  - Create .env.production for VPS deployment');
  process.exit(1);
}

const sourceFile = 'env.example';
const targetFile = setupType === 'local' ? '.env.local' : '.env.production';

try {
  // Check if source file exists
  if (!fs.existsSync(sourceFile)) {
    console.log(`❌ Source file ${sourceFile} not found!`);
    process.exit(1);
  }

  // Copy the file
  fs.copyFileSync(sourceFile, targetFile);
  
  console.log(`✅ ${setupType === 'local' ? 'Local development' : 'Production'} environment file created: ${targetFile}`);
  console.log('');
  
  if (setupType === 'local') {
    console.log('🏠 Local Development Setup:');
    console.log('   - Frontend: http://localhost:3000');
    console.log('   - Backend: http://localhost:3001');
    console.log('   - API: http://localhost:3001/api');
    console.log('');
    console.log('To start: npm run dev:local');
  } else {
    console.log('🌐 VPS Production Setup:');
    console.log('   Next steps:');
    console.log('   1. Edit .env.production with your domain settings');
    console.log('   2. Build: npm run build');
    console.log('   3. Start: npm run start:domain');
    console.log('');
    console.log('For detailed instructions, see VPS_DEPLOYMENT_GUIDE.md');
  }
  
} catch (error) {
  console.log(`❌ Error creating ${targetFile}:`, error.message);
  process.exit(1);
}
