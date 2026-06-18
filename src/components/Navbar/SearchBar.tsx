import { useEffect, useState, useRef } from "react";
import { Search, Layers } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

import type { Product } from "../../types/product";
import { getProducts } from "../../services/productService";
import { getCategories } from "../../services/adminCategoryService";
import { slugify } from "../../utils/slugify";

interface Category {
  id: string;
  name: string;
  code: string;
  parent_id: string | null;
}

interface Props {
  className?: string;
  dropdownWidth?: string;
}

export default function SearchBar({
  className = "",
  dropdownWidth = "w-full",
}: Props) {

  const navigate = useNavigate();
  const location = useLocation();

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  const [loadingSearch, setLoadingSearch] = useState(false);

  const cache = useRef<Record<string, Product[]>>({});

  const shortenName = (name: string) => {
    const words = name.split(" ");
    const take = Math.random() > 0.5 ? 2 : 3;
    return words.slice(0, take).join(" ");
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  const getProductImage = (product: Product) => {
    const imagePath =
      product.images?.[0]?.thumbnail_url ||
      product.thumbnail_url ||
      product.images?.[0]?.image_url;

    if (!imagePath) return "/icon-anandam.svg";

    return imagePath.startsWith("http")
      ? imagePath
      : `${import.meta.env.VITE_API_BASE}${imagePath}`;
  };

  useEffect(() => {
    if (!search.trim() || search.length < 2) {
      setResults([]);
      setSuggestions([]);
      setCategorySuggestions([]);
      setShowDropdown(false);
      return;
    }

    setShowDropdown(true);
    setLoadingSearch(true);

    const delay = setTimeout(async () => {

      if (cache.current[search]) {
        setResults(cache.current[search]);
        setFeaturedProducts(shuffleArray(cache.current[search]).slice(0,10));
        setShowDropdown(true);
        setLoadingSearch(false);
        return;
      }

      try {

        const res = await getProducts({
          search,
          page: 1,
          limit: 10,
        });

        const products: Product[] = res.data;

        cache.current[search] = products;

        setResults(products);
        setFeaturedProducts(shuffleArray(products).slice(0,10));

        const normalizedSearch = search.trim().toLowerCase();

        const nameSuggestions = Array.from(
          new Set(shuffleArray(products).map((p) => shortenName(p.name)))
        )
          .filter((name) => name.toLowerCase() !== normalizedSearch)
          .slice(0, 5);

        setSuggestions(nameSuggestions);

        const uniqueCategories = Array.from(
          new Map(
            products
              .filter((p) => p.category)
              .map((p) => [p.category!.id, p.category])
          ).values()
        ) as Category[];

        setCategorySuggestions(uniqueCategories);

      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSearch(false);
      }

    }, 150);

    return () => clearTimeout(delay);

  }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!search.trim()) return;

    const currentPath = location.pathname;
    navigate(`/search?query=${encodeURIComponent(search)}`);
  };

  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    if (showDropdown) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showDropdown]);

  return (
    <form onSubmit={handleSearch} className={`relative ${className}`}>

      {/* INPUT CONTAINER */}
      <div className="relative w-full flex items-center h-10 border border-[#CBD5E1] rounded-button focus-within:border-color-primary bg-white overflow-hidden transition-colors">
        <input
          type="text"
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => search && setShowDropdown(true)}
          onBlur={() => {
            setTimeout(() => {
              if (!isInteracting) {
                setShowDropdown(false);
              }
            }, 150);
          }}
          className="
            flex-grow
            h-full
            pl-4 pr-14
            text-sm
            bg-transparent
            outline-none
            border-none
          "
        />

        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setShowDropdown(false);
            }}
            className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
          >
            ✕
          </button>
        )}

        <button
          type="submit"
          className="absolute right-0 top-0 bottom-0 w-12 h-full flex items-center justify-center bg-color-primary text-white hover:bg-color-primary-dark transition-colors"
          aria-label="Cari"
        >
          <Search size={18} />
        </button>
      </div>

      {/* DROPDOWN */}
      {showDropdown && (
        <div
          onMouseEnter={() => setIsInteracting(true)}
          onMouseLeave={() => setIsInteracting(false)}
          onTouchStart={() => setIsInteracting(true)}
          onTouchEnd={() => setIsInteracting(false)}
          className={`absolute top-full left-0 ${dropdownWidth} bg-white border border-gray-200 rounded-lg shadow-xl mt-2 z-[999] max-h-[500px] md:max-h-[500px] max-md:max-h-[calc(100dvh-140px)] overflow-y-auto overscroll-contain touch-pan-y`}
        >

          {/* HEADER */}
          <div className="px-4 py-3 border-b bg-gray-50">
            <div className="text-sm font-medium text-gray-700">
              Hasil pencarian untuk "{search}"
            </div>

            <div className="text-xs text-gray-500">
              {results.length} produk ditemukan
            </div>
          </div>

          {/* SUGGESTION */}
          {suggestions.length > 0 && (
            <div className="border-b">
              {suggestions.map((item, index) => (
                <div
                  key={index}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSearch(item);
                  }}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                >
                  <Search size={14} className="text-gray-400" />
                  {item}
                </div>
              ))}
            </div>
          )}

          {/* CATEGORY */}
          {categorySuggestions.length > 0 && (
            <div className="border-b">

              <div className="px-4 py-2 text-xs font-semibold text-gray-500">
                Category
              </div>

              <div className="grid grid-cols-2 gap-3 px-4 pb-3">

                {categorySuggestions.map((cat) => (

                  <div
                    key={cat.id}
                    onClick={() =>
                      navigate(`/product-categories?category=${cat.name}`)
                    }
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer text-sm"
                  >
                    <Layers size={16} className="text-gray-400" />
                    {cat.name}
                  </div>

                ))}

              </div>

            </div>
          )}

          {/* PRODUCT */}
          {featuredProducts.map((item) => {
            const variant = item.variants?.[0] || {};
            
            const priceNormal = Number(variant.price_normal ?? item.price_normal ?? 0);
            const priceDiscount = Number(variant.price_discount ?? item.price_discount ?? 0);
            const finalPrice = priceNormal - priceDiscount;

            return (
              <div
                key={item.id}
                onClick={() => {
                  navigate(`/products/${slugify(item.name)}--${item.id}`);
                  setShowDropdown(false);
                }}
                className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 cursor-pointer"
              >
                <img
                  src={getProductImage(item)}
                  className="w-14 h-14 object-contain bg-white border rounded"
                  alt={item.name}
                />

                <div className="flex flex-col flex-1 text-sm">
                  <span className="font-medium text-gray-800 line-clamp-1">
                    {item.name}
                  </span>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-primary font-bold text-sm">
                      Rp {finalPrice.toLocaleString("id-ID")}
                    </span>
                    
                    {/* OPSI: Tambah harga coret biar makin keren dropdown-nya */}
                    {priceDiscount > 0 && (
                      <span className="text-[10px] text-gray-400 line-through">
                        Rp {priceNormal.toLocaleString("id-ID")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

        </div>
      )}

    </form>
  );
}