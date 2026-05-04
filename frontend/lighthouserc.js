module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:4173'],
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:   http://localhost:4173',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --headless',
      },
    },
    assert: {
      assertions: {
        // Performance thresholds
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        
        // Resource optimization
        'unused-javascript': ['warn', { maxNumericValue: 50000 }],
        'unused-css-rules': ['warn', { maxNumericValue: 20000 }],
        'modern-image-formats': 'error',
        'uses-webp-images': 'warn',
        
        // Security
        'is-on-https': 'off', // Disabled for local testing
        'uses-http2': 'off', // Disabled for local testing
        
        // Accessibility
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        'button-name': 'error',
        
        // Best practices
        'uses-responsive-images': 'warn',
        'efficient-animated-content': 'warn',
        'no-document-write': 'error',
        'external-anchors-use-rel-noopener': 'error',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};