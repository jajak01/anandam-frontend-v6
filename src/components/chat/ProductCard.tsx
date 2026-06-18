import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  product: any;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();

  const variant = product.variants?.[0] || {};
  const normalPrice = Number(variant.price_normal ?? product.price_normal ?? 0);
  const discountValue = Number(variant.price_discount ?? product.price_discount ?? 0);
  const finalPrice = discountValue > 0 ? normalPrice - discountValue : normalPrice;

  const thumb = product.images?.[0]?.thumbnail_url;
  const original = product.images?.[0]?.image_url;
  const imagePath = thumb?.startsWith("/uploads") ? thumb : original?.startsWith("/uploads") ? original : null;
  const imageSrc = imagePath ? (imagePath.startsWith("http") ? imagePath : `${import.meta.env.VITE_API_BASE}${imagePath}`) : "/icon-anandam.svg";

  // Handle slug formatting for navigation
  const slugify = (text: string) => text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');
  const productSlug = `${slugify(product.name)}--${product.id}`;

  return (
    <div 
      onClick={() => navigate(`/products/${productSlug}`)}
      className="flex bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm max-w-[280px] hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="w-20 h-20 bg-gray-100 flex-shrink-0">
        <img 
          src={imageSrc} 
          alt={product.name} 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-2 flex flex-col justify-between flex-1 min-w-0">
        <div>
          <h4 className="text-[13px] font-medium text-gray-800 line-clamp-2 leading-snug">
            {product.name}
          </h4>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[#ee4d2d] font-semibold text-sm">
            Rp{finalPrice.toLocaleString('id-ID')}
          </span>
          <div className="w-5 h-5 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
            <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
};