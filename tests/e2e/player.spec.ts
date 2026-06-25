// player.spec.ts — Playwright E2E tests for VPS Radio web player
// Run with: npx playwright test
// These tests run against http://localhost:3000 (Vite dev server or Docker)

import { test, expect, type Page } from '@playwright/test'

const BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:3000'
const API_URL  = process.env.TEST_API_URL  ?? 'http://localhost:4000'

// ── Helper ─────────────────────────────────────────────────────────────────

async function mockNowPlaying(page: Page, overrides: Record<string, unknown> = {}) {
  const defaults = {
    live: false,
    mount: '/fallback',
    title: 'Test Track — Artist',
    artist: 'Test Artist',
    listeners: 3,
    bitrate: 192,
    format: 'MP3',
    stream_start: null,
    fallback: true,
    timestamp: new Date().toISOString(),
  }
  await page.route('**/now-playing', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...defaults, ...overrides }),
    }),
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────

test.describe('Web Player', () => {
  test.beforeEach(async ({ page }) => {
    await mockNowPlaying(page)
  })

  test('player page loads with station name', async ({ page }) => {
    await page.goto(BASE_URL)
    await expect(page).toHaveTitle(/VPS Radio/i)
    // Station name visible in header
    await expect(page.locator('.app-title')).toBeVisible()
  })

  test('player component renders', async ({ page }) => {
    await page.goto(BASE_URL)
    const player = page.locator('[aria-label="Radio player"]')
    await expect(player).toBeVisible()
  })

  test('play button is present and accessible', async ({ page }) => {
    await page.goto(BASE_URL)
    const playBtn = page.locator('[aria-label="Play"]')
    await expect(playBtn).toBeVisible()
    await expect(playBtn).toBeEnabled()
  })

  test('now-playing track title shows after load', async ({ page }) => {
    await page.goto(BASE_URL)
    // Wait for the now-playing fetch to complete
    await expect(page.locator('.player-track')).toContainText('Test Track', { timeout: 10_000 })
  })

  test('now-playing artist shows after load', async ({ page }) => {
    await page.goto(BASE_URL)
    await expect(page.locator('.player-artist')).toContainText('Test Artist', { timeout: 10_000 })
  })

  test('AUTO badge shown when not live', async ({ page }) => {
    await page.goto(BASE_URL)
    await expect(page.locator('.badge--auto')).toBeVisible({ timeout: 10_000 })
  })

  test('LIVE badge shown when DJ is connected', async ({ page }) => {
    await mockNowPlaying(page, { live: true, mount: '/live', fallback: false })
    await page.goto(BASE_URL)
    await expect(page.locator('.badge--live')).toBeVisible({ timeout: 10_000 })
  })

  test('listener count is displayed', async ({ page }) => {
    await page.goto(BASE_URL)
    await expect(page.locator('.listener-count')).toContainText('3 listeners', { timeout: 10_000 })
  })

  test('volume slider is present and accessible', async ({ page }) => {
    await page.goto(BASE_URL)
    const slider = page.locator('[aria-label="Volume"]')
    await expect(slider).toBeVisible()
    await expect(slider).toHaveAttribute('type', 'range')
  })

  test('visualizer canvas is rendered', async ({ page }) => {
    await page.goto(BASE_URL)
    const canvas = page.locator('.visualizer-canvas')
    await expect(canvas).toBeVisible()
  })

  test('VU meter is rendered', async ({ page }) => {
    await page.goto(BASE_URL)
    const vuMeter = page.locator('[aria-label="VU meter"]')
    await expect(vuMeter).toBeVisible()
  })
})

test.describe('Navigation', () => {
  test('schedule page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/schedule`)
    await expect(page.locator('.schedule-title')).toBeVisible()
    await expect(page.locator('.schedule-list')).toBeVisible()
  })

  test('schedule page shows show entries', async ({ page }) => {
    await page.goto(`${BASE_URL}/schedule`)
    const items = page.locator('.schedule-item')
    await expect(items).toHaveCount(5)
  })

  test('embed page loads in compact mode', async ({ page }) => {
    await mockNowPlaying(page)
    await page.goto(`${BASE_URL}/embed`)
    const player = page.locator('[aria-label="Radio player"]')
    await expect(player).toBeVisible()
    // Should not have brand strip in compact mode
    await expect(page.locator('.player-brand')).not.toBeVisible()
  })

  test('schedule link in nav navigates correctly', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.click('a[href="/schedule"]')
    await expect(page.locator('.schedule-title')).toBeVisible()
  })
})

test.describe('API endpoints', () => {
  test('GET /health returns ok', async ({ request }) => {
    const res = await request.get(`${API_URL}/health`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.service).toBe('vps-radio-api')
  })

  test('GET /now-playing returns valid shape', async ({ request }) => {
    const res = await request.get(`${API_URL}/now-playing`)
    // 200 or 503 (when Icecast not running) are both valid
    expect([200, 503]).toContain(res.status())
    const body = await res.json()
    expect(typeof body.timestamp).toBe('string')
  })

  test('GET /shows returns array', async ({ request }) => {
    const res = await request.get(`${API_URL}/shows`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(Array.isArray(body.shows)).toBe(true)
  })

  test('GET /podcast/feed.xml returns RSS', async ({ request }) => {
    const res = await request.get(`${API_URL}/podcast/feed.xml`)
    expect(res.ok()).toBeTruthy()
    const text = await res.text()
    expect(text).toContain('<?xml')
    expect(text).toContain('<rss')
  })
})
