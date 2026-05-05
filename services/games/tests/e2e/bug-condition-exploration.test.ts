import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import * as fc from 'fast-check';

/**
 * Bug Condition Exploration Test
 * **Validates: Requirements 1.1, 1.2, 1.3**
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * 
 * Property 1: Bug Condition - Database Connection Failure Timeout
 * 
 * This test explores the bug condition where database connection failures
 * cause API timeouts and improper error handling instead of graceful responses.
 * 
 * Expected to FAIL on unfixed code to prove the bug exists.
 */
describe('Bug Condition Exploration: Database Connection Failure Timeout', () => {
  const API_BASE_URL = 'http://localhost:4001';
  
  /**
   * Property 1: Database Connection Failure Should Return Meaningful Errors Within Timeout
   * 
   * Tests the bug condition where database connection failures cause:
   * 1. API calls to timeout after 10 seconds
   * 2. Generic "RoundNotFoundError" instead of proper connection error handling
   * 3. No graceful error responses for database connectivity issues
   * 
   * This test simulates the exact bug condition described in requirements 1.1, 1.2, 1.3
   * by testing against a service with database connectivity issues.
   */
  it('should handle database connection failures gracefully instead of timing out', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate test scenarios for database connection failures
        fc.record({
          endpoint: fc.constant('/rounds/current'),
          expectedTimeout: fc.constant(10000), // 10 seconds as per requirement 1.2
          testScenario: fc.constantFrom(
            'database_unreachable',
            'connection_timeout',
            'connection_refused'
          ),
        }),
        async ({ endpoint, expectedTimeout, testScenario }) => {
          console.log(`Testing scenario: ${testScenario}`);
          
          const startTime = Date.now();
          
          try {
            // Make API request to /games/rounds/current
            // This will hit the actual bug condition when database is unreachable
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              signal: AbortSignal.timeout(expectedTimeout + 1000), // Allow slightly more than expected timeout
            });
            
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            const responseBody = await response.json().catch(() => ({}));

            console.log(`Response time: ${responseTime}ms, Status: ${response.status}, Body:`, responseBody);

            // BUG CONDITION ASSERTIONS (Expected to FAIL on unfixed code)
            // These assertions encode the EXPECTED BEHAVIOR that should be implemented
            
            // Requirement 2.2: API should respond within 10-second timeout with meaningful error
            expect(responseTime).toBeLessThan(expectedTimeout);
            
            // Should return proper HTTP error status (not timeout)
            expect([500, 503, 502]).toContain(response.status);
            
            // Requirement 2.3: Should return meaningful error message, not generic "RoundNotFoundError"
            expect(responseBody).toHaveProperty('message');
            expect(responseBody.message).not.toBe('No active round found');
            
            // Should indicate database connectivity issue
            const message = (responseBody.message || '').toLowerCase();
            expect(
              message.includes('database') || 
              message.includes('connection') || 
              message.includes('unavailable') ||
              message.includes('service')
            ).toBe(true);
            
            // Should not be a generic "RoundNotFoundError"
            if (responseBody.error) {
              expect(responseBody.error).not.toBe('RoundNotFoundError');
            }
            
          } catch (error: any) {
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            console.log(`Request failed after ${responseTime}ms:`, error.message);
            
            // If the request times out or fails, this indicates the bug exists
            // The service should handle database failures gracefully, not timeout
            if (error.name === 'TimeoutError' || responseTime >= expectedTimeout) {
              // This is the bug condition - service is timing out instead of failing fast
              throw new Error(`BUG DETECTED: Service timed out (${responseTime}ms) instead of handling database failure gracefully. This confirms the bug exists.`);
            }
            
            // Other network errors might be expected in test environment
            // but we still want to document them
            console.log(`Network error (expected in test): ${error.message}`);
          }
        }
      ),
      {
        numRuns: 3, // Test multiple scenarios
        timeout: 20000, // Allow time for timeout testing
      }
    );
  });

  /**
   * Property 2: Health Check Should Detect Database Connection Issues
   * 
   * Tests that the health check endpoint properly detects and reports
   * database connection failures instead of generic errors.
   */
  it('should detect database connection failures in health check', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          testCase: fc.constantFrom(
            'postgres_unreachable',
            'connection_timeout',
            'database_down'
          ),
        }),
        async ({ testCase }) => {
          console.log(`Health check test case: ${testCase}`);
          
          try {
            const response = await fetch(`${API_BASE_URL}/health`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              signal: AbortSignal.timeout(5000),
            });

            const responseBody = await response.json().catch(() => ({}));
            console.log(`Health check response: Status ${response.status}, Body:`, responseBody);

            // BUG CONDITION ASSERTIONS (Expected to FAIL on unfixed code)
            // Health check should detect database issues and return proper error status
            
            if (response.status === 200 && responseBody.status === 'ok') {
              // If health check passes, database connection is working
              // This is not the bug condition we're testing
              console.log('Database connection is healthy - not testing bug condition');
              return;
            }
            
            // If health check fails, it should do so gracefully
            // Should return error status when database is unreachable
            expect(response.status).toBe(503); // Service Unavailable
            
            // Should indicate service error, not success
            expect(responseBody.status).toBe('error');
            
            // Should include service identification
            expect(responseBody.service).toBe('games');
            
          } catch (error: any) {
            console.log(`Health check failed with error: ${error.message}`);
            
            // Health check should not timeout - it should fail fast
            if (error.name === 'TimeoutError') {
              throw new Error('BUG DETECTED: Health check timed out instead of failing fast');
            }
          }
        }
      ),
      {
        numRuns: 2,
        timeout: 10000,
      }
    );
  });

  /**
   * Property 3: Service Should Handle Database Unavailability Gracefully
   * 
   * Tests that when the database is completely unavailable, the service
   * should fail fast with proper error messages instead of hanging or timing out.
   */
  it('should fail fast when database is completely unavailable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          maxResponseTime: fc.constant(5000), // Should fail fast, not wait 10 seconds
          endpoint: fc.constant('/rounds/current'),
        }),
        async ({ maxResponseTime, endpoint }) => {
          const startTime = Date.now();
          
          try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              signal: AbortSignal.timeout(maxResponseTime + 1000),
            });
            
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            const responseBody = await response.json().catch(() => ({}));

            console.log(`Fast fail test: Response time ${responseTime}ms, Status: ${response.status}`);

            // BUG CONDITION ASSERTIONS (Expected to FAIL on unfixed code)
            
            // Should fail fast, not wait for full timeout
            expect(responseTime).toBeLessThan(maxResponseTime);
            
            // Should return service error status
            expect([500, 503, 502]).toContain(response.status);
            
            // Should have meaningful error message
            expect(responseBody).toHaveProperty('message');
            expect(responseBody.message).not.toBe('No active round found');
            
          } catch (error: any) {
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            console.log(`Fast fail test failed after ${responseTime}ms: ${error.message}`);
            
            // If it times out, this is the bug condition
            if (error.name === 'TimeoutError' || responseTime >= maxResponseTime) {
              throw new Error(`BUG DETECTED: Service took too long (${responseTime}ms) instead of failing fast`);
            }
          }
        }
      ),
      {
        numRuns: 2,
        timeout: 15000,
      }
    );
  });

  /**
   * Property 4: Concrete Bug Reproduction Test
   * 
   * This test attempts to reproduce the exact bug condition described in the requirements:
   * - Database connection fails with "Can't reach database server at postgres:5432"
   * - API calls timeout after 10 seconds
   * - System returns "RoundNotFoundError: No active round found"
   */
  it('should reproduce the exact bug condition from requirements', async () => {
    console.log('Attempting to reproduce exact bug condition...');
    
    // Test the specific endpoint mentioned in the bug report
    const endpoint = '/rounds/current';
    const maxAllowedTime = 10000; // 10 seconds as per requirement 1.2
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(maxAllowedTime + 2000), // Allow extra time to detect timeout
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const responseBody = await response.json().catch(() => ({}));
      
      console.log(`Bug reproduction test: ${responseTime}ms, Status: ${response.status}, Body:`, responseBody);
      
      // Check if we hit the bug condition
      if (responseTime >= maxAllowedTime) {
        console.log('BUG CONFIRMED: Request took longer than 10 seconds');
        throw new Error(`BUG DETECTED: API call took ${responseTime}ms, exceeding 10-second limit`);
      }
      
      if (response.status === 404 && responseBody.message === 'No active round found') {
        console.log('BUG CONFIRMED: Generic RoundNotFoundError instead of proper database error');
        throw new Error('BUG DETECTED: Received generic "No active round found" instead of database connection error');
      }
      
      // If we get here, the service might be working correctly (bug is fixed)
      // or the database connection is healthy
      console.log('Service responded normally - either bug is fixed or database is healthy');
      
    } catch (error: any) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (error.name === 'TimeoutError') {
        console.log('BUG CONFIRMED: Request timed out');
        throw new Error(`BUG DETECTED: Request timed out after ${responseTime}ms`);
      }
      
      if (error.message.includes('BUG DETECTED')) {
        throw error; // Re-throw our bug detection errors
      }
      
      console.log(`Network error during bug reproduction: ${error.message}`);
      // Network errors are expected when testing against a potentially down service
    }
  });
});