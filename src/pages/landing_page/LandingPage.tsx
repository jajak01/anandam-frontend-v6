import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { getProducts } from "../../services/productService";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getCategories } from "../../services/adminCategoryService";
import { getBanners } from "../../services/bannerService";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "../../components/ProductCard";
import LoadMoreButton from "../../components/LoadMoreButton";
import CategoryProductSection from "../../components/CategoryProductSection";
import GlassParticlesBackground from "../../components/GlassParticleBackground";
import ProductCardSkeleton from "../../components/ProductCardSkeleton";
import LandingCategorySection from "../../components/LandingCategorySection";
import { OfficialBrandSection } from "../../components/OfficialBrand";
import { getGroupings } from "../../services/groupingService";
import GroupingProductSlider from "../../components/GroupingProduct";
import PopularProduct from "../../components/PopularProduct";
import { getTikTokLiveStatus } from "../../services/tiktokService";
import PromoProductSlider from "../../components/PromoProduct";
import { Helmet } from "react-helmet-async";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    setIsMobile(media.matches);

    const listener = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  return isMobile;
}

export default function LandingPage() {
  const scrollPositionRef = useRef(0);
  const shouldRestoreScroll = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [activeSearch, setActiveSearch] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search");

  useEffect(() => {
    if (searchQuery !== null) {
      setActiveSearch(searchQuery);
      setSearchParams({}, { replace: true });
    }
  }, [searchQuery, setSearchParams]);

  const [categories, setCategories] = useState<any[]>([]);

  const scrollLeft = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const card = container.querySelector(".product-slide") as HTMLElement;
    if (!card) return;
    const gap = 24; 
    const cardWidth = card.offsetWidth + gap;
    container.scrollBy({ left: -cardWidth, behavior: "smooth" });
  };

  const scrollRight = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const card = container.querySelector(".product-slide") as HTMLElement;
    if (!card) return;
    const gap = 24; 
    const cardWidth = card.offsetWidth + gap;
    container.scrollBy({ left: cardWidth, behavior: "smooth" });
  };

  const [popularProducts, setPopularProducts] = useState<any[]>([]);
  const [searchProducts, setSearchProducts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [promoProducts, setPromoProducts] = useState<any[]>([]);

  const fetchPromoProducts = async () => {
    try {
      const res = await getProducts({ is_promo: true, limit: 10 });
      setPromoProducts(res.data || []);
    } catch (err) {
      console.error("Gagal fetch promo products", err);
    }
  };

  const fetchPopularProducts = async () => {
    try {
      const res = await getProducts({ is_popular: true, limit: 10 });
      setPopularProducts(res.data || []);
    } catch (err) {
      console.error("Gagal fetch popular products", err);
    }
  };

  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    startX.current = e.clientX;
    scrollLeftStart.current = scrollRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    const walk = (e.clientX - startX.current) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const handleMouseUp = () => { isDragging.current = false; };
  const handleMouseLeave = () => { isDragging.current = false; };

  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [banners, setBanners] = useState<any[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);

  const heroBanners = banners.filter((b) => b.slot === "hero");
  const bannerPromoMobile = banners.find((b) => b.slot === "banner-after-category-mobile");
  const bannerPromoDesktop = banners.find((b) => b.slot === "banner-after-category");
  const bannerAfterPopularCenters = banners.find((b) => b.slot === "banner-promo");
  const bannerPromoProductSlider = banners.find((b) => b.slot === "banner-promo-product");
  const promoBanners = banners.filter((b) => b.slot === "banner-promo");

  const [isHovered, setIsHovered] = useState(false);
  const isDragClickRef = useRef<boolean>(true);

  // ==========================================
  // LOGIKA INFINITE CAROUSEL HERO BANNER
  // ==========================================
  const [currentHero, setCurrentHero] = useState(1);
  const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const displayHeroBanners = useMemo(() => {
    if (heroBanners.length <= 1) return heroBanners;
    return [
      heroBanners[heroBanners.length - 1], 
      ...heroBanners,
      heroBanners[0]       
    ];
  }, [heroBanners]);

  const [isTransitioning, setIsTransitioning] = useState(true);

  const activeBannerIdx = useMemo(() => {
    if (heroBanners.length === 0) return 0;
    let idx = currentHero - 1;
    if (currentHero === 0) {
      idx = heroBanners.length - 1;
    } else if (currentHero === displayHeroBanners.length - 1) {
      idx = 0;
    }
    if (idx < 0) idx = 0;
    if (idx >= heroBanners.length) idx = 0;
    return idx;
  }, [currentHero, heroBanners, displayHeroBanners]);

  const activeBanner = useMemo(() => {
    return heroBanners[activeBannerIdx] || null;
  }, [heroBanners, activeBannerIdx]);

  const startAutoSlide = useCallback(() => {
    if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    if (heroBanners.length <= 1) return;

    autoSlideRef.current = setInterval(() => {
      setIsTransitioning(true);
      setCurrentHero((prev) => prev + 1);
    }, 4000);
  }, [heroBanners.length]);

  useEffect(() => {
    startAutoSlide();
    return () => {
      if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    };
  }, [startAutoSlide]);

  const nextHero = () => {
    setIsTransitioning(true);
    setCurrentHero((prev) => prev + 1);
    startAutoSlide();
  };

  const prevHero = () => {
    setIsTransitioning(true);
    setCurrentHero((prev) => prev - 1);
    startAutoSlide();
  };

  useEffect(() => {
    if (heroBanners.length <= 1) return;

    if (currentHero === displayHeroBanners.length - 1) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentHero(1);
      }, 500); 
      return () => clearTimeout(timer);
    }

    if (currentHero === 0) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentHero(displayHeroBanners.length - 2);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentHero, heroBanners.length, displayHeroBanners.length]);

  // ==========================================
  // LOGIKA CAROUSEL PROMO BANNER (INFINITE LOOP)
  // ==========================================
  const [currentPromo, setCurrentPromo] = useState(1);
  const [isPromoTransitioning, setIsPromoTransitioning] = useState(true);
  const autoPromoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const displayPromoBanners = useMemo(() => {
    if (promoBanners.length <= 1) return promoBanners;
    return [
      promoBanners[promoBanners.length - 1], 
      ...promoBanners,
      promoBanners[0]       
    ];
  }, [promoBanners]);

  const activePromoIdx = useMemo(() => {
    if (promoBanners.length === 0) return 0;
    let idx = currentPromo - 1;
    if (currentPromo === 0) {
      idx = promoBanners.length - 1;
    } else if (currentPromo === displayPromoBanners.length - 1) {
      idx = 0;
    }
    if (idx < 0) idx = 0;
    if (idx >= promoBanners.length) idx = 0;
    return idx;
  }, [currentPromo, promoBanners, displayPromoBanners]);

  const startAutoPromo = useCallback(() => {
    if (autoPromoRef.current) clearInterval(autoPromoRef.current);
    if (promoBanners.length <= 1) return;

    autoPromoRef.current = setInterval(() => {
      setIsPromoTransitioning(true);
      setCurrentPromo((prev) => prev + 1);
    }, 4000);
  }, [promoBanners.length]);

  useEffect(() => {
    startAutoPromo();
    return () => {
      if (autoPromoRef.current) clearInterval(autoPromoRef.current);
    };
  }, [startAutoPromo]);

  const nextPromoBanner = () => {
    setIsPromoTransitioning(true);
    setCurrentPromo((prev) => prev + 1);
    startAutoPromo();
  };

  const prevPromoBanner = () => {
    setIsPromoTransitioning(true);
    setCurrentPromo((prev) => prev - 1);
    startAutoPromo();
  };

  useEffect(() => {
    if (promoBanners.length <= 1) return;

    if (currentPromo === displayPromoBanners.length - 1) {
      const timer = setTimeout(() => {
        setIsPromoTransitioning(false);
        setCurrentPromo(1);
      }, 500); 
      return () => clearTimeout(timer);
    }

    if (currentPromo === 0) {
      const timer = setTimeout(() => {
        setIsPromoTransitioning(false);
        setCurrentPromo(displayPromoBanners.length - 2);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentPromo, promoBanners.length, displayPromoBanners.length]);

  // ==========================================

  const getImageUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${import.meta.env.VITE_API_BASE}${url}`;
  };

  const handleLoadMore = useCallback(() => {
    scrollPositionRef.current = window.scrollY;
    shouldRestoreScroll.current = true;
    setCurrentPage((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!shouldRestoreScroll.current) return;
    window.scrollTo({ top: scrollPositionRef.current });
    shouldRestoreScroll.current = false;
  }, [products]);

  useEffect(() => {
    fetchPopularProducts();
    fetchCategories();
    fetchBanners();
    fetchPromoProducts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setProducts([]);
  }, [activeSearch]);

  useEffect(() => {
    const stopDragging = () => { isDragging.current = false; };
    window.addEventListener("mouseup", stopDragging);
    return () => { window.removeEventListener("mouseup", stopDragging); };
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res);
    } catch (err) {
      console.error("Gagal fetch kategori", err);
    }
  };

  const fetchBanners = async () => {
    try {
      const res = await getBanners();
      setBanners(res || []);
    } catch (err) {
      console.error("Gagal fetch banner", err);
    } finally {                    // <--- SEHARUSNYA FINALLY
      setLoadingBanners(false);
    }
  };

  const dragStartX = useRef<number>(0);
  const dragOffsetRef = useRef<number>(0); 
  const sliderTrackRef = useRef<HTMLDivElement>(null); 

  const handleBannerDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    setIsTransitioning(false);
    isDragClickRef.current = true; 
    if ('touches' in e) {
      dragStartX.current = e.touches[0].clientX;
    } else {
      dragStartX.current = e.pageX;
    }
  };

  const handleBannerDragMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (dragStartX.current === 0) return;
    
    let currentX = 0;
    if ('touches' in e) {
      currentX = e.touches[0].clientX;
    } else {
      currentX = e.pageX;
    }
    
    const diff = currentX - dragStartX.current;
    
    if (Math.abs(diff) > 15) {
      isDragClickRef.current = false;
    }

    dragOffsetRef.current = diff; 
    if (sliderTrackRef.current) {
      // KEMBALIKAN KE 50% DI SINI
      sliderTrackRef.current.style.transform = `translateX(calc(50% - (var(--slide-width) / 2) - (var(--slide-width) * ${currentHero}) + ${diff}px))`;
    }
  };

  const handleBannerDragEnd = () => {
    if (dragStartX.current === 0) return;

    setIsTransitioning(true); 

    const diff = dragOffsetRef.current; 
    
    if (diff < -50) {
      nextHero();
    } else if (diff > 50) {
      prevHero();
    } else {
       if (sliderTrackRef.current) {
         // KEMBALIKAN KE 50% DI SINI
         sliderTrackRef.current.style.transform = `translateX(calc(50% - (var(--slide-width) / 2) - (var(--slide-width) * ${currentHero})))`;
       }
    }
    
    dragStartX.current = 0;
    dragOffsetRef.current = 0; 
    
    startAutoSlide();
  };
  
  const [groupings, setGroupings] = useState<any[]>([]);
  const [isGroupingLoaded, setIsGroupingLoaded] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const data = await getGroupings();
      setGroupings(data);
      setIsGroupingLoaded(true); 
    };
    fetch();
  }, []);

  const excludedCategoryIds = useMemo(() => {
    const targetGroups = ["Komponen & Peripheral", "Monitor & Display", "Laptop", "Printer & Scanner", "Desktop & PC"];
    const ids: string[] = [];
    groupings.forEach((group: any) => {
      if (targetGroups.includes(group.name)) {
        if (group.children && Array.isArray(group.children)) {
          group.children.forEach((child: any) => ids.push(child.id));
        }
      }
    });
    return ids;
  }, [groupings]);

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: isMobile ? 32 : 30, 
        sort: 'recommend', 
        exclude_category_ids: excludedCategoryIds.join(',') 
      };
      if (activeSearch) {
        params.search = activeSearch;
        delete params.sort; 
      }
      const res = await getProducts(params);
      const newProducts = res.data || [];
      if (page === 1) {
        setProducts(newProducts);
      } else {
        setProducts((prev) => [...prev, ...newProducts]);
      }
      setTotalPages(res.last_page || 1);
    } catch (err) {
      console.error("Gagal fetch products", err);
    } finally {
      setLoading(false); // <--- FIX UNTUK ERROR TYPO KEMARIN
    }
  };

  useEffect(() => {
    if (isGroupingLoaded) {
      fetchProducts(currentPage);
    }
  }, [currentPage, activeSearch, isGroupingLoaded, excludedCategoryIds]);

  const displayedProducts = products;

  const [showLiveModal, setShowLiveModal] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);
  const isDraggingModal = useRef(false);
  const hasDragged = useRef(false); 
  const offset = useRef({ x: 0, y: 0 });

  const handleMouseDownModal = (e: React.MouseEvent) => {
    if (!modalRef.current) return;
    isDraggingModal.current = true;
    hasDragged.current = false; 
    const rect = modalRef.current.getBoundingClientRect();
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseMoveModal = (e: MouseEvent) => {
    if (!isDraggingModal.current || !modalRef.current) return;
    hasDragged.current = true; 
    modalRef.current.style.left = `${e.clientX - offset.current.x}px`;
    modalRef.current.style.top = `${e.clientY - offset.current.y}px`;
  };

  const handleMouseUpModal = () => {
    isDraggingModal.current = false;
    setTimeout(() => { hasDragged.current = false; }, 50);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMoveModal);
    window.addEventListener("mouseup", handleMouseUpModal);
    return () => {
      window.removeEventListener("mousemove", handleMouseMoveModal);
      window.removeEventListener("mouseup", handleMouseUpModal);
    };
  }, []);

  const handleLiveClick = (e: React.MouseEvent) => { if (hasDragged.current) e.preventDefault(); };
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const checkTikTokLiveStatus = async () => {
      try {
        const res = await getTikTokLiveStatus();
        setIsLive(res.is_live);
      } catch (err) {
        console.error("Gagal cek status live:", err);
        setIsLive(false);
      }
    };
    checkTikTokLiveStatus();
    const interval = setInterval(checkTikTokLiveStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleBannerClick = (banner: any) => {
    if (!isDragClickRef.current) return; // Cegah navigasi saat drag
    navigate(`/promo/${banner.id}`);
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <Helmet>
        <title>Anandam Computer - Toko Komputer Terlengkap di Yogyakarta</title>
        <meta name="description" content="Anandam Computer menyediakan berbagai macam Laptop, PC Rakitan, Komponen Komputer, dan Aksesoris terlengkap di Yogyakarta." />
        <link rel="canonical" href="https://anandamid.com/" />
      </Helmet>

      {/* ================= HERO BANNER ================= */}
      {/* Diubah overflow-x-hidden agar sisa sayap tidak membuat halaman bisa di-scroll ke kanan */}
      <section className="w-full relative overflow-hidden bg-gray-50">
        
        {/* 1. BACKGROUND BLUR (FULL WIDTH SCREEN) 
            Berubah mengikuti banner yang aktif (zoomin & blur)
        */}
        {activeBanner && (
          <div 
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              // Trik Masking CSS: Membuat bagian bawah background memudar perlahan (fade out)
              WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)'
            }}
          >
            <img
              src={getImageUrl(activeBanner.image_url)}
              className="w-full h-full object-cover scale-110 blur-[40px] opacity-60 transition-all duration-700 ease-in-out"
              alt="Background Blur"
            />
            {/* Overlay transparan agar konten di depan tetap jelas */}
            <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]"></div>
          </div>
        )}

        {/* 2. CONTAINER KONTEN (DENGAN WHITE SPACE px-4 md:px-12) */}
        <div className="relative z-10 py-6 md:py-8 max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-12 w-full">
          
          <style>{`
            .hero-wrapper {
              --slide-width: 85%; /* Lebar HP */
            }
            @media (min-width: 768px) {
              .hero-wrapper {
                --slide-width: 65%; /* Lebar Tablet */
              }
            }
            @media (min-width: 1024px) {
              .hero-wrapper {
                --slide-width: 58%; /* Lebar PC (Proporsional) */
              }
            }
          `}</style>

          {/* WRAPPER INTERAKTIF (Untuk hover tombol) */}
          <div 
            className="relative w-full group/hero hero-wrapper"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {loadingBanners ? (
              <div className="flex justify-center w-full py-4">
                <div className="w-[58%] aspect-[21/9] rounded-3xl bg-gray-200/60 animate-pulse"></div>
              </div>
            ) : heroBanners.length > 0 && (
              <>
                {/* 3. JENDELA POTONG (overflow-hidden di sini yang bikin banner samping kepotong setengah) */}
                <div className="relative w-full max-w-7xl 2xl:max-w-screen-2xl px-4 md:px-12 overflow-hidden rounded-xl md:rounded-[24px] py-2">
                  <div 
                    className="relative w-full cursor-pointer touch-pan-y select-none"
                    onMouseDown={handleBannerDragStart}
                    onMouseMove={handleBannerDragMove}
                    onMouseUp={handleBannerDragEnd}
                    onMouseLeave={handleBannerDragEnd}
                    onTouchStart={handleBannerDragStart}
                    onTouchMove={handleBannerDragMove}
                    onTouchEnd={handleBannerDragEnd}
                  >
                    <div
                      className="hero-carousel-track flex items-center w-full"
                      ref={sliderTrackRef}
                      style={{
                        transform: `translateX(calc(50% - (var(--slide-width) / 2) - (var(--slide-width) * ${currentHero})))`,
                        transition: isTransitioning ? "transform 600ms cubic-bezier(0.25, 1, 0.5, 1)" : "none"
                      }}
                    >
                      {displayHeroBanners.map((banner, i) => {
                        const isActive = i === currentHero;
                        return (
                          <div
                            key={`${banner.id}-${i}`}
                            className="flex-shrink-0 px-2 md:px-3 transition-all duration-600 ease-out"
                            style={{ width: 'var(--slide-width)' }}
                            onClick={() => handleBannerClick(banner)}
                          >
                            {/* 4. BANNER ITEM DENGAN EFEK 3D (Samping lebih kecil) */}
                            <div 
                              className={`
                                relative w-full aspect-[21/9] rounded-2xl md:rounded-3xl overflow-hidden shadow-lg
                                transition-all duration-600 ease-out
                                ${isActive 
                                  ? "scale-100 opacity-100 z-10" 
                                  : "scale-[0.85] opacity-80 z-0" 
                                }
                              `}
                            >
                              <img
                                src={getImageUrl(banner.image_url)}
                                className="w-full h-full object-cover pointer-events-none"
                                alt={banner.title || "Hero Banner"}
                                draggable={false}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 5. TOMBOL PANAH (Diletakkan di luar Jendela Potong agar tidak ikut kepotong) */}
                {heroBanners.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); prevHero(); }}
                      className={`
                        absolute top-[50%] -translate-y-1/2 z-20
                        flex items-center justify-center
                        w-10 h-10 rounded-full bg-white text-gray-700 shadow-lg
                        transition-all duration-300
                        ${isHovered ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"}
                      `}
                      // Memastikan tombol KIRI menempel di sisi luar kiri banner utama
                      style={{ left: `calc(50% - (var(--slide-width) / 2) - 3rem)` }}
                    >
                      <ChevronLeft size={24} />
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); nextHero(); }}
                      className={`
                        absolute top-[50%] -translate-y-1/2 z-20
                        flex items-center justify-center
                        w-10 h-10 rounded-full bg-white text-gray-700 shadow-lg
                        transition-all duration-300
                        ${isHovered ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"}
                      `}
                      // Memastikan tombol KANAN menempel di sisi luar kanan banner utama
                      style={{ right: `calc(50% - (var(--slide-width) / 2) - 3rem)` }}
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
              </>
            )}

            {/* 6. INDIKATOR TITIK WARNA ORANYE (Berada di bawah banner, aman di dalam white space) */}
            {!loadingBanners && heroBanners.length > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4 relative z-20">
                {heroBanners.map((_, idx) => {
                  const isActive = idx === activeBannerIdx;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setIsTransitioning(true);
                        setCurrentHero(idx + 1);
                        startAutoSlide();
                      }}
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        isActive 
                          ? "w-8 bg-blue-500 shadow-sm"  /* Warna Oranye */
                          : "w-2.5 bg-gray-300 hover:bg-gray-400"
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </section>

      {/* ================= CATEGORY ================= */}
      <LandingCategorySection groupings={groupings} getImageUrl={getImageUrl} />

      {/* ================= BANNER BRAND ================= */}
      <section className="w-full pb-10 pt-10 bg-white border-gray-200 border-b-[1px] relative overflow-hidden">
        <div className="flex justify-center w-full">
          <div className="relative w-full max-w-7xl 2xl:max-w-screen-2xl px-4 md:px-12 group">
            {promoBanners.length > 0 && (
                <div className="relative w-full overflow-hidden rounded-xl shadow-sm bg-gray-50">
                    <div 
                        // Hapus flex, gunakan struktur block standar slider manual
                        className="flex w-full"
                        style={{ 
                            transform: `translateX(-${currentPromo * 100}%)`,
                            transition: isPromoTransitioning ? "transform 500ms ease-in-out" : "none"
                        }}
                    >
                        {displayPromoBanners.map((banner, i) => (
                            <div
                                key={`${banner.id}-${i}`}
                                onClick={() => navigate(`/promo/${banner.id || 'special'}`)}
                                // 🟢 PERUBAHAN UTAMA: Hapus aspect-[8/1], gunakan w-full flex-shrink-0
                                className="w-full flex-shrink-0 cursor-pointer hover:opacity-95 transition-opacity flex justify-center items-center"
                            >
                                <img
                                    src={getImageUrl(banner.image_url)}
                                    className="w-full h-auto object-contain select-none pointer-events-none block"
                                    alt="Banner Promo"
                                    draggable={false}
                                />
                            </div>
                        ))}
                    </div>

                    {promoBanners.length > 1 && (
                        <>
                            <button 
                                onClick={(e) => { e.stopPropagation(); prevPromoBanner(); }}
                                className="absolute top-1/2 left-4 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-8 h-8 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                            >
                                &#10094;
                            </button>

                            <button 
                                onClick={(e) => { e.stopPropagation(); nextPromoBanner(); }}
                                className="absolute top-1/2 right-4 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-8 h-8 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                            >
                                &#10095;
                            </button>

                            {/* PAGINATION DOTS */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                {promoBanners.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setIsPromoTransitioning(true);
                                            setCurrentPromo(index + 1); 
                                            startAutoPromo();
                                        }}
                                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                                            activePromoIdx === index 
                                                ? 'bg-white w-4 shadow-sm' 
                                                : 'bg-white/50 hover:bg-white/80 shadow-sm'
                                        }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
          </div>
        </div>
      </section>

      <PromoProductSlider 
        products={promoProducts}
        promoImageUrl={bannerPromoProductSlider?.image_url} // Kirim path-nya saja
        getImageUrl={getImageUrl} // KIRIM FUNGSI NYA DI SINI
      />

      <PopularProduct popularProducts={popularProducts} />
      <GroupingProductSlider/>
      <OfficialBrandSection />

      {/* ================= PRODUCT LAINNYA ================= */}
      <section className="w-full bg-white mt-4 border-gray-200 border-y pt-6">
        <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-12 pb-10">
          <h2 className="mb-6 text-2xl md:text-3xl lg:text-4xl font-bold bg-gray-800 text-transparent bg-clip-text text-center">
            Produk Lainnya
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-3 sm:gap-4">
            {displayedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
            {loading && Array.from({ length: isMobile ? 16 : 18 }).map((_, i) => (
              <ProductCardSkeleton key={`skeleton-${i}`} />
            ))}
          </div>

          <LoadMoreButton loading={loading} hasMore={currentPage < totalPages} onLoadMore={handleLoadMore} />
        </div>
      </section>

      {/* Modal Tiktok */}
      {showLiveModal && isLive && (
        <div
          ref={modalRef}
          onMouseDown={handleMouseDownModal}
          className="fixed z-[9999] w-[220px] sm:w-[260px] bg-black rounded-xl overflow-hidden shadow-2xl cursor-move"
          style={{ top: "100px", left: "20px" }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setShowLiveModal(false); }}
            className="absolute top-1 right-1 z-10 bg-black/60 text-white text-xs px-2 py-1 rounded"
          >
            ✕
          </button>
          <a
            href="https://www.tiktok.com/@anandamidstore/live" 
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLiveClick}
            className="select-none block" 
            draggable="false" 
          >
            <div className="relative pointer-events-none">
              <img src="/public/tiktoklive.svg" className="w-full h-[140px] object-cover" alt="Live Thumbnail" />
              <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded">LIVE</div>
            </div>
            <div className="p-2 text-white text-sm pointer-events-none">🔴 Live sekarang di TikTok</div>
          </a>
        </div>
      )}
    </div>
  );
}