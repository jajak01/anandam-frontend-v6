import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getGroupings } from "../services/groupingService";
import { getProducts } from "../services/productService";
import ProductCard from "./ProductCard"; // Pastikan path ini benar
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

export default function GroupingProductSlider() {
  const [groupings, setGroupings] = useState<any[]>([]);

  useEffect(() => {
    fetchGroupings();
  }, []);

  const fetchGroupings = async () => {
    try {
      const allGroupings = await getGroupings();

      const getGroupCatIds = (groupName: string) => {
        const group = allGroupings.find((g: any) => 
          g.name.toLowerCase().trim() === groupName.toLowerCase().trim()
        );
        return group ? group.children.map((c: any) => c.id) : [];
      };

      const getCatIdByName = (catName: string) => {
        for (const g of allGroupings) {
          const cat = g.children.find((c: any) => 
            c.name.toLowerCase().trim() === catName.toLowerCase().trim()
          );
          if (cat) return cat.id;
        }
        return null;
      };

      const ssdId = getCatIdByName("SSD");
      const hddId = getCatIdByName("HDD");

      const komponenPeripheralIds = [
        ...getGroupCatIds("Komponen Komputer"),
        ...getGroupCatIds("Peripheral & I/O"),
        ssdId,
        hddId,
      ].filter(Boolean); 

      const sectionsData = [
        {
          id: "komponen",
          title: "Komponen & Peripheral",
          queryGroup: "Komponen & Peripheral", 
          catIds: [...new Set(komponenPeripheralIds)], 
        },
        {
          id: "monitor",
          title: "Monitor Display",
          queryGroup: "Monitor & Display",
          catIds: getGroupCatIds("Monitor & Display"),
        },
        {
          id: "laptop",
          title: "Laptop",
          queryGroup: "Laptop",
          catIds: getGroupCatIds("Laptop"),
        },
        {
          id: "printer",
          title: "Printer & Scanner",
          queryGroup: "Printer & Scanner",
          catIds: getGroupCatIds("Printer & Scanner"),
        },
        {
          id: "pc",
          title: "PC Desktop & AIO",
          queryGroup: "Desktop & PC", 
          catIds: getGroupCatIds("Desktop & PC"),
        },
      ];

      const result = await Promise.all(
        sectionsData.map(async (section) => {
          if (section.catIds.length === 0) return { ...section, products: [] };

          const productsRes = await getProducts({
            category_ids: section.catIds.join(","),
            limit: 40, 
          });

          const rawProducts = Array.isArray(productsRes.data) ? productsRes.data : [];

          // 🟢 LOGIKA FILTER BARU: Menghitung total stok dari seluruh varian produk
          const availableProducts = rawProducts.filter((product: any) => {
            if (!product) return false;

            // Jika produk tidak memiliki varian, asumsikan stoknya 0
            if (!product.variants || !Array.isArray(product.variants)) return false;

            // Jumlahkan nilai 'stock', 'stok', atau 'qty' dari setiap objek varian
            const totalStokVarian = product.variants.reduce((acc: number, variant: any) => {
              const vStock = variant.stock ?? variant.stok ?? variant.qty ?? variant.quantity ?? 0;
              return acc + vStock;
            }, 0);

            // Produk lolos filter jika total stok variannya lebih dari 0
            return totalStokVarian > 0;
          });

          return {
            ...section,
            products: availableProducts.slice(0, 15), // Ambil maksimal 15 produk ready
          };
        })
      );

      setGroupings(result.filter((s) => s.products.length > 0));
    } catch (err) {
      console.error("Gagal fetch grouping", err);
    }
  };

  return (
    <>
      {groupings.map((group) => (
        <SliderSection 
          key={group.id} 
          title={group.title} 
          queryGroup={group.queryGroup} 
          products={group.products} 
        />
      ))}
    </>
  );
}

/* ================= SLIDER PER GROUP ================= */
function SliderSection({ title, queryGroup, products }: any) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // --- STATE & REF UNTUK DRAG & ANIMASI ---
  const [isSwiping, setIsSwiping] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false); 
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const dragDistance = useRef(0);

  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate(`/product-grouping?grouping=${encodeURIComponent(queryGroup)}`);
  };

  // --- Fungsi custom scroll dengan durasi smooth ---
  const animateScroll = (container: HTMLDivElement, targetPosition: number, duration: number) => {
    setIsAnimating(true);
    const startPosition = container.scrollLeft;
    const distance = targetPosition - startPosition;
    let startTime: number | null = null;

    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);

      container.scrollLeft = startPosition + distance * ease(progress);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animation);
  };

  const getScrollAmount = () => {
    if (!scrollRef.current) return 0;
    const card = scrollRef.current.querySelector(".product-slide") as HTMLElement;
    const gap = window.innerWidth >= 768 ? 24 : 16; 
    return card ? card.offsetWidth + gap : 0;
  };

  const scrollLeftAction = () => {
    if (!scrollRef.current || isAnimating) return;
    const container = scrollRef.current;
    const isStart = container.scrollLeft <= 5;

    if (isStart) {
      animateScroll(container, container.scrollWidth, 800); 
    } else {
      animateScroll(container, container.scrollLeft - getScrollAmount(), 800);
    }
  };

  const scrollRightAction = () => {
    if (!scrollRef.current || isAnimating) return;
    const container = scrollRef.current;
    const isEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 5;

    if (isEnd) {
      animateScroll(container, 0, 800); 
    } else {
      animateScroll(container, container.scrollLeft + getScrollAmount(), 800);
    }
  };

  // --- FUNGSI DRAG ---
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!scrollRef.current || isAnimating) return; 
    isDragging.current = true;
    
    dragDistance.current = 0;

    const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
    startX.current = pageX;
    scrollLeftStart.current = scrollRef.current.scrollLeft;
  };

  const handleDragMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging.current || !scrollRef.current) return;
    
    const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
    const walk = (pageX - startX.current) * 1.5; 
    
    dragDistance.current = Math.abs(walk); 

    if (dragDistance.current > 5 && !isSwiping) {
      setIsSwiping(true);
    }

    scrollRef.current.scrollLeft = scrollLeftStart.current - walk; 
  };

  const handleDragEnd = () => { 
    if (!isDragging.current) return;
    isDragging.current = false; 

    // Jika user habis nge-swipe/drag, kita cari posisi snap terdekat biar smooth
    if (isSwiping && scrollRef.current) {
      const container = scrollRef.current;
      const scrollAmount = getScrollAmount();
      const currentScroll = container.scrollLeft;

      // Hitung indeks card terdekat yang harus di-snap
      const targetIndex = Math.round(currentScroll / scrollAmount);
      let targetScroll = targetIndex * scrollAmount;

      // Pastikan target tidak melewati batas maksimal scroll
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (targetScroll > maxScroll) targetScroll = maxScroll;
      if (targetScroll < 0) targetScroll = 0;

      // Panggil animasi (400ms agar snap kembalinya terasa pas & responsif)
      animateScroll(container, targetScroll, 400); 
    }

    setIsSwiping(false); 
  };

  // Mencegah card kepencet / pindah halaman kalau user niatnya geser
  const handleClickCapture = (e: React.MouseEvent) => {
    if (dragDistance.current > 10) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  // --- Efek Auto-Slide ---
  useEffect(() => {
    if (isHovered || isSwiping || isAnimating || !products || products.length === 0) return; 

    const checkShouldScroll = () => {
      if (!scrollRef.current) return false;
      // Cek apakah ada konten yang tersembunyi (perlu di-scroll)
      return scrollRef.current.scrollWidth > scrollRef.current.clientWidth;
    };

    const timer = setInterval(() => {
      if (checkShouldScroll()) {
        scrollRightAction(); 
      }
    }, 4000); 

    return () => clearInterval(timer);
  }, [isHovered, isSwiping, isAnimating, products]);

  // Jika produk kosong, jangan render slider-nya
  if (!products || products.length === 0) return null;

  return (
    <section className="py-4 md:py-6 bg-white">
      <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-8 md:px-16">
        <div 
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >

          <div className="mb-8">
            <div className="inline-block border-l-4 border-primary pl-4 py-1">
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                {title}
              </h2>
            </div>
          </div>

          {/* LEFT BUTTON */}
          <button
            onClick={scrollLeftAction}
            className={`hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-[100] 
            w-12 h-12 items-center justify-center 
            bg-white/80 backdrop-blur-md border border-gray-200 
            shadow-[0_8px_30px_rgb(0,0,0,0.12)] 
            rounded-full text-gray-800 
            transition-all duration-500 ease-out
            ${isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"}
            hover:bg-primary hover:text-white hover:scale-110 hover:shadow-primary/20 active:scale-90`}
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>

          {/* RIGHT BUTTON */}
          <button
            onClick={scrollRightAction}
            className={`hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-[100] 
            w-12 h-12 items-center justify-center 
            bg-white/80 backdrop-blur-md border border-gray-200 
            shadow-[0_8px_30px_rgb(0,0,0,0.12)] 
            rounded-full text-gray-800 
            transition-all duration-500 ease-out
            ${isHovered ? "opacity-100 translate-x-0 delay-75" : "opacity-0 translate-x-12"}
            hover:bg-primary hover:text-white hover:scale-110 hover:shadow-primary/20 active:scale-90`}
          >
            <ChevronRight size={24} strokeWidth={2.5} />
          </button>

          {/* SLIDER CONTAINER */}
          <div
            ref={scrollRef}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
            onClickCapture={handleClickCapture}
            className={`
              flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4
              cursor-grab active:cursor-grabbing touch-pan-y
              ${isSwiping || isAnimating ? "snap-none" : "snap-x snap-mandatory"}
            `}
          >
            {/* DAFTAR PRODUK */}
            {products.map((product: any) => (
              <div
                key={product.id}
                className="
                  product-slide flex-shrink-0 snap-start select-none
                  w-[calc(50%-8px)]
                  sm:w-[calc(33.33%-12px)]
                  md:w-[calc(25%-18px)]
                  lg:w-[calc(16.66%-20px)]
                "
              >
                <div className={isSwiping ? "pointer-events-none select-none" : ""}>
                  <ProductCard product={product} />
                </div>
              </div>
            ))}

            {/* CARD LIHAT SEMUA */}
            <div
              className="
                product-slide flex-shrink-0 snap-start select-none
                w-[calc(50%-8px)]
                sm:w-[180px]
                md:w-[210px]
                lg:w-[210px]
                xl:w-[190px]
                2xl:w-[200px] 
              "
            >
              <div
                onClick={handleNavigate}
                className={`h-full min-h-[280px] bg-gradient-to-b from-blue-50 to-white rounded-2xl border border-blue-100 flex flex-col items-center justify-center p-4 md:p-6 text-center hover:shadow-lg transition-all cursor-pointer group ${
                  isSwiping ? "pointer-events-none select-none" : ""
                }`}
              >
                
                {/* ICON */}
                <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-full shadow-md flex items-center justify-center text-primary mb-4 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <ArrowRight size={26} />
                </div>

                {/* TITLE */}
                <h3 className="font-bold text-gray-800 text-base md:text-lg mb-1">
                  Lihat Semua
                </h3>

                {/* DESC */}
                <p className="text-xs md:text-sm text-gray-500 mb-4 line-clamp-2">
                  Jelajahi lebih banyak produk promo {title}
                </p>

                {/* BUTTON */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigate();
                  }}
                  className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-full w-full mt-auto transition-all duration-300 hover:bg-white hover:text-black border border-primary"
                >
                  Eksplor
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}