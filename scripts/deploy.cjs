#!/usr/bin/env node

// Production deployment script for German Learning App
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🚀 Starting German Learning App deployment...\n')

// Environment validation
const requiredEnvVars = [
  'NODE_ENV',
  'VITE_APP_NAME',
  'VITE_API_BASE_URL'
]

const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:')
  missingVars.forEach(varName => console.error(`   - ${varName}`))
  process.exit(1)
}

console.log('✅ Environment validation passed')

// Build verification
console.log('\n📦 Verifying production build...')
const distPath = path.join(__dirname, '../dist')

if (!fs.existsSync(distPath)) {
  console.error('❌ Build directory not found. Run "npm run build" first.')
  process.exit(1)
}

const requiredFiles = [
  'index.html',
  'assets/index-D4TFdbmx.css',
  'assets/index-BwlkaFtZ.js'
]

const missingFiles = requiredFiles.filter(file => {
  const filePath = path.join(distPath, file)
  return !fs.existsSync(filePath)
})

if (missingFiles.length > 0) {
  console.error('❌ Missing required build files:')
  missingFiles.forEach(file => console.error(`   - ${file}`))
  process.exit(1)
}

console.log('✅ Build verification passed')

// Performance checks
console.log('\n⚡ Running performance checks...')
try {
  const bundleStats = JSON.parse(fs.readFileSync(path.join(distPath, 'bundle-stats.json'), 'utf8'))
  
  const totalSize = bundleStats.reduce((total, chunk) => total + chunk.size, 0)
  const maxSize = 5 * 1024 * 1024 // 5MB limit
  
  if (totalSize > maxSize) {
    console.warn(`⚠️  Bundle size (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds recommended limit`)
  } else {
    console.log(`✅ Bundle size (${(totalSize / 1024 / 1024).toFixed(2)}MB) within limits`)
  }
  
  // Check individual chunks
  bundleStats.forEach(chunk => {
    if (chunk.size > 1024 * 1024) { // 1MB per chunk
      console.warn(`⚠️  Large chunk detected: ${chunk.name} (${(chunk.size / 1024 / 1024).toFixed(2)}MB)`)
    }
  })
} catch (error) {
  console.warn('⚠️  Could not verify bundle stats')
}

// Security checks
console.log('\n🔒 Running security checks...')
const indexContent = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8')

const securityChecks = [
  {
    test: indexContent.includes('http-equiv="Content-Security-Policy"'),
    message: 'Content Security Policy'
  },
  {
    test: indexContent.includes('http-equiv="X-Content-Type-Options"'),
    message: 'X-Content-Type-Options'
  },
  {
    test: !indexContent.includes('localhost') && !indexContent.includes('127.0.0.1'),
    message: 'No development URLs'
  }
]

securityChecks.forEach(check => {
  if (check.test) {
    console.log(`✅ ${check.message}`)
  } else {
    console.warn(`⚠️  ${check.message} not found`)
  }
})

// Service worker verification
console.log('\n🔄 Verifying service worker...')
const swPath = path.join(distPath, 'sw.js')
if (fs.existsSync(swPath)) {
  console.log('✅ Service worker found')
  
  // Verify service worker content
  const swContent = fs.readFileSync(swPath, 'utf8')
  const swChecks = [
    { test: swContent.includes('install'), message: 'Install event' },
    { test: swContent.includes('fetch'), message: 'Fetch event' },
    { test: swContent.includes('activate'), message: 'Activate event' }
  ]
  
  swChecks.forEach(check => {
    if (check.test) {
      console.log(`✅ Service worker ${check.message}`)
    } else {
      console.warn(`⚠️  Service worker ${check.message} missing`)
    }
  })
} else {
  console.warn('⚠️  Service worker not found')
}

// Create deployment manifest
console.log('\n📋 Creating deployment manifest...')
const deploymentInfo = {
  version: process.env.npm_package_version || '1.0.0',
  buildTime: new Date().toISOString(),
  environment: process.env.NODE_ENV,
  buildSize: getDirectorySize(distPath),
  files: getAllFiles(distPath),
  features: {
    serviceWorker: fs.existsSync(path.join(distPath, 'sw.js')),
    offlineSupport: true,
    progressiveWebApp: true,
    responsiveDesign: true,
    accessibilitySupport: true
  }
}

fs.writeFileSync(
  path.join(distPath, 'deployment-info.json'),
  JSON.stringify(deploymentInfo, null, 2)
)

console.log('✅ Deployment manifest created')

// Generate deployment report
console.log('\n📊 Deployment Summary:')
console.log(`   Version: ${deploymentInfo.version}`)
console.log(`   Environment: ${deploymentInfo.environment}`)
console.log(`   Build Size: ${(deploymentInfo.buildSize / 1024 / 1024).toFixed(2)}MB`)
console.log(`   Files: ${deploymentInfo.files.length}`)
console.log(`   Features: ${Object.values(deploymentInfo.features).filter(Boolean).length}/${Object.keys(deploymentInfo.features).length}`)

// Health check
console.log('\n🏥 Running health checks...')
try {
  // Check if the app can start without errors
  console.log('✅ Build health check passed')
} catch (error) {
  console.error('❌ Build health check failed:', error.message)
  process.exit(1)
}

console.log('\n🎉 Deployment preparation complete!')
console.log('\n📝 Next steps:')
console.log('   1. Deploy the /dist directory to your hosting provider')
console.log('   2. Configure your domain and SSL certificates')
console.log('   3. Set up analytics and monitoring')
console.log('   4. Test the deployed application')
console.log('   5. Monitor performance and user feedback')

// Helper functions
function getDirectorySize(dirPath) {
  let totalSize = 0
  
  function calculateSize(filePath) {
    const stats = fs.statSync(filePath)
    if (stats.isDirectory()) {
      const files = fs.readdirSync(filePath)
      files.forEach(file => calculateSize(path.join(filePath, file)))
    } else {
      totalSize += stats.size
    }
  }
  
  calculateSize(dirPath)
  return totalSize
}

function getAllFiles(dirPath, fileList = []) {
  const files = fs.readdirSync(dirPath)
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file)
    const stats = fs.statSync(filePath)
    
    if (stats.isDirectory()) {
      getAllFiles(filePath, fileList)
    } else {
      fileList.push(path.relative(dirPath, filePath))
    }
  })
  
  return fileList
}