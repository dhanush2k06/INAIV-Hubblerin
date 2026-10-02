import path from 'path'
import fs from 'fs'
import express from 'express'
import compression from 'compression'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'
import collegesRoutes from './routes/colleges.js'
import dashboardRoutes from './routes/dashboard.js'
import eventsRoutes from './routes/events.js'
import crmRoutes from './routes/crm.js'
import rewardsRoutes from './routes/rewards.js'
import connectionsRoutes from './routes/connections.js'
import postsRoutes from './routes/posts.js'
import { seedInitialRewards } from './services/rewardService.js'
import { env } from './config.js'

const app = express()

// Gzip / Deflate compression for ultra-fast API JSON payloads and responses
app.use(compression())

// Trust reverse proxy (Vercel, Railway, Render, Cloudflare, etc.) so req.ip reflects actual client IP
app.set('trust proxy', 1)

// Normalize URL for serverless environments (e.g., Vercel rewrites)
app.use((req, _res, next) => {
  const matchedPath = req.headers['x-matched-path']
  if (typeof matchedPath === 'string' && !req.url.startsWith('/api') && matchedPath.startsWith('/api')) {
    req.url = matchedPath
  }
  next()
})

// Auto-seed initial store rewards in the background on startup
seedInitialRewards().catch((err) => console.error('[Server] seedInitialRewards error:', err))

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
)

// Local development and common production origins
const devOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
]

const allowedOrigins = [env.corsOrigin, ...env.corsOrigins, ...devOrigins]
  .filter(Boolean)
  .map((o) => o.replace(/\/$/, ''))

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, curl, or mobile app requests (no origin)
      if (!origin) return callback(null, true)

      const normalizedOrigin = origin.replace(/\/$/, '')

      // Allow if wildcard, explicitly in allowedOrigins list, or any .onrender.com / .vercel.app subdomain
      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(normalizedOrigin) ||
        normalizedOrigin.endsWith('.onrender.com') ||
        normalizedOrigin.endsWith('.vercel.app') ||
        devOrigins.includes(normalizedOrigin)
      ) {
        return callback(null, true)
      }

      console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`)
      return callback(new Error(`Not allowed by CORS: ${origin}`))
    },
    credentials: true,
  }),
)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// General API Rate Limiter (Scalable for 100+ concurrent active sessions)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1500,
  standardHeaders: true,
  legacyHeaders: false,
})

// Specific Auth Limiter to prevent brute-force attacks while avoiding blocking regular navigation
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { error: 'Too many authentication attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/auth/login', authLimiter)
app.use('/api/auth/signup', authLimiter)
app.use('/api/', generalLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/colleges', collegesRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/crm', crmRoutes)
app.use('/api/rewards', rewardsRoutes)
app.use('/api/connections', connectionsRoutes)
app.use('/api/posts', postsRoutes)

app.get('/api/health', (_req, res) => res.json({ message: 'Hubblers API is running' }))

// Serve static frontend assets if built dist folder exists (Standalone / Railway deployment)
// In Vercel, static assets are served directly by the CDN
if (!process.env.VERCEL) {
  const possibleDistPaths = [
    path.join(process.cwd(), 'dist'),
    path.join(process.cwd(), 'hubblers', 'dist'),
    path.join(process.cwd(), '..', 'dist'),
  ]

  const distPath = possibleDistPaths.find((p) => fs.existsSync(path.join(p, 'index.html')))

  if (distPath) {
    console.log(`[Server] Serving static frontend with high-performance caching from: ${distPath}`)
    app.use(
      express.static(distPath, {
        maxAge: '1y',
        etag: true,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
          } else {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
          }
        },
      }),
    )
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next()
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      res.sendFile(path.join(distPath, 'index.html'))
    })
  } else {
    app.use('/api', (_req, res) => {
      res.status(404).json({ error: 'API route not found' })
    })
  }
} else {
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API route not found' })
  })
}

// Global error handler
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    void _next
    console.error('[Global error handler]', err)
    const message = err instanceof Error ? err.message : String(err)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', details: message })
    }
  },
)

export { app }
export default app
