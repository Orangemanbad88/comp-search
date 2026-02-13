/**
 * RETS Connection Test Script
 * Run with: node scripts/test-rets.js
 */

require('dotenv').config({ path: '.env.local' });

const RETS_URL = process.env.MLS_RETS_URL;
const USERNAME = process.env.MLS_USERNAME;
const PASSWORD = process.env.MLS_PASSWORD;
const USER_AGENT = process.env.MLS_USER_AGENT || 'CompSearch/1.0';

async function testRetsConnection() {
  console.log('Testing RETS Connection...');
  console.log('URL:', RETS_URL);
  console.log('Username:', USERNAME);
  console.log('User-Agent:', USER_AGENT);
  console.log('---');

  if (!RETS_URL || !USERNAME || !PASSWORD) {
    console.error('Missing credentials in .env.local');
    process.exit(1);
  }

  try {
    // RETS uses HTTP Basic or Digest auth
    const authHeader = 'Basic ' + Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

    console.log('Attempting connection...');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(RETS_URL, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Authorization': authHeader,
        'Accept': '*/*',
        'RETS-Version': 'RETS/1.5',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    console.log('Status:', response.status, response.statusText);
    console.log('Headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    const body = await response.text();
    console.log('\nResponse body (first 1500 chars):');
    console.log(body.substring(0, 1500));

    if (response.status === 200) {
      console.log('\n✓ Connection successful!');

      if (body.includes('RETS') || body.includes('rets')) {
        console.log('✓ Valid RETS server response');
      }
    } else if (response.status === 401) {
      console.log('\n✗ Authentication failed - check username/password');
    } else {
      console.log('\n? Unexpected response - see details above');
    }

  } catch (error) {
    console.error('\n✗ Connection failed:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause.message || error.cause);
    }
    console.log('\nTrying with http module...');
    await tryWithHttp();
  }
}

async function tryWithHttp() {
  const http = require('http');
  const url = new URL(RETS_URL);

  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

  const options = {
    hostname: url.hostname,
    port: url.port || 80,
    path: url.pathname + url.search,
    method: 'GET',
    headers: {
      'User-Agent': USER_AGENT,
      'Authorization': `Basic ${auth}`,
      'RETS-Version': 'RETS/1.5',
    },
  };

  console.log('HTTP request to:', url.hostname, url.pathname);

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      console.log('Status:', res.statusCode, res.statusMessage);
      console.log('Headers:', JSON.stringify(res.headers, null, 2));

      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('\nResponse (first 1500 chars):');
        console.log(data.substring(0, 1500));

        if (res.statusCode === 200) {
          console.log('\n✓ Connection successful!');
        } else if (res.statusCode === 401) {
          console.log('\n✗ Auth failed - might need Digest auth instead of Basic');
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error('HTTP error:', e.message);
      resolve();
    });

    req.setTimeout(15000, () => {
      console.error('Request timed out');
      req.destroy();
      resolve();
    });

    req.end();
  });
}

testRetsConnection();
