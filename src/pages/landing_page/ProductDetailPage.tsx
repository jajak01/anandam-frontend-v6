import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProductById, getProductsByCategory, getProducts } from "../../services/productService";
import { FaWhatsapp, FaSearchPlus, FaBan, FaCheckCircle } from "react-icons/fa";
import { ChevronLeft, ChevronRight, Truck, ShieldCheck, ShoppingCart, X, Check, ShoppingBag, MessageSquare } from "lucide-react";
import ProductCard from "../../components/ProductCard";
import type { Product } from "../../types/product";
import Breadcrumb from "../../components/Breadcrumb";
import ProductCardSkeleton from "../../components/ProductCardSkeleton";
import { addToCart } from "../../services/cartService";
import { checkoutDirect } from "../../services/orderSevice"; 
import Swal from "sweetalert2";
import AuthModal from "../../components/Navbar/AuthModal";
import { Helmet } from "react-helmet-async";

export default function ProductDetailPage() {
  const [loadingRelated, setLoadingRelated] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();
  const realId = id?.split("--").pop() || id;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState<"description" | "review">("description");

  const [quantity, setQuantity] = useState(1);
  const [selectedVariasi, setSelectedVariasi] = useState<string>("");

  const WHATSAPP_NUMBER = "6281228134747";

  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [showModal, setShowModal] = useState(false);
  
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [pendingAction, setPendingAction] = useState<"cart" | "wa" | "chat" | null>(null);

  // --- STATE & REF UNTUK DRAG & ANIMASI SLIDER RELATED PRODUCTS ---
  const [isSwiping, setIsSwiping] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const dragDistance = useRef(0);

  // useEffect(() => {
  //   if (id) fetchProduct();
  // }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    setLoadingRelated(true);
    try {
      const data = await getProductById(realId!);
      setProduct(data);

      if (data.variants && data.variants.length > 0) {
        setSelectedVariasi(data.variants[0].variant_name); 
      }
      
      let related = [];
      if (data.category && data.category.name) {
        related = await getProductsByCategory(data.category.name);
      } else {
        const response = await getProducts(); 
        
        const allProducts = Array.isArray(response) ? response : (response.data || []);
        
        related = [...allProducts].sort(() => 0.5 - Math.random());
      }

      if (Array.isArray(related)) {
        const filtered = related.filter((p: Product) => p.id !== data.id).slice(0, 30);
        setRelatedProducts(filtered);
      }
    } catch (err) {
      console.error("Gagal mengambil data produk:", err);
    } finally {
      setLoading(false);
      setLoadingRelated(false);
    }
  };

  // 🔥 TAMBAHAN LOGIC SORTING: Mengelompokkan gambar variasi agar rapi
  const sortedImages = useMemo(() => {
    if (!product?.images) return [];

    // Bikin mapping urutan variasi (misal: Hitam = 0, Merah = 1)
    const variantOrderMap = new Map();
    if (product.variants) {
      product.variants.forEach((v: any, index: number) => {
        variantOrderMap.set(v.id, index);
      });
    }

    return [...product.images].sort((a: any, b: any) => {
      const isAGeneral = !a.variant_id;
      const isBGeneral = !b.variant_id;

      // 1. Gambar utama (tanpa variasi) prioritas paling atas
      if (isAGeneral && !isBGeneral) return -1;
      if (!isAGeneral && isBGeneral) return 1;
      
      // Jika keduanya gambar utama, pertahankan urutan aslinya
      if (isAGeneral && isBGeneral) return 0;

      // 2. Gambar dengan variasi diurutkan sesuai urutan variasi produk
      const indexA = variantOrderMap.has(a.variant_id) ? variantOrderMap.get(a.variant_id) : 999;
      const indexB = variantOrderMap.has(b.variant_id) ? variantOrderMap.get(b.variant_id) : 999;

      return indexA - indexB;
    });
  }, [product]);

  // --- FUNGSI CUSTOM SCROLL SMOOTH ---
  const animateScroll = (container: HTMLDivElement, targetPosition: number, duration: number) => {
    setIsAnimating(true);
    const startPosition = container.scrollLeft;
    const distance = targetPosition - startPosition;
    let startTime: number | null = null;

    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);

      container.scrollLeft = startPosition + distance * ease(progress);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animation);
  };

  const getScrollAmount = () => {
    if (!scrollRef.current) return 0;
    const firstCard = scrollRef.current.querySelector(".product-item") as HTMLElement;
    const gap = window.innerWidth >= 1024 ? 24 : 16; 
    return firstCard ? firstCard.offsetWidth + gap : 0;
  };

  const scrollLeftAction = () => {
    if (!scrollRef.current || isAnimating) return;
    const container = scrollRef.current;
    if (container.scrollLeft <= 5) {
      animateScroll(container, container.scrollWidth, 800);
    } else {
      animateScroll(container, container.scrollLeft - getScrollAmount(), 800);
    }
  };

  const scrollRightAction = () => {
    if (!scrollRef.current || isAnimating) return;
    const container = scrollRef.current;
    const isEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 5;
    if (isEnd) {
      animateScroll(container, 0, 800);
    } else {
      animateScroll(container, container.scrollLeft + getScrollAmount(), 800);
    }
  };

  // --- FUNGSI DRAG ---
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!scrollRef.current || isAnimating) return;
    isDragging.current = true;
    dragDistance.current = 0;

    const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
    startX.current = pageX;
    scrollLeftStart.current = scrollRef.current.scrollLeft;
  };

  const handleDragMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging.current || !scrollRef.current) return;
    
    const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
    const walk = (pageX - startX.current) * 1.5; 
    
    dragDistance.current = Math.abs(walk); 

    if (dragDistance.current > 5 && !isSwiping) {
      setIsSwiping(true);
    }

    scrollRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const handleDragEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (isSwiping && scrollRef.current) {
      const container = scrollRef.current;
      const scrollAmount = getScrollAmount();
      const currentScroll = container.scrollLeft;

      const targetIndex = Math.round(currentScroll / scrollAmount);
      let targetScroll = targetIndex * scrollAmount;

      const maxScroll = container.scrollWidth - container.clientWidth;
      if (targetScroll > maxScroll) targetScroll = maxScroll;
      if (targetScroll < 0) targetScroll = 0;

      animateScroll(container, targetScroll, 400); 
    }

    setIsSwiping(false);
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (dragDistance.current > 10) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (isHovered || isSwiping || isAnimating || relatedProducts.length === 0) return;
    const timer = setInterval(() => scrollRightAction(), 4000); 
    return () => clearInterval(timer);
  }, [isHovered, isSwiping, isAnimating, relatedProducts]);


  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [animateModal, setAnimateModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const lastFetchedId = useRef<string | null>(null);

  useEffect(() => {
    if (realId && lastFetchedId.current !== realId) {
      fetchProduct();
      lastFetchedId.current = realId; 
    }

  }, [realId]);

  useEffect(() => {
    if (showSuccessModal) {
      const t = setTimeout(() => setAnimateModal(true), 10);
      return () => clearTimeout(t);
    }
  }, [showSuccessModal]);

  const handleCloseSuccessModal = () => {
    setIsClosing(true); 
    setTimeout(() => {
      setShowSuccessModal(false);
      setIsClosing(false);
    }, 300);
  };

  const handleAddToCart = async () => {
    if (!product) return;

    const token = localStorage.getItem("user_token");
    if (!token) {
      setPendingAction("cart"); 
      setIsAuthModalOpen(true);
      return;
    }

    try {
      await addToCart({
        product_id: product.id,
        quantity,
        variasi: selectedVariasi || "Default",
      });
      setShowSuccessModal(true); 
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err?.response?.data?.message || "Gagal menambahkan ke keranjang",
      });
    }
  };

  const handleWaCheckout = async () => {
    if (!product) return;

    const token = localStorage.getItem("user_token");
    if (!token) {
      setPendingAction("wa"); 
      setIsAuthModalOpen(true);
      return;
    }

    const userDataString = localStorage.getItem("user_data");
    const userData = userDataString ? JSON.parse(userDataString) : null;

    const isPhoneMissing = !userData?.phone_number || userData.phone_number.trim() === "";
    const isAddressMissing = !userData?.address || userData.address.trim() === "";

    if (isPhoneMissing || isAddressMissing) {
      let title = "";
      let text = "";
      let targetPath = "";

      if (isPhoneMissing && isAddressMissing) {
        title = "Data Belum Lengkap!";
        text = "Harap lengkapi nomor WhatsApp dan alamat pengiriman Anda.";
        targetPath = "/user/account/profile";
      } else if (isPhoneMissing) {
        title = "Nomor WA Kosong!";
        text = "Harap lengkapi nomor WhatsApp Anda di halaman profil.";
        targetPath = "/user/account/profile";
      } else {
        title = "Alamat Belum Diisi!";
        text = "Harap lengkapi alamat pengiriman Anda untuk keperluan kurir.";
        targetPath = "/user/account/addresses";
      }

      Swal.fire({
        title: title,
        text: text,
        icon: 'warning',
        position: 'center', 
        showConfirmButton: true,
        confirmButtonText: 'Lengkapi Sekarang',
        confirmButtonColor: '#2563eb',
        showClass: { popup: 'animate__animated animate__slideInCenter' },
        hideClass: { popup: 'animate__animated animate__fadeOut' },
        toast: false, 
        timer: 6000,
        timerProgressBar: true,
      }).then((result) => {
        if (result.isConfirmed || result.dismiss === Swal.DismissReason.timer) {
          navigate(targetPath);
        }
      });
      return; 
    }

    try {
      const res = await checkoutDirect({
        product_id: product.id,
        quantity,
        variasi: activeVariant?.id || selectedVariasi || "Default",
      });

      const orderData = res.order || res.data?.order;
      const invoiceNumber = orderData?.invoice_number;

      if (!invoiceNumber) throw new Error("Nomor Invoice tidak ditemukan");

      const whatsappMessage = `Halo Kak,\n\nSaya ingin melanjutkan proses pembayaran untuk pesanan saya:\n🧾 *No. Invoice:* ${invoiceNumber}\n\nMohon dibantu cek untuk total tagihan beserta ongkos kirimnya ya. Terima kasih!`;
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

      window.open(whatsappUrl, "_blank", "noopener,noreferrer");

    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Gagal Checkout",
        text: err?.response?.data?.message || err.message || "Gagal memproses pesanan",
      });
    }
  };

  const handleAskProduct = () => {
    if (!product) return;
    const productLink = window.location.href;
    const message = `${productLink}\n\nHalo Admin, saya mau tanya seputar produk ini:\n *${product.name}*`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleAskProductWebsite = () => {
    if (!product) return;
    const token = localStorage.getItem("user_token") || localStorage.getItem("token");
    if (!token) {
      setPendingAction("chat"); 
      setIsAuthModalOpen(true);
      return;
    }
    // Buka widget chat secara instan
    window.dispatchEvent(new CustomEvent('openChatWithProduct', { 
      detail: { product_id: product.id, product_name: product.name } 
    }));
  };

  // --- LOGIC VARIASI ---
  const handleSelectVariant = (variant: any) => {
    setSelectedVariasi(variant.variant_name);
    setQuantity(1); // Reset qty supaya ga out of stock bug
    
    // Auto geser gambar ke gambar variasi yang bersangkutan (jika ada)
    if (sortedImages.length > 0) {
      const imgIdx = sortedImages.findIndex((img: any) => img.variant_id === variant.id);
      if (imgIdx !== -1) {
        setActiveImage(imgIdx);
      } else if (variant.images && variant.images.length > 0) {
        const fallbackIdx = sortedImages.findIndex((img: any) => img.image_url === variant.images[0].image_url);
        if (fallbackIdx !== -1) setActiveImage(fallbackIdx);
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-white animate-fadeIn">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4">
          <div className="w-48 h-5 rounded bg-gray-200 shimmer"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 lg:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-6 lg:gap-10">
            <div className="lg:col-span-7 order-1">
              <div className="flex flex-col-reverse lg:flex-row gap-4 lg:gap-6 lg:items-start">
                <div className="flex lg:flex-col gap-3 overflow-x-hidden w-full lg:w-24 flex-shrink-0 lg:h-[500px]">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-16 h-16 lg:w-20 lg:h-20 rounded-lg flex-shrink-0 bg-gray-200 shimmer"></div>
                  ))}
                </div>
                <div className="w-full max-w-lg aspect-square rounded-xl mx-auto bg-gray-200 shimmer"></div>
              </div>
            </div>

            <div className="lg:col-span-5 order-2 lg:row-span-2">
              <div className="lg:border lg:border-gray-200 lg:rounded-2xl lg:p-8 lg:shadow-sm bg-white py-2 lg:py-0 space-y-6">
                <div className="flex gap-2 mt-6 lg:mt-0">
                  <div className="w-20 h-6 rounded bg-gray-200 shimmer"></div>
                  <div className="w-24 h-6 rounded bg-gray-200 shimmer"></div>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-8 rounded bg-gray-200 shimmer"></div>
                  <div className="w-3/4 h-8 rounded bg-gray-200 shimmer"></div>
                </div>
                <div className="w-1/2 h-10 rounded bg-gray-200 shimmer mt-4"></div>
                <div className="space-y-3 pb-6 border-b border-gray-100">
                  <div className="w-40 h-4 rounded bg-gray-200 shimmer"></div>
                  <div className="w-56 h-4 rounded bg-gray-200 shimmer"></div>
                  <div className="w-48 h-4 rounded bg-gray-200 shimmer"></div>
                </div>
                <div className="space-y-3">
                  <div className="w-24 h-4 rounded bg-gray-200 shimmer"></div>
                  <div className="flex gap-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-20 h-10 rounded-lg bg-gray-200 shimmer"></div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 lg:gap-4 mt-6">
                  <div className="w-28 lg:w-32 h-12 rounded-lg bg-gray-200 shimmer"></div>
                  <div className="flex-1 h-12 rounded-lg bg-gray-200 shimmer"></div>
                </div>
                <div className="space-y-4 border-t border-gray-100 mt-6 pt-6">
                  <div className="w-full h-12 rounded bg-gray-200 shimmer"></div>
                  <div className="w-full h-12 rounded bg-gray-200 shimmer"></div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 order-3 lg:pt-8 mt-4 lg:mt-0">
              <div className="flex gap-6 border-b mb-6 pb-4">
                <div className="w-32 h-6 rounded bg-gray-200 shimmer"></div>
                <div className="w-24 h-6 rounded bg-gray-200 shimmer"></div>
              </div>
              <div className="space-y-3">
                <div className="w-full h-4 rounded bg-gray-200 shimmer"></div>
                <div className="w-full h-4 rounded bg-gray-200 shimmer"></div>
                <div className="w-5/6 h-4 rounded bg-gray-200 shimmer"></div>
                <div className="w-3/4 h-4 rounded bg-gray-200 shimmer"></div>
                <div className="w-4/5 h-4 rounded bg-gray-200 shimmer"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return <div className="p-10 text-center font-semibold text-gray-500">Product not found</div>;

  // --- CEK VARIASI AKTIF UNTUK CHECKOUT ---
  const activeVariant = product.variants?.find((v: any) => v.variant_name === selectedVariasi) || product.variants?.[0] || null;
  const showVariants = product.variants && product.variants.length > 0 && !(product.variants.length === 1 && product.variants[0].variant_name === "Default");

  // --- CEK VARIASI KHUSUS UNTUK GAMBAR YANG SEDANG AKTIF DI MODAL ---
  const currentImageVariant = product.variants?.find((v: any) => v.id === sortedImages[activeImage]?.variant_id);

  const normalPrice = Number(activeVariant?.price_normal ?? product.price_normal) || 0;
  const discountPrice = Number(activeVariant?.price_discount ?? product.price_discount) || 0;
  const stockValue = Number(activeVariant?.stock ?? product.stock) || 0;

  const finalPrice = discountPrice > 0 ? normalPrice - discountPrice : normalPrice;
  const isOutOfStock = stockValue === 0;

  const hasDiscount = discountPrice > 0;
  const discountPercent = hasDiscount
    ? ((discountPrice / normalPrice) * 100).toFixed(0)
    : "0";

  // SEO: Structured Data (JSON-LD)
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.images?.map((img) => 
      img.image_url?.startsWith("http") ? img.image_url : `${import.meta.env.VITE_API_BASE}${img.image_url}`
    ),
    "description": product.description || `Beli ${product.name} dengan harga terbaik di Anandam Computer.`,
    "sku": activeVariant?.sku_seller || product.sku_seller || product.id,
    "brand": {
      "@type": "Brand",
      "name": product.brand?.name || "Anandam Computer"
    },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "IDR",
      "price": finalPrice,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"
    }
  };

  return (
    <>
      <Helmet>
        <title>{`${product.name} - Anandam Computer`}</title>
        <meta name="description" content={product.description?.substring(0, 160) || `Beli ${product.name} dengan harga terbaik. Tersedia garansi resmi dan pengiriman cepat.`} />
        <link rel="canonical" href={window.location.href} />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content={`${product.name} - Anandam Computer`} />
        <meta property="og:description" content={product.description?.substring(0, 160)} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="product" />
        <meta property="og:image" content={product.images?.[0]?.image_url?.startsWith("http") ? product.images[0].image_url : `${import.meta.env.VITE_API_BASE}${product.images?.[0]?.image_url}`} />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <div className="max-w-7xl mx-auto bg-white">
        <div className="max-w-7xl px-4 lg:px-2 py-3 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <Breadcrumb
            items={[
              { label: "Home", path: "/" },
              { label: "Produk Katalog", path: "/products" },
              { label: product.name },
            ]}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 lg:py-6 animate-fadeIn">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-6 lg:gap-10">
          
          {/* ================= 1. SECTION GAMBAR ================= */}
          <div className="lg:col-span-7 order-1">
            <div className="flex flex-col-reverse lg:flex-row gap-4 lg:gap-6 lg:items-start">
              <div className="
                flex lg:flex-col gap-3 
                overflow-x-auto lg:overflow-y-auto 
                pb-2 lg:pb-0 
                scrollbar-hide 
                w-full lg:w-24 
                flex-shrink-0
                lg:h-[500px]   
                snap-x snap-mandatory
              ">
                {/* PAKAI sortedImages */}
                {sortedImages.map((img, index) => (
                  <img
                    key={img.id}
                    src={img.image_url?.startsWith("http") ? img.image_url : `${import.meta.env.VITE_API_BASE}${img.image_url}`}
                    onClick={() => setActiveImage(index)}
                    className={`w-16 h-16 object-cover rounded-md cursor-pointer transition-all duration-200
                      ${activeImage === index ? "opacity-100" : "opacity-50 hover:opacity-100"}`} // <-- Revisi border aktif dihapus
                    alt={`Thumbnail ${index + 1}`}
                  />
                ))}
              </div>

              {/* MAIN IMAGE */}
              <div
                className="w-full max-w-lg relative overflow-hidden rounded-md aspect-square mx-auto bg-[#f9f9f9] group lg:cursor-zoom-in"
                onMouseEnter={() => window.innerWidth >= 1024 && setIsZooming(true)}
                onMouseLeave={() => window.innerWidth >= 1024 && setIsZooming(false)}
                onMouseMove={(e) => {
                  if (window.innerWidth < 1024) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  setZoomPosition({
                    x: ((e.clientX - rect.left) / rect.width) * 100,
                    y: ((e.clientY - rect.top) / rect.height) * 100,
                  });
                }}
              >
                {/* --- TAG % OFF --- */}
                {hasDiscount && !isOutOfStock && (
                  <div className="absolute top-4 right-4 z-10 bg-red-500 text-white text-xs lg:text-sm font-bold px-3 py-1.5 rounded-lg shadow-sm tracking-wider uppercase pointer-events-none">
                    {discountPercent}% OFF
                  </div>
                )}
                {/* ----------------- */}

                <img
                  src={sortedImages[activeImage]?.image_url?.startsWith("http") 
                    ? sortedImages[activeImage]?.image_url 
                    : `${import.meta.env.VITE_API_BASE}${sortedImages[activeImage]?.image_url}`}
                  alt={product.name}
                  className="w-full h-full object-contain transition-transform duration-200"
                  style={{
                    transform: isZooming ? "scale(2)" : "scale(1)",
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  }}
                />
                <button onClick={() => setShowModal(true)} className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition hidden lg:block text-primary">
                  <FaSearchPlus size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* ================= 2. SECTION INFO PRODUK ================= */}
          <div className="lg:col-span-5 order-2 lg:row-span-2">
            <div className="lg:sticky lg:top-36 bg-white py-2 lg:p-5 lg:border lg:border-gray-200 lg:rounded-md">
              
              {/* BADGES & CATEGORY */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {product.category?.name && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded-md">
                    {product.category.name}
                  </span>
                )}
                {product.brand?.name && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-full">
                    {product.brand.name}
                  </span>
                )}
                {/* Stock Status Badge */}
                {isOutOfStock ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold uppercase rounded-full border border-red-100">
                    <FaBan size={10} /> Stok Habis
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold uppercase rounded-full border border-green-100">
                    <FaCheckCircle size={10} /> Tersedia
                  </span>
                )}
              </div>

              {/* TITLE & PRICE SECTION */}
              <div className="space-y-2 mb-6">
                <h1 className="text-xl lg:text-xl font-bold text-gray-900">
                  {product.name}
                </h1>
                
                <div className="flex flex-col gap-1">
                  {discountPrice > 0 ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl lg:text-2xl font-bold text-primary">
                          Rp {finalPrice.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-sm lg:text-sm text-gray-400 line-through">
                        Rp {normalPrice.toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-2xl lg:text-2xl font-bold text-primary">
                      Rp {normalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* QUICK SPECS */}
              <div className="mb-5 space-y-2.5 text-xs lg:text-[13px]">
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-500">SKU</span>
                  <span className="font-medium text-gray-900">
                    {activeVariant?.sku_seller || product.sku_seller || "-"}
                  </span>
                </div>

                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-500">Garansi</span>
                  <span className="font-medium text-gray-900">
                    {product.warranty || "Garansi Toko"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Stok</span>
                  <span className={`font-semibold ${
                    stockValue < 5 ? "text-gray-900" : "text-gray-900"
                  }`}>
                    {stockValue > 20 ? "20+" : stockValue} Unit
                  </span>
                </div>
              </div>

              {/* VARIATIONS */}
              {showVariants && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2.5">
                    <p className="text-xs lg:text-[13px] font-bold text-gray-900">
                      Pilih {product.variant_type_name || "Variasi"}
                    </p>
                    {/* <p className="text-[10px] text-gray-400 italic">*Wajib dipilih</p> */}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v: any) => (
                      <button
                        key={v.id}
                        onClick={() => handleSelectVariant(v)}
                        className={`px-3 py-1.5 text-[11px] font-medium rounded-md border transition-all 
                          ${selectedVariasi === v.variant_name 
                            ? "bg-primary/5 border-primary text-primary" 
                            : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}
                      >
                        {v.variant_name}
                      </button>
                    ))}
                  </div>
                </div>
              )} 

              {/* ACTION AREA */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  
                  {/* 1. Counter (Kiri) */}
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                    <button 
                      onClick={() => setQuantity(q => q > 1 ? q - 1 : 1)} 
                      disabled={quantity <= 1 || isOutOfStock}
                      className="w-8 h-10 lg:w-10 lg:h-11 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition"
                    >
                      -
                    </button>
                    <span className="w-7 sm:w-8 lg:w-10 text-center text-xs lg:text-[13px] font-semibold text-gray-900">
                      {isOutOfStock ? 0 : quantity}
                    </span>
                    <button 
                      onClick={() => setQuantity(q => q < stockValue ? q + 1 : q)} 
                      disabled={quantity >= stockValue || isOutOfStock}
                      className="w-8 h-10 lg:w-10 lg:h-11 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition"
                    >
                      +
                    </button>
                  </div>

                  {/* 2. Beli Langsung (Tengah & Melebar) */}
                  <button
                    onClick={handleWaCheckout}
                    disabled={isOutOfStock}
                    className={`flex-1 h-10 font-semibold rounded-md flex items-center justify-center gap-2
                      ${isOutOfStock
                        ? "bg-gray-100 text-gray-400"
                        : "bg-primary text-white hover:bg-primary/90"}`}
                  >
                    <ShoppingBag size={16} />
                    <span className="text-[11px] sm:text-[12px] lg:text-[13px] whitespace-nowrap">Checkout</span>
                  </button>

                  {/* 3. Add To Cart (Kanan, Cuma Icon, Tanpa Border) */}
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    title="Tambah ke Keranjang"
                    className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors duration-300
                      ${isOutOfStock
                        ? "text-gray-200 cursor-not-allowed"
                        : "bg-transparent text-gray-400 hover:text-primary"
                      }`}
                  >
                    <ShoppingCart size={22} />
                  </button>

                </div>

                {/* 4. TOMBOL TANYA (PILIHAN CHAT) */}
                <div className="flex gap-2">
                  <button
                    onClick={handleAskProductWebsite}
                    className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white text-xs lg:text-sm font-semibold rounded-md flex items-center justify-center gap-1 sm:gap-2 transition-colors shadow-sm"
                  >
                    <MessageSquare size={18} />
                    Chat via Website
                  </button>
                  <button
                    onClick={handleAskProduct}
                    className="flex-1 h-11 bg-[#25D366] hover:bg-green-500 text-white text-xs lg:text-sm font-semibold rounded-md flex items-center justify-center gap-1 sm:gap-2 transition-colors shadow-sm"
                  >
                    <FaWhatsapp size={18} />
                    WhatsApp
                  </button>
                </div>
              </div>

              {/* TRUST BADGES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3 mt-5 lg:mt-6">
                <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl sm:border-transparent sm:bg-transparent sm:p-0 lg:border-transparent lg:p-0">
                  <Truck className="text-primary flex-shrink-0" size={20} />
                  <div>
                    <p className="text-xs lg:text-[13px] font-semibold text-gray-900 leading-tight">Gratis Ongkir</p>
                    <p className="text-[10px] lg:text-[11px] text-gray-500">Area DIY & Sekitarnya</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white sm:border-transparent sm:bg-transparent sm:p-0 lg:border-transparent lg:p-0">
                  <ShieldCheck className="text-primary flex-shrink-0" size={20} />
                  <div>
                    <p className="text-xs lg:text-[13px] font-semibold text-gray-900 leading-tight">100% Original</p>
                    <p className="text-[10px] lg:text-[11px] text-gray-500">Garansi Resmi</p>
                  </div>
                </div>
              </div>
              
            </div>
          </div>

          {/* ================= 3. SECTION DESKRIPSI & REVIEW ================= */}
          <div className="lg:col-span-7 order-3 lg:pt-8 mt-4 lg:mt-0">
            <div className="flex gap-6 lg:gap-8 border-b mb-6 overflow-x-auto scrollbar-hide whitespace-nowrap">
              <button 
                onClick={() => setActiveTab("description")}
                className={`pb-4 text-xs lg:text-sm font-bold uppercase tracking-wider transition-all ${activeTab === "description" ? "border-b-2 border-primary text-primary" : "text-gray-400 hover:text-primary/70"}`}
              >
                Tentang Produk
              </button>
              <button 
                onClick={() => setActiveTab("review")}
                className={`pb-4 text-xs lg:text-sm font-bold uppercase tracking-wider transition-all ${activeTab === "review" ? "border-b-2 border-primary text-primary" : "text-gray-400 hover:text-primary/70"}`}
              >
                Review
              </button>
            </div>

            {activeTab === "description" ? (
              <div className="space-y-4 text-gray-700 leading-relaxed text-sm lg:text-base">
                 <h3 className="text-base lg:text-lg font-bold text-gray-900">Specifications</h3>
                 <div className="space-y-2">
                    {product.specifications?.map((spec, index) => (
                      <p key={index}>• {spec.trim()}</p>
                    ))}
                 </div>
              </div>
            ) : (
              <div className="py-10 text-center text-gray-500 italic text-sm lg:text-base">Belum ada review untuk produk ini.</div>
            )}
          </div>

        </div>
      </div>

      {/* ================= RELATED PRODUCT ================= */}
      <section className="w-full pb-10 lg:pb-16 mt-10 lg:mt-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-10">
          <div
            className="relative group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* JUDUL DINAMIS BERDASARKAN KATEGORI */}
            <h2 className="text-xl lg:text-2xl font-bold mb-2 text-gray-900">
              {product.category?.name ? "Produk Serupa" : "Mungkin Anda Tertarik"}
            </h2>
            
            {/* LEFT BUTTON */}
            <button
              onClick={scrollLeftAction}
              className={`hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-[100] 
              w-12 h-12 items-center justify-center 
              bg-white/80 backdrop-blur-md border border-gray-200 
              shadow-[0_8px_30px_rgb(0,0,0,0.12)] 
              rounded-full text-gray-800 
              transition-all duration-500 ease-out
              ${isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"}
              hover:bg-primary hover:text-white hover:scale-110 hover:shadow-primary/20 active:scale-90`}
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>

            {/* RIGHT BUTTON */}
            <button
              onClick={scrollRightAction}
              className={`hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-[100] 
              w-12 h-12 items-center justify-center 
              bg-white/80 backdrop-blur-md border border-gray-200 
              shadow-[0_8px_30px_rgb(0,0,0,0.12)] 
              rounded-full text-gray-800 
              transition-all duration-500 ease-out
              ${isHovered ? "opacity-100 translate-x-0 delay-75" : "opacity-0 translate-x-12"}
              hover:bg-primary hover:text-white hover:scale-110 hover:shadow-primary/20 active:scale-90`}
            >
              <ChevronRight size={24} strokeWidth={2.5} />
            </button>

            {/* SLIDER CONTAINER */}
            <div 
              ref={scrollRef} 
              onMouseDown={handleDragStart}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
              onClickCapture={handleClickCapture}
              className={`flex gap-2 sm:gap-3 lg:gap-6 overflow-x-auto scrollbar-hide py-4 cursor-grab active:cursor-grabbing touch-pan-y ${
                isSwiping || isAnimating ? "snap-none" : "snap-x snap-mandatory"
              }`}
            >
              {loadingRelated ? (
                [...Array(6)].map((_, i) => (
                  <div 
                    key={i} 
                    className="product-item flex-shrink-0 snap-start w-[60%] sm:w-[calc((100%-16px)/2)] md:w-[calc((100%-32px)/3)] lg:w-[calc((100%-96px)/5)]"
                  >
                    <div className={isSwiping ? "pointer-events-none select-none" : ""}>
                      <ProductCardSkeleton />
                    </div>
                  </div>
                ))
              ) : (
                relatedProducts.map((item) => (
                  <div 
                    key={item.id} 
                    className="product-item flex-shrink-0 snap-start 
                    w-[calc((100%-12px)/2)] 
                    sm:w-[calc((100%-16px)/2)] 
                    md:w-[calc((100%-32px)/3)] 
                    lg:w-[calc((100%-96px)/5)]"
                  >
                    <div className={isSwiping ? "pointer-events-none select-none" : ""}>
                      <ProductCard product={item} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* MODAL ZOOM*/}
      {showModal && (
        <div 
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/95 p-4" 
          onClick={() => setShowModal(false)}
        >
          <button 
            onClick={() => setShowModal(false)}
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-[100] transition-colors"
          >
            &times;
          </button>

          {/* TAMBAHAN: INFO VARIASI DI MODAL ZOOM BERDASARKAN GAMBAR AKTIF */}
          <div className="absolute top-4 left-4 lg:top-6 lg:left-8 z-50 text-white pointer-events-none text-left">
            <h3 className="text-base lg:text-xl font-bold uppercase tracking-wide drop-shadow-md">
              {product.name}
            </h3>
            {showVariants && currentImageVariant && (
              <p className="text-xs lg:text-sm text-gray-300 mt-1 font-medium drop-shadow-md">
                {product.variant_type_name || "Variasi"}: <span className="text-white">{currentImageVariant.variant_name}</span>
              </p>
            )}
          </div>

          <div 
            className="w-full max-w-4xl h-[50vh] lg:h-[65vh] flex items-center justify-center mb-6 mt-12 lg:mt-0"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={
                sortedImages[activeImage]?.image_url?.startsWith("http") 
                  ? sortedImages[activeImage]?.image_url 
                  : `${import.meta.env.VITE_API_BASE}${sortedImages[activeImage]?.image_url}`
              }
              className="max-w-full max-h-full object-contain shadow-2xl transition-all"
              alt="Zoomed Product"
            />
          </div>

          <div 
            className="flex gap-4 overflow-x-auto max-w-4xl w-full px-4 pb-4 scrollbar-hide justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* PAKAI sortedImages */}
            {sortedImages.map((img, index) => (
              <img
                key={img.id}
                src={
                  img.image_url?.startsWith("http") 
                    ? img.image_url 
                    : `${import.meta.env.VITE_API_BASE}${img.image_url}`
                }
                onClick={() => setActiveImage(index)}
                className={`w-14 h-14 lg:w-16 lg:h-16 md:w-20 md:h-20 object-cover rounded-lg cursor-pointer transition-all border-2 flex-shrink-0 ${
                  activeImage === index ? "border-primary opacity-100 scale-105" : "border-transparent opacity-50 hover:opacity-100"
                }`}
                alt={`Thumbnail Modal ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ==================================== */}
      {/* MODAL BERHASIL TAMBAH KERANJANG */}
      {/* ==================================== */}
      <style>{`
        @keyframes fadeInBackdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popInModal {
          from { opacity: 0; transform: scale(0.85) translateY(15px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fade-in-backdrop {
          animation: fadeInBackdrop 0.2s ease-out forwards;
        }
        .animate-pop-in-modal {
          animation: popInModal 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards;
        }
      `}</style>

      {showSuccessModal && (
        <div 
          className={`fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4 
            ${isClosing ? "animate-backdrop-out" : "animate-backdrop-in"}`}
          onClick={handleCloseSuccessModal} 
        >
          <div 
            className={`bg-white w-full max-w-sm rounded-md shadow-2xl overflow-hidden border border-gray-100
              ${isClosing ? "animate-zoom-out-smooth" : "animate-zoom-in-smooth"}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER: Icon Ceklis */}
            <div className="p-6 text-center relative">
              <button 
                onClick={handleCloseSuccessModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="w-16 h-16 mx-auto bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4 border border-green-100">
                <Check size={32} strokeWidth={3} />
              </div>
              
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                Berhasil Terpilih
              </h3>
              <p className="text-[11px] text-gray-500 mt-1 font-medium uppercase tracking-tight">
                Produk sudah masuk ke keranjang
              </p>
            </div>

            {/* BODY: Info Produk Mini */}
            <div className="px-6 py-4 bg-gray-50/50 border-y border-gray-100 flex gap-4 items-center">
              <div className="w-14 h-14 bg-white rounded-md border border-gray-200 p-1 flex-shrink-0 shadow-sm">
                <img 
                  src={sortedImages[0]?.image_url?.startsWith("http") 
                    ? sortedImages[0]?.image_url 
                    : `${import.meta.env.VITE_API_BASE}${sortedImages[0]?.image_url}`} 
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[11px] font-bold text-gray-900 truncate uppercase">{product.name}</h4>
                <p className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase">
                  {showVariants && activeVariant && <span>{activeVariant.variant_name} • </span>} 
                  {quantity} Item
                </p>
              </div>
            </div>

            {/* FOOTER: Tombol Aksi */}
            <div className="p-6 grid grid-cols-2 gap-3">
              <button
                onClick={handleCloseSuccessModal} 
                className="h-11 bg-white border border-gray-200 text-[10px] font-bold text-gray-500 rounded-md hover:bg-gray-50 transition uppercase tracking-widest"
              >
                Lanjut Belanja
              </button>
              <button
                onClick={() => navigate("/cart")} 
                className="h-11 bg-primary text-white text-[10px] font-bold rounded-md flex items-center justify-center gap-2 hover:bg-primary/90 transition shadow-lg shadow-primary/20 uppercase tracking-widest"
              >
                <ShoppingBag size={14} />
                Cek Keranjang
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          if (pendingAction === "wa") {
            handleWaCheckout();
          } else if (pendingAction === "chat") {
            handleAskProductWebsite();
          } else {
            handleAddToCart();
          }
          setPendingAction(null);
        }}
      />

    </>
  );
}