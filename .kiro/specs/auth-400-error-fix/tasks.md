# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Port 5177 Authentication Failure
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test that authentication from port 5177 fails with 400 Bad Request on UNFIXED Keycloak configuration
  - Verify the redirect URI `http://localhost:5177/auth/callback` is rejected by Keycloak
  - Test implementation details from Bug Condition: `input.port NOT IN [3000, 5173, 5174, 5175, 5176]`
  - The test assertions should match the Expected Behavior Properties: authentication should succeed and redirect to Keycloak login page (status 200 or 302)
  - Run test on UNFIXED code (current realm-export.json without ports 5177-5180)
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found: Keycloak returns 400 Bad Request with error indicating invalid redirect URI
  - Also test ports 5178, 5179, 5180 to verify the bug affects multiple unlisted ports
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Port Authentication
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (ports 3000, 5173, 5174, 5175, 5176)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Test that authentication on port 3000 succeeds with current configuration
  - Test that authentication on ports 5173, 5174, 5175, 5176 succeeds with current configuration
  - Verify complete OAuth2 flow: login → Keycloak redirect → callback → token exchange → authenticated state
  - Verify token refresh flow works on existing ports
  - Verify logout flow works on existing ports
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code (current realm-export.json)
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix for authentication 400 error on port 5177

  - [x] 3.1 Implement the fix
    - Update `docker/keycloak/realm-export.json` to add support for ports 5177-5180
    - Locate the `crash-game-client` configuration in the `clients` array
    - Add redirect URI entries for port 5177: `"http://localhost:5177/*"` and `"http://localhost:5177/auth/callback"`
    - Add redirect URI entries for port 5178: `"http://localhost:5178/*"` and `"http://localhost:5178/auth/callback"`
    - Add redirect URI entries for port 5179: `"http://localhost:5179/*"` and `"http://localhost:5179/auth/callback"`
    - Add redirect URI entries for port 5180: `"http://localhost:5180/*"` and `"http://localhost:5180/auth/callback"`
    - Add corresponding web origins for CORS support: `"http://localhost:5177"`, `"http://localhost:5178"`, `"http://localhost:5179"`, `"http://localhost:5180"`
    - Preserve all existing redirect URI and web origin entries (ports 3000, 5173-5176)
    - Ensure PKCE configuration remains unchanged (`attributes.pkce.code.challenge.method` = `"S256"`)
    - Restart Keycloak container to load the new configuration: `docker-compose restart keycloak`
    - _Bug_Condition: isBugCondition(input) where input.port NOT IN [3000, 5173, 5174, 5175, 5176]_
    - _Expected_Behavior: For all inputs where isBugCondition(input), result.status IN [200, 302] AND result.redirectsToKeycloakLogin = true AND NOT (result.status = 400)_
    - _Preservation: For all inputs where NOT isBugCondition(input), authenticateUser_original(input) = authenticateUser_fixed(input)_
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Port 5177 Authentication Success
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - Verify authentication from port 5177 now succeeds (status 200 or 302)
    - Verify redirect to Keycloak login page works correctly
    - Verify authentication from ports 5178, 5179, 5180 also succeeds
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Port Authentication
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - Verify authentication on port 3000 still works identically
    - Verify authentication on ports 5173, 5174, 5175, 5176 still works identically
    - Verify token refresh flow still works on existing ports
    - Verify logout flow still works on existing ports
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
