import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react"
import AOS from "aos"
import "aos/dist/aos.css"

import { initDeferredScripts } from "./utils/deferredScripts";
import LandingPage from "./pages/landing_page/LandingPage";
import PublicLayout from "./components/PublicLayout";
import ScrollToTop from "./components/ScrollToTop";
import ScrollToTopButton from "./components/CornerActions";
import PageLoader from "./components/PageLoader";
import { SocketProvider } from "./contexts/SocketContext";
import { initIdleTimer } from "./services/idleTimer";
import { checkLoginExpired } from "./services/userLoginCache";
import { logoutUser } from "./services/userAuthService";
import { GlobalImportProvider } from "./components/admin/NotificationUpdateUpload";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import UserProtectedRoute from "./components/UserProtectedRoute";
import UserLayout from "./components/UserLayout";
import AdminLayout from "./components/admin/AdminLayout";

// Lazy Loaded Pages (non-critical pages loaded on demand)
const LoginPage = lazy(() => import("./pages/admin_panel/LoginPage"));
const Dashboard = lazy(() => import("./pages/admin_panel/Dashboard"));
const CategoryPage = lazy(() => import("./pages/admin_panel/CategoryPage"));
const AdminProductPage = lazy(() => import("./pages/admin_panel/ProductPage"));
const ProductUpdatePage = lazy(() => import("./pages/admin_panel/ProductUpdatePage"));
const ProductUploadPage = lazy(() => import("./pages/admin_panel/ProductUploadPage"));
const AdminPricelistPage = lazy(() => import("./pages/admin_panel/PricelistPage"));
const BannerPage = lazy(() => import("./pages/admin_panel/BannerPage"));
const CertificatePage = lazy(() => import("./pages/admin_panel/CertificatePage"));
const ProductKatalogPage = lazy(() => import("./pages/landing_page/ProductKatalogPage"));
const CategoriesPage = lazy(() => import("./pages/landing_page/Categories"));
const ProductDetailPage = lazy(() => import("./pages/landing_page/ProductDetailPage"));
const CompanyProfile = lazy(() => import("./pages/landing_page/company_profile/ProfilLandingPage"));
const TermsPage = lazy(() => import("./pages/landing_page/company_profile/TermsPage"));
const GroupingPage = lazy(() => import("./pages/landing_page/GroupingPage"));
const CertificateVerifyPage = lazy(() => import("./pages/landing_page/CertificateVerifyPage"));
const SearchResultPage = lazy(() => import("./pages/landing_page/SearchResultPage"));
const BrandSection = lazy(() => import("./pages/admin_panel/BrandPage"));
const PCBuilderPage = lazy(() => import("./pages/landing_page/PCBuilderPage"));
const PCBuilderPreviewPage = lazy(() => import("./pages/landing_page/PCBuilderPreviewPage"));
// const PublicPricelistPage = lazy(() => import("./pages/landing_page/PricelistPage"));
const ServerBusyPage = lazy(() => import("./pages/ServerBusyPage"));
const TiktokPage = lazy(() => import("./pages/admin_panel/TiktokPage"));
const ProfilePage = lazy(() => import("./pages/landing_page/User/ProfilePage"));
const CartPage = lazy(() => import("./pages/landing_page/User/CartPage"));
const OrderListPage = lazy(() => import("./pages/admin_panel/OrderListPage"));
const UserOrderHistory = lazy(() => import("./pages/landing_page/User/UserOrderHistory"));
const UserAddressPage = lazy(() => import("./pages/landing_page/User/UserAddressPage"));
const ChangePasswordPage = lazy(() => import("./pages/landing_page/User/ChangePasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/landing_page/User/ResetPasswordPage"));
const PromoBannerPage = lazy(() => import("./pages/landing_page/PromoBannerPage"));
const ServiceTrackingPage = lazy(() => import("./pages/landing_page/ServiceTrackingPage"));
const AdminUsersPage = lazy(() => import("./pages/admin_panel/UserPage"));
const ChatPage = lazy(() => import("./pages/chat/ChatPage"));

// ================= ROUTES =================
function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/server-busy" element={<ServerBusyPage />} />

        {/* ================= PUBLIC ROUTES (Ada Header/Footer) ================= */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/products" element={<ProductKatalogPage />} />
          <Route path="/product-categories" element={<CategoriesPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/product-grouping" element={<GroupingPage />} />
          <Route path="/company-profile" element={<CompanyProfile />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/certificate" element={<CertificateVerifyPage />} />
          <Route path="/certificate/:id" element={<CertificateVerifyPage />} />
          <Route path="/search" element={<SearchResultPage />} />
          <Route path="/pc-builder" element={<PCBuilderPage />} />
          <Route path="/pc-builder/preview" element={<PCBuilderPreviewPage />} />
          {/* <Route path="/price-list" element={<PublicPricelistPage />} /> */}
          <Route path="/cart" element={<CartPage />} />
          <Route path="/promo/:id" element={<PromoBannerPage />} />
          <Route path="/track/servis/:token?" element={<ServiceTrackingPage />} />

          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* NESTED ROUTING USER */}
          <Route element={<UserProtectedRoute />}>
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/user" element={<UserLayout />}>
              <Route path="account/profile" element={<ProfilePage />} />
              <Route path="account/addresses" element={<UserAddressPage />} />
              <Route path="account/change-password" element={<ChangePasswordPage />} />
              <Route path="purchase" element={<UserOrderHistory />} />
            </Route>
          </Route>
        </Route>

        {/* ================= ADMIN ROUTES (AyamGoreng) ================= */}
        <Route path="/ayamgoreng/login" element={<LoginPage />} />

        <Route path="/ayamgoreng" element={<AdminProtectedRoute role="admin" />}>
          <Route element={
            <GlobalImportProvider>
              <AdminLayout />
            </GlobalImportProvider>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="category" element={<CategoryPage />} />
            <Route path="product" element={<AdminProductPage />} />
            <Route path="update-massal" element={<ProductUpdatePage />} />
            <Route path="upload-massal" element={<ProductUploadPage />} />
            <Route path="admin-pricelist" element={<AdminPricelistPage />} />
            <Route path="banner" element={<BannerPage />} />
            <Route path="certificate" element={<CertificatePage />} />
            <Route path="brand" element={<BrandSection />} />
            <Route path="tiktok" element={<TiktokPage />} />
            <Route path="orders" element={<OrderListPage />} />
            <Route path="users" element={<AdminUsersPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

function AppContent() { 
  const location = useLocation();

  useEffect(() => {
    // Initialize deferred third-party scripts after page load
    initDeferredScripts();

    // Defer AOS init to not block first paint
    const timer = setTimeout(() => {
      AOS.init({
        duration: 800,
        once: true,
        offset: 80
      })
    }, 100);
    return () => clearTimeout(timer);
  }, [])

  useEffect(() => {
    // ================= CEK EXPIRED LOGIN USER (7 HARI) =================
    const userToken = localStorage.getItem("user_token");
    if (userToken && checkLoginExpired()) {
      console.warn("Sesi login user sudah lebih dari 7 hari. Logout otomatis...");
      logoutUser().finally(() => {
        window.location.reload();
      });
    }
  }, []);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName === "IMG") {
        e.preventDefault();
      }
    };
    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (
      token &&
      location.pathname.startsWith("/ayamgoreng")
    ) {
      initIdleTimer();
    }
  }, [location.pathname])

  return (
    <>
      <ScrollToTop/>
      <ScrollToTopButton/>
      <AppRoutes/>
    </>
  )
}

export default function App() { 
  return (
    <BrowserRouter>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </BrowserRouter>
  )
}