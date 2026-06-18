import { useLocation, useNavigate } from "react-router-dom";
import Breadcrumb from "../../components/Breadcrumb";
import { Printer, ChevronLeft } from "lucide-react";

export default function PCBuilderPreviewPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { parts, grandTotal } = location.state || { parts: [], grandTotal: 0 };

    if (!parts || parts.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Belum ada komponen terpilih</h2>
                <button 
                    onClick={() => navigate("/pc-builder")}
                    className="bg-primary text-white px-6 py-2 rounded-md font-bold uppercase tracking-widest text-xs"
                >
                    Kembali ke PC Builder
                </button>
            </div>
        );
    }

    const handlePrint = () => {
        if (!parts || parts.length === 0) return;

        // 1. Buka jendela cetak baru
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            alert("Pop-up blocker aktif! Mohon izinkan pop-up untuk mencetak nota.");
            return;
        }

        // 2. Format tanggal hari ini
        const formattedDate = new Date().toLocaleDateString("id-ID", {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        // 3. Generate baris tabel komponen secara murni menggunakan struktur tabel HTML standar
        const tableRowsHtml = parts.map((p: any) => {
            const subtotal = p.item.final_price * p.qty;
            return `
                <tr style="border-bottom: 1px solid #f3f4f6;">
                    <td style="padding: 12px 8px; vertical-align: top; font-weight: bold; color: #2563eb; font-size: 11px; text-transform: uppercase;">
                        ${p.label}
                    </td>
                    <td style="padding: 12px 8px; vertical-align: top;">
                        <div style="display: flex; gap: 12px; align-items: flex-start;">
                            <div style="width: 48px; height: 48px; border: 1px solid #e5e7eb; border-radius: 6px; padding: 2px; display: flex; align-items: center; justify-content: center; background: #fff; flex-shrink: 0;">
                                <img src="${p.image || '/icon-anandam.svg'}" style="width: 100%; height: 100%; object-fit: contain;" />
                            </div>
                            <div style="font-size: 13px; font-weight: 600; color: #1f2937; line-height: 1.4;">
                                ${p.item.name}
                            </div>
                        </div>
                    </td>
                    <td style="padding: 12px 8px; vertical-align: top; text-align: center; font-size: 13px; font-weight: bold; color: #374151;">
                        ${p.qty}
                    </td>
                    <td style="padding: 12px 8px; vertical-align: top; text-align: right; font-size: 13px; font-weight: bold; color: #374151;">
                        <div style="font-size: 10px; color: #9ca3af; text-decoration: line-through; font-weight: normal; margin-bottom: 2px;">
                            ${p.item.price_discount ? 'Rp ' + p.item.price_normal.toLocaleString("id-ID") : ''}
                        </div>
                        Rp ${p.item.final_price.toLocaleString("id-ID")}
                    </td>
                    <td style="padding: 12px 8px; vertical-align: top; text-align: right; font-size: 13px; font-weight: 800; color: #2563eb;">
                        Rp ${subtotal.toLocaleString("id-ID")}
                    </td>
                </tr>
            `;
        }).join("");

        // 4. Suntikkan dokumen layout struktural yang bersih dan imun dari kerusakan CSS
        printWindow.document.write(`
            <html>
                <head>
                    <title>Estimasi Rakitan PC - Anandam Computer</title>
                    <style>
                        * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
                        body { padding: 40px; background: white; color: #111827; }
                        .info-box { background: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 24px; }
                        .info-text { font-size: 11px; color: #1e40af; font-weight: bold; text-transform: uppercase; margin: 0; tracking: 0.5px; }
                        .header-table { width: 100%; margin-bottom: 30px; border-collapse: collapse; }
                        .main-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; table-layout: fixed; }
                        .total-box { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin-top: 20px; text-align: right; }
                        .footer-text { font-size: 10px; color: #9ca3af; font-weight: bold; text-align: center; margin-top: 30px; text-transform: uppercase; }
                        @media print {
                            body { padding: 10px; }
                            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        }
                    </style>
                </head>
                <body>
                    
                    <div class="info-box">
                        <p class="info-text">
                            Harga adalah harga update (${formattedDate}), jika ada perubahan harga maka perlu dikomunikasikan dan dihitung kembali.
                        </p>
                    </div>

                    <table class="header-table">
                        <tr>
                            <td style="text-align: left; vertical-align: bottom;">
                                <h1 style="font-size: 24px; font-weight: 800; margin: 0; text-transform: uppercase; color: #111827;">Anandam Computer</h1>
                                <p style="font-size: 10px; color: #6b7280; font-weight: bold; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Estimasi Rakitan PC</p>
                            </td>
                            <td style="text-align: right; vertical-align: bottom;">
                                <p style="font-size: 10px; color: #9ca3af; font-weight: bold; margin: 0; text-transform: uppercase;">Tanggal</p>
                                <p style="font-size: 14px; font-weight: bold; margin: 4px 0 0 0; color: #374151;">${formattedDate}</p>
                            </td>
                        </tr>
                    </table>

                    <table class="main-table">
                        <thead>
                            <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                                <th style="width: 15%; padding: 12px 8px; font-size: 10px; font-weight: bold; color: #6b7280; text-transform: uppercase; text-align: left;">Komponen</th>
                                <th style="width: 45%; padding: 12px 8px; font-size: 10px; font-weight: bold; color: #6b7280; text-transform: uppercase; text-align: left;">Nama Produk</th>
                                <th style="width: 8%; padding: 12px 8px; font-size: 10px; font-weight: bold; color: #6b7280; text-transform: uppercase; text-align: center;">Qty</th>
                                <th style="width: 16%; padding: 12px 8px; font-size: 10px; font-weight: bold; color: #6b7280; text-transform: uppercase; text-align: right;">Harga</th>
                                <th style="width: 16%; padding: 12px 8px; font-size: 10px; font-weight: bold; color: #6b7280; text-transform: uppercase; text-align: right;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRowsHtml}
                        </tbody>
                    </table>

                    <div class="total-box">
                        <table style="width: 300px; margin-left: auto; border-collapse: collapse;">
                            <tr>
                                <td style="text-align: left; font-size: 13px; font-weight: bold; color: #6b7280; text-transform: uppercase;">Grand Total</td>
                                <td style="text-align: right; font-size: 20px; font-weight: 800; color: #2563eb;">
                                    Rp ${grandTotal.toLocaleString("id-ID")}
                                </td>
                            </tr>
                        </table>
                    </div>

                    <p class="footer-text">
                        * Harga dapat berubah sewaktu-waktu tergantung stok dan promo yang berlaku.
                    </p>

                </body>
            </html>
        `);

        printWindow.document.close();
        
        // 5. Eksekusi cetak setelah struktur siap
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 400);
    };

    return (
        <div className="bg-white min-h-screen pb-20">
            {/* BREADCRUMB - Hidden on Print */} 
            <div className="w-full bg-white border-b border-gray-100 no-print">
                <div className="max-w-7xl mx-auto h-12 flex items-center px-4 lg:px-8">
                    <Breadcrumb items={[{ label: "Home", path: "/" }, { label: "Rakit PC", path: "/pc-builder" }, { label: "Preview" }]} />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
                
                {/* 🟢 HEADER - Sekarang disembunyikan penuh saat cetak dengan menambahkan class no-print */}
                <div className="flex justify-between items-center mb-6 no-print">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate("/pc-builder")}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ChevronLeft size={20} className="text-gray-900" />
                        </button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 uppercase tracking-tight">Preview Rakitan</h1>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Review Spesifikasi & Estimasi Biaya</p>
                        </div>
                    </div>
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 text-[11px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-5 py-2.5 rounded-md hover:bg-primary/20 transition-all border border-primary/20"
                    >
                        <Printer size={14} />
                        Cetak
                    </button>
                </div>

                {/* ================= AREA YANG AKAN DICETAK (START) ================= */}
                {/* Batas Awal: Kotak Informasi Update Harga */}
                <div className="mb-2 p-4 bg-blue-50 border border-blue-200 rounded-xl shadow-sm">
                    <p className="text-[10px] md:text-[11px] text-blue-800 font-bold uppercase tracking-widest text-center leading-relaxed">
                        Harga adalah harga update ({new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}), jika ada perubahan harga maka perlu dikomunikasikan dan dihitung kembali.
                    </p>
                </div>

                {/* Kotak Peringatan Screenshot - 🟢 Sembunyikan saat dicetak karena tidak penting di kertas */}
                <div className="mb-5 p-2 bg-indigo-600 border border-indigo-700 rounded-xl shadow-md no-print">
                    <p className="text-[10px] md:text-[11px] text-white font-bold uppercase tracking-widest text-center leading-relaxed">
                        Ini hanyalah preview, jika keluar halaman maka akan hilang. segera screenshot!!
                    </p>
                </div>

                {/* PRINTABLE AREA */}
                <div id="print-area" className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden print:border-0 print:shadow-none">
                    {/* Print Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-end">
                        <div className="hidden print:block text-left">
                            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Anandam Computer</h1>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Estimasi Rakitan PC</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Tanggal</p>
                            <p className="text-sm font-bold text-gray-800">{new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>

                    {/* DESKTOP TABLE VIEW */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left table-fixed">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="w-[15%] px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Komponen</th>
                                    <th className="w-[45%] px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nama Produk</th>
                                    <th className="w-[8%] px-2 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Qty</th>
                                    <th className="w-[16%] px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Harga</th>
                                    <th className="w-[16%] px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {parts.map((p: any, index: number) => {
                                    const subtotal = p.item.final_price * p.qty;
                                    return (
                                        <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-5 align-top">
                                                <span className="text-[10px] font-bold text-primary uppercase tracking-tight bg-primary/5 px-2 py-1 rounded">
                                                    {p.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 align-top">
                                                {/* 🟢 SEKTOR FOTO DESKTOP TABLE */}
                                                <div className="flex gap-4 items-start">
                                                    <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center p-1 overflow-hidden">
                                                        <img src={p.image || "/icon-anandam.svg"} alt="Part" className="w-full h-full object-contain" />
                                                    </div>
                                                    <p className="text-sm font-semibold text-gray-800 leading-snug whitespace-normal break-words pt-0.5">
                                                        {p.item.name}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-2 py-5 text-center align-top pt-6">
                                                <span className="text-sm font-bold text-gray-700">{p.qty}</span>
                                            </td>
                                            <td className="px-4 py-5 text-right align-top pt-6">
                                                <p className="text-[10px] text-gray-400 line-through mb-0.5 leading-none">
                                                    {p.item.price_discount ? `Rp ${p.item.price_normal.toLocaleString("id-ID")}` : ""}
                                                </p>
                                                <p className="text-sm font-extrabold text-gray-800">
                                                    Rp {p.item.final_price.toLocaleString("id-ID")}
                                                </p>
                                            </td>
                                            <td className="px-6 py-5 text-right align-top pt-6">
                                                <p className="text-sm font-extrabold text-primary">
                                                    Rp {subtotal.toLocaleString("id-ID")}
                                                </p>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE CARD VIEW */}
                    <div className="md:hidden divide-y divide-gray-100 print:hidden">
                        {parts.map((p: any, index: number) => {
                            const subtotal = p.item.final_price * p.qty;
                            return (
                                <div key={index} className="p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded">
                                            {p.label}
                                        </span>
                                        <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-0.5 rounded-full">
                                            x{p.qty}
                                        </span>
                                    </div>

                                    {/* 🟢 SEKTOR FOTO MOBILE VIEW */}
                                    <div className="flex gap-3 items-center">
                                        <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center p-1 overflow-hidden">
                                            <img src={p.image || "/icon-anandam.svg"} alt="Part" className="w-full h-full object-contain" />
                                        </div>
                                        <p className="text-[13px] font-semibold text-gray-800 leading-snug flex-1 line-clamp-2">
                                            {p.item.name}
                                        </p>
                                    </div>

                                    <div className="flex justify-between items-end pt-1 bg-gray-50/50 p-2 rounded-lg">
                                        <div className="text-left">
                                            <p className="text-[9px] text-gray-400 uppercase font-extrabold tracking-widest leading-none mb-1">Harga Unit</p>
                                            <p className="text-xs font-bold text-gray-700">Rp {p.item.final_price.toLocaleString("id-ID")}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] text-primary uppercase font-extrabold tracking-widest leading-none mb-1">Subtotal</p>
                                            <p className="text-sm font-extrabold text-primary">Rp {subtotal.toLocaleString("id-ID")}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Summary Footer */}
                    <div className="bg-gray-50/50 p-6 md:p-8 border-t border-gray-100">
                        <div className="flex justify-between items-center max-w-md ml-auto">
                            <span className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-widest">Grand Total</span>
                            <span className="text-xl md:text-2xl font-extrabold text-primary">
                                Rp {grandTotal.toLocaleString("id-ID")}
                            </span>
                        </div>
                    </div>

                    {/* PRINT FOOTER NOTE */}
                    <div className="p-6 border-t border-gray-50 text-center">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            * Harga dapat berubah sewaktu-waktu tergantung stok dan promo yang berlaku.
                        </p>
                    </div>
                </div>
                {/* PRINTABLE AREA END */}

                <div className="mt-8 text-center no-print">
                    <p className="text-[11px] text-gray-300 font-medium italic">
                        "Terima kasih telah mempercayai Anandam Computer"
                    </p>
                </div>
            </div>

            <style>{`
                @media print {
                    /* 1. Sembunyikan elemen-elemen navigasi dan tombol */
                    .no-print, 
                    header, 
                    footer, 
                    nav,
                    .w-full.bg-white.border-b.border-gray-100 { 
                        display: none !important; 
                    }

                    /* 2. Hilangkan border, shadow, dan padding berlebih pada container utama */
                    .bg-white, 
                    .max-w-7xl, 
                    .shadow-sm { 
                        border: none !important; 
                        box-shadow: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }

                    /* 3. PAKSA DAFTAR BARANG (TABEL DESKTOP) UNTUK MUNCUL DI KERTAS */
                    .hidden.md\:block { 
                        display: block !important; 
                    }
                    
                    table { 
                        display: table !important; 
                        width: 100% !important; 
                        border-collapse: collapse !important;
                    }
                    
                    tr { 
                        display: table-row !important;
                        page-break-inside: avoid !important; 
                    }
                    
                    td, th { 
                        display: table-cell !important; 
                    }

                    /* Sembunyikan tampilan mobile card agar tidak double saat di-print */
                    .md\    :hidden { 
                        display: none !important; 
                    }
                    
                    /* 4. Pengaturan kertas */
                    body { 
                        background-color: white !important; 
                        color: black !important;
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important;
                    }
                }

                @media screen {
                    .print-only { display: none; }
                }
            `}</style>
        </div>
    );
}