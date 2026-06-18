import { CircleQuestionMark } from "lucide-react";

interface TopInfoBarProps {
  onOpenOrderModal: () => void;
}

export default function TopInfoBar({ onOpenOrderModal }: TopInfoBarProps) {
  return (
    <div className="w-full bg-blue-700 text-white border-b border-blue-800 overflow-hidden">
      <style>{`
        /* --- ANIMASI DESKTOP: Vertical Loop (In - Stay - Out) --- */
        .animate-info-loop { 
          animation: desktopInfoLoop 4s ease-in-out infinite;
        }

        @keyframes desktopInfoLoop {
          0% { opacity: 0; transform: translateY(10px); }
          5% { opacity: 1; transform: translateY(0); }
          95% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }

        /* --- ANIMASI MARQUEE MOBILE: Tetap Infinity --- */
        .marquee-container {
          display: flex;
          width: max-content;
          animation: marquee-smooth 30s linear infinite;
        }

        @keyframes marquee-smooth {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <div className="w-full max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-12 py-2">
        {/* MOBILE VERSION */}
        <div className="md:hidden overflow-hidden relative">
          <div className="marquee-container flex items-center gap-12">
            <div className="flex items-center gap-2 whitespace-nowrap text-[10px] font-medium tracking-wide">
              <span className="opacity-80 uppercase">Jam Operasional:</span>
              <span>SENIN–SABTU 08.00–21.00</span>
              <span className="mx-2 text-blue-400">|</span>
              <span>MINGGU / LIBUR NASIONAL 10.00–19.00</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap text-[10px] font-medium tracking-wide">
              <span className="opacity-80 uppercase">Jam Operasional:</span>
              <span>SENIN–SABTU 08.00–21.00</span>
              <span className="mx-2 text-blue-400">|</span>
              <span>MINGGU / LIBUR NASIONAL 10.00–19.00</span>
            </div>
          </div>
        </div>

        {/* DESKTOP VERSION */}
        <div className="hidden md:flex items-center justify-between animate-info-loop">
          <div className="flex items-center gap-3 text-xs">
            <div className="bg-blue-600 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase">
              Operational Hours
            </div>
            <div className="flex items-center gap-2 font-medium opacity-90 tracking-wide">
              <span>Senin–Sabtu: 08.00–21.00</span>
              <span className="w-1.5 h-1.5 bg-blue-400/50 rounded-full"></span>
              <span>Minggu / Libur: 10.00–19.00</span>
            </div>
          </div>

          <button 
            onClick={onOpenOrderModal}
            className="flex items-center gap-2 hover:text-blue-200 transition-colors group text-xs font-bold uppercase tracking-widest"
          >
            <CircleQuestionMark size={14} className="group-hover:rotate-12 transition-transform duration-300" />
            <span>Cara Pemesanan</span>
          </button>
        </div>
      </div>
    </div>
  );
}