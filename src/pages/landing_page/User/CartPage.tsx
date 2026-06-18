import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; 
import { Trash2, Plus, Minus, ShoppingBag, ChevronRight, Check } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { getMyCart, removeFromCart, updateCartQuantity } from "../../../services/cartService";
import { checkoutFromCart } from "../../../services/orderSevice"; 
import Swal from "sweetalert2";
import { slugify } from "../../../utils/slugify";

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const WHATSAPP_NUMBER = "6281228134747";

  const fetchCart = async () => {
    try {
        const data = await getMyCart();

        const validatedData = data.map((item: any) => {
        const stock = item.product?.stock || 0;
        if (item.quantity > stock) {
            updateCartQuantity(item.id, stock).catch(err => console.error("Auto-sync failed", err));
            
            return { ...item, quantity: stock };
        }
        return item;
        });

        setCartItems(validatedData);
        setSelectedItems(validatedData.map((item: any) => item.id));
    } catch (err) {
        console.error("Gagal mengambil keranjang", err);
    } finally {
        setLoading(false);
    }
    };

  useEffect(() => { fetchCart(); }, []);

  const toggleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map(item => item.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleUpdateQty = async (id: string, newQty: number, stock: number) => {
    if (newQty < 1) return;
    if (newQty > stock) {
      Swal.fire({
        icon: "warning",
        title: "Stok tidak cukup",
        text: `Maksimal pembelian hanya ${stock}`,
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }
    try {
      await updateCartQuantity(id, newQty);
      setCartItems(prev =>
        prev.map(item => item.id === id ? { ...item, quantity: newQty } : item)
      );
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Hapus barang?',
      text: "Barang akan dihapus dari keranjangmu",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    });
    if (result.isConfirmed) {
      try {
        await removeFromCart(id);
        setCartItems(prev => prev.filter(item => item.id !== id));
        setSelectedItems(prev => prev.filter(item => item !== id));
      } catch (err) { console.error(err); }
    }
  };

  const selectedCartItems = cartItems.filter(item => selectedItems.includes(item.id));

  const subtotal = selectedCartItems.reduce((acc, item) => {
    const priceNormal = Number(item.product?.price_normal || 0);
    const priceDiscount = Number(item.product?.price_discount || 0);
    const finalPrice = priceDiscount > 0 ? priceNormal - priceDiscount : priceNormal;
    return acc + finalPrice * item.quantity;
  }, 0);

  const totalDiscount = selectedCartItems.reduce((acc, item) => {
    const discount = Number(item.product?.price_discount || 0);
    return acc + (discount * item.quantity);
  }, 0);

  const handleCheckoutWA = async () => {
    if (selectedItems.length === 0) {
      Swal.fire({ icon: 'info', title: 'Opps!', text: 'Pilih minimal 1 produk untuk checkout' });
      return;
    }
    const token = localStorage.getItem("user_token");
    if (!token) {
      Swal.fire({ icon: 'warning', title: 'Sesi Berakhir', text: 'Silakan login kembali.' });
      return;
    }
    const userDataString = localStorage.getItem("user_data");
    const userData = userDataString ? JSON.parse(userDataString) : null;

    if (!userData?.phone_number || !userData?.address) {
      Swal.fire({
        title: "Data Belum Lengkap!",
        text: "Harap lengkapi nomor WA dan alamat di profil Anda.",
        icon: 'warning',
        confirmButtonText: 'Lengkapi Sekarang',
        confirmButtonColor: '#2563eb',
      }).then((result) => {
        if (result.isConfirmed) navigate("/user/account/profile");
      });
      return; 
    }

    try {
      Swal.fire({ title: 'Memproses...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
      const response = await checkoutFromCart(selectedItems, "Checkout via WhatsApp");
      const orderData = response?.order || response?.data?.order;
      const invoiceNumber = orderData?.invoice_number || response?.invoice_number;
      Swal.close();

      const whatsappMessage = `Halo Admin Anandam,\n\nSaya ingin melanjutkan pembayaran:\n🧾 *No. Invoice:* ${invoiceNumber}\n\nMohon dibantu cek total tagihan + ongkir. Terima kasih!`;
      setCartItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
      setSelectedItems([]);
      window.dispatchEvent(new Event('cartUpdated'));
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
    } catch (err: any) {
      Swal.close();
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Terjadi kesalahan.' });
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-primary font-bold animate-pulse text-xs uppercase tracking-widest">Memuat Keranjang...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-6">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Halaman */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800 uppercase">Keranjang Belanja</h1>
            <p className="text-xs text-gray-500 mt-1">Total {cartItems.length} produk pilihan Anda</p>
          </div>
          {cartItems.length > 0 && (
            <button 
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider bg-white px-4 py-2 rounded-md border border-gray-200 shadow-sm"
            >
              <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${selectedItems.length === cartItems.length ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                {selectedItems.length === cartItems.length && <Check size={12} className="text-white" strokeWidth={4} />}
              </div>
              Pilih Semua
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* List Barang */}
          <div className="lg:col-span-8 space-y-3">
            {cartItems.length > 0 ? (
              cartItems.map((item) => {
                const product = item.product;
                const priceNormal = Number(product?.price_normal || 0);
                const priceDiscount = Number(product?.price_discount || 0);
                const finalPrice = priceDiscount > 0 ? priceNormal - priceDiscount : priceNormal;
                const isSelected = selectedItems.includes(item.id);
                const imageUrl = product?.thumbnail?.startsWith("http") ? product.thumbnail : `${import.meta.env.VITE_API_BASE}${product?.thumbnail}`;

                return (
                  <div key={item.id} className={`bg-white p-3 sm:p-4 rounded-md border transition-all flex gap-3 sm:gap-4 items-center ${isSelected ? "border-primary/40 ring-1 ring-primary/10" : "border-gray-200 shadow-sm"}`}>
                    
                    {/* Checkbox */}
                    <div 
                      onClick={() => toggleSelectItem(item.id)}
                      className={`cursor-pointer w-5 h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${isSelected ? "bg-primary border-primary" : "border-gray-300 hover:border-primary/50"}`}
                    >
                      {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                    </div>

                    {/* Image */}
                    <Link to={`/products/${slugify(product?.name || "")}--${product?.id}`} className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-md p-1 border border-gray-100 flex-shrink-0 overflow-hidden">
                      <img src={imageUrl} className="w-full h-full object-contain" alt="product" />
                    </Link>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <Link to={`/products/${slugify(product?.name || "")}--${product?.id}`} className="hover:text-primary transition-colors block">
                        <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{product?.name}</h3>
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md font-bold uppercase tracking-tight">
                          {item.selected_variasi || "Default"}
                        </span>
                        <span className="text-[10px] font-bold text-green-600">Stok: {product?.stock}</span>
                      </div>
                      <p className="text-primary font-bold text-sm sm:text-base mt-2">Rp {finalPrice.toLocaleString()}</p>
                      
                      {/* Controls Mobile */}
                      <div className="flex sm:hidden items-center justify-between mt-3 pt-3 border-t border-gray-50">
                        <div className="flex items-center border border-gray-200 rounded-md">
                          <button onClick={() => handleUpdateQty(item.id, item.quantity - 1, product?.stock)} className="px-2 py-1 text-gray-400"><Minus size={12}/></button>
                          <span className="px-2 text-xs font-bold border-x border-gray-100">{item.quantity}</span>
                          <button onClick={() => handleUpdateQty(item.id, item.quantity + 1, product?.stock)} className="px-2 py-1 text-gray-400"><Plus size={12}/></button>
                        </div>
                        <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>

                    {/* Controls Desktop */}
                    <div className="hidden sm:flex flex-col items-end gap-3 pl-4 border-l border-gray-100">
                      <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                        <button onClick={() => handleUpdateQty(item.id, item.quantity - 1, product?.stock)} className="p-2 text-gray-400 hover:bg-gray-50 transition-colors"><Minus size={14}/></button>
                        <span className="w-10 text-center text-xs font-bold border-x border-gray-100">{item.quantity}</span>
                        <button onClick={() => handleUpdateQty(item.id, item.quantity + 1, product?.stock)} className="p-2 text-gray-400 hover:bg-gray-50 transition-colors"><Plus size={14}/></button>
                      </div>
                      <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1"><Trash2 size={18} /></button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-md py-16 text-center border border-gray-200 shadow-sm">
                <div className="w-40 h-40 mx-auto mb-6 opacity-80">
                  <img src="/cart.svg" alt="Keranjang Kosong" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-base font-bold text-gray-800 uppercase tracking-tight">Wah, keranjangmu kosong</h3>
                <p className="text-xs text-gray-500 mt-2 mb-8">Yuk, isi dengan barang-barang impianmu!</p>
                <Link to="/products" className="inline-flex items-center px-8 py-3 bg-primary text-white rounded-md text-xs font-bold uppercase tracking-widest hover:bg-primary-dark transition-all">Mulai Belanja</Link>
              </div>
            )}
          </div>

          {/* Ringkasan */}
          {cartItems.length > 0 && (
            <div className="lg:col-span-4">
              <div className="bg-white p-5 rounded-md border border-gray-200 shadow-sm sticky top-24">
                <h2 className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-4 pb-2 border-b">Ringkasan Pesanan</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Total Harga ({selectedItems.length} barang)</span>
                    <span className="font-bold text-gray-800 text-sm">Rp {(subtotal + totalDiscount).toLocaleString()}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-xs text-green-600 font-bold">
                      <span>Hemat Diskon</span>
                      <span>-Rp {totalDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pt-4 border-t border-dashed flex justify-between items-end">
                    <span className="text-xs font-bold text-gray-800 uppercase">Total Tagihan</span>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary leading-none">Rp {subtotal.toLocaleString()}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-wider">Belum termasuk ongkir</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleCheckoutWA}
                  className="w-full h-12 bg-primary text-white rounded-md font-bold text-xs uppercase tracking-widest hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <FaWhatsapp size={18} /> Checkout via WhatsApp
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}