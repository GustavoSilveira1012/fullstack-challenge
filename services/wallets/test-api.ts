/**
 * Manual API Testing Script
 * 
 * This script tests the wallet service API endpoints manually.
 */

import jwt from 'jsonwebtoken';
import { environmentConfig } from './src/infrastructure/config/environment.config';

// Generate a valid JWT token
function generateValidJWT(playerId: string): string {
  return jwt.sign(
    { sub: playerId },
    environmentConfig.jwtSecret,
    {
      issuer: environmentConfig.jwtIssuer,
      expiresIn: '1h',
    }
  );
}

async function testAPI() {
  const playerId = 'test-player-123';
  const token = generateValidJWT(playerId);
  const baseUrl = 'http://localhost:3001';

  console.log('=== Wallet Service API Testing ===\n');
  console.log(`Player ID: ${playerId}`);
  console.log(`JWT Token: ${token.substring(0, 50)}...\n`);

  // Test 1: Health Check
  console.log('1. Testing GET /health');
  try {
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Response:`, healthData);
    console.log('   ✅ Health check passed\n');
  } catch (error) {
    console.error('   ❌ Health check failed:', error);
  }

  // Test 2: Create Wallet
  console.log('2. Testing POST /wallets (Create Wallet)');
  try {
    const createResponse = await fetch(`${baseUrl}/wallets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const createData = await createResponse.json();
    console.log(`   Status: ${createResponse.status}`);
    console.log(`   Response:`, createData);
    if (createResponse.status === 201) {
      console.log('   ✅ Wallet created successfully\n');
    } else {
      console.log('   ⚠️  Unexpected status code\n');
    }
  } catch (error) {
    console.error('   ❌ Create wallet failed:', error);
  }

  // Test 3: Get Wallet
  console.log('3. Testing GET /wallets/me (Get Wallet)');
  try {
    const getResponse = await fetch(`${baseUrl}/wallets/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const getData = await getResponse.json();
    console.log(`   Status: ${getResponse.status}`);
    console.log(`   Response:`, getData);
    if (getResponse.status === 200) {
      console.log('   ✅ Wallet retrieved successfully\n');
    } else {
      console.log('   ⚠️  Unexpected status code\n');
    }
  } catch (error) {
    console.error('   ❌ Get wallet failed:', error);
  }

  // Test 4: Try to create wallet again (should fail)
  console.log('4. Testing POST /wallets again (Should fail - wallet already exists)');
  try {
    const createAgainResponse = await fetch(`${baseUrl}/wallets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const createAgainData = await createAgainResponse.json();
    console.log(`   Status: ${createAgainResponse.status}`);
    console.log(`   Response:`, createAgainData);
    if (createAgainResponse.status === 409) {
      console.log('   ✅ Correctly rejected duplicate wallet creation\n');
    } else {
      console.log('   ⚠️  Unexpected status code\n');
    }
  } catch (error) {
    console.error('   ❌ Test failed:', error);
  }

  console.log('=== API Testing Complete ===');
}

// Run the tests
testAPI().catch(console.error);
