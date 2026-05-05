// Simple test script to check wallet API response format
const fetch = require('node-fetch');

async function testWalletAPI() {
  try {
    // Test with a dummy token (this will fail auth but show us the response format)
    const response = await fetch('http://localhost:8000/wallets/me', {
      headers: {
        'Authorization': 'Bearer dummy-token'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response body:', text);
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      try {
        const json = JSON.parse(text);
        console.log('Parsed JSON:', json);
      } catch (e) {
        console.log('Failed to parse JSON:', e.message);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testWalletAPI();