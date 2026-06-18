import React from 'react';
import { Package, ExternalLink } from 'lucide-react';

const DUMMY_PRODUCT = {
  name: 'Laptop ASUS ROG Zephyrus G14 2024 OLED',
  price: 25999000,
  image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=200&h=200',
  status: 'Ready Stock',
  orderId: 'INV/20260525/MPL/321456',
  orderStatus: 'Dikirim',
};

const ProductAttachmentPanel: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
      {/* Detail Pesanan (if applicable) */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3">
          <Package size={18} className="text-blue-600" />
          Info Pesanan
        </h3>
        <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">No. Invoice</p>
              <p className="text-xs font-semibold text-blue-600 cursor-pointer hover:underline">
                {DUMMY_PRODUCT.orderId}
              </p>
            </div>
            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded">
              {DUMMY_PRODUCT.orderStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Detail Produk */}
      <div className="p-4 bg-white flex-1 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Produk Terkait</h3>
        <div className="border border-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow">
          <div className="h-32 w-full bg-gray-200 overflow-hidden">
            <img
              src={DUMMY_PRODUCT.image}
              alt="Product"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-3">
            <h4 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 leading-tight">
              {DUMMY_PRODUCT.name}
            </h4>
            <p className="text-lg font-bold text-red-500 mb-2">
              Rp{DUMMY_PRODUCT.price.toLocaleString('id-ID')}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              {DUMMY_PRODUCT.status}
            </div>
            <button className="w-full bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
              Lihat Produk <ExternalLink size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductAttachmentPanel;
