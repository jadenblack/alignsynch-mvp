#!/usr/bin/env node

/**
 * Promote a Vercel deployment to production
 * This removes the authentication protection and gives you a clean URL
 */

import https from 'https';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const DEPLOYMENT_URL = 'alignsynch-test-jsofvtf02-ventureio.vercel.app';

if (!VERCEL_TOKEN) {
  console.error('❌ Missing VERCEL_TOKEN environment variable');
  console.error('   Get your token from: https://vercel.com/account/tokens');
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
 * Get deployment by URL
 */
async function getDeploymentByUrl(url) {
  try {
    console.log(`🔍 Finding deployment for: ${url}`);
    const deployments = await makeRequest('GET', '/v6/deployments');
    
    const deployment = deployments.deployments.find(d => d.url === url);
    if (!deployment) {
      throw new Error(`Deployment not found for URL: ${url}`);
    }
    
    console.log(`✅ Found deployment: ${deployment.uid}`);
    return deployment;
  } catch (error) {
    console.error('❌ Failed to find deployment:', error.message);
    throw error;
  }
}

/**
 * Promote deployment to production
 */
async function promoteToProduction(deploymentId) {
  try {
    console.log('🚀 Promoting deployment to production...');
    
    const result = await makeRequest('PATCH', `/v13/deployments/${deploymentId}`, {
      target: 'production'
    });
    
    console.log('✅ Deployment promoted to production!');
    return result;
  } catch (error) {
    console.error('❌ Failed to promote deployment:', error.message);
    throw error;
  }
}

/**
 * Set custom domain (optional)
 */
async function setCustomDomain(projectId, domain) {
  try {
    console.log(`🌐 Setting custom domain: ${domain}`);
    
    const result = await makeRequest('POST', `/v9/projects/${projectId}/domains`, {
      name: domain
    });
    
    console.log('✅ Custom domain set!');
    return result;
  } catch (error) {
    console.error('❌ Failed to set custom domain:', error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🎯 Promoting Vercel deployment to production...');
    
    // Find the deployment
    const deployment = await getDeploymentByUrl(DEPLOYMENT_URL);
    
    // Promote to production
    await promoteToProduction(deployment.uid);
    
    console.log('🎉 Success! Your deployment is now live at:');
    console.log(`🌐 https://alignsynch-test.vercel.app`);
    console.log('');
    console.log('The authentication protection has been removed.');
    
  } catch (error) {
    console.error('💥 Failed to promote deployment:', error.message);
    console.error('');
    console.error('💡 Alternative solutions:');
    console.error('   1. Go to Vercel dashboard and promote manually');
    console.error('   2. Disable deployment protection in project settings');
    console.error('   3. Create a new production deployment');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { getDeploymentByUrl, promoteToProduction };
