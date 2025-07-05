#!/usr/bin/env node

/**
 * Vercel API Deployment Script
 * Provides full CI/CD control using Vercel's REST API
 */

import https from 'https';
import fs from 'fs';
import path from 'path';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_ORG_ID = process.env.VERCEL_ORG_ID;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;

if (!VERCEL_TOKEN || !VERCEL_ORG_ID || !VERCEL_PROJECT_ID) {
  console.error('❌ Missing required environment variables:');
  console.error('   VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID');
  process.exit(1);
}

/**
 * Make API request to Vercel
 */
function makeRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: endpoint,
      method: method,
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`API Error: ${res.statusCode} - ${parsed.error?.message || body}`));
          }
        } catch (e) {
          reject(new Error(`Parse Error: ${body}`));
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Create a new deployment
 */
async function createDeployment() {
  console.log('🚀 Creating deployment...');
  
  const deploymentData = {
    name: 'alignsynch-mvp',
    files: [],
    projectSettings: {
      framework: 'nextjs',
      buildCommand: 'cd ../.. && pnpm build --filter=app',
      installCommand: 'corepack enable && corepack prepare pnpm@latest --activate && cd ../.. && pnpm install --frozen-lockfile',
      outputDirectory: '.next',
    },
    target: 'production',
  };

  try {
    const deployment = await makeRequest('POST', `/v13/deployments`, deploymentData);
    console.log('✅ Deployment created:', deployment.url);
    return deployment;
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    throw error;
  }
}

/**
 * Get deployment status
 */
async function getDeploymentStatus(deploymentId) {
  try {
    const deployment = await makeRequest('GET', `/v13/deployments/${deploymentId}`);
    return deployment;
  } catch (error) {
    console.error('❌ Failed to get deployment status:', error.message);
    throw error;
  }
}

/**
 * Wait for deployment to complete
 */
async function waitForDeployment(deploymentId) {
  console.log('⏳ Waiting for deployment to complete...');
  
  let attempts = 0;
  const maxAttempts = 60; // 10 minutes max
  
  while (attempts < maxAttempts) {
    const deployment = await getDeploymentStatus(deploymentId);
    
    console.log(`📊 Status: ${deployment.readyState} (${deployment.state})`);
    
    if (deployment.readyState === 'READY') {
      console.log('✅ Deployment completed successfully!');
      console.log(`🌐 URL: https://${deployment.url}`);
      return deployment;
    }
    
    if (deployment.readyState === 'ERROR') {
      console.error('❌ Deployment failed');
      throw new Error('Deployment failed');
    }
    
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    attempts++;
  }
  
  throw new Error('Deployment timeout');
}

/**
 * Set environment variables
 */
async function setEnvironmentVariables(envVars) {
  console.log('🔧 Setting environment variables...');
  
  for (const [key, value] of Object.entries(envVars)) {
    try {
      await makeRequest('POST', `/v9/projects/${VERCEL_PROJECT_ID}/env`, {
        key,
        value,
        type: 'encrypted',
        target: ['production', 'preview', 'development'],
      });
      console.log(`✅ Set ${key}`);
    } catch (error) {
      console.log(`⚠️  ${key} might already exist: ${error.message}`);
    }
  }
}

/**
 * Main deployment function
 */
async function main() {
  try {
    console.log('🎯 Starting Vercel deployment...');
    
    // Optional: Set environment variables
    const envVars = {
      // Add your environment variables here
      // 'CLERK_SECRET_KEY': 'your-value',
      // 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY': 'your-value',
    };
    
    if (Object.keys(envVars).length > 0) {
      await setEnvironmentVariables(envVars);
    }
    
    // Create deployment
    const deployment = await createDeployment();
    
    // Wait for completion
    const finalDeployment = await waitForDeployment(deployment.id);
    
    console.log('🎉 Deployment successful!');
    console.log(`🌐 Production URL: https://${finalDeployment.url}`);
    
  } catch (error) {
    console.error('💥 Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createDeployment, waitForDeployment, setEnvironmentVariables };
