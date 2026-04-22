#!/usr/bin/env node
/**
 * Start all wiki services: API server + Web mirror
 */

const { spawn } = require('child_process');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');

async function startServices() {
  console.log('🚀 Starting Wiki Engine Services...\n');
  
  // Start API server on port 4488
  const apiProcess = spawn('node', ['server/index.js'], {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
  });
  
  // Wait a moment for API to start
  await new Promise(r => setTimeout(r, 2000));
  
  // Start Web mirror on port 8091
  const webProcess = spawn('node', ['web/server.js'], {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
  });
  
  // Kill all on exit
  process.on('SIGINT', () => {
    console.log('\n\n📭 Shutting down...');
    apiProcess.kill();
    webProcess.kill();
    process.exit(0);
  });
  
  // Wait for both
  await Promise.all([
    new Promise(r => apiProcess.on('exit', r)),
    new Promise(r => webProcess.on('exit', r)),
  ]);
}

startServices().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
