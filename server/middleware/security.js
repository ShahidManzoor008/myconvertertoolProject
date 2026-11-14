import { expressCspHeader, SELF, NONE, UNSAFE_INLINE } from 'express-csp-header';

const googleDomains = [
  'https://accounts.google.com',
  'https://apis.google.com',
  'https://*.googleusercontent.com'
];

export const securityMiddleware = [
  // CSP Headers with specific Google Sign-In requirements
  expressCspHeader({
    directives: {
      'default-src': [SELF],
      'script-src': [
        SELF,
        UNSAFE_INLINE,
        ...googleDomains,
        'https://accounts.google.com/gsi/client'
      ],
      'frame-src': [
        SELF,
        ...googleDomains,
        'https://accounts.google.com/gsi/'
      ],
      // Google Sign-In uses its own iframe; it does not need to frame our pages.
      'frame-ancestors': [SELF],
      'object-src': [NONE],
      'connect-src': [
        SELF,
        ...googleDomains,
        'https://accounts.google.com/gsi/'
      ],
      'img-src': [SELF, 'data:', 'https:', ...googleDomains],
      'style-src': [SELF, UNSAFE_INLINE, 'https://fonts.googleapis.com', 'https://accounts.google.com/gsi/style'],
      'font-src': [SELF, 'data:', 'https://fonts.gstatic.com'],
      'form-action': [SELF],
      'base-uri': [SELF]
    }
  }),
  
  // Security Headers optimized for Google Sign-In
  (req, res, next) => {
    // Required for Google Sign-In popup/iframe communication
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    // Disable COEP for Google Sign-In compatibility
    res.removeHeader('Cross-Origin-Embedder-Policy');
    // Permissions policy allowing necessary features
    res.setHeader('Permissions-Policy', 
      'geolocation=(), camera=(), microphone=(), payment=(), usb=(), ' +
      'magnetic-sensor=(), accelerometer=(), gyroscope=(), ' +
      'interest-cohort=(), browsing-topics=()'
    );
    // Additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // The legacy XSS auditor is obsolete and can introduce browser-specific issues.
    res.setHeader('X-XSS-Protection', '0');
    next();
  }
];
