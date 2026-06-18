import { useEffect, useState } from "react";
import { getProducts } from "../../services/productService";
import { getCategories } from "../../services/adminCategoryService";
import { getBrands } from "../../services/brandService";
import { useParams, useSearchParams, useLocation } from "react-router-dom";

import ProductCard from "../../components/ProductCard";
import InfiniteScrollTrigger from "../../components/InfiniteScrollTrigger";
import FilteringSidebar from "../../components/FilteringSidebar";
import HeaderProduct from "../../components/HeaderProduct";
import Breadcrumb from "../../components/Breadcrumb";
import ProductCardSkeleton from "../../components/ProductCardSkeleton";

import type { Product } from "../../types/product";
import type { Category } from "../../types/category";

export default function CategoriesPage() {
  interface Brand {
    id: string;
    name: string;
    image?: string;
  }

  const { parent } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  
  // 1. Tangkap parameter hardware dari URL
  const brandParam = searchParams.get("brand");
  const socketParam = searchParams.get("socket");
  const ramTypeParam = searchParams.get("ram_type");
  
  const location = useLocation();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  // 2. Inisialisasi state filter dari URL
  const [selectedBrand, setSelectedBrand] = useState<string[]>(
    brandParam ? brandParam.split(",") : []
  );
  const [selectedSockets, setSelectedSockets] = useState<string[]>(
    socketParam ? socketParam.split(",") : []
  );
  const [selectedRamTypes, setSelectedRamTypes] = useState<string[]>(
    ramTypeParam ? ramTypeParam.split(",") : []
  );

  // State untuk opsi yang tersedia (diambil dari backend)
  const [availableSockets, setAvailableSockets] = useState<string[]>([]);
  const [availableRamTypes, setAvailableRamTypes] = useState<string[]>([]);

  const [searchBrand, setSearchBrand] = useState("");
  const [sort, setSort] = useState<string>("newest");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const MIN = 0;
  const MAX = 10000000;

  const [minPrice, setMinPrice] = useState(MIN);
  const [maxPrice, setMaxPrice] = useState(MAX);
  const STEP = 100000;

  const isPriceFiltered = minPrice !== MIN || maxPrice !== MAX;

  const [searchCategory, setSearchCategory] = useState("");

  // 3. Sinkronisasi state saat URL berubah (misal tombol Back ditekan)
  useEffect(() => {
    const currentBrandParam = searchParams.get("brand");
    if (currentBrandParam) {
      setSelectedBrand(currentBrandParam.split(","));
    } else if (!currentBrandParam && selectedBrand.length > 0) {
      setSelectedBrand([]);
    }

    const currentSocketParam = searchParams.get("socket");
    if (currentSocketParam) {
      setSelectedSockets(currentSocketParam.split(","));
    } else if (!currentSocketParam && selectedSockets.length > 0) {
      setSelectedSockets([]);
    }

    const currentRamParam = searchParams.get("ram_type");
    if (currentRamParam) {
      setSelectedRamTypes(currentRamParam.split(","));
    } else if (!currentRamParam && selectedRamTypes.length > 0) {
      setSelectedRamTypes([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Fetch opsi hardware (Ganti dengan endpoint API aslimu nanti)
  const fetchHardwareTypes = async () => {
    try {
      // Nanti ganti dengan API aslimu:
      // const res = await getHardwareTypes();
      // setAvailableSockets(res.sockets);
      // setAvailableRamTypes(res.rams);

      // Mock Data Sementara
      setAvailableSockets(["LGA 1700", "LGA 1200", "AM4", "AM5"]);
      setAvailableRamTypes(["DDR3", "DDR4", "DDR5"]);
    } catch (error) {
      console.error("Gagal memuat tipe hardware:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchBrands();
    fetchHardwareTypes(); // 🔥 Panggil saat mount
  }, []);

  useEffect(() => {
    const isRefresh = location.key === "default";
    if (isRefresh && searchParams.get("category")) {
      setSearchParams({}, { replace: true });
    }
  }, []);

  // Tambahkan dependency filter hardware
  useEffect(() => {
    fetchProducts();
  }, [page, parent, categoryParam, selectedBrand, selectedSockets, selectedRamTypes, sort, minPrice, maxPrice]);

  useEffect(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [parent, categoryParam, selectedBrand, selectedSockets, selectedRamTypes, sort, minPrice, maxPrice]);

  const resetProducts = () => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
  };

  const fetchCategories = async () => {
    const data = await getCategories();
    setCategories(data);
  };

  const fetchBrands = async () => {
    const data = await getBrands();
    setBrands(data);
  };

  const fetchProducts = async () => {
    setLoading(true);

    const params: any = {
      page,
      limit: 20,
      parent: parent,
    };

    if (categoryParam) params.category = categoryParam;
    if (selectedBrand.length > 0) params.brand = selectedBrand.join(",");
    
    // 🔥 Tambahkan payload filter hardware
    if (selectedSockets.length > 0) params.socket_type = selectedSockets.join(",");
    if (selectedRamTypes.length > 0) params.ram_type = selectedRamTypes.join(",");

    if (sort) params.sort = sort;
    if (minPrice !== MIN) params.min_price = minPrice;
    if (maxPrice !== MAX) params.max_price = maxPrice;

    const res = await getProducts(params);

    setTotalProducts(res.total);

    if (page === 1) {
      setProducts(res.data);
    } else {
      setProducts((prev) => [...prev, ...res.data]);
    }

    setHasMore(res.page < res.last_page);
    setLoading(false);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const parentName = categories.find((c) => c.code === parent)?.name || parent;

  const [openFilter, setOpenFilter] = useState(false);

  const filterProps = {
    showCategory: false, 
    categoryIdsParam: categoryParam,
    showGrouping: false, 
    categoryParam,
    
    searchCategory,
    setSearchCategory,
    
    selectedBrand,
    setSelectedBrand,
    searchBrand,
    setSearchBrand,
    brands, 

    // 🔥 Hardware Filters Props
    availableSockets,
    availableRamTypes,
    selectedSockets,
    setSelectedSockets,
    selectedRamTypes,
    setSelectedRamTypes,

    minPrice,
    maxPrice,
    setMinPrice,
    setMaxPrice,

    MIN,
    MAX,
    STEP,

    isPriceFiltered,
    resetProducts,
    setSearchParams,
  };

  return (
    <div>
      {/* ================= BREADCRUMB BAR ================= */}
      <div className="w-full bg-white">
        <div className="flex items-center h-14 px-8 md:px-16 max-w-7xl 2xl:max-w-screen-2xl mx-auto">
          <Breadcrumb
            items={[
              { label: "Home", path: "/" },
              { label: parentName ?? "Kategori" },
              ...(categoryParam
                ? [
                    {
                      label: categoryParam,
                      path: `/categories/${parent}?category=${categoryParam}`,
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className="px-8 md:px-16 pt-4 pb-8 mx-auto max-w-7xl 2xl:max-w-screen-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ================= SIDEBAR ================= */}
          <div className="hidden lg:block col-span-3">
            <FilteringSidebar {...filterProps} />
          </div>

          {/* ================= PRODUCT LIST ================= */}
          <div className="flex flex-col col-span-12 lg:col-span-9">
            <HeaderProduct
              layout={layout}
              setLayout={setLayout}
              sort={sort}
              setSort={setSort}
              totalProducts={totalProducts}
              page={page}
              onOpenFilter={() => setOpenFilter(true)}
            />

            {/* ACTIVE FILTER TAGS */}
            <div className="flex flex-wrap gap-2 mb-4">
              
              {/* BRAND TAGS */}
              {selectedBrand.map((brandId) => {
                const brandObj = brands.find((b) => b.id === brandId);

                return (
                  <div
                    key={`brand-${brandId}`}
                    className="flex items-center gap-2 px-3 py-1 text-sm rounded-full bg-primary5 border border-gray-300 shadow-sm text-gray-700"
                  >
                    <span>{brandObj?.name || brandId}</span>

                    <button
                      onClick={() => {
                        setSelectedBrand((prev) =>
                          prev.filter((b) => b !== brandId)
                        );
                        resetProducts();
                      }}
                      className="text-gray-500 hover:text-red-500 transition"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}

              {/* SOCKET TAGS */}
              {selectedSockets.map((sock) => (
                  <div key={`sock-${sock}`} className="flex items-center gap-2 px-3 py-1 text-sm rounded-full bg-blue-50 border border-blue-200 shadow-sm text-blue-700">
                      <span>{sock}</span>
                      <button
                          onClick={() => {
                              setSelectedSockets((prev) => prev.filter((s) => s !== sock));
                              resetProducts();
                          }}
                          className="text-blue-500 hover:text-red-500"
                      >✕</button>
                  </div>
              ))}

              {/* RAM TYPE TAGS */}
              {selectedRamTypes.map((ram) => (
                  <div key={`ram-${ram}`} className="flex items-center gap-2 px-3 py-1 text-sm rounded-full bg-blue-50 border border-blue-200 shadow-sm text-blue-700">
                      <span>{ram}</span>
                      <button
                          onClick={() => {
                              setSelectedRamTypes((prev) => prev.filter((r) => r !== ram));
                              resetProducts();
                          }}
                          className="text-blue-500 hover:text-red-500"
                      >✕</button>
                  </div>
              ))}

              {/* PRICE TAG */}
              {isPriceFiltered && (
                <div className="flex items-center gap-2 px-3 py-1 text-sm rounded-full bg-primary5 border border-gray-300 shadow-sm text-gray-700 transition">
                  <span>
                    Rp {minPrice.toLocaleString("id-ID")} - Rp{" "}
                    {maxPrice.toLocaleString("id-ID")}
                  </span>

                  <button
                    onClick={() => {
                      setMinPrice(MIN);
                      setMaxPrice(MAX);
                      resetProducts();
                    }}
                    className="text-gray-500 hover:text-red-500 transition"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* PRODUCT GRID / SKELETON */}
            {loading && page === 1 ? (
              <div
                className={
                  layout === "grid"
                    ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-6"
                    : "flex flex-col gap-4"
                }
              >
                {Array.from({ length: 20 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-lg font-semibold text-gray-600">
                  Produk tidak ditemukan
                </p>
                <p className="mt-2 text-sm text-gray-400">
                  Coba sesuaikan filter pencarianmu
                </p>
              </div>
            ) : (
              <div
                className={
                  layout === "grid"
                    ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-6"
                    : "flex flex-col gap-4"
                }
              >
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    layout={layout}
                  />
                ))}
              </div>
            )}

            {/* ================= INFINITE SCROLL ================= */}
            <InfiniteScrollTrigger
              loading={loading}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
            />
          </div>
        </div>
      </div>

      {/* ================= MOBILE FILTER MODAL ================= */}
      {openFilter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center lg:hidden">
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpenFilter(false)}
          />

          {/* modal */}
          <div className="relative w-[90%] max-w-md max-h-[85vh] bg-white rounded-2xl shadow-xl overflow-y-auto p-4">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Filter</h2>
              <button
                onClick={() => setOpenFilter(false)}
                className="text-gray-500 hover:text-black"
              >
                ✕
              </button>
            </div>

            <FilteringSidebar {...filterProps} />
          </div>
        </div>
      )}
    </div>
  );
}