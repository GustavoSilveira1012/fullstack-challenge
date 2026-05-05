import { KeycloakTokenResponse, KeycloakUserInfo } from '../types/api';
import { useAuthStore } from '../store/authStore';

/**
 * AuthService: Handles Keycloak OAuth2 authentication
 * Requirement 2.6: Create AuthService for Keycloak integration
 * Requirement 2.1.1: OAuth2 authentication with Keycloak
 */
class AuthService {
  private keycloakUrl: string;
  private clientId: string;
  private redirectUri: string;
  private realm: string;

  constructor() {
    this.keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080';
    this.clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'crash-game-client';
    this.realm = import.meta.env.VITE_KEYCLOAK_REALM || 'crash-game';
    this.redirectUri = `${window.location.origin}/auth/callback`;
  }

  /**
   * Get Keycloak login URL
   * Requirement 2.1.1: Login page redirects to Keycloak
   */
  async getLoginUrl(): Promise<string> {
    // Generate PKCE parameters
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    
    // Store code verifier for token exchange
    sessionStorage.setItem('code_verifier', codeVerifier);
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      state: this.generateState(),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    const loginUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/auth?${params.toString()}`;
    console.log('Generated login URL:', loginUrl);
    console.log('Login URL params:', {
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      keycloakUrl: this.keycloakUrl,
      realm: this.realm
    });

    return loginUrl;
  }

  /**
   * Get Keycloak logout URL
   * Requirement 2.1.3: Logout functionality
   */
  getLogoutUrl(): string {
    const params = new URLSearchParams({
      redirect_uri: `${window.location.origin}/login`,
    });

    return `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/logout?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   * Called after Keycloak redirects back to the app
   */
  async exchangeCodeForToken(code: string): Promise<KeycloakTokenResponse> {
    try {
      const codeVerifier = sessionStorage.getItem('code_verifier');
      if (!codeVerifier) {
        throw new Error('Code verifier not found');
      }

      console.log('Exchanging code for token with:', {
        keycloakUrl: this.keycloakUrl,
        realm: this.realm,
        clientId: this.clientId,
        redirectUri: this.redirectUri,
        hasCodeVerifier: !!codeVerifier
      });

      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        code,
        redirect_uri: this.redirectUri,
        code_verifier: codeVerifier,
      });

      const tokenUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;
      console.log('Token exchange URL:', tokenUrl);
      console.log('Token exchange params:', params.toString());

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Token exchange response status:', response.status);
      console.log('Token exchange response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Token exchange failed with status:', response.status);
        console.error('Token exchange error response:', errorData);
        throw new Error(`Failed to exchange code for token (${response.status}): ${errorData}`);
      }

      const data = await response.json();
      console.log('Token exchange successful, received data keys:', Object.keys(data));
      console.log('Access token length:', data.access_token?.length || 'undefined');
      
      // Clear the code verifier after use
      sessionStorage.removeItem('code_verifier');
      
      return data as KeycloakTokenResponse;
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Token exchange error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      
      if (err.name === 'AbortError') {
        throw new Error('Token exchange timed out after 30 seconds');
      }
      
      throw new Error(`Token exchange failed: ${err.message}`);
    }
  }

  /**
   * Get user info from Keycloak using access token
   */
  async getUserInfo(token: string): Promise<KeycloakUserInfo> {
    try {
      const response = await fetch(
        `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const data = await response.json();
      return data as KeycloakUserInfo;
    } catch (error) {
      throw new Error(`Failed to fetch user info: ${(error as Error).message}`);
    }
  }

  /**
   * Decode JWT token to extract claims
   * Note: This is a simple decode without verification
   * Token verification should be done on the backend
   */
  decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const decoded = JSON.parse(atob(parts[1]));
      return decoded;
    } catch (error) {
      throw new Error(`Failed to decode token: ${(error as Error).message}`);
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      if (!token || typeof token !== 'string') {
        console.log('Token is invalid or missing');
        return true;
      }

      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        console.log('Token has no expiration time');
        return true;
      }

      const expirationTime = decoded.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const isExpired = currentTime >= expirationTime;
      
      console.log('Token expiration check:', {
        currentTime: new Date(currentTime).toISOString(),
        expirationTime: new Date(expirationTime).toISOString(),
        isExpired
      });
      
      return isExpired;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<KeycloakTokenResponse> {
    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.clientId,
        refresh_token: refreshToken,
      });

      const response = await fetch(
        `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      return data as KeycloakTokenResponse;
    } catch (error) {
      throw new Error(`Token refresh failed: ${(error as Error).message}`);
    }
  }

  /**
   * Perform login flow
   * 1. Redirect to Keycloak login
   */
  async login(): Promise<void> {
    try {
      console.log('Initiating login redirect to Keycloak...');
      const loginUrl = await this.getLoginUrl();
      console.log('Login URL generated successfully');
      window.location.href = loginUrl;
    } catch (error) {
      console.error('Failed to initiate login:', error);
      throw error;
    }
  }

  /**
   * Perform logout flow
   * 1. Clear local auth state
   * 2. Redirect to Keycloak logout
   */
  logout(): void {
    const authStore = useAuthStore.getState();
    
    // Clear auth state first
    authStore.logout();
    
    // Always redirect to Keycloak logout for real sessions
    console.log('Redirecting to Keycloak logout');
    window.location.href = this.getLogoutUrl();
  }

  private isProcessingCallback = false;
  private processedCodes = new Set<string>();

  /**
   * Handle OAuth2 callback after Keycloak redirects back
   * Requirement 2.1.1: Handle callback and token storage
   */
  async handleCallback(code: string): Promise<void> {
    if (this.isProcessingCallback) {
      console.log('Already processing callback, skipping duplicate...');
      return;
    }

    // Check if this code has already been processed
    if (this.processedCodes.has(code)) {
      console.log('Code already processed, skipping duplicate...');
      return;
    }

    try {
      this.isProcessingCallback = true;
      this.processedCodes.add(code);
      
      // Set flag to prevent useAuth from clearing state during callback
      sessionStorage.setItem('processing_callback', 'true');
      
      console.log('Starting callback processing with code:', code.substring(0, 10) + '...');
      
      // Exchange code for tokens
      console.log('About to call exchangeCodeForToken...');
      const tokenResponse = await this.exchangeCodeForToken(code);
      console.log('exchangeCodeForToken completed successfully');
      console.log('Tokens received successfully');

      // Manually decode JWT payload (it's the second part of the token)
      const tokenParts = tokenResponse.access_token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }

      // Decode base64url payload
      const payloadBase64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decodedToken = JSON.parse(window.atob(payloadBase64));
      
      console.log('Decoded token payload:', {
        sub: decodedToken?.sub,
        email: decodedToken?.email,
        exp: decodedToken?.exp,
        iat: decodedToken?.iat
      });
      
      const playerId = decodedToken?.sub;
      const email = decodedToken?.email || 'player@crash-game.dev';

      if (!playerId) {
        throw new Error('Could not extract player ID from token');
      }

      console.log('Extracted Player ID:', playerId);
      console.log('Extracted Email:', email);

      // Store in auth store
      const authStore = useAuthStore.getState();
      console.log('Calling authStore.login...');
      authStore.login(tokenResponse.access_token, playerId, email);
      
      // Verify the state was set correctly immediately
      const newState = useAuthStore.getState();
      console.log('Auth state after login:', {
        isAuthenticated: newState.isAuthenticated,
        hasToken: !!newState.token,
        playerId: newState.playerId
      });

      // Store refresh token in secure storage
      if (tokenResponse.refresh_token) {
        sessionStorage.setItem('refresh_token', tokenResponse.refresh_token);
        console.log('Refresh token stored');
      }
      
      // Try to initialize wallet (create if doesn't exist)
      try {
        console.log('Initializing wallet...');
        const { walletService } = await import('./walletService');
        await walletService.getBalance(); // This will auto-create wallet if it doesn't exist
        console.log('Wallet initialized successfully');
      } catch (walletError) {
        console.warn('Failed to initialize wallet:', walletError);
        // Don't fail the login process if wallet creation fails
      }
      
      console.log('Callback processing completed successfully');
    } catch (error) {
      console.error('Authentication callback failed:', error);
      throw new Error(`Authentication callback failed: ${(error as Error).message}`);
    } finally {
      // Clear the callback processing flag
      sessionStorage.removeItem('processing_callback');
      this.isProcessingCallback = false;
    }
  }

  /**
   * Generate random state for OAuth2 CSRF protection
   */
  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate PKCE code verifier
   */
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Generate PKCE code challenge
   */
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    
    // Use crypto.subtle.digest for proper SHA256
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    
    // Convert to base64url
    return btoa(String.fromCharCode.apply(null, Array.from(hashArray)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }


}

export const authService = new AuthService();
export default authService;
