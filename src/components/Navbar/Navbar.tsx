import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu as MenuIcon, LogOut, User, ShoppingCart, ChevronDown, ShoppingBag, Home, Package, MessageSquare, Headphones, Mail } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useEffect, useState, useRef } from "react";
import { logoutUser, getMyAddresses } from "../../services/userAuthService";
import { getProducts } from "../../services/productService";
import { getCategories } from "../../services/adminCategoryService";
import { getGroupings } from "../../services/groupingService";
import type { Product } from "../../types/product";
import { getMyCart } from "../../services/cartService";

import AuthModal from "./AuthModal";
import SearchBar from "./SearchBar";
import TopInfoBar from "./TopInfoBar";
import OrderFlowModal from "./OrderFlowModal";
import DesktopNavLinks from "./DesktopNavLinks";
import MobileSidebar from "./MobileSidebar";

interface Category {
  id: string;
  name: string;
  code: string;
  parent_id: string | null;
}

interface Grouping {
  id: string;
  name: string;
  children: Category[];
}

const isDataMissing = (data: any) => {
  if (data === null || data === undefined) return true;
  if (typeof data === "string") {
    const trimmed = data.trim().toLowerCase();
    if (trimmed === "" || trimmed === "null" || trimmed === "undefined" || trimmed === "[]" || trimmed === "{}") return true;
  }
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === "object" && !Array.isArray(data)) return Object.keys(data).length === 0;
  return false;
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [groupings, setGroupings] = useState<Grouping[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);

  const [isAddressMissing, setIsAddressMissing] = useState(false);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showWaDropdown, setShowWaDropdown] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const waDropdownRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const cache = useRef<Record<string, Product[]>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [cartCount, setCartCount] = useState(0);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [cartPreviewItems, setCartPreviewItems] = useState<any[]>([]);

  const fetchCartData = async () => {
    if (!localStorage.getItem("user_token")) {
      setCartCount(0);
      setCartPreviewItems([]);
      return;
    }

    try {
      const data = await getMyCart();
      const total = data.reduce((acc: number, item: any) => acc + item.quantity, 0);
      setCartCount(total);
      setCartPreviewItems(data.slice(0, 3)); 
    } catch (err) {
      console.error("Gagal fetch cart data", err);
    }
  };

  useEffect(() => {
    fetchCartData();
    const handleCartUpdate = () => {
      fetchCartData();
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
    };
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (waDropdownRef.current && !waDropdownRef.current.contains(event.target as Node)) {
        setShowWaDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadUserData = () => {
    const userDataStr = localStorage.getItem("user_data");
    if (userDataStr) {
      try { setCurrentUser(JSON.parse(userDataStr)); } 
      catch (e) { console.error("Failed to parse user data"); }
    } else {
      setCurrentUser(null);
    }

    const hasAddr = localStorage.getItem("user_has_address");
    if (hasAddr === "true") setIsAddressMissing(false);
    else if (hasAddr === "false") setIsAddressMissing(true);
  };

  useEffect(() => {
    loadUserData();
    window.addEventListener("storage", loadUserData);
    window.addEventListener("userDataUpdated", loadUserData);
    
    return () => {
      window.removeEventListener("storage", loadUserData);
      window.removeEventListener("userDataUpdated", loadUserData);
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return; 

    const verifyAddressRightAway = async () => {
      const hasAddr = localStorage.getItem("user_has_address");
      if (hasAddr === "true") {
        setIsAddressMissing(false);
        return;
      }

      try {
        const addresses = await getMyAddresses();
        if (addresses && addresses.length > 0) {
          setIsAddressMissing(false);
          localStorage.setItem("user_has_address", "true");
        } else {
          setIsAddressMissing(true);
          localStorage.setItem("user_has_address", "false");
        }
      } catch (err) {
        setIsAddressMissing(isDataMissing(currentUser?.address));
      }
    };

    verifyAddressRightAway();
  }, [currentUser]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupingData, categoryData] = await Promise.all([
          getGroupings(),
          getCategories(),
        ]);
        setGroupings(groupingData);
        setCategories(categoryData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const shortenName = (name: string) => name.split(" ").slice(0, Math.random() > 0.5 ? 2 : 3).join(" ");
  const shuffleArray = <T,>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

  useEffect(() => {
    if (!search.trim() || search.length < 2) {
      setResults([]); setSuggestions([]); setCategorySuggestions([]); setShowWaDropdown(false);
      return;
    }
    setShowWaDropdown(true);
    setLoadingSearch(true);

    const delay = setTimeout(async () => {
      if (cache.current[search]) {
        setResults(cache.current[search]);
        setShowWaDropdown(true);
        setLoadingSearch(false);
        return;
      }
      try {
        const res = await getProducts({ search: search, page: 1, limit: 10 });
        const products: Product[] = res.data;
        cache.current[search] = products;

        setResults(products);
        setFeaturedProducts(shuffleArray(products).slice(0, 5));
        
        const normalizedSearch = search.trim().toLowerCase();
        const nameSuggestions = Array.from(new Set(shuffleArray(products).map((p) => shortenName(p.name))))
          .filter((name) => name.toLowerCase() !== normalizedSearch)
          .slice(0, 5);
        setSuggestions(nameSuggestions);

        const uniqueCategories = Array.from(new Map(products.filter((p: Product) => p.category).map((p: Product) => [p.category!.id, p.category])).values()) as Category[];
        setCategorySuggestions(uniqueCategories);
        setShowWaDropdown(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSearch(false);
      }
    }, 150);

    return () => clearTimeout(delay);
  }, [search]);

  const handleLogout = async () => {
    try { await logoutUser(); } 
    catch (e) { console.error(e); } 
    finally {
      setCurrentUser(null);
      setCartCount(0);
      setCartPreviewItems([]);
      setUserDropdownOpen(false);
      
      localStorage.removeItem("user_data");
      localStorage.removeItem("user_has_address");
      
      window.dispatchEvent(new Event("userDataUpdated"));
      navigate("/");
    }
  };

  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const getAvatarUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${import.meta.env.VITE_API_BASE}${url}`;
  };

  const showProfileAlert = currentUser && (isDataMissing(currentUser.phone_number) || isAddressMissing);

  return (
    <>
      <style>{`
        @keyframes rakitanImgSequence {
          0% { transform: scale(0.8) translateY(-8px); }
          5% { transform: scale(1.1) translateY(0); }
          7% { transform: scale(1.1) rotate(-8deg); }
          9% { transform: scale(1.1) rotate(8deg); }
          12% { transform: scale(1) rotate(0deg); }
          35% { transform: scale(1) translateY(0); }
          40% { transform: scale(0.8) translateY(-8px); }
          90% { transform: scale(0.8) translateY(-8px); }
          100% { transform: scale(0.8) translateY(-8px); }
        }

        @keyframes rakitanTextSequence {
          0%, 35% { opacity: 0; transform: translateY(5px); }
          40%, 85% { opacity: 1; transform: translateY(0); }
          90%, 100% { opacity: 0; transform: translateY(5px); }
        }

        .animate-rakitan-img {
          animation: rakitanImgSequence 8s infinite cubic-bezier(0.25, 1, 0.5, 1);
        }
        
        .animate-rakitan-text {
          animation: rakitanTextSequence 8s infinite ease-out;
        }
      `}</style>

      <TopInfoBar onOpenOrderModal={() => setIsOrderModalOpen(true)} />

      <div className={`sticky top-0 z-[1000] w-full bg-white border-b border-gray-200 transition-shadow ${isScrolled ? "shadow-md" : "shadow-sm"}`}>
        <div className="w-full">
          <div className="flex items-center justify-between max-w-7xl 2xl:max-w-screen-2xl mx-auto w-full h-16 lg:h-20 px-4 md:px-12 gap-4">
            
            {/* Left Area (Brand & Category) - Ditambahkan flex-shrink-0 agar logo tidak tergencet */}
            <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
              <Link to="/" className="flex-shrink-0">
                <img src="/anandam-logo-blue.svg" alt="Anandam Logo" className="h-8 sm:h-8 lg:h-9 w-auto object-contain" />
              </Link>

              <DesktopNavLinks groupings={groupings} />
            </div>

            <div className="hidden md:flex flex-1 justify-center min-w-0 mx-4 lg:mx-8 max-w-xl xl:max-w-2xl 2xl:max-w-3xl">
              <SearchBar className="w-full" dropdownWidth="w-full" />
            </div>

            {/* Right Area (Utilities & Auth) - Ditambahkan flex-shrink-0 agar barisan icon ukurannya terkunci */}
            <div className="flex items-center justify-end flex-shrink-0 gap-2 md:gap-4 lg:gap-6">
              
              {/* RAKIT PC (Mobile & Desktop) */}
              <Link 
                to="/pc-builder" 
                className="relative flex w-10 h-10 sm:w-12 sm:h-12 items-center justify-center rounded-button transition-all duration-300 group"
                title="Rakit PC"
              >
                <div className="relative flex flex-col items-center justify-center w-full h-full pointer-events-none">
                  <img 
                    src="/pc.svg" 
                    alt="Rakitan" 
                    className="w-7 h-7 sm:w-8 sm:h-8 object-contain animate-rakitan-img drop-shadow-sm"
                  />
                  <span className="absolute bottom-0.5 text-[6px] sm:text-[7px] font-extrabold text-color-primary tracking-wider animate-rakitan-text whitespace-nowrap uppercase">
                    Rakit PC
                  </span>
                </div>
              </Link>

              {/* CONTACT CENTER DROPDOWN (Mobile & Desktop) */}
              <div className="relative flex justify-center group">
                
                {/* Trigger Button */}
                <button className="relative cursor-pointer text-gray-600 group-hover:text-blue-600 transition-colors p-1 flex items-center justify-center">
                  <MessageSquare size={20} strokeWidth={2} />
                </button>

                {/* Dropdown Container */}
                <div
                  className="absolute right-0 lg:left-1/2 lg:-translate-x-1/2 top-[calc(100%+8px)] lg:top-full lg:pt-3 w-[240px] z-50
                    transition-all duration-300 ease-out origin-top-right lg:origin-top
                    opacity-0 -translate-y-2 scale-95 pointer-events-none 
                    group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-hover:pointer-events-auto"
                >
                  {/* Segitiga penunjuk */}
                  <div className="absolute top-1.5 right-3 lg:right-auto lg:left-1/2 lg:-translate-x-1/2 w-3.5 h-3.5 bg-[#f4f7f9] border-t border-l border-gray-200 transform rotate-45 z-10 rounded-tl-sm hidden lg:block"></div>

                  {/* Main Card */}
                  <div className="relative bg-white border border-gray-200 rounded-xl shadow-lg flex flex-col z-20 overflow-hidden">
                    
                    <div className="bg-[#f4f7f9] px-4 py-3 text-left border-b border-gray-200">
                      <h3 className="text-blue-700 font-bold text-[13px] tracking-wide">Contact Center</h3>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                        Ada pertanyaan? Kami siap membantu.
                      </p>
                    </div>

                    <div className="flex flex-col">
                      <a
                        href="https://wa.me/6285950544597"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 hover:bg-blue-50/50 transition-colors text-left"
                      >
                        <div className="w-6 flex justify-center text-blue-600">
                          <Headphones size={18} strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-gray-800">Customer Care</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">0859-5054-4597</p>
                        </div>
                      </a>

                      <a
                        href="mailto:sales@anandam.id"
                        className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 hover:bg-blue-50/50 transition-colors text-left"
                      >
                        <div className="w-6 flex justify-center text-blue-600">
                          <Mail size={18} strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-gray-800">Kirim Email</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">sales@anandam.id</p>
                        </div>
                      </a>

                      <a
                        href="https://wa.me/6281228134747"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50/50 transition-colors text-left"
                      >
                        <div className="w-6 flex justify-center text-green-500">
                          <FaWhatsapp size={18} />
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-gray-800">WhatsApp Marketing</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">0812-2813-4747</p>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* MOBILE CART BUTTON */}
              <button
                onClick={() => navigate("/cart")}
                className="relative lg:hidden p-2 rounded-md text-gray-600 hover:text-color-primary transition-colors"
                aria-label="Keranjang"
              >
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] min-w-[15px] h-[15px] flex items-center justify-center rounded-full font-bold border border-white shadow-sm">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>

              {/* DESKTOP ICON GROUP */}
              <div className="hidden lg:flex items-center gap-6">
                

                {/* Cart Icon with Dropdown */}
                <div 
                  className="relative flex justify-center group"
                  onMouseEnter={() => {
                    if (window.innerWidth >= 1024) setShowCartPreview(true);
                  }} 
                  onMouseLeave={() => setShowCartPreview(false)}
                >
                  <button
                    onClick={() => navigate("/cart")}
                    className="relative p-1 rounded-md text-gray-600 hover:text-color-primary transition-colors duration-300 z-10"
                  >
                    <ShoppingCart size={22} />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1.5 bg-red-500 text-white text-[9px] min-w-[16px] h-[16px] flex items-center justify-center rounded-full font-bold border-2 border-white shadow-sm animate-in zoom-in">
                        {cartCount > 9 ? '9+' : cartCount}
                      </span>
                    )}
                  </button>

                  {/* Preview Cart Desktop */}
                  <div
                    className={`hidden lg:block absolute right-0 lg:left-1/2 lg:-translate-x-1/2 top-full pt-3 w-80 z-50
                      transition-all duration-300 ease-out origin-top-right lg:origin-top
                      ${showCartPreview 
                        ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" 
                        : "opacity-0 -translate-y-2 scale-95 pointer-events-none"}
                    `}
                  >
                    <div className="relative bg-white border border-gray-100 rounded-md shadow-2xl overflow-hidden z-10">
                      <div className="px-5 py-4 border-b bg-gray-50/50 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-gray-900">Keranjang</h3>
                        {cartPreviewItems.length > 0 && (
                          <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold">
                            {cartCount} Item
                          </span>
                        )}
                        <button 
                          onClick={() => { setShowCartPreview(false); navigate("/cart"); }}
                          className="text-[11px] font-bold text-primary hover:underline"
                        >
                          Lihat
                        </button>
                      </div>

                      <div className="max-h-[350px] overflow-y-auto scrollbar-hide">
                        {cartPreviewItems.length > 0 ? (
                          <div className="divide-y divide-gray-50">
                            {cartPreviewItems.map((item) => {
                              const product = item.product;
                              const priceNormal = Number(product?.price_normal || 0);
                              const priceDiscount = Number(product?.price_discount || 0);
                              const finalPrice = priceDiscount > 0 ? priceNormal - priceDiscount : priceNormal;
                              const imageUrl = product?.thumbnail?.startsWith("http")
                                ? product.thumbnail
                                : `${import.meta.env.VITE_API_BASE}${product?.thumbnail}`;

                              return (
                                <div key={item.id} className="flex gap-4 p-4 hover:bg-gray-50 transition group/item">
                                  <div className="w-14 h-14 bg-gray-50 rounded-md overflow-hidden flex-shrink-0 p-1 border border-gray-100">
                                    <img src={imageUrl} className="w-full h-full object-contain" alt={product?.name} />
                                  </div>
                                  <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                                    <p className="text-sm font-bold text-gray-800 truncate hover:text-primary">{product?.name}</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                      {item.quantity} x <span className="font-medium text-black">Rp {finalPrice.toLocaleString()}</span>
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-10 flex flex-col items-center justify-center text-center px-8">
                            <div className="w-32 h-32 mb-4 flex items-center justify-center">
                              <img 
                                src="/cart.svg" 
                                alt="Keranjang Kosong" 
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/11329/11329060.png";
                                }}
                              />
                            </div>
                            <h3 className="text-sm font-bold text-gray-900 mb-1">
                              Wah, keranjang belanjamu kosong
                            </h3>
                            <p className="text-[11px] text-gray-500 mb-6 leading-relaxed">
                              Yuk, isi dengan barang-barang impianmu!
                            </p>
                            <button
                              onClick={() => {
                                setShowCartPreview(false);
                                navigate("/products");
                              }}
                              className="w-full py-2.5 border border-primary text-primary rounded-md text-sm font-bold hover:bg-primary/10 transition-all active:scale-95"
                            >
                              Mulai Belanja
                            </button>
                          </div>
                        )}
                      </div>

                      {cartPreviewItems.length > 0 && (
                        <div className="p-4 bg-gray-50/50 border-t">
                          <button
                            onClick={() => { setShowCartPreview(false); navigate("/cart"); }}
                            className="w-full bg-primary text-white py-2.5 rounded-md text-sm font-bold hover:bg-primary-dark transition-all active:scale-95 shadow-lg shadow-primary/20"
                          >
                            Lihat Selengkapnya
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Vertical Divider */}
              <div className="hidden lg:block w-px h-6 bg-color-border"></div>

              {/* Auth or User Profile */}
              <div className="relative hidden lg:block" ref={dropdownRef}>
                {currentUser ? (
                  <div 
                    className={`flex items-center gap-3 cursor-pointer py-1.5 pl-1.5 pr-3 rounded-full transition-all duration-300 border ${
                      userDropdownOpen ? "bg-white border-gray-200 shadow-md" : "border-transparent hover:bg-gray-100"
                    }`}
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  >
                    <div className="relative flex-shrink-0">
                      {currentUser.avatar_url ? (
                        <img 
                          src={getAvatarUrl(currentUser.avatar_url)} 
                          alt="Profile" 
                          className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-full flex items-center justify-center font-semibold text-sm border-2 border-white shadow-sm">
                          {currentUser.full_name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      
                      {showProfileAlert && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-orange-500 border-2 border-white"></span>
                        </span>
                      )}
                    </div>

                    <div className="hidden lg:flex flex-col items-start leading-none">
                      <span className="text-sm font-bold text-gray-800 max-w-[90px] truncate">
                        {currentUser.full_name.split(' ')[0]}
                      </span>
                    </div>

                    <ChevronDown 
                      size={16} 
                      className={`text-gray-400 hidden lg:block transition-transform duration-300 ${userDropdownOpen ? "rotate-180" : ""}`} 
                    />
                  </div>
                ) : (
                  <div className="hidden lg:flex items-center gap-3">
                    <button 
                      onClick={() => openAuth('login')} 
                      className="px-4 py-2 text-sm font-bold text-color-primary border border-color-primary rounded-button bg-transparent hover:bg-color-primary/5 transition-colors"
                    >
                      Masuk
                    </button>
                    <button 
                      onClick={() => openAuth('register')} 
                      className="px-5 py-2 text-sm font-bold bg-color-primary text-white rounded-button hover:bg-color-primary-dark shadow-sm transition-colors active:scale-95"
                    >
                      Daftar
                    </button>
                  </div>
                )}

                {/* USER DROPDOWN MENU */}
                {currentUser && (
                  <div
                    className={`absolute right-0 top-full pt-2 w-60 z-50
                      transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
                      ${userDropdownOpen 
                        ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" 
                        : "opacity-0 -translate-y-2 scale-95 pointer-events-none"}
                    `}
                  >
                    <div className="bg-white border border-gray-100 rounded-md shadow-2xl py-2 overflow-hidden duration-300 ease-out origin-top-right">
                      <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-100 mb-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{currentUser.full_name}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{currentUser.email}</p>
                      </div>

                      <Link 
                        to="/user/account/profile" 
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-primary flex items-center justify-between transition"
                      >
                        <div className="flex items-center gap-3 font-semibold">
                          <User size={18} className="text-gray-400" /> Profil Saya
                        </div>
                        
                        {showProfileAlert && (
                          <span className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                          </span>
                        )}
                      </Link>

                      <Link 
                        to="/user/purchase" 
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-primary flex items-center gap-3 transition"
                      >
                        <ShoppingBag size={18} className="text-gray-400" />
                        <span className="font-semibold">Pesanan Saya</span>
                      </Link>

                      <div className="h-px bg-gray-100 my-2 mx-4" />

                      <button 
                        onClick={handleLogout} 
                        className="w-full px-4 py-3 text-sm text-red-500 font-bold hover:bg-red-50 flex items-center gap-3 transition"
                      >
                        <LogOut size={18} /> Keluar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* SEARCH BAR MOBILE */}
        <div className="md:hidden px-4 pt-2 pb-3 max-w-7xl mx-auto w-full">
          <SearchBar className="w-full" dropdownWidth="w-full" />
        </div>

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 z-[999] flex items-center justify-around pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.03)] h-16">
        
        <button 
          onClick={() => navigate("/")} 
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${location.pathname === "/" ? "text-primary" : "text-gray-400"}`}
        >
          <Home size={22} strokeWidth={location.pathname === "/" ? 2.5 : 2} />
          <span className="text-[10px] font-semibold">Home</span>
        </button>

        <button 
          onClick={() => setMobileMenuOpen(true)} 
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${mobileMenuOpen ? "text-primary" : "text-gray-400"}`}
        >
          <MenuIcon size={22} strokeWidth={mobileMenuOpen ? 2.5 : 2} />
          <span className="text-[10px] font-semibold">Kategori</span>
        </button>

        <button 
          onClick={() => navigate("/products")} 
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${location.pathname === "/products" ? "text-primary" : "text-gray-400"}`}
        >
          <Package size={22} strokeWidth={location.pathname === "/products" ? 2.5 : 2} />
          <span className="text-[10px] font-semibold">Katalog</span>
        </button>

        <button 
          onClick={() => currentUser ? navigate("/user") : openAuth("login")}
          className={`relative flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${location.pathname.includes("/user") ? "text-primary" : "text-gray-400"}`}
        >
          <User size={22} strokeWidth={location.pathname.includes("/user") ? 2.5 : 2} />
          <span className="text-[10px] font-semibold">{currentUser ? "Akun" : "Masuk"}</span>
          
          {showProfileAlert && (
            <span className="absolute top-2.5 right-6 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
            </span>
          )}
        </button>
      </div>

      <MobileSidebar 
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        groupings={groupings}
      />

      <OrderFlowModal 
        isOpen={isOrderModalOpen} 
        onClose={() => setIsOrderModalOpen(false)} 
      />

      <AuthModal 
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(userData) => {
          setCurrentUser(userData);
          localStorage.setItem("user_data", JSON.stringify(userData));
          window.dispatchEvent(new Event("userDataUpdated"));
          setIsAuthModalOpen(false);
        }}
      />
    </>
  );
}