#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function checkFilesExist() {
  const backendFiles = [
    'src/index.ts',
    'src/db/init.ts',
    'src/models/Device.ts',
    'src/models/Team.ts',
    'src/models/Phone.ts',
    'src/models/User.ts',
    'src/routes/auth.ts',
    'src/routes/devices.ts',
    'src/routes/teams.ts',
    'src/routes/phones.ts',
  ];

  const frontendFiles = [
    'src/App.tsx',
    'src/main.tsx',
    'src/components/PhoneManagement.tsx',
  ];

  console.log('Checking backend files...');
  let backendErrors = 0;
  for (const file of backendFiles) {
    const filePath = path.join(__dirname, 'backend', file);
    if (fs.existsSync(filePath)) {
      console.log(`✓ ${file}`);
    } else {
      console.log(`✗ ${file} - NOT FOUND`);
      backendErrors++;
    }
  }

  console.log('\nChecking frontend files...');
  let frontendErrors = 0;
  for (const file of frontendFiles) {
    const filePath = path.join(__dirname, 'frontend', file);
    if (fs.existsSync(filePath)) {
      console.log(`✓ ${file}`);
    } else {
      console.log(`✗ ${file} - NOT FOUND`);
      frontendErrors++;
    }
  }

  if (backendErrors === 0 && frontendErrors === 0) {
    console.log('\n✅ All required files are present!');
    return true;
  } else {
    console.log('\n❌ Some files are missing!');
    return false;
  }
}

function checkPackageJson() {
  console.log('\nChecking package.json files...');
  
  const backendPackagePath = path.join(__dirname, 'backend', 'package.json');
  const frontendPackagePath = path.join(__dirname, 'frontend', 'package.json');
  
  if (fs.existsSync(backendPackagePath)) {
    console.log('✓ backend/package.json exists');
  } else {
    console.log('✗ backend/package.json - NOT FOUND');
  }
  
  if (fs.existsSync(frontendPackagePath)) {
    console.log('✓ frontend/package.json exists');
  } else {
    console.log('✗ frontend/package.json - NOT FOUND');
  }
}

function main() {
  console.log('UC Inventory System - File Structure Check');
  console.log('============================================');
  
  const filesOk = checkFilesExist();
  checkPackageJson();
  
  if (filesOk) {
    console.log('\n🎉 Project structure is complete!');
    console.log('\nNext steps:')
    console.log('1. Install dependencies: npm install (in both backend and frontend directories)');
    console.log('2. Build backend: npm run build (in backend directory)');
    console.log('3. Start backend: npm start (in backend directory)');
    console.log('4. Start frontend: npm run dev (in frontend directory)');
    console.log('5. Access the application at http://localhost:3000');
  } else {
    console.log('\n⚠️  Project structure is incomplete. Please check the missing files.');
    process.exit(1);
  }
}

main();
