import { describe, it, expect } from 'vitest';
import { apiClient } from '../api';

/**
 * API Client Unit Tests
 * Requirement 2.1, 2.2, 2.3: API Client with interceptors
 */
describe('API Client', () => {
  describe('Client Initialization', () => {
    it('should be defined', () => {
      expect(apiClient).toBeDefined();
    });

    it('should have post method', () => {
      expect(apiClient.post).toBeDefined();
      expect(typeof apiClient.post).toBe('function');
    });

    it('should have get method', () => {
      expect(apiClient.get).toBeDefined();
      expect(typeof apiClient.get).toBe('function');
    });

    it('should have put method', () => {
      expect(apiClient.put).toBeDefined();
      expect(typeof apiClient.put).toBe('function');
    });

    it('should have delete method', () => {
      expect(apiClient.delete).toBeDefined();
      expect(typeof apiClient.delete).toBe('function');
    });

    it('should have patch method', () => {
      expect(apiClient.patch).toBeDefined();
      expect(typeof apiClient.patch).toBe('function');
    });
  });

  describe('Client Configuration', () => {
    it('should have interceptors', () => {
      expect(apiClient.interceptors).toBeDefined();
    });

    it('should have request interceptors', () => {
      expect(apiClient.interceptors.request).toBeDefined();
    });

    it('should have response interceptors', () => {
      expect(apiClient.interceptors.response).toBeDefined();
    });

    it('should have defaults configuration', () => {
      expect(apiClient.defaults).toBeDefined();
    });

    it('should have timeout configured', () => {
      expect(apiClient.defaults.timeout).toBe(10000);
    });

    it('should have withCredentials enabled', () => {
      expect(apiClient.defaults.withCredentials).toBe(true);
    });
  });

  describe('Method Signatures', () => {
    it('post should be callable', () => {
      expect(typeof apiClient.post).toBe('function');
    });

    it('get should be callable', () => {
      expect(typeof apiClient.get).toBe('function');
    });

    it('put should be callable', () => {
      expect(typeof apiClient.put).toBe('function');
    });

    it('delete should be callable', () => {
      expect(typeof apiClient.delete).toBe('function');
    });

    it('patch should be callable', () => {
      expect(typeof apiClient.patch).toBe('function');
    });
  });

  describe('Interceptor Configuration', () => {
    it('request interceptor should be registered', () => {
      expect(apiClient.interceptors.request.handlers).toBeDefined();
      expect((apiClient.interceptors.request.handlers as any)?.length).toBeGreaterThan(0);
    });

    it('response interceptor should be registered', () => {
      expect(apiClient.interceptors.response.handlers).toBeDefined();
      expect((apiClient.interceptors.response.handlers as any)?.length).toBeGreaterThan(0);
    });
  });
});
