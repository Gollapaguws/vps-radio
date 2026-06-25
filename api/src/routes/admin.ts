// admin.ts — admin login + JWT middleware
// Uses a hand-rolled HMAC-SHA256 JWT (no extra deps)
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const ADMIN_PASS = process.env.ADMIN_PASSWORD ?? ''
const JWT_SECRET = process.env.API_SECRET ?? randomBytes(32).toString('hex')
const TOKEN_TTL  = 8 * 60 * 60 * 1000 // 8 hours

// ── Minimal JWT (HS256) ─────────────────────────────────────────────────────
function b64url(buf: string | Buffer): string {
  const s = typeof buf === 'string' ? Buffer.from(buf) : buf
  return s.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function signJwt(payload: Record<string, unknown>): string {
  const header  = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body    = b64url(JSON.stringify(payload))
  const sig     = b64url(createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest())
  return `${header}.${body}.${sig}`
}

function verifyJwt(token: string): Record<string, unknown> | null {
  try {
    const [header, body, sig] = token.split('.')
    if (!header || !body || !sig) return null
    const expected = b64url(createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest())
    const sigBuf = Buffer.from(sig + '==', 'base64')
    const expBuf = Buffer.from(expected + '==', 'base64')
    if (sigBuf.length !== expBuf.length) return null
    if (!timingSafeEqual(sigBuf, expBuf)) return null
    const payload = JSON.parse(Buffer.from(body, 'base64').toString()) as Record<string, unknown>
    if (typeof payload.exp === 'number' && Date.now() > payload.exp) return null
    return payload
  } catch {
    return null
  }
}

// ── Fastify plugin ──────────────────────────────────────────────────────────
export async function adminRoute(app: FastifyInstance) {
  // POST /admin/login
  app.post('/admin/login', async (request, reply) => {
    const { password } = request.body as { password?: string }

    if (!ADMIN_PASS) {
      return reply.code(503).send({ error: 'Admin password not configured' })
    }

    // Constant-time comparison
    const a = Buffer.from(password ?? '')
    const b = Buffer.from(ADMIN_PASS)
    const match = a.length === b.length && timingSafeEqual(a, b)

    if (!match) {
      return reply.code(401).send({ error: 'Invalid password' })
    }

    const token = signJwt({ sub: 'admin', iat: Date.now(), exp: Date.now() + TOKEN_TTL })
    reply.send({ token, expiresIn: TOKEN_TTL })
  })

  // GET /admin/me — validate token
  app.get('/admin/me', async (request, reply) => {
    const token = extractToken(request)
    const payload = token ? verifyJwt(token) : null
    if (!payload) return reply.code(401).send({ error: 'Unauthorized' })
    reply.send({ ok: true, sub: payload.sub })
  })
}

// ── Middleware helper (use in other routes) ─────────────────────────────────
export function extractToken(request: FastifyRequest): string | null {
  const auth = request.headers.authorization
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  const q = (request.query as Record<string, string>).token
  return q ?? null
}

export function requireAdmin(request: FastifyRequest, reply: FastifyReply): boolean {
  const token = extractToken(request)
  const payload = token ? verifyJwt(token) : null
  if (!payload) {
    void reply.code(401).send({ error: 'Unauthorized' })
    return false
  }
  return true
}
