import { useEffect, useState } from "react";
import { getProducts } from "../../services/productService";
import { LayoutGrid, LayoutList } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import ProductCard from "../../components/ProductCard";
import InfiniteScrollTrigger from "../../components/InfiniteScrollTrigger";
import HeaderProduct from "../../components/HeaderProduct";
import Breadcrumb from "../../components/Breadcrumb";
import ProductCardSkeleton from "../../components/ProductCardSkeleton";

import type { Product } from "../../types/product";

export default function SearchResultPage() {

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<string>("newest");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);

  const [searchParams] = useSearchParams();
  const query = searchParams.get("query");

  useEffect(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
  }, [query, sort]);

  useEffect(() => {
    fetchProducts();
  }, [page, query, sort]);

  const fetchProducts = async () => {
    if (!query) return;

    setLoading(true);

    const res = await getProducts({
      page,
      limit: 20,
      search: query,
      sort,
    });

    const newProducts = res.data;

    setTotalProducts(res.total);

    if (page === 1) {
      setProducts(newProducts);
    } else {
      setProducts(prev => [...prev, ...newProducts]);
    }

    setHasMore(res.page < res.last_page);
    setLoading(false);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div>

      {/* ================= BREADCRUMB ================= */}
      <div className="w-full bg-white">
        <div className="h-14 flex items-center px-8 md:px-16 max-w-7xl 2xl:max-w-screen-2xl mx-auto">
          <Breadcrumb
            items={[
              { label: "Home", path: "/" },
              { label: "Hasil Pencarian" },
              { label: query ? `"${query}"` : "-" },
            ]}
          />
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="px-8 md:px-16 pt-4 pb-8 mx-auto max-w-7xl 2xl:max-w-screen-2xl">

        {/* TITLE */}
        {query && (
          <h1 className="mb-4 text-xl md:text-2xl font-semibold text-gray-800">
            Hasil pencarian untuk "{query}"
          </h1>
        )}

        <HeaderProduct
          layout={layout}
          setLayout={setLayout}
          sort={sort}
          setSort={setSort}
          totalProducts={totalProducts}
          page={page}
        />

        {/* PRODUCT LIST */}
        {loading && page === 1 ? (
          <div className={
            layout === "grid"
              ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-6"
              : "flex flex-col gap-4"
          }>
            {Array.from({ length: 20 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>

        ) : products.length === 0 ? (

          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg font-semibold text-gray-600">
              Tidak ada hasil untuk "{query}"
            </p>
            <p className="mt-2 text-sm text-gray-400">
              Coba kata kunci lain
            </p>
          </div>

        ) : (

          <div className={
            layout === "grid"
              ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-6"
              : "flex flex-col gap-4"
          }>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                layout={layout}
              />
            ))}
          </div>

        )}

        <InfiniteScrollTrigger
          loading={loading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
        />

      </div>
    </div>
  );
}