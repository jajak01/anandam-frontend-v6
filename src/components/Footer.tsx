import { Facebook, Instagram, Youtube, Copy } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

type CopyNumberProps = {
  label: string;
  number: string;
};

function CopyNumber({ label, number }: CopyNumberProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Gagal meng-copy:", err);
      alert("Browser memblokir fitur copy. Pastikan menggunakan HTTPS atau localhost.");
    }
  };

  return (
    <div className="group">
      <p className="text-gray-300">{label}</p>

      <div 
        onClick={handleCopy} 
        className="flex items-center gap-2 cursor-pointer w-fit"
      >
        <p className="text-white">{number}</p>

        <button className="opacity-0 group-hover:opacity-100 transition">
          {copied ? (
            <span className="text-xs text-green-400 font-bold">✓</span>
          ) : (
            <Copy size={14} className="text-gray-400 hover:text-white" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="w-full bg-black text-gray-300">
      <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto px-8 md:px-16 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-12">

          {/* ================= BRAND ================= */}
          <div className="col-span-2 lg:col-span-1">
            <h2 className="text-2xl font-bold text-white">
              ANANDAM ID
            </h2>

            <p className="mt-2 text-sm text-primary1 font-semibold">
              Solusi Teknologi Tanpa Ribet, Semua Ada di Sini
            </p>

            <div className="w-32 h-[2px] bg-gray-400 my-6" />

            <p className="text-sm leading-relaxed text-gray-300">
              Anandam ID adalah partner terpercaya untuk kebutuhan teknologi mulai dari komputer, laptop, hingga aksesoris. Kami menghadirkan produk berkualitas dengan harga kompetitif serta layanan yang cepat dan profesional.
            </p>

            {/* Social Icons */}
            <div className="flex gap-3 mt-6">

                {/* TikTok */}
                <a
                  href="https://www.tiktok.com/@anandamidstore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-black border border-gray-600 rounded-full text-white hover:bg-gray-800 inline-flex"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-1.88v8.42a5.032 5.032 0 1 1-4.373-4.983v2.06a2.974 2.974 0 1 0 2.315 2.902V2h2.058a4.79 4.79 0 0 0 3.77 2.687v2z"/>
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href="https://www.facebook.com/Anandamcomputer/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="p-2 border border-gray-600 rounded-full hover:bg-gray-800 cursor-pointer">
                    <Facebook size={16} />
                  </div>
                </a>

                {/* Instagram */}
                <a 
                  href="https://www.instagram.com/anandam.id/?hl=en"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="p-2 border border-gray-600 rounded-full hover:bg-gray-800">
                      <Instagram size={16} />
                  </div>
                </a>

                {/* Youtube */}
                <a 
                  href="https://www.youtube.com/@AnandamIDstore"
                  target="_blank"
                  rel="noopener noreferrer"
                >  
                  <div className="p-2 border border-gray-600 rounded-full hover:bg-gray-800">
                      <Youtube size={16} />
                  </div>
                </a>

            </div>
          </div>

          {/* ================= ABOUT ================= */}
          <div>
            <h3 className="text-white font-semibold mb-4">
              Perusahaan Kami
            </h3>

            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/company-profile" className="hover:text-white">
                  Tentang Kami
                </Link>
              </li>

              {/* <li>
                <Link to="" className="hover:text-white">
                  Kebijakan Privasi
                </Link>
              </li> */}

              <li>
                <Link to="/terms" className="hover:text-white">
                  Syarat & Ketentuan
                </Link>
              </li>
            </ul>
          </div>

          {/* ================= MENU ================= */}
          <div>
            <h3 className="text-white font-semibold mb-4">
              Menu
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white">
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-white">
                  Produk Katalog
                </Link>
              </li>
              <li>
                <Link to="/pc-builder" className="hover:text-white">
                  Rakitan
                </Link>
              </li>
              {/* <li>
                <Link to="/price-list" className="hover:text-white">
                  Pricelist 
                </Link>
              </li> */}
              <li>
                <Link to="/certificate" className="hover:text-white">
                  Sertifikat PKL
                </Link>
              </li>
            </ul>
          </div>

          {/* ================= CONTACT ================= */}
          <div>
            <h3 className="text-white font-semibold mb-4">
              Kontak
            </h3>
            <div className="text-sm space-y-3">
              <CopyNumber label="Sales :" number="+62 8122-8134-747" />
              <CopyNumber label="Customer Service :" number="+62 8595-0544-597" />
              <CopyNumber label="Email :" number="sales@anandam.id" />
            </div>
          </div>

            {/* ================= MAP ================= */}
            <div>
              <h3 className="text-white font-semibold mb-4">
                Lokasi Kami
              </h3>

              <div className="w-full h-[140px] md:h-[180px] overflow-hidden border border-gray-700 rounded-md">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15813.121542448534!2d110.38987475128177!3d-7.760059611725515!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x51aab3a4de9990f%3A0x6122cbf0b82f64d9!2sAnandam.id%20(Toko%20Notebook%20%26%20Komputer%20Yogyakarta)!5e0!3m2!1sid!2sid!4v1773457167405!5m2!1sid!2sid"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <p className="text-sm text-gray-300 mt-3">
                Jl. Affandi No.17, Soropadan, Condongcatur, Kec. Depok, Kabupaten Sleman,
                Daerah Istimewa Yogyakarta 55283
              </p>
            </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-16 border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
            © Copyright {new Date().getFullYear()} by <span className="text-white font-semibold">Anandam ID</span>, All Right Reserved.
        </div>
      </div>
    </footer>
  );
}