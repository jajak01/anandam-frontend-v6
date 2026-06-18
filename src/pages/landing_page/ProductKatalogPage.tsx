import { useEffect, useState } from "react";
import { getProducts } from "../../services/productService";
import { getCategories } from "../../services/adminCategoryService";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import ProductCard from "../../components/ProductCard";
import type { Product } from "../../types/product";
import InfiniteScrollTrigger from "../../components/InfiniteScrollTrigger";
import type { Grouping } from "../../components/FilteringSidebarKatalog";
import { getGroupings } from "../../services/groupingService";

import FilteringSidebarKatalog from "../../components/FilteringSidebarKatalog";
import HeaderProduct from "../../components/HeaderProduct";
import type { Category } from "../../types/category";
import Breadcrumb from "../../components/Breadcrumb";
import ProductCardSkeleton from "../../components/ProductCardSkeleton";
import { getBrands } from "../../services/brandService";

export default function ProductKatalogPage() {
    interface Brand {
        id: string;
        name: string;
        image?: string;
    }

    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get("search");
    
    // 1. Tangkap parameter dari URL
    const brandParam = searchParams.get("brand");
    const socketParam = searchParams.get("socket");
    const ramTypeParam = searchParams.get("ram_type");

    const [brands, setBrands] = useState<Brand[]>([]);
    const fetchBrands = async () => {
        const data = await getBrands();
        setBrands(data);
    };

    const [totalProducts, setTotalProducts] = useState(0);
    const [layout, setLayout] = useState<"grid" | "list">("grid");
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchCategory, setSearchCategory] = useState("");
    
    // 2. Inisialisasi state filter dari URL (jika ada)
    const [selectedBrand, setSelectedBrand] = useState<string[]>(
        brandParam ? brandParam.split(",") : []
    );
    const [selectedSockets, setSelectedSockets] = useState<string[]>(
        socketParam ? socketParam.split(",") : []
    );
    const [selectedRamTypes, setSelectedRamTypes] = useState<string[]>(
        ramTypeParam ? ramTypeParam.split(",") : []
    );

    // State untuk opsi yang tersedia (diambil dari backend nanti)
    const [availableSockets, setAvailableSockets] = useState<string[]>([]);
    const [availableRamTypes, setAvailableRamTypes] = useState<string[]>([]);

    const resetProducts = () => {
        setProducts([]);
        setPage(1);
        setHasMore(true);
        // Reset filter hardware tambahan
        // setSelectedSockets([]);
        // setSelectedRamTypes([]);
    };
    
    const [searchBrand, setSearchBrand] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [activeSearch, setActiveSearch] = useState<string | null>(null);
    const [sort, setSort] = useState<string>(searchParams.get("sort") || "newest");

    const MIN = 0;
    const MAX = 10000000; 

    const [minPrice, setMinPrice] = useState<number>(MIN);
    const [maxPrice, setMaxPrice] = useState<number>(MAX);

    const STEP = 100000;

    const isPriceFiltered = minPrice !== MIN || maxPrice !== MAX;

    const location = useLocation();

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
        fetchGroupings();
        fetchBrands();
        fetchHardwareTypes(); // Panggil fetch hardware
    }, []);

    const parentParam = searchParams.get("parent");
    const categoryParam = searchParams.get("category");
    const categoryIdsParam = searchParams.get("category_ids");

    const fetchGroupings = async () => {
        const data = await getGroupings();
        setGroupings(data);
    };
    
    useEffect(() => {
        const isRefresh = location.key === "default";
        
        if (isRefresh && searchParams.get("category")) {
            setSearchParams({}, { replace: true });
        }
    }, []);

    const [groupings, setGroupings] = useState<Grouping[]>([]);
    const groupingParam = searchParams.get("grouping");
    
    useEffect(() => {
        fetchProducts();
    }, [
        page,
        groupingParam,
        categoryIdsParam,
        selectedBrand,
        selectedSockets,   // Masukkan dependency
        selectedRamTypes,  // Masukkan dependency
        activeSearch,
        sort,
        minPrice,
        maxPrice
    ]);

    useEffect(() => {
        if (searchQuery !== null) {
            setActiveSearch(searchQuery);
            setProducts([]);
            setPage(1);
            setHasMore(true);
            setSearchParams({}, { replace: true });
        }
    }, [searchQuery]);

    useEffect(() => {
        setProducts([]);
        setPage(1);
        setHasMore(true);
    }, [groupingParam, categoryIdsParam, selectedBrand, selectedSockets, selectedRamTypes, minPrice, maxPrice, sort]); // Update reset trigger

    const fetchCategories = async () => {
        const data = await getCategories();
        setCategories(data);
    };

    const fetchProducts = async () => {
        setLoading(true);

        const params: any = {
            page,
            limit: 20,
        };

        const categoryIdsFromGrouping = getCategoryIdsFromGrouping();

        if (groupingParam) {
            if (categoryIdsFromGrouping.length === 0) {
                setProducts([]);
                setTotalProducts(0);
                setHasMore(false);
                setLoading(false);
                return;
            }
            params.category_ids = categoryIdsFromGrouping.join(",");
        }

        if (categoryParam && !groupingParam) {
            params.category = categoryParam;
        }

        if (parentParam) params.parent = parentParam;
        if (selectedBrand.length > 0) params.brand = selectedBrand.join(",");
        
        // Tambahkan payload filter hardware
        if (selectedSockets.length > 0) params.socket_type = selectedSockets.join(",");
        if (selectedRamTypes.length > 0) params.ram_type = selectedRamTypes.join(",");

        if (activeSearch) params.search = activeSearch;
        if (sort) params.sort = sort;
        if (minPrice !== MIN) params.min_price = minPrice;
        if (maxPrice !== MAX) params.max_price = maxPrice;

        if (categoryIdsParam) {
            params.category_ids = categoryIdsParam;
        }
        else if (groupingParam) {
            const categoryIdsFromGrouping = getCategoryIdsFromGrouping();

            if (categoryIdsFromGrouping.length === 0) {
                setProducts([]);
                setTotalProducts(0);
                setHasMore(false);
                setLoading(false);
                return;
            }

            params.category_ids = categoryIdsFromGrouping.join(",");
        }
        else if (categoryParam) {
            params.category = categoryParam;
        }

        const res = await getProducts(params);

        setTotalProducts(res.total);

        if (page === 1) {
            setProducts(res.data);
        } else {
            setProducts(prev => [...prev, ...res.data]);
        }

        setHasMore(res.page < res.last_page);
        setLoading(false);
    };

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            setPage((prev) => prev + 1);
        }
    };

    const [showFilter, setShowFilter] = useState(false);
    const [openFilter, setOpenFilter] = useState(false);

    const getCategoryIdsFromGrouping = () => {
        if (!groupingParam || groupings.length === 0) return [];

        const grouping = groupings.find(
            (g) => g.name === groupingParam
        );

        return grouping?.children?.map((c: any) => c.id) || [];
    };

    const filterProps = {
        groupings,
        categories,
        categoryParam,
        categoryIdsParam,
        groupingParam,
        searchCategory,
        setSearchCategory,

        selectedBrand,
        setSelectedBrand,
        searchBrand,
        setSearchBrand,
        brands,

        // Hardware Filters Props
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
            <div className="max-w-7xl 2xl:max-w-screen-2xl w-full mx-auto h-14 flex items-center px-8 md:px-16">
                <Breadcrumb
                    items={[
                        { label: "Home", path: "/" },
                        { label: "Produk Katalog", path: "/products" },
                        ...(categoryParam
                        ? [
                            {
                                label: categoryParam,
                                path: `/categories?category=${categoryParam}`,
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
                    <FilteringSidebarKatalog {...filterProps} />
                </div>
                {/* ================= PRODUCT GRID ================= */}
                <div className="flex flex-col col-span-9">

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
                                const brandObj = brands.find(b => b.id === brandId);

                                return (
                                    <div
                                    key={brandId}
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
                                        className="text-gray-500 hover:text-red-500"
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
                            {(isPriceFiltered) && (
                                <div
                                className="
                                    flex items-center gap-2
                                    px-3 py-1 text-sm
                                    rounded-full
                                    bg-primary5
                                    border border-gray-300
                                    shadow-sm
                                    text-gray-700
                                    transition
                                "
                                >
                                <span>
                                    Rp {minPrice.toLocaleString("id-ID")} - Rp{" "}
                                    {maxPrice.toLocaleString("id-ID")}
                                </span>

                                <button
                                    onClick={() => {
                                        setMinPrice(MIN);
                                        setMaxPrice(MAX);
                                        setProducts([]);
                                        setPage(1);
                                        setHasMore(true);
                                    }}
                                    className="text-gray-500 hover:text-red-500 transition"
                                >
                                    ✕
                                </button>
                                </div>
                            )}
                        </div>

                    {loading && page === 1 ? (
                        <div
                            className={
                            layout === "grid"
                                ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4" // <--- Tambahkan di sini
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
                            Coba pilih brand atau kategori lain
                            </p>
                        </div>
                        ) : (
                        <div
                            className={
                            layout === "grid"
                                ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4" // <--- Tambahkan di sini
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

        {openFilter && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center lg:hidden">

                {/* overlay */}
                <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setOpenFilter(false)}
                />

                {/* modal */}
                <div className="
                relative
                w-[90%]
                max-w-md
                max-h-[85vh]
                bg-white
                rounded-2xl
                shadow-xl
                overflow-y-auto
                p-4
                ">

                {/* HEADER */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-lg">Filter</h2>

                    <button
                    onClick={() => setOpenFilter(false)}
                    className="text-gray-500 hover:text-black"
                    >
                    ✕
                    </button>
                </div>

                <FilteringSidebarKatalog {...filterProps} />

                </div>
            </div>
        )}

    </div>
  );
}