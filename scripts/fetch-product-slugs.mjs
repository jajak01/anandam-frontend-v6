/**
 * Script untuk mengambil daftar slug produk dari API backend Nest.js.
 * Digunakan di vite.config.ts untuk prerendering dynamic routes.
 * File .mjs agar bisa di-import langsung tanpa kompilasi TypeScript.
 */

/**
 * @returns {Promise<string[]>} daftar string yang merupakan slug/id produk
 */
export async function fetchProductSlugs() {
  const API_BASE = process.env.VITE_API_BASE || "https://api-marketplace.anandamcomputer.com";
  const SLUGS_ENDPOINT = `${API_BASE}/api/v1/products/slugs`;

  console.log(`[Prerender] Fetching product slugs from: ${SLUGS_ENDPOINT}`);

  try {
    const response = await fetch(SLUGS_ENDPOINT);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    // Handle berbagai format response yang mungkin dari Nest.js API
    let slugs = [];

    if (Array.isArray(result)) {
      // Jika response langsung array string (slugs)
      slugs = result;
    } else if (Array.isArray(result.data)) {
      // Jika response { data: [...] }
      slugs = result.data;
    } else if (Array.isArray(result.slugs)) {
      // Jika response { slugs: [...] }
      slugs = result.slugs;
    } else if (Array.isArray(result.products)) {
      // Jika response { products: [{ id, slug, name }] }
      slugs = result.products.map((p) => p.slug || p.id);
    }

    // Filter hanya string valid dan hapus duplikat
    slugs = [...new Set(slugs.filter(Boolean))];

    console.log(`[Prerender] Successfully fetched ${slugs.length} product slugs`);
    console.log(`[Prerender] Sample slugs: ${slugs.slice(0, 3).join(", ")}${slugs.length > 3 ? "..." : ""}`);

    return slugs;
  } catch (error) {
    console.error("[Prerender] Failed to fetch product slugs:", error);
    console.warn("[Prerender] WARNING: Continuing build with empty product routes.");
    return []; // Return empty array agar build tetap lanjut
  }
}