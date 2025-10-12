#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);
const setupType = args[0]; // 'local' or 'prod'
const domain = args[1]; // Optional domain for production

if (!setupType || !['local', 'prod'].includes(setupType)) {
  console.log('❌ Usage: node setup-env.js [local|prod] [domain]');
  console.log('   local - Create .env.local for development');
  console.log('   prod  - Create .env.production for VPS deployment');
  console.log('   domain - Optional domain name (default: flipychat.com)');
  process.exit(1);
}

const sourceFile = 'env.example';
const targetFile = setupType === 'local' ? 'local.env' : '.env.production';

try {
  // Check if source file exists
  if (!fs.existsSync(sourceFile)) {
    console.log(`❌ Source file ${sourceFile} not found!`);
    process.exit(1);
  }

  let content = fs.readFileSync(sourceFile, 'utf8');
  
  if (setupType === 'prod') {
    const productionDomain = domain || 'flipychat.com';
    
    // Replace the template content with production-specific values
    content = `# Production Environment Configuration for ${productionDomain}
NODE_ENV=production
PORT=3001

# Domain Configuration
DOMAIN=${productionDomain}
USE_HTTPS=true

# Production URLs
FRONTEND_URL=https://${productionDomain}
BACKEND_URL=https://${productionDomain}
CORS_ORIGIN=https://${productionDomain}

# Database Configuration
DATABASE_URL=mongodb://localhost:27017/chat-app-prod

# JWT Secret (use a secure secret in production)
JWT_SECRET=your-super-secure-production-secret-key-change-this

# Additional CORS Origins
ADDITIONAL_CORS_ORIGINS=https://${productionDomain},http://${productionDomain},https://www.${productionDomain},http://www.${productionDomain}

# Next.js Public API URL
NEXT_PUBLIC_API_URL=https://${productionDomain}/api

# SSL Configuration (if using custom SSL certificates)
# SSL_CERT_PATH=/path/to/ssl/cert.pem
# SSL_KEY_PATH=/path/to/ssl/private.key
`;
  }
  
  // Write the file
  fs.writeFileSync(targetFile, content);
  
  console.log(`✅ ${setupType === 'local' ? 'Local development' : 'Production'} environment file created: ${targetFile}`);
  console.log('');
  
  if (setupType === 'local') {
    console.log('🏠 Local Development Setup:');
    console.log('   - Environment file: local.env');
    console.log('   - Frontend: http://localhost:3000');
    console.log('   - Backend: http://localhost:3001');
    console.log('   - API: http://localhost:3001/api');
    console.log('');
    console.log('To start: npm run dev:local');
    console.log('To start production build: npm run start:local');
  } else {
    const productionDomain = domain || 'flipychat.com';
    console.log(`🌐 VPS Production Setup for ${productionDomain}:`);
    console.log('   ✅ Environment configured with:');
    console.log(`   - Domain: ${productionDomain}`);
    console.log(`   - Frontend: https://${productionDomain}`);
    console.log(`   - Backend: https://${productionDomain}`);
    console.log(`   - API: https://${productionDomain}/api`);
    console.log('');
    console.log('   ⚠️  IMPORTANT: Change the JWT_SECRET in .env.production!');
    console.log('   Generate a secure secret: openssl rand -base64 32');
    console.log('');
    console.log('   Next steps:');
    console.log('   1. Update JWT_SECRET in .env.production');
    console.log('   2. Build: npm run build');
    console.log('   3. Start: npm run start:domain');
    console.log('');
    console.log('For detailed instructions, see VPS_DEPLOYMENT_GUIDE.md');
  }
  
} catch (error) {
  console.log(`❌ Error creating ${targetFile}:`, error.message);
  process.exit(1);
}
