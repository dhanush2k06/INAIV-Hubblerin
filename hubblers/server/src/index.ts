import { app } from './app.js'
import { env } from './config.js'

export { app }
export default app

// Only start the standalone HTTP listener when NOT running in a serverless environment (e.g. Vercel)
if (!process.env.VERCEL) {
  const server = app.listen(env.port, () => {
    console.log(`Hubblers backend listening on http://localhost:${env.port}`)

    // Keep-Alive Self-Ping for platforms like Render
    const pingUrl = process.env.RENDER_EXTERNAL_URL || process.env.SELF_PING_URL
    if (pingUrl && !pingUrl.includes('localhost')) {
      const healthEndpoint = `${pingUrl.replace(/\/$/, '')}/api/health`
      console.log(`[KeepAlive] Self-ping configured → ${healthEndpoint} (every 4 min)`)
      setInterval(async () => {
        try {
          const res = await fetch(healthEndpoint)
          if (res.ok) {
            console.log(`[KeepAlive] Heartbeat OK at ${new Date().toISOString()}`)
          }
        } catch (e) {
          console.warn('[KeepAlive] Heartbeat error:', (e as Error).message)
        }
      }, 4 * 60 * 1000)
    }
  })

  // Gracefully handle port conflicts (EADDRINUSE) that occur during tsx hot-reload
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
    setTimeout(() => process.exit(1), 3000).unref()
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

// Keep the server alive even if an unhandled promise rejection or uncaught exception occurs
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason)
})
process.on('uncaughtException', (error) => {
  console.error('[uncaughtException]', error)
})
