const { createServer } = require('https')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')
const path = require('path')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = 3000

// Initialize Next.js
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// Check if certificates exist
const certPath = path.join(__dirname, 'certificates', 'localhost.crt')
const keyPath = path.join(__dirname, 'certificates', 'localhost.key')

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.error('\n❌ SSL certificates not found!')
  console.error('Please create certificates first:\n')
  console.error('mkdir certificates')
  console.error('cd certificates')
  console.error('openssl req -x509 -newkey rsa:4096 -keyout localhost.key -out localhost.crt -days 365 -nodes -subj "/CN=localhost"\n')
  process.exit(1)
}

const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
}

console.log('🔄 Preparing Next.js...')

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error('❌ Server error:', err)
      process.exit(1)
    })
    .listen(port, hostname, () => {
      console.log('\n✅ HTTPS Server ready!\n')
      console.log(`   Local:    https://localhost:${port}`)
      console.log(`   Network:  https://192.168.2.200:${port}`)
      console.log('\n⚠️  Browser will show security warning - this is normal for self-signed certificates\n')
    })
}).catch((err) => {
  console.error('❌ Error preparing Next.js:', err)
  process.exit(1)
})