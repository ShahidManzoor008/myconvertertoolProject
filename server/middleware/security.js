import { expressCspHeader, SELF, UNSAFE_INLINE, UNSAFE_EVAL } from 'express-csp-header';

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
        UNSAFE_EVAL,
        ...googleDomains,
        'https://accounts.google.com/gsi/client'
      ],
      'frame-src': [
        SELF,
        ...googleDomains,
        'https://accounts.google.com/gsi/'
      ],
      'frame-ancestors': [ // Allow Google to frame the site for Sign-In
        SELF,
        ...googleDomains
      ],
      'connect-src': [
        SELF,
        ...googleDomains,
        'https://accounts.google.com/gsi/'
      ],
      'img-src': [SELF, 'data:', 'https:', ...googleDomains],
      'style-src': [SELF, UNSAFE_INLINE],
      'font-src': [SELF, 'data:'],
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
    // Allow cross-origin resources (needed for Google services)
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    // Permissions policy allowing necessary features
    res.setHeader('Permissions-Policy', 
      'geolocation=(), camera=(), microphone=(), payment=(), usb=(), ' +
      'magnetic-sensor=(), accelerometer=(), gyroscope=(), ' +
      'interest-cohort=(), browsing-topics=()'
    );
    // Additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  }
];