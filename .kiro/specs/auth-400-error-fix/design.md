# Auth 400 Error Fix - Bugfix Design

## Overview

This bugfix addresses authentication failures that occur when the frontend development server runs on ports outside the pre-configured range (3000, 5173-5176). The bug manifests as a 400 Bad Request error from Keycloak because the dynamically constructed redirect URI is not in the allowed list.

The fix involves expanding the Keycloak client's `redirectUris` configuration to support a broader range of development ports, particularly port 5177 and other commonly used Vite development ports. This is a configuration-only fix that requires no code changes to the authentication service.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when the frontend runs on a port not in Keycloak's allowed redirect URI list (ports other than 3000, 5173-5176)
- **Property (P)**: The desired behavior when the bug condition occurs - authentication should succeed and redirect to Keycloak login page
- **Preservation**: Existing authentication behavior for currently supported ports (3000, 5173-5176) that must remain unchanged by the fix
- **redirectUri**: The OAuth2 redirect URI dynamically constructed as `http://localhost:{port}/auth/callback` where `{port}` is the frontend's current port
- **Keycloak Client Configuration**: The `crash-game-client` configuration in `docker/keycloak/realm-export.json` that defines allowed redirect URIs
- **AuthService**: The service class in `frontend/src/services/authService.ts` that handles OAuth2 authentication flow with Keycloak
- **window.location.origin**: Browser API that returns the origin (protocol + hostname + port) of the current page, used to construct the redirect URI dynamically

## Bug Details

### Bug Condition

The bug manifests when a developer runs the frontend development server on port 5177 (or any port outside the range 3000, 5173-5176). The `AuthService` constructs a redirect URI using `window.location.origin`, which produces `http://localhost:5177/auth/callback`. When this URI is sent to Keycloak during the OAuth2 authorization flow, Keycloak rejects the request with a 400 Bad Request error because the URI does not match any entry in the client's `redirectUris` array.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type AuthRequest
  OUTPUT: boolean
  
  RETURN input.port NOT IN [3000, 5173, 5174, 5175, 5176]
         AND input.redirectUri = "http://localhost:" + input.port + "/auth/callback"
         AND keycloakClientConfiguredPorts = [3000, 5173, 5174, 5175, 5176]
END FUNCTION
```

### Examples

- **Port 5177**: User runs `npm run dev` and Vite assigns port 5177 → Authentication fails with 400 Bad Request
- **Port 5178**: User runs multiple Vite instances and gets port 5178 → Authentication fails with 400 Bad Request
- **Port 8080**: User configures custom port 8080 → Authentication fails with 400 Bad Request
- **Port 5173**: User runs on default Vite port 5173 → Authentication succeeds (no bug)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Authentication on port 3000 must continue to work exactly as before
- Authentication on ports 5173, 5174, 5175, 5176 must continue to work exactly as before
- The OAuth2 authorization code flow must remain unchanged
- Token exchange, refresh token flow, and logout functionality must remain unchanged
- PKCE (Proof Key for Code Exchange) security mechanism must remain enabled and functional
- User session management and token storage must remain unchanged

**Scope:**
All authentication requests from ports currently in the allowed list (3000, 5173-5176) should be completely unaffected by this fix. This includes:
- Login flow initiation and redirect to Keycloak
- Authorization code callback handling
- Token exchange and storage
- User info retrieval
- Token refresh operations
- Logout flow

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

1. **Static Configuration vs Dynamic Runtime Behavior**: The Keycloak client configuration in `docker/keycloak/realm-export.json` contains a static list of allowed redirect URIs for ports 3000 and 5173-5176. However, the `AuthService` dynamically constructs the redirect URI using `window.location.origin`, which can be any port the developer chooses to run the frontend on.

2. **Limited Port Range**: The current configuration only supports 5 ports (3000, 5173-5176), which is insufficient for development scenarios where:
   - Multiple developers run the frontend simultaneously on different ports
   - Port conflicts cause Vite to auto-increment to the next available port (5177, 5178, etc.)
   - Developers prefer custom port configurations

3. **Keycloak's Strict URI Validation**: Keycloak enforces strict matching of redirect URIs for security reasons. Even though wildcard patterns like `http://localhost:5173/*` are configured, they only apply to the path portion, not the port. A request with `http://localhost:5177/auth/callback` does not match `http://localhost:5173/*`.

4. **No Fallback Mechanism**: The `AuthService` has no fallback or error handling for unsupported ports. It blindly constructs the redirect URI and sends it to Keycloak, resulting in a 400 error that is not user-friendly.

## Correctness Properties

Property 1: Bug Condition - Port 5177 Authentication Success

_For any_ authentication request where the frontend runs on port 5177 (or any commonly used development port), the fixed Keycloak configuration SHALL accept the redirect URI and allow the OAuth2 authorization flow to proceed, resulting in a successful redirect to the Keycloak login page instead of a 400 Bad Request error.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Existing Port Authentication

_For any_ authentication request where the frontend runs on a currently supported port (3000, 5173, 5174, 5175, 5176), the fixed Keycloak configuration SHALL produce exactly the same authentication behavior as the original configuration, preserving all existing login, token exchange, and logout functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct (static port list in Keycloak configuration):

**File**: `docker/keycloak/realm-export.json`

**Section**: `clients[0].redirectUris` (crash-game-client configuration)

**Specific Changes**:
1. **Add Port 5177 Support**: Add explicit redirect URI entries for port 5177
   - Add `"http://localhost:5177/*"` to the `redirectUris` array
   - Add `"http://localhost:5177/auth/callback"` to the `redirectUris` array

2. **Add Extended Port Range**: Add support for ports 5177-5180 to handle auto-incremented ports
   - Add `"http://localhost:5178/*"` and `"http://localhost:5178/auth/callback"`
   - Add `"http://localhost:5179/*"` and `"http://localhost:5179/auth/callback"`
   - Add `"http://localhost:5180/*"` and `"http://localhost:5180/auth/callback"`

3. **Update Web Origins**: Add corresponding entries to the `webOrigins` array for CORS support
   - Add `"http://localhost:5177"`
   - Add `"http://localhost:5178"`
   - Add `"http://localhost:5179"`
   - Add `"http://localhost:5180"`

4. **Maintain Existing Entries**: Preserve all existing redirect URI and web origin entries to ensure no regression

5. **Preserve PKCE Configuration**: Ensure the `attributes.pkce.code.challenge.method` remains set to `"S256"`

**Alternative Consideration**: While Keycloak supports wildcard patterns in redirect URIs, using a pattern like `http://localhost:*/auth/callback` is not supported by Keycloak for security reasons. Therefore, we must explicitly list each port.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on the unfixed configuration, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write integration tests that simulate the authentication flow from port 5177. Run these tests against the UNFIXED Keycloak configuration to observe the 400 Bad Request error and confirm the root cause is the missing redirect URI entry.

**Test Cases**:
1. **Port 5177 Login Initiation**: Simulate frontend running on port 5177, call `authService.getLoginUrl()`, verify the constructed URL contains `redirect_uri=http%3A%2F%2Flocalhost%3A5177%2Fauth%2Fcallback` (will fail on unfixed config when sent to Keycloak)
2. **Port 5177 Keycloak Request**: Make actual HTTP request to Keycloak authorization endpoint with port 5177 redirect URI (will fail with 400 on unfixed config)
3. **Port 5178 Authentication**: Test with port 5178 to verify the bug affects multiple unlisted ports (will fail on unfixed config)
4. **Port 9999 Edge Case**: Test with an unusual port like 9999 to understand Keycloak's error response (will fail on unfixed config)

**Expected Counterexamples**:
- Keycloak returns 400 Bad Request with error message indicating invalid redirect URI
- Possible causes: redirect URI not in allowed list, port mismatch, configuration not loaded

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed configuration produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := authenticateUser_fixed(input)
  ASSERT result.status IN [200, 302] AND
         result.redirectsToKeycloakLogin = true AND
         NOT (result.status = 400)
END FOR
```

**Test Plan**: After updating the Keycloak configuration, restart the Keycloak container to load the new configuration, then run authentication tests from port 5177 and other newly supported ports.

**Test Cases**:
1. **Port 5177 Login Success**: Initiate login from port 5177, verify redirect to Keycloak login page succeeds
2. **Port 5177 Full Flow**: Complete full OAuth2 flow from port 5177 (login → callback → token exchange → user info)
3. **Port 5178 Authentication**: Verify authentication works on port 5178
4. **Port 5179 Authentication**: Verify authentication works on port 5179
5. **Port 5180 Authentication**: Verify authentication works on port 5180

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed configuration produces the same result as the original configuration.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT authenticateUser_original(input) = authenticateUser_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED configuration first for ports 3000, 5173-5176, then write property-based tests capturing that behavior. Run the same tests on the FIXED configuration and assert identical results.

**Test Cases**:
1. **Port 3000 Preservation**: Verify complete authentication flow on port 3000 produces identical results before and after fix
2. **Port 5173 Preservation**: Verify complete authentication flow on port 5173 produces identical results before and after fix
3. **Port 5174 Preservation**: Verify complete authentication flow on port 5174 produces identical results before and after fix
4. **Port 5175 Preservation**: Verify complete authentication flow on port 5175 produces identical results before and after fix
5. **Port 5176 Preservation**: Verify complete authentication flow on port 5176 produces identical results before and after fix
6. **Token Refresh Preservation**: Verify token refresh flow works identically on all preserved ports
7. **Logout Preservation**: Verify logout flow works identically on all preserved ports

### Unit Tests

- Test `AuthService.getLoginUrl()` constructs correct redirect URI for various ports
- Test redirect URI format matches expected pattern `http://localhost:{port}/auth/callback`
- Test that Keycloak configuration JSON is valid and parseable
- Test that all redirect URIs in configuration follow the correct format
- Test that web origins match the ports in redirect URIs

### Property-Based Tests

- Generate random port numbers in range 5177-5180 and verify authentication succeeds
- Generate random port numbers in range 3000, 5173-5180 and verify all produce successful authentication
- Generate random valid OAuth2 authorization codes and verify token exchange works on all supported ports
- Test that adding new ports does not break existing port authentication (preservation property)

### Integration Tests

- Test full authentication flow from port 5177: login → Keycloak redirect → callback → token storage → authenticated state
- Test switching between different ports (e.g., login on 5177, then restart on 5173) and verify session handling
- Test that CORS works correctly for all newly added ports
- Test that logout flow works correctly from port 5177
- Test concurrent authentication from multiple ports (3000, 5173, 5177) to verify no interference
- Test Keycloak container restart with new configuration loads correctly
