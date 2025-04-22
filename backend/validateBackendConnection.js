const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

async function checkEndpoint(path) {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) {
      console.error(`Failed: ${path} - Status: ${res.status}`);
      return false;
    }
    const data = await res.json();
    console.log(`Success: ${path} - Response sample:`, JSON.stringify(data).substring(0, 100));
    return true;
  } catch (error) {
    console.error(`Error calling ${path}:`, error.message);
    return false;
  }
}

async function validateBackend() {
  console.log('Validating backend connection...');
  const endpoints = [
    '/ping',
    '/mode1/metrics',
    '/mode2/metrics',
    '/mode3/metrics',
    '/mode4/metrics'
  ];

  for (const ep of endpoints) {
    const result = await checkEndpoint(ep);
    if (!result) {
      console.error(`Validation failed for endpoint: ${ep}`);
    }
  }
  console.log('Validation complete.');
}

validateBackend();
