import { useMemo } from "react";
import {
  Headphones,
  Wrench,
  Lightbulb,
  Zap,
  Truck,
  ShieldCheck,
} from "lucide-react";

const Disclaimer = ({ text, sk }: { text: string; sk: string }) => (
  <>
    {text} <br /> {sk}
  </>
);

interface ServiceItem {
  icon: React.ReactNode;
  title: string;
  desc: React.ReactNode;
}

export default function LayananEksklusifSection() {
  const services: ServiceItem[] = useMemo(
    () => [
      {
        // Kolom 1: Dukungan Teknis
        icon: (
          <div className="relative inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14">
            <Headphones className="w-full h-full stroke-[1.5]" style={{ color: "#2563EB" }} />
          </div>
        ),
        title: "Dukungan Teknis",
        desc: "Akses dukungan teknis ke tim ahli Anandam.ID.",
      },
      {
        // Kolom 2: Service On Site
        icon: (
          <div className="relative inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14">
            <Wrench className="w-full h-full stroke-[1.5]" style={{ color: "#10B981" }} />
          </div>
        ),
        title: "Service On Site",
        desc: "Akses service On Site terhadap produk pembelian di Anandam.ID.",
      },
      {
        // Kolom 3: Konsultasi Teknis
        icon: (
          <div className="relative inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14">
            <Lightbulb className="w-full h-full stroke-[1.5]" style={{ color: "#2563EB" }} />
          </div>
        ),
        title: "Konsultasi Teknis",
        desc: "Memberikan konsultasi teknis mengenai kebutuhan perangkat.",
      },
      {
        // Kolom 4: Perbaikan Cepat & Tepat
        icon: (
          <div className="relative inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14">
            <Zap className="w-full h-full stroke-[1.5]" style={{ color: "#10B981" }} />
          </div>
        ),
        title: "Perbaikan Cepat & Tepat",
        desc: "Memberikan pelayanan yang terbaik mengenai dukungan teknis.",
      },
      {
        // Kolom 5: Gratis Kirim
        icon: (
          <div className="relative inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14">
            <Truck className="w-full h-full stroke-[1.5]" style={{ color: "#2563EB" }} />
          </div>
        ),
        title: "Gratis Kirim",
        desc: (
          <Disclaimer
          text="100% Gratis pengiriman untuk wilayah DIY."
          sk="S&K Berlaku"
          />
        ),
      },
      {
        // Kolom 6: Garansi Terjamin
        icon: (
          <div className="relative inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14">
            <ShieldCheck className="w-full h-full stroke-[1.5]" style={{ color: "#10B981" }} />
          </div>
        ),
        title: "Garansi Terjamin",
        desc: (
          <Disclaimer
            text="100% Garansi terjamin dan Barang Original."
            sk="S&K Berlaku"
          />
        ),
      },
    ],
    []
  );

  return (
    <section className="w-full bg-white py-16 md:py-20">
      <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 md:px-12">
        {/* Judul Section */}
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center text-gray-800 mb-12 md:mb-16">
          LAYANAN EKSKLUSIF KAMI
        </h2>

        {/* Grid 6 kolom */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 md:gap-10">
          {services.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center group"
            >
              {/* Ikon */}
              <div className="mb-4 transition-transform duration-300 group-hover:scale-110">
                {item.icon}
              </div>

              {/* Garis pemisah tipis */}
              <div className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full mb-3" />

              {/* Judul */}
              <h3 className="text-xs md:text-sm font-bold text-gray-700 tracking-wider mb-2">
                {item.title}
              </h3>

              {/* Deskripsi */}
              <p className="text-[11px] md:text-xs text-gray-500 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}