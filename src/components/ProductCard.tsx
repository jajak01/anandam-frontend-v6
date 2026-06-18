import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa6";
import type { Product } from "../types/product";
import { slugify } from "../utils/slugify";

interface Props {
  product: Product;
  layout?: "grid" | "list";
  from?: "landing" | "katalog" | "categories";
  category?: string;
}

const WHATSAPP_NUMBER = "6281228134747";

const ProductCard: React.FC<Props> = ({
  product,
  layout = "grid",
  from,
  category
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();

  // Ambil data dari variant pertama (index 0)
  const variant = product.variants?.[0] || {};
  
  const stock = Number(variant.stock ?? product.stock ?? 0);
  const normal = Number(variant.price_normal ?? product.price_normal ?? 0);
  const discountValue = Number(variant.price_discount ?? product.price_discount ?? 0); // Nominal potongan
  const skuSeller = variant.sku_seller ?? product.sku_seller;

  const isOutOfStock = stock === 0;
  const hasDiscount = discountValue > 0 && discountValue < normal;

  const productSlug = `${slugify(product.name)}--${product.id}`;
  const productLink = `${window.location.origin}/products/${productSlug}`;
  const message = `Hai, saya ingin bertanya mengenai produk berikut:\n\nNama Produk: ${product.name}\nLink Produk: ${productLink}\n\nTerima kasih.`;
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  // Hitung persentase dari nominal potongan diskon secara akurat
  const discountPercent = hasDiscount
    ? ((discountValue / normal) * 100).toFixed(0) 
    : "0";

  const finalPrice = hasDiscount ? normal - discountValue : normal;

  const thumb = product.images?.[0]?.thumbnail_url;
  const original = product.images?.[0]?.image_url;

  const imagePath =
    thumb?.startsWith("/uploads")
      ? thumb
      : original?.startsWith("/uploads")
      ? original
      : null;

  const imageSrc = imagePath
    ? imagePath.startsWith("http")
      ? imagePath
      : `${import.meta.env.VITE_API_BASE}${imagePath}`
    : "/icon-anandam.svg";

  const metaItems: {
    label: string;
    onClick: () => void;
  }[] = [];

  if (product.brand?.id && product.brand?.name) {
    metaItems.push({
      label: product.brand.name,
      onClick: () => navigate(`/products?brand=${product.brand!.id}`),
    });
  }

  if (product.category?.name) {
    metaItems.push({
      label: product.category.name,
      onClick: () =>
        navigate(`/product-categories?category=${encodeURIComponent(product.category!.name)}`),
    });
  }

  return (
    <div
      onClick={() =>
        navigate(`/products/${productSlug}`, {
          state: { from, category: product.category?.name },
        })
      }
      className={`
        group relative
        rounded-xl
        bg-white
        border border-gray-250
        cursor-pointer
        transition-all duration-300
        hover:shadow-[0_8px_24px_rgba(149,157,165,0.12)]
        hover:border-blue-100
        overflow-hidden
        ${layout === "grid" ? "flex flex-col h-full" : "flex flex-row gap-3 p-3 items-start"}
      `}
    >
      {/* ================= 1. IMAGE CONTAINER ================= */}
      <div
        className={`
          relative overflow-hidden bg-whiteflex-shrink-0
          ${layout === "grid" ? "w-full aspect-square" : "w-20 h-20 sm:w-24 sm:h-24 rounded-lg"}
        `}
      >
        {hasDiscount && !isOutOfStock && (
          <div className="absolute top-1.5 left-1.5 z-10 bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-sm tracking-wide">
            {discountPercent}% OFF
          </div>
        )}

        {!imageLoaded && <div className="absolute inset-0 animate-pulse bg-white" />}
        <img
          src={imageSrc}
          alt={product.name}
          onLoad={() => setImageLoaded(true)}
          draggable={false}
          className={`
            w-full h-full object-contain p-2
            transition-transform duration-500 ease-out transform-gpu
            ${imageLoaded ? "opacity-100" : "opacity-0"}
            ${!isOutOfStock ? "group-hover:scale-105" : ""}
            ${isOutOfStock ? "opacity-30 grayscale" : ""}
          `}
          onError={(e) => {
            const filename = product.images?.[0]?.thumbnail_url?.split("/").pop();
            if (filename && !e.currentTarget.src.includes("original")) {
              e.currentTarget.src = `${import.meta.env.VITE_API_BASE}/uploads/products/original/${filename}`;
              return;
            }
            e.currentTarget.src = "/icon-anandam.svg";
            setImageLoaded(true);
          }}
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-gray-100/40 backdrop-blur-[1px] flex items-center justify-center">
             <span className="bg-gray-900/80 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm">Habis</span>
          </div>
        )}
      </div>

      {/* ================= 2. CONTENT AREA ================= */}
      <div
        className={`
          flex flex-col flex-1 justify-between p-2.5 sm:p-3
          ${layout === "grid" ? "" : "pt-0 pl-0"}
        `}
      >
        <div className="flex flex-col gap-1.5">
          
          {/* META BRAND / CATEGORY */}
          <div className="text-[10px] sm:text-[11px] font-medium text-gray-400 leading-tight flex items-center overflow-hidden whitespace-nowrap">
            {metaItems.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span className="mx-1 text-gray-300 flex-shrink-0">|</span>}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    item.onClick();
                  }}
                  className={`hover:text-blue-600 transition ${index === metaItems.length - 1 ? "truncate min-w-0 flex-1" : "flex-shrink-0"}`}
                >
                  {item.label}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* NAMA PRODUK */}
          <h3
            className={`font-semibold text-gray-800 tracking-tight leading-snug group-hover:text-blue-600 transition-colors ${
              layout === "grid"
                ? "text-[11px] sm:text-[12px] md:text-[13px] line-clamp-2 min-h-[34px] sm:min-h-[38px]"
                : "text-[13px] md:text-base line-clamp-2"
            }`}
          >
            {product.name}
          </h3>

          {layout === "list" && skuSeller && (
            <span className="text-[11px] text-gray-400 font-mono">SKU: {skuSeller}</span>
          )}
        </div>

        {/* ================= 3. PRICE & ACTIONS WRAPPER ================= */}
        <div className="flex items-center justify-between mt-3 pt-1 border-t border-gray-50">
          <div className="flex flex-col min-w-0 flex-1 pr-1">
            
            {/* HARGA CORET */}
            {hasDiscount ? (
              <span className="text-[10px] sm:text-[11px] text-gray-400 line-through leading-none mb-0.5 truncate">
                Rp {normal.toLocaleString("id-ID")}
              </span>
            ) : (
              <span className="text-[10px] sm:text-[11px] opacity-0 leading-none mb-0.5 select-none pointer-events-none">-</span>
            )}

            {/* HARGA FINAL (Menggunakan ukuran proporsional yang Anda minta) */}
            <p className={`font-bold text-blue-600 tracking-tight leading-none ${
              layout === "grid" 
                ? "text-[11px] sm:text-[12px] md:text-base" 
                : "text-[12px] md:text-lg"
            }`}>
              Rp {finalPrice.toLocaleString("id-ID")}
            </p>
          </div>

          {/* WHATSAPP ACTION BUTTON */}
          {/* <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="bg-green-500 hover:bg-green-600 text-white p-1.5 sm:p-2 rounded-lg transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md hover:scale-105 active:scale-95 flex-shrink-0"
          >
            <FaWhatsapp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </a> */}
        </div>

      </div>
    </div>
  );
};

export default ProductCard;