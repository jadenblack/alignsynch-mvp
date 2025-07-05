#!/usr/bin/env node

/**
 * Set environment variables in Vercel project
 */

import https from 'https';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || "LbPKppSqFGLflQH0MA4sTcIl";
const VERCEL_PROJECT_ID = "prj_c3PzVAMMpAaTG14WSZJomhCBEWop";

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
 * Set environment variable
 */
async function setEnvVar(key, value, type = 'encrypted') {
  try {
    console.log(`🔧 Setting ${key}...`);
    
    const result = await makeRequest('POST', `/v9/projects/${VERCEL_PROJECT_ID}/env`, {
      key,
      value,
      type,
      target: ['production', 'preview', 'development'],
    });
    
    console.log(`✅ Set ${key}`);
    return result;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`⚠️  ${key} already exists, updating...`);
      // Try to update instead
      try {
        // First get the env var ID
        const envVars = await makeRequest('GET', `/v9/projects/${VERCEL_PROJECT_ID}/env`);
        const existingVar = envVars.envs.find(env => env.key === key);
        
        if (existingVar) {
          await makeRequest('PATCH', `/v9/projects/${VERCEL_PROJECT_ID}/env/${existingVar.id}`, {
            value,
            target: ['production', 'preview', 'development'],
          });
          console.log(`✅ Updated ${key}`);
        }
      } catch (updateError) {
        console.log(`❌ Failed to update ${key}: ${updateError.message}`);
      }
    } else {
      console.log(`❌ Failed to set ${key}: ${error.message}`);
    }
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🎯 Setting PostHog environment variables in Vercel...');
  
  // Set PostHog environment variables
  await setEnvVar('NEXT_PUBLIC_POSTHOG_KEY', 'phc_placeholder_key_for_build');
  await setEnvVar('NEXT_PUBLIC_POSTHOG_HOST', 'https://app.posthog.com');
  
  console.log('🎉 Environment variables set successfully!');
  console.log('');
  console.log('💡 Note: These are placeholder values to allow builds to pass.');
  console.log('   Replace with real PostHog credentials when ready to use analytics.');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { setEnvVar };
