import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'
import collegesRoutes from './routes/colleges.js'
import dashboardRoutes from './routes/dashboard.js'
import eventsRoutes from './routes/events.js'
import crmRoutes from './routes/crm.js'
import { env } from './config.js'

const app = express()

app.use(helmet())
// Local development origins should always be allowed so the Vite dev servers
// (hubblers on :5173, CRM on :5174) can talk to the backend without CORS errors.
const devOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
]
const allowedOrigins = [env.corsOrigin, ...env.corsOrigins, ...devOrigins].filter(Boolean)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, server-to-server) and any allowed origin.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error('Not allowed by CORS'))
    },
  }),
)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  }),
)

app.use('/api/auth', authRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/colleges', collegesRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/crm', crmRoutes)

app.get('/api/health', (_req, res) => res.json({ message: 'Hubblers API is running' }))

app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

// Global error handler — catches any error thrown in a route (including async
// handlers) and returns a 500 instead of letting the process crash, which is
// what previously caused the Vite proxy to fail with ECONNREFUSED.
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

const server = app.listen(env.port, () => {
  console.log(`Hubblers backend listening on http://localhost:${env.port}`)
})

// Gracefully handle port conflicts (EADDRINUSE) that occur during tsx hot-reload,
// instead of crashing the process and requiring a manual restart.
server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `[Server] Port ${env.port} is already in use. ` +
        'Another instance may still be shutting down — retrying in 1 s...',
    )
    setTimeout(() => {
      server.close()
      server.listen(env.port)
    }, 1000)
  } else {
    console.error('[Server] Unexpected server error:', err)
  }
})

// Release the port cleanly when tsx sends SIGTERM/SIGINT during file-watch restarts.
function shutdown(signal: string) {
  console.log(`[Server] ${signal} received — closing HTTP server...`)
  server.close(() => {
    console.log('[Server] HTTP server closed.')
    process.exit(0)
  })
  // Force-exit if the server hasn't closed within 3 seconds.
  setTimeout(() => process.exit(1), 3000).unref()
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

// Keep the server alive even if an unhandled promise rejection or uncaught
// exception occurs; log it instead of silently dying.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason)
})
process.on('uncaughtException', (error) => {
  console.error('[uncaughtException]', error)
})
