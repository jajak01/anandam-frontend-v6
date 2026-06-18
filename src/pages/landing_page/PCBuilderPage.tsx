import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom"; 
import { getCompatibility, getProducts } from "../../services/productService";
import { checkoutPCBuilder } from "../../services/orderSevice";
import type { Product } from "../../types/product";
import Breadcrumb from "../../components/Breadcrumb";
import Swal from "sweetalert2";
import AuthModal from "../../components/Navbar/AuthModal";
import { ChevronRight, Eye } from "lucide-react";

// Fungsi helper pembentuk URL gambar agar seragam dengan ProductCard
const getProductImageSrc = (p: any) => {
    if (!p) return "/icon-anandam.svg";
    const thumb = p.images?.[0]?.thumbnail_url;
    const original = p.images?.[0]?.image_url;
    const imagePath = thumb?.startsWith("/uploads") ? thumb : (original?.startsWith("/uploads") ? original : null);

    if (!imagePath) return "/icon-anandam.svg";
    return imagePath.startsWith("http") ? imagePath : `${import.meta.env.VITE_API_BASE}${imagePath}`;
};

// ================= KOMPONEN ROW (DENGAN FOTO PRODUK) =================
const Row = ({ label, value, onChange, options, price, qtyKey, qty, setQty }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getItemStock = (p: any) => {
        if (!p) return 0;
        if (p.variants && Array.isArray(p.variants)) {
            return p.variants.reduce((total: number, v: any) => total + Number(v.stock || 0), 0);
        }
        return Number(p.stock ?? p.stok ?? 0);
    };

    const filteredOptions = options?.filter((p: Product) =>
        p.name.toLowerCase().includes(search.toLowerCase()) && (getItemStock(p) > 0)
    ) || [];

    return (
        <div className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 items-start md:items-center py-4 border-b border-gray-50 last:border-0">
            {/* LABEL KATEGORI */}
            <div className="md:col-span-3 text-[13px] font-bold text-gray-400 uppercase tracking-tight w-full md:pr-2">
                {label}
            </div>

            {/* AREA SELEKTOR DROPDOWN */}
            <div className={`md:col-span-5 w-full relative ${isOpen ? 'z-50' : 'z-10'}`} ref={dropdownRef}>
                <div
                    className="w-full flex items-center gap-3 border border-gray-200 p-2 rounded-xl text-sm bg-white hover:border-primary hover:shadow-sm transition-all cursor-pointer outline-none min-h-[52px]"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {/* 🟢 FOTO BARANG YANG SEDANG TERPILIH */}
                    <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center p-1 overflow-hidden">
                        <img 
                            src={getProductImageSrc(value)} 
                            alt="Preview" 
                            className={`w-full h-full object-contain ${!value ? "opacity-30" : ""}`}
                        />
                    </div>

                    <span className={`flex-1 pr-2 line-clamp-2 font-medium ${value ? "text-gray-800" : "text-gray-400"}`}>
                        {value ? `${value.name} (Stok ${getItemStock(value)})` : `Pilih ${label}`}
                    </span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 mr-1 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>

                {/* MENU PILIHAN DROPDOWN */}
                {isOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden flex flex-col animate-fadeIn max-w-[100vw] sm:max-w-full">
                        <div className="p-2 border-b border-gray-100 bg-gray-50 sticky top-0">
                            <input
                                type="text"
                                autoFocus
                                className="w-full text-sm p-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-primary"
                                placeholder={`Cari ${label}...`}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>

                        <div className="max-h-60 overflow-y-auto scrollbar-hide">
                            <div
                                className="px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-red-500 hover:bg-red-50 cursor-pointer border-b border-gray-50"
                                onClick={() => { onChange(null); setIsOpen(false); setSearch(""); }}
                            >
                                -- Kosongkan Pilihan --
                            </div>
                            
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((p: Product) => {
                                    const totalStock = getItemStock(p);
                                    return (
                                        <div
                                            key={p.id}
                                            className={`px-3 py-2 flex gap-3 items-center text-sm cursor-pointer transition-colors border-b border-gray-50/50 last:border-0 ${value?.id === p.id ? 'bg-primary/5 text-primary font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                                            onClick={() => {
                                                onChange(p);
                                                setIsOpen(false);
                                                setSearch("");
                                                setQty((prev: any) => ({ ...prev, [qtyKey]: 1 }));
                                            }}
                                        >
                                            {/* 🟢 MINI FOTO PADA DAFTAR PENCARIAN */}
                                            <div className="w-9 h-9 bg-white border border-gray-100 rounded-md flex-shrink-0 p-1 flex items-center justify-center overflow-hidden">
                                                <img src={getProductImageSrc(p)} alt={p.name} className="w-full h-full object-contain" />
                                            </div>

                                            <span className="flex-1 mr-2 line-clamp-2 leading-snug">{p.name}</span>
                                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 whitespace-nowrap flex-shrink-0">
                                                STOK {totalStock}
                                            </span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="px-3 py-6 text-xs text-center text-gray-400 font-bold uppercase tracking-widest">
                                    {search ? "Hasil tidak ditemukan" : "Stok Kosong"}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* KUANTITAS (QTY) & ESTIMASI HARGA ROW */}
            <div className="flex items-center justify-between w-full md:col-span-4 gap-4 relative z-0 md:pl-2">
                <div className="flex items-center gap-3 md:justify-center md:w-full">
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase md:hidden tracking-widest">Qty</span>
                    <input
                        type="number"
                        min={1}
                        max={value ? getItemStock(value) : 99} 
                        className="w-16 border border-gray-200 p-2 rounded-lg text-sm text-center bg-white outline-none focus:border-primary disabled:bg-gray-50 disabled:text-gray-300"
                        value={qty[qtyKey] === "" ? "" : qty[qtyKey]}
                        disabled={!value}
                        onChange={(e) => {
                            const val = e.target.value;
                            let numVal = val === "" ? "" : Number(val);
                            const maxStock = value ? getItemStock(value) : 99;

                            if (typeof numVal === 'number' && numVal > maxStock) numVal = maxStock;

                            setQty((prev: any) => ({
                                ...prev,
                                [qtyKey]: numVal === "" ? "" : Math.max(1, numVal as number)
                            }));
                        }}
                    />
                </div>
                <div className="text-right text-sm font-extrabold text-gray-800 md:w-full whitespace-nowrap">
                    Rp {price.toLocaleString("id-ID")}
                </div>
            </div>
        </div>
    );
};

// ================= MAIN PC BUILDER PAGE COMPONENT =================
export default function PCBuilderPage() {
    const navigate = useNavigate();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    const [selectedCPU, setSelectedCPU] = useState<Product | null>(null);
    const [selectedMobo, setSelectedMobo] = useState<Product | null>(null);
    const [selectedRAM, setSelectedRAM] = useState<Product | null>(null);
    const [selectedVGA1, setSelectedVGA1] = useState<Product | null>(null);
    const [selectedVGA2, setSelectedVGA2] = useState<Product | null>(null);
    const [selectedPSU, setSelectedPSU] = useState<Product | null>(null);
    const [selectedCoolerCPU, setSelectedCoolerCPU] = useState<Product | null>(null);
    const [selectedCoolerFan1, setSelectedCoolerFan1] = useState<Product | null>(null);
    const [selectedCoolerFan2, setSelectedCoolerFan2] = useState<Product | null>(null);
    const [selectedCoolerFan3, setSelectedCoolerFan3] = useState<Product | null>(null);
    const [selectedCasing, setSelectedCasing] = useState<Product | null>(null);
    const [selectedSSD1, setSelectedSSD1] = useState<Product | null>(null);
    const [selectedSSD2, setSelectedSSD2] = useState<Product | null>(null);
    const [selectedHDD1, setSelectedHDD1] = useState<Product | null>(null);
    const [selectedHDD2, setSelectedHDD2] = useState<Product | null>(null);
    const [selectedMonitor1, setSelectedMonitor1] = useState<Product | null>(null);
    const [selectedMonitor2, setSelectedMonitor2] = useState<Product | null>(null);
    const [selectedMonitor3, setSelectedMonitor3] = useState<Product | null>(null);
    const [selectedOS, setSelectedOS] = useState<Product | null>(null);

    const [list, setList] = useState<{ [key: string]: Product[] }>({
        processors: [], motherboards: [], rams: [],
        vgas: [], psus: [], 
        coolerCPU: [], coolerFan: [],
        casings: [], ssds: [], hdds: [], monitors: [], oss: []
    });

    const [constraints, setConstraints] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCoreParts = async () => {
            setLoading(true);
            try {
                const res = await getCompatibility({
                    processor_id: selectedCPU?.id,
                    motherboard_id: selectedMobo?.id,
                    ram_id: selectedRAM?.id,
                });

                setList(prev => ({
                    ...prev,
                    processors: res.available_processors || [],
                    motherboards: res.available_motherboards || [],
                    rams: res.available_rams || []
                }));

                setConstraints(res.active_constraints);
            } catch (err) {
                console.error(err);
            } finally { 
                setLoading(false); 
            }
        };

        fetchCoreParts();
    }, [selectedCPU?.id, selectedMobo?.id, selectedRAM?.id]);

    useEffect(() => { 
        const fetchSupportParts = async () => {
            const categories = [
                { key: 'vgas', name: 'VGA' },
                { key: 'psus', name: 'Power Supply' },
                { key: 'coolerCPU', name: 'Cooler CPU' },
                { key: 'coolerFan', name: 'Cooler Fan' },
                { key: 'casings', name: 'Casing PC' },
                { key: 'ssds', name: 'SSD' },
                { key: 'hdds', name: 'HDD' },
                { key: 'oss', name: 'Operating System' }
            ];
            try {
                const results = await Promise.all(categories.map(cat => getProducts({ category: cat.name, limit: 100 })));
                const newList: any = {};
                categories.forEach((cat, index) => { newList[cat.key] = results[index].data || []; });
                const monitorCategories = ["Monitor LED", "Monitor Gaming", "Monitor Professional"];
                const monitorResults = await Promise.all(monitorCategories.map(name => getProducts({ category: name, limit: 100 })));
                const mergedMonitors = Array.from(new Map(monitorResults.flatMap(res => res.data || []).map(item => [item.id, item])).values());
                newList["monitors"] = mergedMonitors;
                setList(prev => ({ ...prev, ...newList }));
            } catch (err) { console.error(err); }
        };

        fetchSupportParts(); 
    }, []);

    const initialQty = {
        cpu: 1, mobo: 1, ram: 1, vga1: 1, vga2: 1, psu: 1,
        coolerCPU: 1, fan1: 1, fan2: 1, fan3: 1,
        casing: 1, ssd1: 1, ssd2: 1, hdd1: 1, hdd2: 1,
        monitor1: 1, monitor2: 1, monitor3: 1, os: 1
    };

    const [qty, setQty] = useState<{ [key: string]: number | string }>(initialQty);

    const handleReset = () => {
        setSelectedCPU(null); setSelectedMobo(null); setSelectedRAM(null);
        setSelectedVGA1(null); setSelectedVGA2(null); setSelectedPSU(null);
        setSelectedCoolerCPU(null); setSelectedCoolerFan1(null); setSelectedCoolerFan2(null); setSelectedCoolerFan3(null);
        setSelectedCasing(null); setSelectedSSD1(null); setSelectedSSD2(null); setSelectedHDD1(null); setSelectedHDD2(null);
        setSelectedMonitor1(null); setSelectedMonitor2(null); setSelectedMonitor3(null); setSelectedOS(null);
        setQty(initialQty);
    };

    const handlePreview = () => {
        const parts = [
            { label: "Processor", item: selectedCPU, key: "cpu" },
            { label: "Motherboard", item: selectedMobo, key: "mobo" },
            { label: "RAM", item: selectedRAM, key: "ram" },
            { label: "VGA Utama", item: selectedVGA1, key: "vga1" },
            { label: "VGA Tambahan", item: selectedVGA2, key: "vga2" },
            { label: "Power Supply", item: selectedPSU, key: "psu" },
            { label: "Casing", item: selectedCasing, key: "casing" },
            { label: "Cooler CPU", item: selectedCoolerCPU, key: "coolerCPU" },
            { label: "Cooler Fan 1", item: selectedCoolerFan1, key: "fan1" },
            { label: "Cooler Fan 2", item: selectedCoolerFan2, key: "fan2" },
            { label: "Cooler Fan 3", item: selectedCoolerFan3, key: "fan3" },
            { label: "SSD Utama", item: selectedSSD1, key: "ssd1" },
            { label: "SSD Tambahan", item: selectedSSD2, key: "ssd2" },
            { label: "HDD", item: selectedHDD1, key: "hdd1" },
            { label: "Monitor", item: selectedMonitor1, key: "monitor1" },
            { label: "OS", item: selectedOS, key: "os" },
        ]
        .filter(p => p.item)
        .map(p => ({ 
            ...p, 
            qty: Number(qty[p.key]) || 1,
            // 🟢 Ikut kirimkan URL gambar produk yang valid ke halaman preview
            image: getProductImageSrc(p.item)
        }));

        if (parts.length === 0) {
            Swal.fire({ icon: 'warning', title: 'Belum Ada Komponen', text: 'Pilih minimal satu komponen dulu.' });
            return;
        }

        navigate("/pc-builder/preview", { state: { parts, grandTotal } });
    };

    const handleConsult = () => {
        const parts = [
            { label: "Processor", item: selectedCPU, key: "cpu" },
            { label: "Motherboard", item: selectedMobo, key: "mobo" },
            { label: "RAM", item: selectedRAM, key: "ram" },
            { label: "VGA Utama", item: selectedVGA1, key: "vga1" },
            { label: "VGA Tambahan", item: selectedVGA2, key: "vga2" },
            { label: "Power Supply", item: selectedPSU, key: "psu" },
            { label: "Casing", item: selectedCasing, key: "casing" },
            { label: "Cooler CPU", item: selectedCoolerCPU, key: "coolerCPU" },
            { label: "Cooler Fan 1", item: selectedCoolerFan1, key: "fan1" },
            { label: "Cooler Fan 2", item: selectedCoolerFan2, key: "fan2" },
            { label: "Cooler Fan 3", item: selectedCoolerFan3, key: "fan3" },
            { label: "SSD Utama", item: selectedSSD1, key: "ssd1" },
            { label: "SSD Tambahan", item: selectedSSD2, key: "ssd2" },
            { label: "HDD", item: selectedHDD1, key: "hdd1" },
            { label: "Monitor", item: selectedMonitor1, key: "monitor1" },
            { label: "OS", item: selectedOS, key: "os" },
        ].filter(p => p.item);

        if (parts.length === 0) {
            Swal.fire({ icon: 'warning', title: 'Belum Ada Komponen', text: 'Pilih minimal satu komponen dulu.' });
            return;
        }

        const lines = parts.map(p =>
            `• ${p.label}: ${p.item!.name} (x${qty[p.key]}) - Rp ${getPrice(p.item, p.key).toLocaleString("id-ID")}`
        ).join("\n");

        const message = 
    `Halo Admin Anandam,

    Saya ingin konsultasi rakitan PC berikut:

    ${lines}

    💰 *Estimasi Total:* Rp ${grandTotal.toLocaleString("id-ID")}

    Mohon bantuannya 🙏`;

        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
    };

    const getPrice = (p: Product | null, key: string) => (p?.final_price || 0) * (Number(qty[key]) || 1);

    const grandTotal = 
        getPrice(selectedCPU, "cpu") + getPrice(selectedMobo, "mobo") + getPrice(selectedRAM, "ram") +
        getPrice(selectedVGA1, "vga1") + getPrice(selectedVGA2, "vga2") + getPrice(selectedPSU, "psu") +
        getPrice(selectedCoolerCPU, "coolerCPU") + getPrice(selectedCoolerFan1, "fan1") +
        getPrice(selectedCoolerFan2, "fan2") + getPrice(selectedCoolerFan3, "fan3") +
        getPrice(selectedCasing, "casing") + getPrice(selectedSSD1, "ssd1") + getPrice(selectedSSD2, "ssd2") +
        getPrice(selectedHDD1, "hdd1") + getPrice(selectedHDD2, "hdd2") + getPrice(selectedMonitor1, "monitor1") +
        getPrice(selectedMonitor2, "monitor2") + getPrice(selectedMonitor3, "monitor3") + getPrice(selectedOS, "os");

    const isCoreComplete = selectedCPU && selectedMobo && selectedRAM;
    const WHATSAPP_NUMBER = "6281228134747";

    const filterValidProducts = (products: Product[], type: "cpu" | "mobo" | "ram") => {
        return products.filter(p => {
            if (type === "cpu") return p.socket_type && p.socket_type !== "";
            if (type === "mobo") return p.socket_type && p.ram_type;
            if (type === "ram") return p.ram_type && p.ram_type !== "";
            return true;
        });
    };

    const handleCheckout = async () => {
        const token = localStorage.getItem("user_token");
        if (!token) { setIsAuthModalOpen(true); return; }
        const userData = JSON.parse(localStorage.getItem("user_data") || "null");

        if (!userData?.phone_number || !userData?.address) {
            Swal.fire({
                title: "Data Belum Lengkap!",
                text: "Lengkapi WA dan Alamat di profil untuk checkout rakitan.",
                icon: 'warning',
                confirmButtonText: 'Lengkapi Sekarang',
                confirmButtonColor: '#2563eb',
                showClass: { popup: 'animate__animated animate__zoomIn' },
            }).then((res) => { if (res.isConfirmed) navigate("/user/account/profile"); });
            return; 
        }

        try {
            Swal.fire({ title: 'Proses...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const items = [
                { item: selectedCPU, key: "cpu" }, { item: selectedMobo, key: "mobo" }, { item: selectedRAM, key: "ram" },
                { item: selectedVGA1, key: "vga1" }, { item: selectedVGA2, key: "vga2" }, { item: selectedPSU, key: "psu" },
                { item: selectedCoolerCPU, key: "coolerCPU" }, { item: selectedCoolerFan1, key: "fan1" },
                { item: selectedCoolerFan2, key: "fan2" }, { item: selectedCoolerFan3, key: "fan3" },
                { item: selectedCasing, key: "casing" }, { item: selectedSSD1, key: "ssd1" },
                { item: selectedSSD2, key: "ssd2" }, { item: selectedHDD1, key: "hdd1" },
                { item: selectedHDD2, key: "hdd2" }, { item: selectedMonitor1, key: "monitor1" },
                { item: selectedMonitor2, key: "monitor2" }, { item: selectedMonitor3, key: "monitor3" },
                { item: selectedOS, key: "os" },
            ].filter(i => i.item).map(i => ({ product_id: i.item!.id, quantity: Number(qty[i.key]) || 1 }));

            const response = await checkoutPCBuilder({ items, notes: "Pesanan Custom Rakitan PC" });
            const invoice = response?.order?.invoice_number || response?.data?.order?.invoice_number || response?.invoice_number;
            
            Swal.close();
            const message = `Halo Admin Anandam,\n\nSaya ingin bayar rakitan PC:\n🧾 *Invoice:* ${invoice}\n\nMohon dibantu.`;
            handleReset();
            window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
        } catch (err: any) {
            Swal.close();
            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan checkout.' });
        }
    };

    return (
        <div className="bg-white min-h-screen">
            <div className="w-full bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto h-12 flex items-center px-4 lg:px-8">
                    <Breadcrumb items={[{ label: "Home", path: "/" }, { label: "Rakit PC" }]} />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight">PC Builder</h1>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Konfigurasi PC Sesuai Kebutuhan</p>
                    </div>
                    <button onClick={handleReset} className="text-[11px] font-bold text-red-500 uppercase tracking-widest bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 transition-all">
                        Reset Konfigurasi
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3 space-y-6">
                        {/* Section 1 */}
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Komponen Utama</h2>
                                <span className="text-[9px] bg-primary text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-widest">Wajib</span>
                            </div>
                            <Row label="Processor" value={selectedCPU} onChange={setSelectedCPU} options={filterValidProducts(list.processors, "cpu")} price={getPrice(selectedCPU, "cpu")} qtyKey="cpu" qty={qty} setQty={setQty} />
                            <Row label="Motherboard" value={selectedMobo} onChange={setSelectedMobo} options={filterValidProducts(list.motherboards, "mobo")} price={getPrice(selectedMobo, "mobo")} qtyKey="mobo" qty={qty} setQty={setQty} />
                            <Row label="RAM" value={selectedRAM} onChange={setSelectedRAM} options={filterValidProducts(list.rams, "ram")} price={getPrice(selectedRAM, "ram")} qtyKey="ram" qty={qty} setQty={setQty} />
                        </div>

                        {/* Section 2 */}
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                            <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-6">Graphics & Power</h2>
                            <Row label="VGA Utama" value={selectedVGA1} onChange={setSelectedVGA1} options={list.vgas} price={getPrice(selectedVGA1, "vga1")} qtyKey="vga1" qty={qty} setQty={setQty} />
                            <Row label="VGA Tambahan" value={selectedVGA2} onChange={setSelectedVGA2} options={list.vgas} price={getPrice(selectedVGA2, "vga2")} qtyKey="vga2" qty={qty} setQty={setQty} />
                            <Row label="Power Supply" value={selectedPSU} onChange={setSelectedPSU} options={list.psus} price={getPrice(selectedPSU, "psu")} qtyKey="psu" qty={qty} setQty={setQty} />
                            <Row label="Casing PC" value={selectedCasing} onChange={setSelectedCasing} options={list.casings} price={getPrice(selectedCasing, "casing")} qtyKey="casing" qty={qty} setQty={setQty} />
                        </div>

                        {/* Section 3 */}
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                            <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-6">Cooling System</h2>
                            <Row label="Cooler CPU" value={selectedCoolerCPU} onChange={setSelectedCoolerCPU} options={list.coolerCPU} price={getPrice(selectedCoolerCPU, "coolerCPU")} qtyKey="coolerCPU" qty={qty} setQty={setQty} />
                            <Row label="Cooler Fan 1" value={selectedCoolerFan1} onChange={setSelectedCoolerFan1} options={list.coolerFan} price={getPrice(selectedCoolerFan1, "fan1")} qtyKey="fan1" qty={qty} setQty={setQty} />
                            <Row label="Cooler Fan 2" value={selectedCoolerFan2} onChange={setSelectedCoolerFan2} options={list.coolerFan} price={getPrice(selectedCoolerFan2, "fan2")} qtyKey="fan2" qty={qty} setQty={setQty} />
                            <Row label="Cooler Fan 3" value={selectedCoolerFan3} onChange={setSelectedCoolerFan3} options={list.coolerFan} price={getPrice(selectedCoolerFan3, "fan3")} qtyKey="fan3" qty={qty} setQty={setQty} />
                        </div>

                        {/* Section 4 */}
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                            <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-6">Storage & Display</h2>
                            <Row label="SSD Utama" value={selectedSSD1} onChange={setSelectedSSD1} options={list.ssds} price={getPrice(selectedSSD1, "ssd1")} qtyKey="ssd1" qty={qty} setQty={setQty} />
                            <Row label="SSD Tambahan" value={selectedSSD2} onChange={setSelectedSSD2} options={list.ssds} price={getPrice(selectedSSD2, "ssd2")} qtyKey="ssd2" qty={qty} setQty={setQty} />
                            <Row label="HDD Utama" value={selectedHDD1} onChange={setSelectedHDD1} options={list.hdds} price={getPrice(selectedHDD1, "hdd1")} qtyKey="hdd1" qty={qty} setQty={setQty} />
                            <Row label="Monitor LED" value={selectedMonitor1} onChange={setSelectedMonitor1} options={list.monitors} price={getPrice(selectedMonitor1, "monitor1")} qtyKey="monitor1" qty={qty} setQty={setQty} />
                            <Row label="Operating System" value={selectedOS} onChange={setSelectedOS} options={list.oss} price={getPrice(selectedOS, "os")} qtyKey="os" qty={qty} setQty={setQty} />
                        </div>
                    </div>

                    {/* SUMMARY CARD */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-md lg:sticky lg:top-28">
                            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6 border-b pb-4">Estimasi Biaya</h2>
                            
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
                                    <span className="text-gray-400">Socket</span>
                                    <span className={isCoreComplete ? "text-primary" : "text-gray-400"}>{constraints?.socket?.toUpperCase() || "--"}</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
                                    <span className="text-gray-400">RAM Type</span>
                                    <span className={isCoreComplete ? "text-primary" : "text-gray-400"}>{constraints?.ram_type?.toUpperCase() || "--"}</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                                <span className="block text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-2">Total Harga</span>
                                <div className="text-2xl font-bold text-primary">
                                    Rp {grandTotal.toLocaleString("id-ID")}
                                </div>
                            </div>

                            <button
                                onClick={handlePreview}
                                className="w-full mt-8 bg-white border border-primary text-primary py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary/5 transition-all flex items-center justify-center gap-2 mb-3 shadow-sm"
                            >
                                <Eye size={16} />
                                Preview Konfigurasi
                            </button>

                            <button
                                onClick={handleConsult}
                                className="w-full border border-green-400 text-green-400 py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-green-400/10 transition-all flex items-center justify-center gap-2"
                            >
                                Tanya Dulu
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326z"/>
                                </svg>
                            </button>

                            <button 
                                disabled={!isCoreComplete}
                                onClick={handleCheckout}
                                className="w-full mt-3 bg-primary text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:brightness-110 disabled:bg-gray-100 disabled:text-gray-400 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-primary/20"
                            >
                                Checkout Pesanan
                                <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                            </button>
                            {!isCoreComplete && <p className="text-[9px] text-red-400 font-bold uppercase mt-3 text-center tracking-tighter">* Lengkapi Komponen Utama Dahulu</p>}
                        </div>
                    </div>
                </div>
            </div>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={() => { setIsAuthModalOpen(false); handleCheckout(); }} />
        </div>
    );
}