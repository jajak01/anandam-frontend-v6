import { useEffect, useState, useRef } from "react";
import { getActiveBrands } from "../services/brandService";
import { useNavigate } from "react-router-dom";

const getInitial = (brand: string) => {
  return brand
    .split(" ")
    .map(word => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

export function OfficialBrandSection() {
  const navigate = useNavigate(); 
  const [brands, setBrands] = useState<any[]>([]);
  const [imageError, setImageError] = useState<Record<string, boolean>>({});
  
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const data = await getActiveBrands(); 
        setBrands(data);
      } catch (err) {
        console.error("Failed to fetch brands", err);
      }
    };

    fetchBrands();
  }, []);

  useEffect(() => {
    const container = carouselRef.current;
    if (!container || brands.length === 0) return;

    const autoplay = setInterval(() => {
      const firstItem = container.querySelector(".brand-card");
      const scrollStep = firstItem ? firstItem.clientWidth + 16 : 200;

      if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 10) {
        container.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        container.scrollBy({ left: scrollStep, behavior: "smooth" });
      }
    }, 3500);

    return () => clearInterval(autoplay);
  }, [brands]);

  const handleScroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.clientWidth / 2;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  if (brands.length === 0) return null;

  return (
    <section className="w-full bg-white mt-4 py-6 border-y border-gray-200">
      {/* 
        SINKRONISASI WHITE SPACE DI SINI:
        Mengubah padding container dari `px-4 sm:px-6 lg:px-0` menjadi `px-4 md:px-12`
      */}
      <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-12">
        
        {/* HEADER */}
        <div className="mb-6">
          <div className="inline-block border-l-4 border-primary pl-4 py-1">
            <h2 className="text-2xl md:text-3xl font-bold text-black">
              Official Brand
            </h2>
          </div>
        </div>

        {/* CONTAINER UTAMA DENGAN TOMBOL NAVIGASI */}
        <div className="relative group/carousel">
          
          {/* 
            TOMBOL KIRI (Disesuaikan posisinya ke left-0 agar pas di dalam ruang padding baru)
          */}
          <button
            onClick={() => handleScroll("left")}
            className="
              absolute left-0 lg:left-[-20px] top-1/2 -translate-y-1/2 z-10
              bg-white text-gray-700 p-2 rounded-full border border-gray-300 shadow-md 
              hover:bg-gray-100 transition-all duration-200
              opacity-0 group-hover/carousel:opacity-100 hidden md:flex items-center justify-center
              w-10 h-10
            "
            aria-label="Scroll Left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* CAROUSEL GRID CONTAINER */}
          <div 
            ref={carouselRef}
            className="
              grid grid-rows-2 grid-flow-col gap-3 sm:gap-4
              overflow-x-auto scroll-smooth
              [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
              pb-2
              snap-x snap-proximity /* <--- UBAH DI SINI (dari snap-mandatory ke snap-proximity) */
            "
          >
            {brands.map((brand) => {
              const imagePath = brand.image_url;
              const hasError = imageError[brand.id];

              return (
                <div
                  key={brand.id}
                  onClick={() => navigate(`/products?brand=${brand.id}`)}
                  className="
                    brand-card flex items-center justify-center bg-white 
                    transition-all duration-300 cursor-pointer select-none p-3
                    snap-start snap-always rounded-xl shadow-sm
                    border border-gray-300 hover:border-gray-400
                    /* Lebar kartu disesuaikan agar proporsional di layar besar */
                    w-[130px] sm:w-[160px] lg:w-[180px] xl:w-[190px] 2xl:w-[200px]
                    h-[80px] sm:h-[100px] lg:h-[110px]
                  "
                >
                  {imagePath && !hasError ? (
                    <img
                      src={
                        imagePath.startsWith("http")
                          ? imagePath
                          : `${import.meta.env.VITE_API_BASE}${imagePath}`
                      }
                      alt={brand.name}
                      draggable={false}
                      className="h-10 sm:h-14 lg:h-16 max-w-[85%] object-contain group-hover:scale-105 transition-transform duration-300"
                      onError={() =>
                        setImageError(prev => ({
                          ...prev,
                          [brand.id]: true
                        }))
                      }
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-700 group-hover:scale-105 transition-transform duration-300">
                      <div className="text-sm md:text-lg font-bold">
                        {getInitial(brand.name)}
                      </div>
                      <div className="text-[9px] md:text-[10px] opacity-70 text-center px-1 line-clamp-1 max-w-full">
                        {brand.name}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 
            TOMBOL KANAN (Disesuaikan posisinya ke right-0 agar pas di dalam ruang padding baru)
          */}
          <button
            onClick={() => handleScroll("right")}
            className="
              absolute right-0 lg:right-[-20px] top-1/2 -translate-y-1/2 z-10
              bg-white text-gray-700 p-2 rounded-full border border-gray-300 shadow-md 
              hover:bg-gray-100 transition-all duration-200
              opacity-0 group-hover/carousel:opacity-100 hidden md:flex items-center justify-center
              w-10 h-10
            "
            aria-label="Scroll Right"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

        </div>

      </div>
    </section>
  );
}