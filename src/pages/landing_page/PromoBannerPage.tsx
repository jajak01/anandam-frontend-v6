import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProducts } from "../../services/productService";
import { getBanners } from "../../services/bannerService"; 
import { getBrands } from "../../services/brandService"; 
import { getCategories } from "../../services/adminCategoryService"; 
import ProductCard from "../../components/ProductCard";
import ProductCardSkeleton from "../../components/ProductCardSkeleton"; 
import LoadMoreButton from "../../components/LoadMoreButton";
import Breadcrumb from "../../components/Breadcrumb";

export default function PromoBannerPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [products, setProducts] = useState<any[]>([]);
    const [banner, setBanner] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const [loadingBanner, setLoadingBanner] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    const [brandIds, setBrandIds] = useState<string>("");
    const [categoryIds, setCategoryIds] = useState<string>("");
    const [isMasterLoaded, setIsMasterLoaded] = useState(false);

    const scrollPositionRef = useRef(0);
    const shouldRestoreScroll = useRef(false);

    const getImageUrl = (url?: string) => {
        if (!url) return "";
        if (url.startsWith("http")) return url;
        return `${import.meta.env.VITE_API_BASE}${url}`;
    };

    const handleLoadMore = useCallback(() => {
        scrollPositionRef.current = window.scrollY;
        shouldRestoreScroll.current = true;
        setCurrentPage((prev) => prev + 1);
    }, []);

    useEffect(() => {
        if (!shouldRestoreScroll.current) return;
        window.scrollTo({ top: scrollPositionRef.current });
        shouldRestoreScroll.current = false;
    }, [products]);

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                setLoadingBanner(true);
                
                // 1. Ambil semua banners
                const bannerRes = await getBanners();

                // 2. Cari banner yang ID-nya sama dengan params URL
                const currentBanner = bannerRes?.find(
                    (b: any) => String(b.id) === String(id) || b.slug === id
                );

                if (currentBanner) {
                    setBanner(currentBanner);

                    // Tidak perlu list carousel, kita hanya butuh 1 banner yang diklik
                    // 4. AMBIL LANGSUNG DARI OBJEK BANNER
                    const bIds = currentBanner.brands?.map((b: any) => b.id).join(",");
                    const cIds = currentBanner.categories?.map((c: any) => c.id).join(",");

                    setBrandIds(bIds || "");
                    setCategoryIds(cIds || "");
                } else {
                    setError("Promo tidak ditemukan.");
                }

                setIsMasterLoaded(true);
            } catch (err) {
                console.error("Gagal fetch master data", err);
                setError("Gagal memuat halaman promo.");
            } finally {
                setLoadingBanner(false);
            }
        };

        if (id) fetchMasterData();
    }, [id]);



    useEffect(() => {
        const fetchPromoProducts = async () => {
            if (!isMasterLoaded) return;

            try {
                setLoadingProducts(true);
                setError(null);

                const params: any = { 
                    limit: 12,
                    page: currentPage
                };
                
                if (id !== "special") params.promo_id = id;
                if (brandIds) params.brand = brandIds;
                if (categoryIds) params.category_ids = categoryIds;

                const productRes = await getProducts(params);
                const newProducts = productRes.data || [];

                if (currentPage === 1) {
                    setProducts(newProducts);
                } else {
                    setProducts((prev) => [...prev, ...newProducts]);
                }

                setTotalPages(productRes.last_page || 1);
            } catch (err) {
                console.error("Gagal fetch data promo", err);
                setError("Gagal memuat data produk. Coba lagi nanti ya.");
            } finally {
                setLoadingProducts(false);
            }
        };

        fetchPromoProducts();
    }, [currentPage, isMasterLoaded, brandIds, categoryIds, id]);

    const isHero = banner?.slot === 'hero';
    const widthClass = isHero ? 'max-w-4xl mx-auto' : 'w-full';

    return (
        <div className="w-full min-h-screen bg-white pb-20">
            <div className="max-w-7xl w-full mx-auto pt-4 flex items-center px-4 sm:px-6 lg:px-8">
                <Breadcrumb
                    items={[
                        { label: "Home", path: "/" },
                        { label: banner?.promo || "Promo" },
                    ]}
                />
            </div>

            {/* BANNER SECTION */}
            <section className="w-full bg-white pt-4 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    {loadingBanner ? (
                        // Skeleton sementara saat loading (pakai rasio standar agar tidak kolaps)
                        <div className={`${widthClass} aspect-[4/1] bg-gray-200 animate-pulse rounded-xl`} />
                    ) : banner ? (
                        // Container tidak lagi dikunci rasionya
                        <div className={`relative overflow-hidden rounded-xl shadow-sm ${widthClass} flex justify-center bg-gray-50`}>
                            <img
                                src={getImageUrl(banner.image_url)}
                                alt={banner.title || "Banner Promo"}
                                // KUNCI UTAMANYA DISINI: w-full dan h-auto 
                                className="w-full h-auto block object-contain pointer-events-none select-none"
                                draggable={false}
                            />
                        </div>
                    ) : null}
                </div>
            </section>

            {/* PRODUCT SECTION */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-8 sm:pb-12">
                {/* <div className="mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                        {banner?.promo || "Produk Pilihan Promo"}
                    </h2>
                    <p className="text-gray-500 text-sm">
                        Temukan barang impianmu dengan harga terbaik.
                    </p>
                </div> */}

                {error ? (
                    <div className="w-full py-16 flex flex-col items-center justify-center text-gray-500">
                        <p className="text-lg font-medium text-gray-700">{error}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Muat Ulang Halaman
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}

                            {/* Skeleton muncul di bagian bawah saat load more */}
                            {loadingProducts && Array.from({ length: 12 }).map((_, i) => (
                                <ProductCardSkeleton key={`skeleton-${i}`} />
                            ))}
                        </div>
                        
                        {/* Empty State kalau benar-benar kosong di page 1 */}
                        {!loadingProducts && products.length === 0 && (
                            <div className="w-full py-20 flex flex-col items-center justify-center text-center bg-white rounded-xl border border-gray-100 shadow-sm mt-4">
                                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <span className="text-4xl">🛒</span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Produk tidak ditemukan</h3>
                                <p className="text-gray-500 max-w-sm mb-6 text-sm">
                                    Promo ini belum memiliki produk dengan kriteria tersebut.
                                </p>
                                <button 
                                    onClick={() => navigate('/products')}
                                    className="px-6 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800"
                                >
                                    Ke Katalog Produk
                                </button>
                            </div>
                        )}

                        {/* Tombol Load More */}
                        {products.length > 0 && (
                            <LoadMoreButton
                                loading={loadingProducts}
                                hasMore={currentPage < totalPages}
                                onLoadMore={handleLoadMore}
                            />
                        )}
                    </>
                )}
            </section>
        </div>
    );
}