import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Package, Loader2 } from 'lucide-react';

interface ProductSearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (productId: string, productName: string) => void;
}

interface SearchResult {
  id: string;
  name: string;
  final_price?: number;
  images?: { thumbnail_url?: string; image_url?: string }[];
  variants?: { price_normal: number; price_discount: number }[];
}

const ProductSearchPanel: React.FC<ProductSearchPanelProps> = ({ isOpen, onClose, onSelectProduct }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!isOpen) {
      setSearchQuery('');
      setResults([]);
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const isAdmin = window.location.pathname.startsWith('/ayamgoreng');
      const baseUrl = import.meta.env.VITE_API_BASE;
      const endpoint = isAdmin
        ? `${baseUrl}/api/v1/admin/products?search=${encodeURIComponent(query)}&limit=10`
        : `${baseUrl}/api/v1/products?search=${encodeURIComponent(query)}&limit=10`;

      const token = isAdmin
        ? localStorage.getItem('token')
        : localStorage.getItem('user_token');

      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to search');

      const data = await res.json();
      setResults(data.data || []);
      setSelectedIndex(-1);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      searchProducts(value);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
      e.preventDefault();
      const product = results[selectedIndex];
      onSelectProduct(product.id, product.name);
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const getProductPrice = (product: SearchResult): number => {
    if (product.final_price) return product.final_price;
    const variant = product.variants?.[0];
    if (variant) {
      return Number(variant.price_normal || 0) - Number(variant.price_discount || 0);
    }
    return 0;
  };

  const getProductImage = (product: SearchResult): string => {
    const thumb = product.images?.[0]?.thumbnail_url;
    const original = product.images?.[0]?.image_url;
    const imagePath = thumb?.startsWith('/uploads') ? thumb : original?.startsWith('/uploads') ? original : null;
    if (imagePath) {
      return imagePath.startsWith('http') ? imagePath : `${import.meta.env.VITE_API_BASE}${imagePath}`;
    }
    return '/icon-anandam.svg';
  };

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 mx-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden max-h-[400px] flex flex-col">
        {/* Search Header */}
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              placeholder="Cari produk untuk dilampirkan..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
            />
            {isLoading ? (
              <Loader2 size={16} className="text-blue-500 animate-spin shrink-0" />
            ) : searchQuery ? (
              <button onClick={() => { setSearchQuery(''); setResults([]); }} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            ) : null}
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto">
          {results.length === 0 && searchQuery && !isLoading && (
            <div className="p-6 text-center text-gray-400 text-sm">
              <Package size={32} className="mx-auto mb-2 opacity-50" />
              Produk tidak ditemukan
            </div>
          )}

          {results.length === 0 && !searchQuery && !isLoading && (
            <div className="p-6 text-center text-gray-400 text-sm">
              <Package size={32} className="mx-auto mb-2 opacity-50" />
              Ketik nama produk untuk mencari
            </div>
          )}

          {results.map((product, index) => (
            <button
              key={product.id}
              onClick={() => {
                onSelectProduct(product.id, product.name);
                onClose();
              }}
              className={`w-full flex items-center gap-3 p-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-50 last:border-b-0 ${
                index === selectedIndex ? 'bg-blue-50 ring-2 ring-blue-200 ring-inset' : ''
              }`}
            >
              <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                <img
                  src={getProductImage(product)}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/icon-anandam.svg'; }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">
                  {product.name}
                </p>
                <p className="text-xs font-semibold text-red-500 mt-1">
                  Rp{getProductPrice(product).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="text-xs text-blue-600 font-medium shrink-0 bg-blue-50 px-2 py-1 rounded">
                Lampirkan
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductSearchPanel;