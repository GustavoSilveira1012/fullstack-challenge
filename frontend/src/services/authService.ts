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
    this.clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'crash-game-frontend';
    this.realm = import.meta.env.VITE_KEYCLOAK_REALM || 'crash-game';
    this.redirectUri = `${window.location.origin}/auth/callback`;
  }

  /**
   * Get Keycloak login URL
   * Requirement 2.1.1: Login page redirects to Keycloak
   */
  getLoginUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      state: this.generateState(),
    });

    return `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/auth?${params.toString()}`;
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
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        code,
        redirect_uri: this.redirectUri,
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
        throw new Error('Failed to exchange code for token');
      }

      const data = await response.json();
      return data as KeycloakTokenResponse;
    } catch (error) {
      throw new Error(`Token exchange failed: ${(error as Error).message}`);
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
      const decoded = this.decodeToken(token);
      const expirationTime = decoded.exp * 1000; // Convert to milliseconds
      return Date.now() >= expirationTime;
    } catch {
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
  login(): void {
    window.location.href = this.getLoginUrl();
  }

  /**
   * Perform logout flow
   * 1. Clear local auth state
   * 2. Redirect to Keycloak logout
   */
  logout(): void {
    const authStore = useAuthStore.getState();
    authStore.logout();
    window.location.href = this.getLogoutUrl();
  }

  /**
   * Handle OAuth2 callback after Keycloak redirects back
   * Requirement 2.1.1: Handle callback and token storage
   */
  async handleCallback(code: string): Promise<void> {
    try {
      // Exchange code for tokens
      const tokenResponse = await this.exchangeCodeForToken(code);

      // Get user info
      const userInfo = await this.getUserInfo(tokenResponse.access_token);

      // Store in auth store
      const authStore = useAuthStore.getState();
      authStore.login(tokenResponse.access_token, userInfo.sub, userInfo.email);

      // Store refresh token in secure storage (httpOnly cookie would be better)
      // For now, store in sessionStorage (cleared when browser closes)
      sessionStorage.setItem('refresh_token', tokenResponse.refresh_token);
    } catch (error) {
      throw new Error(`Authentication callback failed: ${(error as Error).message}`);
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
}

export const authService = new AuthService();
export default authService;
