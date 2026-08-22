import type { RequestHandler } from 'express'
import type { Role } from '../types.js'

export function authorizeRoles(...allowedRoles: Role[]): RequestHandler {
  return (req, res, next) => {
    const user = (req as { user?: { role: Role } }).user
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient privileges' })
    }
    next()
  }
}
