# German Learning App - Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the German Learning application to production environments. The application is a progressive web app (PWA) built with React 18, Vite, and modern web technologies.

## Prerequisites

### System Requirements
- Node.js 18.0 or higher
- npm 9.0 or higher
- Git for version control
- Modern web browser for testing

### Hosting Requirements
- Static file hosting (Netlify, Vercel, AWS S3, etc.)
- HTTPS/SSL certificate required
- Support for client-side routing
- Service worker support (recommended)

## Build Process

### 1. Environment Setup

Create a production environment file:

```bash
# Copy the template
cp .env.production.example .env.production

# Edit with your specific values
nano .env.production
```

### 2. Production Build

```bash
# Build for production
npm run build:prod

# This creates an optimized build in the /dist directory with:
# - Minified JavaScript and CSS
# - Optimized assets
# - Service worker for offline functionality
# - Progressive Web App manifest
```

### 3. Build Verification

```bash
# Run deployment checks
npm run deploy:check

# Analyze bundle size
npm run analyze
```

## Deployment Options

### Option 1: Netlify (Recommended)

1. **Create Netlify Account**
   - Sign up at [netlify.com](https://netlify.com)
   - Connect your Git repository

2. **Configure Build Settings**
   ```
   Build command: npm run build:prod
   Publish directory: dist
   Node version: 18
   ```

3. **Environment Variables**
   ```
   NODE_ENV=production
   VITE_API_BASE_URL=https://your-api.com
   VITE_ENABLE_ANALYTICS=true
   ```

4. **Deploy**
   - Push to Git or use manual drag-and-drop
   - Automatic deployment on Git push

### Option 2: Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Configure vercel.json**
   ```json
   {
     "buildCommand": "npm run build:prod",
     "outputDirectory": "dist",
     "framework": "vite"
   }
   ```

### Option 3: AWS S3 + CloudFront

1. **Build and Upload**
   ```bash
   npm run build:prod
   aws s3 sync dist/ s3://your-bucket-name --delete
   ```

2. **Configure CloudFront**
   - Origin: S3 bucket
   - Viewer Protocol: HTTPS Only
   - Cache Policy: Managed-CachingOptimized
   - Function Associations: /* -> lambda-edge for SPA routing

### Option 4: Traditional Hosting

1. **Build**
   ```bash
   npm run build:prod
   ```

2. **Upload Files**
   - Upload entire `/dist` directory to web server
   - Ensure `.htaccess` or equivalent is configured for SPA routing

3. **Server Configuration**
   ```apache
   # Apache .htaccess
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule . /index.html [L]
   ```

## Post-Deployment Configuration

### 1. SSL Certificate
- Ensure HTTPS is properly configured
- Redirect all HTTP traffic to HTTPS
- Update any hardcoded HTTP URLs

### 2. Service Worker
- Verify service worker registration
- Test offline functionality
- Check cache strategies

### 3. Progressive Web App
- Test PWA installation
- Verify manifest.json configuration
- Check app icons and splash screens

### 4. Performance Optimization
- Enable Gzip/Brotli compression
- Configure CDN headers
- Set up browser caching

## Environment Variables

### Required Variables
```bash
NODE_ENV=production
VITE_APP_NAME=German Learn
VITE_API_BASE_URL=https://your-api.com
```

### Optional Variables
```bash
VITE_ENABLE_ANALYTICS=true
VITE_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
VITE_SENTRY_DSN=https://your-sentry-dsn
VITE_ENABLE_ERROR_REPORTING=true
```

## Performance Monitoring

### 1. Web Vitals
```javascript
// Monitor Core Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

getCLS(console.log)
getFID(console.log)
getFCP(console.log)
getLCP(console.log)
getTTFB(console.log)
```

### 2. Analytics Integration
- Google Analytics 4
- Sentry for error tracking
- Custom event tracking for learning progress

### 3. Performance Budgets
- JavaScript: < 1MB per chunk
- CSS: < 100KB total
- Images: WebP format, lazy loaded
- Fonts: < 200KB total

## Security Considerations

### 1. Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;">
```

### 2. HTTPS Only
- No mixed content warnings
- Secure cookies
- HSTS headers

### 3. Input Validation
- PDF upload size limits
- File type restrictions
- XSS prevention

## Testing Before Going Live

### 1. Functional Testing
```bash
# Run all tests
npm run test

# End-to-end tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### 2. Performance Testing
- Lighthouse audit (score > 90)
- Bundle size analysis
- Network throttling tests

### 3. Cross-Browser Testing
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

### 4. Accessibility Testing
- WCAG 2.1 AA compliance
- Screen reader compatibility
- Keyboard navigation
- Color contrast verification

## Monitoring and Maintenance

### 1. Error Tracking
```javascript
// Sentry integration
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV
})
```

### 2. Performance Monitoring
- Real User Monitoring (RUM)
- Core Web Vitals tracking
- Error rate monitoring

### 3. Update Process
```bash
# Update dependencies
npm update

# Run tests
npm test

# Build and deploy
npm run deploy:prod
```

## Troubleshooting

### Common Issues

#### 1. Blank Page After Deploy
- Check console for JavaScript errors
- Verify asset paths in index.html
- Ensure service worker is properly registered

#### 2. Routing Issues
- Configure server for SPA routing
- Check base URL in vite.config.js
- Verify 404 handling

#### 3. Service Worker Problems
- Clear browser cache
- Unregister and re-register service worker
- Check scope and file paths

#### 4. Performance Issues
- Analyze bundle size
- Check for memory leaks
- Optimize images and assets

### Debug Mode
```bash
# Enable debug mode temporarily
VITE_DEBUG_MODE=true npm run build:prod
```

## Rollback Procedure

### 1. Quick Rollback
```bash
# Git rollback
git checkout previous-stable-commit
npm run deploy:prod
```

### 2. Database Rollback
- Restore from automated backups
- Verify data integrity
- Update API endpoints if needed

## Support

### Documentation
- [User Manual](./USER_MANUAL.md)
- [Technical Documentation](./TECHNICAL_DOCS.md)
- [API Documentation](./API_DOCS.md)

### Contact
- Technical support: tech-support@germanlearn.com
- Bug reports: bugs@germanlearn.com
- Feature requests: features@germanlearn.com

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Production build successful
- [ ] All tests passing
- [ ] Security headers configured
- [ ] SSL certificate installed
- [ ] Service worker registered
- [ ] Performance targets met
- [ ] Accessibility verified
- [ ] Cross-browser tested
- [ ] Monitoring configured
- [ ] Backup procedures documented
- [ ] Rollback plan ready

---

**Note**: This deployment guide is version 1.0.0 and updated regularly. Check for the latest version in the repository.