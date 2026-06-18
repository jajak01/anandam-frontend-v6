import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { ChevronUp } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

export default function FloatingActionButtons() {
  const location = useLocation()

  const hideWhatsapp = true;

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const marketingNumber = "6281228134747";
  const serviceNumber = "6285950544597";

  const marketingUrl = `https://wa.me/${marketingNumber}`;
  const serviceUrl = `https://wa.me/${serviceNumber}`;

  const [showWaModal, setShowWaModal] = useState(false);
  const popupRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setShowWaModal(false);
      }
    };

    if (showWaModal) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showWaModal]);

  return (
    <>
      <div
        className="
          fixed right-6 md:right-8 bottom-[160px] md:bottom-[100px]
          z-[100]
          flex flex-col items-end gap-3
          pointer-events-none
        "
      >

        {/* ================= WA ================= */}
        {!hideWhatsapp && (
          <div
            className={`
              relative flex flex-col items-end
              transition-all duration-300 ease-out
              ${visible ? "mb-16" : "mb-0"}
            `}
          >

            {/* POPUP */}
            <div
              ref={popupRef}
              onClick={(e) => e.stopPropagation()}
              className={`
                mb-2
                w-[220px] sm:w-[260px]
                max-w-[calc(100vw-2rem)]
                bg-white rounded-2xl shadow-2xl
                p-4
                origin-bottom-right
                transition-all duration-300
                ${showWaModal 
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" /* 👈 Aktifkan klik saat muncul */
                  : "opacity-0 scale-95 translate-y-3 pointer-events-none"
                }
              `}
            >
              <h3 className="text-sm font-semibold mb-3 text-gray-700">
                Hubungi Kami
              </h3>

              <a
                href={marketingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-green-50 transition"
              >
                <FaWhatsapp className="text-green-500" size={20} />
                <div>
                  <p className="text-sm font-medium">Marketing Sales</p>
                  <p className="text-xs text-gray-500">Anandamid</p>
                </div>
              </a>

              <a
                href={serviceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-green-50 transition"
              >
                <FaWhatsapp className="text-green-500" size={20} />
                <div>
                  <p className="text-sm font-medium">Service Center</p>
                  <p className="text-xs text-gray-500">Anandamid</p>
                </div>
              </a>
            </div>

            {/* WA BUTTON */}
            <div className="relative pointer-events-auto /* 👈 Aktifkan klik untuk area tombol ini */">
              <span className="absolute inset-0 rounded-full bg-green-400 opacity-50 animate-ping"></span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowWaModal(prev => !prev);
                }}
                className="
                  relative
                  flex items-center justify-center
                  bg-green-500 text-white
                  p-3 rounded-full shadow-lg
                  hover:scale-110
                  transition-transform duration-300
                "
              >
                <FaWhatsapp size={22} />
              </button>
            </div>
          </div>
        )}

        {/* ================= SCROLL TOP ================= */}
        <button
          onClick={scrollToTop}
          className={`
            absolute right-0 bottom-0
            bg-primary text-white
            p-3 rounded-full shadow-lg
            transition-all duration-300 ease-out
            hover:scale-110
            ${visible 
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-6 pointer-events-none"
            }
          `}
        >
          <ChevronUp size={20} />
        </button>

      </div>
    </>
  );
}