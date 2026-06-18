import React, { useEffect, useState } from "react";
import { getUserOrders } from "../../../services/orderSevice"; 
import api from "../../../services/api";
import { Package, Store, ShoppingBag, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { slugify } from "../../../utils/slugify";

export default function UserOrderHistory() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("SEMUA");

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    setLoading(true);
    try {
      const res = await getUserOrders();
      const orderData = Array.isArray(res) ? res : res.data || [];
      setOrders(orderData);
    } catch (error) {
      console.error("Gagal mengambil riwayat pesanan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const confirm = await Swal.fire({
      title: 'Batalkan Pesanan?',
      text: "Tindakan ini tidak dapat dibatalkan.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Batalkan',
      cancelButtonText: 'Kembali'
    });

    if (confirm.isConfirmed) {
      try {
        const token = localStorage.getItem("user_token");
        await api.patch(`/orders/${orderId}/cancel`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        Swal.fire("Berhasil", "Pesanan berhasil dibatalkan", "success");
        fetchMyOrders();
      } catch (err: any) {
        Swal.fire("Gagal", err.response?.data?.message || "Gagal membatalkan pesanan", "error");
      }
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "SEMUA") return true;
    return order.status === activeTab;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "LUNAS":
        return { color: "text-green-600", label: "Selesai" };
      case "PENDING":
        return { color: "text-orange-500", label: "Belum Bayar" };
      case "BATAL":
        return { color: "text-red-500", label: "Dibatalkan" };
      default:
        return { color: "text-gray-600", label: status };
    }
  };

  const getProductImage = (product: any) => {
    if (!product) return null;
    let imgPath = null;
    
    if (product.thumbnail) {
      imgPath = product.thumbnail;
    } else if (product.images && product.images.length > 0) {
      imgPath = product.images[0]?.image_url || product.images[0];
    } else if (product.image_url) {
      imgPath = product.image_url;
    }

    if (!imgPath) return null;
    return imgPath.startsWith("http") 
      ? imgPath 
      : `${import.meta.env.VITE_API_BASE}${imgPath}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 md:bg-transparent -mx-4 md:mx-0 flex flex-col">
      
      {/* --- TABS FILTER (Biasa, Tidak Sticky) --- */}
      <div className="bg-white flex overflow-x-auto border-b border-gray-200 hide-scrollbar shadow-sm mb-4 md:mb-6">
        {[
          { id: "SEMUA", label: "Semua" },
          { id: "PENDING", label: "Belum Bayar" },
          { id: "LUNAS", label: "Selesai" },
          { id: "BATAL", label: "Dibatalkan" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[100px] py-3.5 text-[13px] sm:text-sm text-center font-bold transition-all border-b-2 whitespace-nowrap px-4 ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- ORDER LIST --- */}
      <div className="p-4 md:p-0 flex-1">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-primary w-8 h-8" />
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusStyle = getStatusStyle(order.status);
              
              return (
                <div key={order.id} className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
                  
                  {/* Header: Invoice & Status */}
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2">
                      <Store size={15} className="text-gray-500" />
                      <span className="font-bold text-xs text-gray-700 uppercase tracking-tight">
                        {order.invoice_number}
                      </span>
                    </div>
                    <div className={`text-xs font-bold uppercase tracking-wider ${statusStyle.color}`}>
                      {statusStyle.label}
                    </div>
                  </div>

                  {/* Body: Products */}
                  <div className="divide-y divide-gray-100">
                    {order.items?.map((item: any) => {
                      const imageUrl = getProductImage(item.product);

                      return (
                        <Link to={`/products/${slugify(item.product_name)}--${item.product_id}`} key={item.id} className="flex gap-4 p-4 hover:bg-gray-50 transition-colors">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border border-gray-200">
                            {imageUrl ? (
                              <img src={imageUrl} alt={item.product_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Package className="text-gray-300" size={24} /></div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <h3 className="text-sm text-gray-800 font-medium line-clamp-2 leading-snug">
                                {item.product_name}
                              </h3>
                              {item.variasi && (
                                <p className="text-[11px] text-gray-500 mt-1">Variasi: {item.variasi}</p>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-gray-500 font-medium">x{item.quantity}</p>
                              <p className="text-sm font-bold text-gray-800">
                                Rp {Number(item.price).toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Footer: Total & Actions */}
                  <div className="px-4 py-4 border-t border-gray-100 bg-white">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-medium text-gray-500">Total Pesanan</span>
                      <span className="text-base sm:text-lg font-bold text-primary">
                        Rp {Number(order.total_price).toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex justify-end gap-2">
                      {order.status === "PENDING" && (
                        <button 
                          onClick={() => handleCancelOrder(order.id)}
                          className="px-5 py-2 text-xs font-bold text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors uppercase tracking-wider"
                        >
                          Batalkan
                        </button>
                      )}
                      
                      {(order.status === "LUNAS" || order.status === "BATAL") && (
                        <Link 
                          to={`/products/${slugify(order.items?.[0]?.product_name || "")}--${order.items?.[0]?.product_id}`}
                          className="px-6 py-2 text-xs font-bold text-white bg-primary rounded-md hover:bg-primary-dark transition-colors uppercase tracking-wider text-center"
                        >
                          Beli Lagi
                        </Link>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-md border border-gray-200 mx-4 md:mx-0 shadow-sm">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-base font-bold text-gray-800 uppercase tracking-tight">Belum ada pesanan</h3>
            <p className="text-xs text-gray-500 mt-1 mb-6 px-10 leading-relaxed">
              Kamu belum memiliki riwayat transaksi di kategori ini.
            </p>
            <Link to="/products" className="inline-block px-8 py-2.5 bg-primary text-white rounded-md text-xs font-bold hover:bg-primary-dark transition-colors uppercase tracking-widest">
              Mulai Belanja
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}