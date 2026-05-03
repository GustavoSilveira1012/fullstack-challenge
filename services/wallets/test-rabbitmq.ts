/**
 * Manual RabbitMQ Event Testing Script
 * 
 * This script publishes test events to RabbitMQ to verify the wallet service
 * correctly processes bet placed, cashout, and bet lost events.
 */

import amqp from 'amqplib';
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

async function testRabbitMQ() {
  console.log('=== RabbitMQ Event Testing ===\n');

  // Connect to RabbitMQ
  console.log('Connecting to RabbitMQ...');
  const connection = await amqp.connect(environmentConfig.rabbitmqUrl);
  const channel = await connection.createChannel();
  console.log('✅ Connected to RabbitMQ\n');

  // Ensure exchange exists
  await channel.assertExchange('game.events', 'topic', { durable: true });

  const playerId = 'test-player-rabbitmq';
  const token = generateValidJWT(playerId);
  const baseUrl = 'http://localhost:3001';

  // Step 1: Create a wallet for testing
  console.log('1. Creating wallet for testing...');
  const createResponse = await fetch(`${baseUrl}/wallets`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const walletData = await createResponse.json();
  console.log(`   Wallet created: ${walletData.id}`);
  console.log(`   Initial balance: ${walletData.balance} centavos\n`);

  // Step 2: Credit the wallet with a cashout event (add 50000 centavos = 500 currency units)
  console.log('2. Publishing Cashout Event (credit 50000 centavos)...');
  const cashoutEvent = {
    eventId: crypto.randomUUID(),
    playerId: playerId,
    betId: crypto.randomUUID(),
    amount: '50000',
    multiplier: '2.50',
    timestamp: new Date().toISOString(),
  };
  await channel.publish(
    'game.events',
    'bet.cashout',
    Buffer.from(JSON.stringify(cashoutEvent))
  );
  console.log('   Event published:', cashoutEvent);
  
  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check balance
  let getResponse = await fetch(`${baseUrl}/wallets/me`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  let currentWallet = await getResponse.json();
  console.log(`   New balance: ${currentWallet.balance} centavos`);
  console.log(`   ✅ Balance updated correctly\n`);

  // Step 3: Debit the wallet with a bet placed event (debit 10000 centavos = 100 currency units)
  console.log('3. Publishing Bet Placed Event (debit 10000 centavos)...');
  const betPlacedEvent = {
    eventId: crypto.randomUUID(),
    playerId: playerId,
    betId: crypto.randomUUID(),
    amount: '10000',
    timestamp: new Date().toISOString(),
  };
  await channel.publish(
    'game.events',
    'bet.placed',
    Buffer.from(JSON.stringify(betPlacedEvent))
  );
  console.log('   Event published:', betPlacedEvent);
  
  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check balance
  getResponse = await fetch(`${baseUrl}/wallets/me`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  currentWallet = await getResponse.json();
  console.log(`   New balance: ${currentWallet.balance} centavos`);
  console.log(`   Expected: 40000 centavos (50000 - 10000)`);
  if (currentWallet.balance === '40000') {
    console.log(`   ✅ Balance updated correctly\n`);
  } else {
    console.log(`   ❌ Balance mismatch!\n`);
  }

  // Step 4: Publish a bet lost event (should not change balance)
  console.log('4. Publishing Bet Lost Event (should not change balance)...');
  const betLostEvent = {
    eventId: crypto.randomUUID(),
    playerId: playerId,
    betId: betPlacedEvent.betId, // Same bet ID
    amount: '10000',
    timestamp: new Date().toISOString(),
  };
  await channel.publish(
    'game.events',
    'bet.lost',
    Buffer.from(JSON.stringify(betLostEvent))
  );
  console.log('   Event published:', betLostEvent);
  
  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check balance
  getResponse = await fetch(`${baseUrl}/wallets/me`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  currentWallet = await getResponse.json();
  console.log(`   Balance: ${currentWallet.balance} centavos`);
  console.log(`   Expected: 40000 centavos (unchanged)`);
  if (currentWallet.balance === '40000') {
    console.log(`   ✅ Balance unchanged correctly\n`);
  } else {
    console.log(`   ❌ Balance changed unexpectedly!\n`);
  }

  // Step 5: Try to debit more than available balance (should fail)
  console.log('5. Publishing Bet Placed Event with insufficient balance (debit 50000 centavos)...');
  const insufficientBetEvent = {
    eventId: crypto.randomUUID(),
    playerId: playerId,
    betId: crypto.randomUUID(),
    amount: '50000',
    timestamp: new Date().toISOString(),
  };
  await channel.publish(
    'game.events',
    'bet.placed',
    Buffer.from(JSON.stringify(insufficientBetEvent))
  );
  console.log('   Event published:', insufficientBetEvent);
  
  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check balance (should be unchanged)
  getResponse = await fetch(`${baseUrl}/wallets/me`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  currentWallet = await getResponse.json();
  console.log(`   Balance: ${currentWallet.balance} centavos`);
  console.log(`   Expected: 40000 centavos (unchanged due to insufficient balance)`);
  if (currentWallet.balance === '40000') {
    console.log(`   ✅ Insufficient balance handled correctly\n`);
  } else {
    console.log(`   ❌ Balance changed unexpectedly!\n`);
  }

  // Cleanup
  await channel.close();
  await connection.close();
  console.log('=== RabbitMQ Event Testing Complete ===');
}

// Run the tests
testRabbitMQ().catch(console.error);
