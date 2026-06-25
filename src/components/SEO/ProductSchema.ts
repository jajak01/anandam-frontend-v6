/**
 * Utility untuk membuat Schema.org JSON-LD untuk halaman produk.
 * Kompatibel dengan prerendering Puppeteer (tidak bergantung pada window).
 */

export interface ProductSchemaConfig {
  name: string;
  id: string;
  description: string;
  images: Array<{ image_url: string }>;
  sku?: string;
  brand?: { name: string } | null;
  price: number;
  currency?: string;
  inStock: boolean;
  canonicalUrl: string;
  priceValidUntil?: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
    bestRating?: number;
  };
}

/**
 * Membuat JSON-LD markup untuk tipe Schema.org Product.
 * Output berupa string JSON yang siap dimasukkan ke <script type="application/ld+json">.
 * Aman untuk prerendering Puppeteer karena tidak menggunakan window.
 */
export function createProductSchema(config: ProductSchemaConfig): string {
  const {
    name,
    id,
    description,
    images,
    sku,
    brand,
    price,
    currency = "IDR",
    inStock,
    canonicalUrl,
    priceValidUntil,
    aggregateRating,
  } = config;

  // Build image array dengan full URL
  const apiBase = import.meta.env.VITE_API_BASE || "https://api-marketplace.anandamcomputer.com";
  const imageUrls: string[] = (images || [])
    .map((img) =>
      img.image_url?.startsWith("http")
        ? img.image_url
        : `${apiBase}${img.image_url}`
    )
    .filter(Boolean);

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description?.substring(0, 500) || `Beli ${name} dengan harga terbaik di Anandam Computer.`,
    image: imageUrls.length > 0 ? imageUrls : undefined,
    sku: sku || id,
    brand: brand?.name
      ? {
          "@type": "Brand",
          name: brand.name,
        }
      : {
          "@type": "Brand",
          name: "Anandam Computer",
        },
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: currency,
      price,
      itemCondition: "https://schema.org/NewCondition",
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      ...(priceValidUntil ? { priceValidUntil } : {}),
    },
  };

  // Tambah aggregateRating jika ada review
  if (aggregateRating && aggregateRating.reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: aggregateRating.ratingValue,
      reviewCount: aggregateRating.reviewCount,
      bestRating: aggregateRating.bestRating || 5,
    };
  }

  // Hapus undefined/null values
  const cleanObject = (obj: Record<string, unknown>): Record<string, unknown> => {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null && value !== "") {
        if (typeof value === "object" && !Array.isArray(value)) {
          const nested = cleanObject(value as Record<string, unknown>);
          if (Object.keys(nested).length > 0) {
            cleaned[key] = nested;
          }
        } else if (Array.isArray(value) && value.length > 0) {
          cleaned[key] = value;
        } else if (!Array.isArray(value)) {
          cleaned[key] = value;
        }
      }
    }
    return cleaned;
  };

  return JSON.stringify(cleanObject(schema));
}

/**
 * Interface untuk parameter meta tags produk.
 */
export interface ProductMetaParams {
  name: string;
  description?: string | null;
  images?: Array<{ image_url: string }> | null;
  price: number;
  inStock: boolean;
  canonicalUrl: string;
}

/**
 * Generate semua SEO meta tags untuk halaman produk.
 * Mengembalikan objek dengan properti title, description, canonical, og, twitter.
 */
export function getProductMetaTags(product: ProductMetaParams) {
  const { name, description, images, price, inStock, canonicalUrl } = product;
  const apiBase = import.meta.env.VITE_API_BASE || "https://api-marketplace.anandamcomputer.com";

  const descriptionText = (description?.substring(0, 160) || `Beli ${name} dengan harga terbaik. Tersedia garansi resmi dan pengiriman cepat.`)
    .replace(/\s+/g, " ")
    .trim();

  const imageUrl = images?.[0]?.image_url
    ? images[0].image_url.startsWith("http")
      ? images[0].image_url
      : `${apiBase}${images[0].image_url}`
    : undefined;

  return {
    title: `${name} - Anandam Computer`,
    description: descriptionText,
    canonical: canonicalUrl,
    og: {
      title: `${name} - Anandam Computer`,
      description: descriptionText,
      url: canonicalUrl,
      type: "product",
      image: imageUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} - Anandam Computer`,
      description: descriptionText,
      image: imageUrl,
      label1: "Harga",
      data1: `Rp ${price.toLocaleString("id-ID")}`,
      label2: "Ketersediaan",
      data2: inStock ? "Tersedia" : "Stok Habis",
    },
  };
}