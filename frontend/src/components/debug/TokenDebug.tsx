import React from 'react';
import { useAuthStore } from '@store/authStore';

/**
 * TokenDebug Component - Debug JWT token information
 */
export const TokenDebug: React.FC = () => {
  const { token, playerId, email, isAuthenticated } = useAuthStore();

  const decodeToken = (token: string) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      return null;
    }
  };

  const tokenPayload = token ? decodeToken(token) : null;

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">Debug: JWT Token Information</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}
        </div>
        
        <div>
          <strong>Player ID (from store):</strong> {playerId || 'None'}
        </div>
        
        <div>
          <strong>Email (from store):</strong> {email || 'None'}
        </div>
        
        <div>
          <strong>Has Token:</strong> {token ? 'Yes' : 'No'}
        </div>
        
        {token && (
          <div>
            <strong>Token Preview:</strong> {token.substring(0, 50)}...
          </div>
        )}
        
        {tokenPayload && (
          <div>
            <strong>Token Payload:</strong>
            <pre className="bg-gray-200 dark:bg-gray-700 p-2 rounded mt-1 text-xs overflow-auto">
              {JSON.stringify(tokenPayload, null, 2)}
            </pre>
          </div>
        )}
        
        <div>
          <strong>LocalStorage Token:</strong> {localStorage.getItem('token') ? 'Present' : 'None'}
        </div>
        
        <div>
          <strong>LocalStorage Player ID:</strong> {localStorage.getItem('playerId') || 'None'}
        </div>
      </div>
    </div>
  );
};

export default TokenDebug;