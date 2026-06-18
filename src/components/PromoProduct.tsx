import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ProductCard from "./ProductCard";

interface PromoProductSliderProps {
  products: any[];
  promoImageUrl?: string;
  getImageUrl: (url?: string) => string;
}

export default function PromoProductSlider({ products, promoImageUrl, getImageUrl }: PromoProductSliderProps) {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // State untuk mengatur efek fade-out/fade-in banner secara real-time saat di-scroll
  const [bannerOpacity, setBannerOpacity] = useState(1);

  // 1. FILTER PRODUK PROMO & VALIDASI READY STOCK
  const discountedProducts = products.filter((p) => {
    if (!p) return false;
    const hasPromo = p.discount > 0 || p.discount_price > 0 || p.is_promo === true;
    const hasStock = p.variants && Array.isArray(p.variants)
      ? p.variants.reduce((acc: number, v: any) => acc + (v.stock ?? v.stok ?? v.qty ?? 0), 0) > 0
      : false;
    return hasPromo && hasStock;
  }).slice(0, 4);

  // 2. FUNGSI UNTUK MENGHITUNG FADE OUT / FADE IN BANNER SAAT DI-SCROLL
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    
    // Banner akan memudar habis (opacity 0) jika user sudah scroll sejauh 150px
    const maxScrollForFade = 150; 
    const newOpacity = Math.max(0, 1 - scrollLeft / maxScrollForFade);
    
    setBannerOpacity(newOpacity);
  };

  // 3. LOGIKA AUTO-SCROLL OTOMATIS (Bisa berjalan di mobile maupun desktop jika di-hover)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || discountedProducts.length === 0) return;

    // Gunakan fungsi named agar bisa dibersihkan dengan benar
    const startAutoScroll = () => {
      return setInterval(() => {
        // HANYA scroll jika TIDAK sedang di-hover atau disentuh
        if (isHovered) return; 

        const maxScroll = container.scrollWidth - container.clientWidth;
        if (container.scrollLeft >= maxScroll - 15) {
          container.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          container.scrollBy({ left: 200, behavior: "smooth" });
        }
      }, 4000);
    };

    const timer = startAutoScroll();
    return () => clearInterval(timer);
  }, [discountedProducts, isHovered]);

  if (discountedProducts.length === 0) return null;

  return (
    <section className="bg-white py-4">
      <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-12">
        
        {/* CONTAINER UTAMA (Kunci 1 baris lurus tanpa putus untuk Mobile & Desktop) */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => setIsHovered(false)}
          // Hapus touch-pan-x agar tidak memblokir scroll vertikal (ke bawah/atas) di HP
          className="flex flex-row flex-nowrap items-stretch gap-3 p-3 overflow-x-auto scrollbar-hide bg-[#1A85D5] rounded-xl shadow-md"
        >
          
          {/* ================= SISI KIRI: BANNER PROMO ================= */}
          {/* Menggunakan inline style untuk mengubah opacity secara real-time dan pointer-events agar tidak mengalangi klik saat transparan */}
          <div 
            style={{ opacity: bannerOpacity, pointerEvents: bannerOpacity === 0 ? "none" : "auto" }}
            className="
              flex-shrink-0 snap-start flex flex-col items-center justify-center text-center p-2
              /* Mengunci lebar banner agar presisi mirip gambar di mobile (w-[140px]) dan desktop (lg:w-[180px]) */
              w-[140px] lg:w-[180px] 
              transition-opacity duration-100 ease-out
            "
          >
            {promoImageUrl && (
              <img 
                src={getImageUrl(promoImageUrl)} 
                alt="Promo Banner" 
                className="w-full h-auto object-contain select-none pointer-events-none"
              />
            )}
          </div>

          {/* ================= SISI KANAN: BARISAN PRODUK PROMO ================= */}
          {/* DAFTAR CARD PRODUK */}
          {discountedProducts.map((product) => (
            <div 
              key={product.id} 
              className="
                bg-white rounded-xl p-2 shadow-sm flex-shrink-0 flex flex-col justify-between
                /* Hapus snap-start di sini */
                w-[calc(50%-8px)] 
                sm:w-[190px] md:w-[210px] lg:w-[220px]
              "
            >
              <ProductCard product={product} />
            </div>
          ))}

          {/* CARD LIHAT SELENGKAPNYA */}
          <div 
            onClick={() => navigate("/products?promo=true")}
            className="
              bg-white/10 border border-dashed border-white/30 rounded-xl flex flex-col items-center justify-center text-white cursor-pointer hover:bg-white/20 transition-all text-center flex-shrink-0 p-4
              /* Hapus snap-start di sini */
              w-[calc(50%-8px)] sm:w-[190px] md:w-[210px] lg:w-[220px] min-h-[250px]
            "
          >
            <div className="w-9 h-9 bg-white text-[#1A85D5] rounded-full flex items-center justify-center mb-2 shadow-sm">
              <ArrowRight size={18} />
            </div>
            <span className="font-bold text-[11px] tracking-wide">Lihat Selengkapnya</span>
          </div>

        </div> {/* END CONTAINER UTAMA */}
      </div>
    </section>
  );
}