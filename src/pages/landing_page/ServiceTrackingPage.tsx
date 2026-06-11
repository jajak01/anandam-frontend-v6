import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getServiceTracking, getTrackingByPhone } from "../../services/trackingService";
import { 
  Package, 
  User, 
  Settings, 
  Tag, 
  Cpu, 
  Wrench, 
  Shield, 
  History,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  ClipboardList,
  Printer,
  ArrowLeft,
  Search,
  Phone
} from "lucide-react";
import { Helmet } from "react-helmet-async";

interface TimelineItem {
  status: string;
  catatan: string | null;
  waktuUpdate: string;
}

interface TrackingData {
  noServis: string;
  namaPelangganMasked: string;
  jenisBarang: string;
  merek: string;
  modelSeri: string;
  kerusakan: string;
  statusTerkini: string;
  garansi: string;
  timeline: TimelineItem[];
}

export default function ServiceTrackingPage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrackingData | null>(null); // State for data fetched via direct token/id
  const [results, setResults] = useState<TrackingData[]>([]); // State for data fetched via phone
  
  const [phoneNumber, setPhoneNumber] = useState(searchParams.get("phone") || "");

  // Computed: The actual service data to display
  // We check if we have a direct fetch 'data', or if the current 'token' matches an item in 'results'
  const activeService = useMemo(() => {
    if (token) {
      // Priority 1: If we found it via phone search and the user clicked it (Instant)
      const foundInResults = results.find(r => r.noServis === token);
      if (foundInResults) return foundInResults;

      // Priority 2: If we fetched it directly (e.g. via UUID or refresh)
      if (data && (data.noServis === token || token.length > 20)) {
        return data;
      }
    }
    return null;
  }, [token, data, results]);

  // Effect for detail view (direct access or refresh)
  useEffect(() => {
    const fetchDetail = async () => {
      // Only fetch if we don't already have this service data in 'results' or 'data'
      if (!token) {
        setData(null);
        return;
      }

      // Optimization: If it's already in results, don't fetch again
      if (results.some(r => r.noServis === token)) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      
      // Optimization: If we already fetched this exact one
      if (data && (data.noServis === token)) return;

      setLoading(true);
      setError(null);
      try {
        const res = await getServiceTracking(token);
        setData(res);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err: any) {
        console.error("Gagal mengambil data tracking:", err);
        setError("Data tracking tidak ditemukan. Pastikan nomor servis atau token benar.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [token, results, data]);

  // Effect for phone search
  useEffect(() => {
    const phone = searchParams.get("phone");
    if (phone) {
      handlePhoneSearch(phone);
    } else {
      setResults([]);
    }
  }, [searchParams]);

  const handlePhoneSearch = async (phone: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTrackingByPhone(phone);
      if (res && res.length > 0) {
        setResults(res);
      } else {
        setError("Tidak ada data servis yang ditemukan untuk nomor telepon ini.");
      }
    } catch (err: any) {
      console.error("Gagal mencari data tracking by phone:", err);
      setError("Terjadi kesalahan saat mencari data. Pastikan nomor telepon benar.");
    } finally {
      setLoading(false);
    }
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    
    // If viewing a specific service, go back to list view for the new search
    if (token) {
      navigate(`/track/servis?phone=${phoneNumber}`);
    } else {
      setSearchParams({ phone: phoneNumber });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("selesai") || s.includes("diambil") || s.includes("tes")) return "text-green-600 bg-green-50 border-green-200";
    if (s.includes("proses") || s.includes("tangani")) return "text-blue-600 bg-blue-50 border-blue-200";
    if (s.includes("tunggu") || s.includes("antri")) return "text-orange-600 bg-orange-50 border-orange-200";
    if (s.includes("batal") || s.includes("gagal")) return "text-red-600 bg-red-50 border-red-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const getStatusIcon = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("selesai") || s.includes("diambil")) return <CheckCircle2 className="w-5 h-5" />;
    if (s.includes("tes")) return <History className="w-5 h-5" />;
    if (s.includes("proses") || s.includes("tangani")) return <Settings className="w-5 h-5" />;
    if (s.includes("tunggu") || s.includes("antri")) return <Clock className="w-5 h-5" />;
    return <AlertCircle className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 print:bg-white print:pb-0">
      <Helmet>
        <title>{activeService ? `Lacak Servis - ${activeService.noServis}` : "Lacak Servis"} | Anandam Computer</title>
      </Helmet>

      {/* Header Section */}
      <div className="bg-blue-600 pt-8 pb-24 px-4 print:hidden">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={() => activeService ? (results.length > 0 ? navigate(`/track/servis?phone=${searchParams.get("phone")}`) : navigate("/track/servis")) : navigate("/")}
              className="flex items-center gap-2 text-white/80 hover:text-white font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {activeService ? "Kembali" : "Beranda"}
            </button>
            {activeService && (
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20 transition-all"
              >
                <Printer className="w-4 h-4" />
                Cetak Status
              </button>
            )}
          </div>
          
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-2 bg-blue-500/30 px-4 py-1.5 rounded-full backdrop-blur-sm mb-4 border border-blue-400/30">
              <ClipboardList className="w-4 h-4" />
              <span className="text-sm font-medium tracking-wide uppercase">Tracking Servis</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">
              {activeService ? "Status Servis Anda" : "Lacak Perbaikan Anda"}
            </h1>
            <p className="text-blue-100 text-lg opacity-90">
              {activeService ? "Pantau perkembangan perbaikan perangkat Anda secara real-time" : "Masukkan nomor telepon Anda untuk melihat daftar servis"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-16 print:mt-0">
        
        {/* Search UI (only if not viewing detail) */}
        {!activeService && (
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-white p-6 md:p-8 mb-8">
            <form onSubmit={onSearchSubmit} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="tel" 
                  placeholder="Masukkan Nomor Telepon (Contoh: 0896...)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-5 h-5" />}
                Lacak Sekarang
              </button>
            </form>
          </div>
        )}

        {/* Loading State */}
        {loading && !activeService && (
          <div className="flex flex-col items-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Mencari data servis...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && !activeService && (
          <div className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-red-500 w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Pencarian Gagal</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* List Results */}
        {!activeService && results.length > 0 && !loading && (
          <div className="space-y-4">
            <h3 className="text-gray-900 font-black text-xl mb-4 px-2">Ditemukan {results.length} Data Servis</h3>
            {results.map((item, idx) => (
              <div 
                key={idx}
                onClick={() => navigate(`/track/servis/${item.noServis}?phone=${phoneNumber}`)}
                className="group bg-white rounded-3xl p-6 border border-white shadow-sm hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{item.noServis}</h4>
                    <p className="text-gray-500 text-sm font-medium">{item.jenisBarang} - {item.merek} {item.modelSeri}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs text-gray-400 font-bold">Update terakhir: {item.timeline[0]?.waktuUpdate}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-4">
                  <div className={`px-4 py-1.5 rounded-xl border text-xs font-bold ${getStatusColor(item.statusTerkini)}`}>
                    {item.statusTerkini}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail View (Existing logic) */}
        {activeService && (
          <>
            {/* Main Info Card */}
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-white overflow-hidden mb-8 print:shadow-none print:border-gray-200">
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-8 border-b border-gray-100 print:mb-4 print:pb-4">
                  <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Nomor Servis</p>
                    <h2 className="text-2xl font-black text-gray-900">{activeService.noServis}</h2>
                  </div>
                  <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border font-bold text-sm ${getStatusColor(activeService.statusTerkini)} print:border-gray-200 print:text-black print:bg-white`}>
                    {getStatusIcon(activeService.statusTerkini)}
                    {activeService.statusTerkini}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12 print:grid-cols-2 print:gap-y-4">
                  <div className="space-y-6 print:space-y-4">
                    <InfoItem icon={<User className="text-blue-500" />} label="Pelanggan" value={activeService.namaPelangganMasked} />
                    <InfoItem icon={<Package className="text-blue-500" />} label="Jenis Barang" value={activeService.jenisBarang} />
                    <InfoItem icon={<Tag className="text-blue-500" />} label="Merek / Brand" value={activeService.merek} />
                  </div>
                  <div className="space-y-6 print:space-y-4">
                    <InfoItem icon={<Cpu className="text-blue-500" />} label="Model / Seri" value={activeService.modelSeri} />
                    <InfoItem icon={<Wrench className="text-blue-500" />} label="Keluhan / Kerusakan" value={activeService.kerusakan} />
                    <InfoItem icon={<Shield className="text-blue-500" />} label="Status Garansi" value={activeService.garansi} />
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Section */}
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-white p-6 md:p-8 print:shadow-none print:border-gray-200">
              <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3 print:mb-4">
                <History className="text-blue-600 w-6 h-6 print:hidden" />
                Riwayat Pembaruan
              </h3>

              <div className="relative">
                {/* Timeline Vertical Line */}
                <div className="absolute left-4 md:left-6 top-2 bottom-2 w-0.5 bg-gray-100 print:left-4"></div>

                <div className="space-y-8 relative print:space-y-6">
                  {activeService.timeline.map((item, idx) => (
                    <div key={idx} className="flex gap-6 md:gap-8 group print:gap-4">
                      <div className="relative z-10 print:hidden">
                        <div className={`w-8 h-8 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                          idx === 0 
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110 ring-4 ring-blue-50" 
                          : "bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-500"
                        }`}>
                          {idx === 0 ? <CheckCircle2 className="w-4 h-4 md:w-6 md:h-6" /> : <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-current" />}
                        </div>
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-2">
                          <h4 className={`text-base md:text-lg font-bold leading-tight ${idx === 0 ? "text-blue-600 print:text-black" : "text-gray-900"}`}>
                            {item.status}
                          </h4>
                          <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 print:bg-white print:border-none">
                            {item.waktuUpdate}
                          </span>
                        </div>
                        {item.catatan && (
                          <div className={`p-4 rounded-2xl border text-sm leading-relaxed ${
                            idx === 0 ? "bg-blue-50 border-blue-100 text-blue-700 font-medium print:bg-white print:text-black print:border-gray-200" : "bg-gray-50 border-gray-100 text-gray-600 print:bg-white print:text-black print:border-gray-200"
                          }`}>
                            {item.catatan}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center print:hidden">
          <p className="text-gray-400 text-sm">Butuh bantuan lebih lanjut? Hubungi layanan pelanggan kami</p>
          <a 
            href="https://wa.me/6285950544597" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-blue-600 font-bold hover:text-blue-700 transition-colors"
          >
            Hubungi Customer Service <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex gap-4 group print:gap-2">
      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-100 transition-all duration-300 group-hover:bg-white group-hover:shadow-md group-hover:border-blue-100 group-hover:scale-110 print:hidden">
        {icon}
      </div>
      <div>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
        <p className="text-gray-900 font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}
