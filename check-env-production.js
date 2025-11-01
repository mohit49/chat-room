/**
 * Check Environment Variables on Production Server
 * Run this on your production server to verify .env.production is loaded correctly
 * Usage: NODE_ENV=production node check-env-production.js
 */

require('dotenv').config({ 
  path: process.env.NODE_ENV === 'production' ? '.env.production' : 'local.env' 
});

console.log('\n🔍 Environment Variable Check\n');
console.log('='.repeat(60));
console.log(`\n📂 Current Directory: ${process.cwd()}`);
console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV || 'NOT SET (defaulting to development)'}`);
console.log(`📄 Loading from: ${process.env.NODE_ENV === 'production' ? '.env.production' : 'local.env'}`);

console.log('\n📧 Email Configuration:');
console.log('─'.repeat(60));

const emailVars = [
  'EMAIL_HOST',
  'EMAIL_PORT', 
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'EMAIL_FROM'
];

let allSet = true;

emailVars.forEach(varName => {
  const value = process.env[varName];
  if (varName === 'EMAIL_PASSWORD') {
    if (value) {
      console.log(`✅ ${varName}: ***SET*** (length: ${value.length}, last 4: ***${value.slice(-4)})`);
      console.log(`   Contains special chars: ${/[^a-zA-Z0-9]/.test(value) ? 'YES' : 'NO'}`);
      console.log(`   First char: "${value.charAt(0)}", Last char: "${value.charAt(value.length - 1)}"`);
    } else {
      console.log(`❌ ${varName}: NOT SET`);
      allSet = false;
    }
  } else if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allSet = false;
  }
});

console.log('\n' + '='.repeat(60));

if (allSet) {
  console.log('✅ All email environment variables are set!\n');
  
  // Test the exact credentials that will be used
  console.log('📋 Credentials that will be used for SMTP:');
  console.log(`   User: ${process.env.EMAIL_USER}`);
  console.log(`   Password length: ${process.env.EMAIL_PASSWORD?.length} characters`);
  
} else {
  console.log('❌ Some email environment variables are missing!\n');
  console.log('💡 Troubleshooting:');
  console.log('   1. Check if .env.production exists in the current directory');
  console.log('   2. Verify NODE_ENV=production is set');
  console.log('   3. Check file permissions on .env.production');
  console.log('   4. Verify no syntax errors in .env.production\n');
}

// Check if .env.production exists
const fs = require('fs');
const path = require('path');

const prodEnvPath = path.join(process.cwd(), '.env.production');
const localEnvPath = path.join(process.cwd(), 'local.env');

console.log('\n📁 File Existence Check:');
console.log('─'.repeat(60));
console.log(`.env.production exists: ${fs.existsSync(prodEnvPath) ? '✅ YES' : '❌ NO'}`);
console.log(`local.env exists: ${fs.existsSync(localEnvPath) ? '✅ YES' : '❌ NO'}`);

if (fs.existsSync(prodEnvPath)) {
  console.log(`\n📄 .env.production file info:`);
  const stats = fs.statSync(prodEnvPath);
  console.log(`   Size: ${stats.size} bytes`);
  console.log(`   Last modified: ${stats.mtime}`);
  
  // Read and show email-related lines (without password)
  const content = fs.readFileSync(prodEnvPath, 'utf-8');
  const emailLines = content.split('\n').filter(line => 
    line.startsWith('EMAIL_') && !line.startsWith('EMAIL_PASSWORD')
  );
  
  if (emailLines.length > 0) {
    console.log(`\n📧 Email config lines in .env.production:`);
    emailLines.forEach(line => console.log(`   ${line}`));
  }
}

console.log('\n' + '='.repeat(60) + '\n');

