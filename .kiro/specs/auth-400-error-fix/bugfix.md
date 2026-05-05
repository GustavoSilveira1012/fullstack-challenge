# Bugfix Requirements Document

## Introduction

The application fails to authenticate users when the frontend development server runs on port 5177 (or any port outside the pre-configured range). The authentication request to Keycloak returns a 400 Bad Request error because the dynamically constructed redirect URI (`http://localhost:5177/auth/callback`) is not in the Keycloak client's allowed redirect URI list.

This bug affects developers who run the frontend on non-standard ports and prevents them from testing authentication flows. The root cause is a mismatch between the frontend's dynamic redirect URI construction (using `window.location.origin`) and the static list of allowed redirect URIs in the Keycloak realm configuration.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the frontend runs on port 5177 (or any port not in the allowed list: 3000, 5173-5176) THEN the authentication request to Keycloak returns a 400 Bad Request error

1.2 WHEN the user attempts to log in from a frontend running on an unlisted port THEN the OAuth2 authorization flow fails before reaching the Keycloak login page

1.3 WHEN the redirect URI `http://localhost:5177/auth/callback` is sent to Keycloak THEN Keycloak rejects the request because the URI is not in the client's `redirectUris` configuration

### Expected Behavior (Correct)

2.1 WHEN the frontend runs on port 5177 (or any commonly used development port) THEN the authentication request SHALL succeed and redirect to the Keycloak login page

2.2 WHEN the user attempts to log in from a frontend running on port 5177 THEN the OAuth2 authorization flow SHALL complete successfully

2.3 WHEN the redirect URI `http://localhost:5177/auth/callback` is sent to Keycloak THEN Keycloak SHALL accept the request and allow the authentication flow to proceed

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the frontend runs on port 3000 THEN the system SHALL CONTINUE TO authenticate successfully

3.2 WHEN the frontend runs on ports 5173, 5174, 5175, or 5176 THEN the system SHALL CONTINUE TO authenticate successfully

3.3 WHEN the redirect URI matches any existing allowed URI pattern THEN the system SHALL CONTINUE TO process authentication requests without errors

3.4 WHEN users authenticate with valid credentials THEN the system SHALL CONTINUE TO issue tokens and establish authenticated sessions

3.5 WHEN the logout flow is triggered THEN the system SHALL CONTINUE TO redirect to the configured logout URI

---

## Bug Condition Analysis

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type AuthRequest
  OUTPUT: boolean
  
  // X.port is the port on which the frontend is running
  // X.redirectUri is the dynamically constructed redirect URI
  
  RETURN X.port NOT IN [3000, 5173, 5174, 5175, 5176]
END FUNCTION
```

### Property Specification

```pascal
// Property: Fix Checking - Port 5177 Authentication
FOR ALL X WHERE isBugCondition(X) DO
  result ← authenticateUser'(X)
  ASSERT result.status = 200 OR result.status = 302 AND
         result.redirectsToKeycloakLogin = true AND
         no_400_error(result)
END FOR
```

### Preservation Goal

```pascal
// Property: Preservation Checking - Existing Ports Continue Working
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT authenticateUser(X) = authenticateUser'(X)
END FOR
```

**Key Definitions:**
- **authenticateUser**: The original authentication flow with the current Keycloak configuration
- **authenticateUser'**: The authentication flow after fixing the redirect URI configuration
- **X.port**: The port number on which the frontend development server is running
- **X.redirectUri**: The redirect URI constructed as `http://localhost:{port}/auth/callback`

### Counterexample

**Concrete example demonstrating the bug:**

```
Input: AuthRequest {
  port: 5177,
  redirectUri: "http://localhost:5177/auth/callback",
  clientId: "crash-game-client",
  keycloakUrl: "http://localhost:8080",
  realm: "crash-game"
}

Current Output: 400 Bad Request
Expected Output: 302 Redirect to Keycloak login page
```
