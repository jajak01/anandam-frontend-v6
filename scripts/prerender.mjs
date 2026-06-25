/**
 * Script prerender untuk SPA Vite + React.
 * - Menjalankan server preview dari folder dist
 * - Fetch daftar ID produk dari API backend (dengan pagination)
 * - Menggunakan Puppeteer untuk merender setiap halaman menjadi HTML statis
 * - Menyimpan hasilnya ke folder dist dengan struktur path yang sesuai
 *
 * Cara pakai:
 *   node scripts/prerender.mjs
 *   (dijalankan SETELAH npm run build selesai)
 *
 * Konfigurasi via environment variable:
 *   VITE_API_BASE        = base URL API (default: https://api-marketplace.anandamcomputer.com)
 *   PRERENDER_MAX_PAGES  = max halaman produk yang di-prerender (default: 3, 0 = semua)
 *   PRERENDER_TIMEOUT    = timeout per halaman (ms, default: 60000)
 */

import { spawn } from 'child_process'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, join, dirname } from 'path'

// ===================== KONFIGURASI =====================
const DIST_DIR = resolve('dist')
const PREVIEW_PORT = 4173
const PREVIEW_URL = `http://localhost:${PREVIEW_PORT}`

// Batasi jumlah halaman produk yang di-prerender (default: 3 halaman pertama = ~300 produk)
// Set ke 0 untuk semua produk (3734 produk -> ~38 halaman API -> butuh waktu lama)
const MAX_PRODUCT_API_PAGES = parseInt(process.env.PRERENDER_MAX_PAGES || '3', 10)

const STATIC_ROUTES = [
  '/',
  '/products',
  '/product-categories',
  '/product-grouping',
  '/company-profile',
  '/terms',
  '/search',
  '/pc-builder',
  '/pc-builder/preview',
  '/price-list',
  '/cart',
]

// ===================== FETCH SEMUA PRODUCT ID DARI API =====================
async function fetchAllProductIds() {
  const API_BASE = process.env.VITE_API_BASE || 'https://api-marketplace.anandamcomputer.com'
  const API_URL = `${API_BASE}/api/v1/products`

  console.log(`[Prerender] Fetching product IDs from: ${API_URL}`)

  try {
    // Ambil halaman pertama untuk tahu total halaman
    const firstRes = await fetch(`${API_URL}?limit=100&page=1`)
    if (!firstRes.ok) throw new Error(`HTTP ${firstRes.status}`)
    const firstData = await firstRes.json()
    
    const totalProducts = firstData.total || 0
    const lastPage = firstData.last_page || 1

    console.log(`[Prerender] API reports ${totalProducts} products across ${lastPage} pages`)

    // Kumpulkan semua ID dari halaman pertama
    let allIds = (firstData.data || []).map((p) => p.id).filter(Boolean)

    // Tentukan berapa halaman yang akan diambil
    const targetPages = MAX_PRODUCT_API_PAGES > 0 
      ? Math.min(MAX_PRODUCT_API_PAGES, lastPage) 
      : lastPage

    console.log(`[Prerender] Fetching ${targetPages} of ${lastPage} pages (PRERENDER_MAX_PAGES=${MAX_PRODUCT_API_PAGES})`)

    // Fetch halaman sisanya (page 2 sampai targetPages)
    const pagePromises = []
    for (let page = 2; page <= targetPages; page++) {
      pagePromises.push(
        fetch(`${API_URL}?limit=100&page=${page}`)
          .then((r) => r.json())
          .then((data) => (data.data || []).map((p) => p.id).filter(Boolean))
          .catch((err) => {
            console.warn(`[Prerender] Failed to fetch page ${page}:`, err.message)
            return []
          })
      )
    }

    const results = await Promise.all(pagePromises)
    for (const ids of results) {
      allIds.push(...ids)
    }

    // Hapus duplikat (jika ada)
    allIds = [...new Set(allIds)]

    console.log(`[Prerender] Collected ${allIds.length} unique product IDs`)
    console.log(`[Prerender] Sample IDs: ${allIds.slice(0, 3).join(', ')}${allIds.length > 3 ? '...' : ''}`)

    return allIds
  } catch (error) {
    console.error('[Prerender] Failed to fetch product IDs:', error.message)
    return []
  }
}

// ===================== TUNGGU SERVER SIAP =====================
function waitForServer(url, maxRetries = 30, interval = 1000) {
  return new Promise((resolve, reject) => {
    let retries = 0
    const check = () => {
      fetch(url)
        .then(() => {
          console.log('[Prerender] Server is ready!')
          resolve()
        })
        .catch(() => {
          retries++
          if (retries >= maxRetries) {
            reject(new Error('Server did not start in time'))
          } else {
            setTimeout(check, interval)
          }
        })
    }
    check()
  })
}

// ===================== START VITE PREVIEW =====================
function startPreview() {
  return new Promise((resolve, reject) => {
    const server = spawn('npx', [
      'vite', 'preview',
      '--port', String(PREVIEW_PORT),
      '--strictPort',
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    })

    server.stdout.on('data', (data) => {
      const output = data.toString()
      if (output.trim()) console.log(`[Preview Server] ${output.trim()}`)
    })

    server.stderr.on('data', (data) => {
      const output = data.toString()
      if (output.trim()) console.log(`[Preview Server] ${output.trim()}`)
      if (output.includes('Local:') || output.includes('ready in')) {
        resolve(server)
      }
    })

    server.on('error', reject)
    setTimeout(() => resolve(server), 5000)

    process.on('SIGINT', () => { server.kill(); process.exit(0) })
    process.on('SIGTERM', () => { server.kill(); process.exit(0) })
  })
}

// ===================== PRERENDER DENGAN PUPPETEER =====================
async function prerenderRoutes(routes) {
  console.log(`\n[Prerender] 🎯 Starting prerender for ${routes.length} routes...`)
  console.log('[Prerender] This may take a while depending on the number of routes...\n')

  let browser

  try {
    const puppeteer = await import('puppeteer')

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',         // Hindari CORS issues
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials',
      ],
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })

    // Set default timeout
    const PAGE_TIMEOUT = parseInt(process.env.PRERENDER_TIMEOUT || '60000', 10)

    let successCount = 0
    let failCount = 0

    for (let i = 0; i < routes.length; i++) {
      const route = routes[i]
      const url = `${PREVIEW_URL}${route}`

      // Tentukan output path
      const outputPath = route === '/'
        ? join(DIST_DIR, 'index.html')
        : join(DIST_DIR, `${route.replace(/\/$/, '')}/index.html`)

      console.log(`[Prerender] [${i + 1}/${routes.length}] Rendering: ${route}`)

      try {
        await page.goto(url, {
          waitUntil: 'networkidle0',
          timeout: PAGE_TIMEOUT,
        })

        // Jika halaman produk, tunggu hingga JSON-LD disuntikkan ke DOM
        if (route.startsWith('/products/')) {
          try {
            await page.waitForSelector('script[type="application/ld+json"]', { timeout: 10000 })
          } catch (e) {
            console.warn(`  ⚠️  Timeout waiting for JSON-LD schema on ${route}`)
          }
        }

        // Tunggu ekstra agar React selesai render + react-helmet-async update <head>
        await new Promise((r) => setTimeout(r, 1500))

        // Ambil HTML hasil render penuh (termasuk <head> dari react-helmet-async)
        const html = await page.content()

        // Validasi <title>
        if (!html.includes('<title>')) {
          console.warn(`  ⚠️  WARNING: No <title> tag found in ${route}`)
        } else {
          // Ekstrak title untuk verifikasi
          const titleMatch = html.match(/<title>([^<]+)<\/title>/)
          if (titleMatch) {
            console.log(`  📋 Title: "${titleMatch[1]}"`)
          }
        }

        // Validasi <meta description>
        if (!html.includes('meta name="description"') && !html.includes("meta name='description'")) {
          console.warn(`  ⚠️  WARNING: No <meta description> found in ${route}`)
        }

        // Bersihkan HTML dari atribut sisa Puppeteer/React
        const cleanedHtml = html
          .replace(/ data-rr-\w+="[^"]*"/g, '')
          .replace(/ data-vite-dev-[^=]*="[^"]*"/g, '')
          .replace(/ data-\w+-fiber="[^"]*"/g, '')

        // Simpan ke file
        mkdirSync(dirname(outputPath), { recursive: true })
        writeFileSync(outputPath, cleanedHtml, 'utf-8')

        console.log(`  ✅ Saved to: ${outputPath.replace(DIST_DIR, 'dist')}`)
        successCount++
      } catch (routeError) {
        console.error(`  ❌ Failed to render ${route}:`, routeError.message)
        failCount++
      }
    }

    console.log(`\n[Prerender] ======== SUMMARY ========`)
    console.log(`[Prerender] Total routes: ${routes.length}`)
    console.log(`[Prerender] Successful: ${successCount}`)
    console.log(`[Prerender] Failed: ${failCount}`)
    console.log(`[Prerender] ===========================\n`)
  } catch (error) {
    console.error('[Prerender] Fatal error:', error)
    throw error
  } finally {
    if (browser) await browser.close()
  }
}

// ===================== MAIN =====================
async function main() {
  console.log(`\n[Prerender] 🚀 Starting prerender process...\n`)

  // 1. Validasi folder dist
  if (!existsSync(DIST_DIR)) {
    console.error(`[Prerender] ❌ dist folder not found! Run 'npm run build' first.`)
    process.exit(1)
  }

  if (!existsSync(join(DIST_DIR, 'index.html'))) {
    console.error(`[Prerender] ❌ dist/index.html not found! Build mungkin gagal.`)
    process.exit(1)
  }

  // 2. Fetch semua product IDs
  const productIds = await fetchAllProductIds()
  const productRoutes = productIds.map((id) => `/products/${id}`)
  const allRoutes = [...STATIC_ROUTES, ...productRoutes]

  console.log(`\n[Prerender] 📊 Route breakdown:`)
  console.log(`[Prerender]   - Static routes: ${STATIC_ROUTES.length}`)
  console.log(`[Prerender]   - Product routes: ${productRoutes.length}`)
  console.log(`[Prerender]   - Total: ${allRoutes.length}`)

  // 3. Start preview server
  console.log(`\n[Prerender] 🔧 Starting preview server on port ${PREVIEW_PORT}...`)
  const server = await startPreview()

  try {
    // 4. Tunggu server siap
    await waitForServer(PREVIEW_URL)

    // 5. Jalankan prerender
    await prerenderRoutes(allRoutes)

    console.log(`[Prerender] ✅ Prerender completed successfully!`)
    console.log(`[Prerender] 📁 Output directory: dist/`)
    console.log(`[Prerender] 💡 Run 'npm run preview' to test the result.\n`)
  } catch (error) {
    console.error('[Prerender] ❌ Error:', error.message)
    process.exit(1)
  } finally {
    server.kill()
    process.exit(0)
  }
}

main()