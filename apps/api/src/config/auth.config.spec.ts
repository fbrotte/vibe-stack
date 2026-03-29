import { describe, it, expect, afterEach } from 'vitest'

describe('auth config factory', () => {
  afterEach(() => {
    delete process.env.AUTH_REGISTRATION_MODE
    delete process.env.AUTH_MAGIC_LINK_TTL
    delete process.env.AUTH_DEV_LOGIN
  })

  it('returns defaults when no env vars are set', async () => {
    const { default: authConfigFactory } = await import('./auth.config')
    const config = authConfigFactory()
    expect(config.registrationMode).toBe('open')
    expect(config.magicLinkTtl).toBe(15)
    expect(config.devLogin).toBe(true)
  })

  it('reads AUTH_REGISTRATION_MODE from env', async () => {
    process.env.AUTH_REGISTRATION_MODE = 'invite-only'
    // Re-import to pick up env changes
    const mod = await import('./auth.config?t=' + Date.now())
    const config = mod.default()
    expect(config.registrationMode).toBe('invite-only')
  })

  it('reads AUTH_MAGIC_LINK_TTL from env', async () => {
    process.env.AUTH_MAGIC_LINK_TTL = '30'
    const mod = await import('./auth.config?t=' + Date.now())
    const config = mod.default()
    expect(config.magicLinkTtl).toBe(30)
  })

  it('disables devLogin when AUTH_DEV_LOGIN is false', async () => {
    process.env.AUTH_DEV_LOGIN = 'false'
    const mod = await import('./auth.config?t=' + Date.now())
    const config = mod.default()
    expect(config.devLogin).toBe(false)
  })

  it('rejects invalid registrationMode', async () => {
    process.env.AUTH_REGISTRATION_MODE = 'magic'
    const mod = await import('./auth.config?t=' + Date.now())
    expect(() => mod.default()).toThrow()
  })
})
