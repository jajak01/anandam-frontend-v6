import React, { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import ProductCard from "./ProductCard"; // Sesuaikan path jika error
import { useNavigate } from "react-router-dom";

interface PopularProductSliderProps {
  popularProducts: any[];
}

export default function PopularProduct({ popularProducts }: PopularProductSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // State untuk drag & animasi
  const [isSwiping, setIsSwiping] = useState(false); 
  const [isAnimating, setIsAnimating] = useState(false); 
  
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const dragDistance = useRef(0);

  // Fungsi custom scroll dengan pengaturan durasi yang smooth
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
    if (container.scrollLeft <= 5) {
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

  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate("/products?sort=popular");
  };

  // Auto Slide Logic 
  useEffect(() => {
    if (isHovered || isSwiping || isAnimating || popularProducts.length === 0) return;

    const interval = setInterval(() => {
      scrollRightAction();
    }, 4000); 

    return () => clearInterval(interval);
  }, [isHovered, isSwiping, isAnimating, popularProducts]);

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

    if (isSwiping && scrollRef.current) {
      const container = scrollRef.current;
      const scrollAmount = getScrollAmount();
      const currentScroll = container.scrollLeft;

      const targetIndex = Math.round(currentScroll / scrollAmount);
      let targetScroll = targetIndex * scrollAmount;

      const maxScroll = container.scrollWidth - container.clientWidth;
      if (targetScroll > maxScroll) targetScroll = maxScroll;
      if (targetScroll < 0) targetScroll = 0;

      animateScroll(container, targetScroll, 400);
    }

    setIsSwiping(false); 
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (dragDistance.current > 10) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  if (popularProducts.length === 0) return null;

  return (
    <section className="py-6 md:py-10 bg-white border-y border-gray-200 my-4">
      <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-8 md:px-16">
        <div
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >

          <div className="mb-8">
            <div className="inline-block border-l-4 border-primary pl-4 py-1">
              <h2 className="text-2xl md:text-3xl font-bold">
                Produk Populer
              </h2>
            </div>
          </div>

          {/* BUTTON LEFT */}
          <button
            onClick={scrollLeftAction}
            className={`hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-[100] 
            w-12 h-12 items-center justify-center bg-white/80 backdrop-blur-md border border-gray-200 
            shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-full text-gray-800 transition-all duration-500 ease-out
            ${isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"}
            hover:bg-primary hover:text-white hover:scale-110 hover:shadow-primary/20 active:scale-90`}
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>

          {/* BUTTON RIGHT */}
          <button
            onClick={scrollRightAction}
            className={`hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-[100] 
            w-12 h-12 items-center justify-center bg-white/80 backdrop-blur-md border border-gray-200 
            shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-full text-gray-800 transition-all duration-500 ease-out
            ${isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"}
            hover:bg-primary hover:text-white hover:scale-110 hover:shadow-primary/20 active:scale-90`}
          >
            <ChevronRight size={24} strokeWidth={2.5} />
          </button>

          <div
            ref={scrollRef}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTransitionEnd={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
            onClickCapture={handleClickCapture}
            className={`flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing touch-pan-y pb-4 ${
              isSwiping || isAnimating ? "snap-none" : "snap-x snap-mandatory"
            }`}
          >
            {/* DAFTAR PRODUK */}
            {popularProducts.map((product) => (
                <div
                  key={product.id}
                  className="
                    product-slide flex-shrink-0 snap-start select-none
                    /* 🟢 SISTEM KUNCI LAYAR: Di-sinkronkan penuh dengan card global */
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
                /* 🟢 SINKRONISASI UKURAN CARD LIHAT SEMUA */
                w-[calc(50%-8px)]
                sm:w-[calc(33.33%-12px)]
                md:w-[calc(25%-18px)]
                lg:w-[calc(16.66%-20px)]
              "
            >
              <div
                onClick={handleNavigate}
                className={`h-full min-h-[250px] bg-gradient-to-b from-blue-50 to-white rounded-2xl border border-blue-100 flex flex-col items-center justify-center p-4 md:p-6 text-center hover:shadow-lg transition-all cursor-pointer group ${
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
                  Jelajahi lebih banyak produk populer
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