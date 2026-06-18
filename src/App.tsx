import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react"
import AOS from "aos"
import "aos/dist/aos.css"

import LoginPage from "./pages/admin_panel/LoginPage";
import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin_panel/Dashboard";
import CategoryPage from "./pages/admin_panel/CategoryPage";
import AdminProductPage from "./pages/admin_panel/ProductPage";
import LandingPage from "./pages/landing_page/LandingPage";
import ProductUpdatePage from "./pages/admin_panel/ProductUpdatePage";
import ProductUploadPage from "./pages/admin_panel/ProductUploadPage";
import AdminPricelistPage from "./pages/admin_panel/PricelistPage";
import BannerPage from "./pages/admin_panel/BannerPage";
import CertificatePage from "./pages/admin_panel/CertificatePage";
import PublicLayout from "./components/PublicLayout";
import ProductKatalogPage from "./pages/landing_page/ProductKatalogPage";
import CategoriesPage from "./pages/landing_page/Categories";
import ProductDetailPage from "./pages/landing_page/ProductDetailPage";
import ScrollToTop from "./components/ScrollToTop";
import ScrollToTopButton from "./components/CornerActions";
import CompanyProfile from "./pages/landing_page/company_profile/ProfilLandingPage";
import TermsPage from "./pages/landing_page/company_profile/TermsPage";
import PageLoader from "./components/PageLoader";
import GroupingPage from "./pages/landing_page/GroupingPage";
import CertificateVerifyPage from "./pages/landing_page/CertificateVerifyPage";
import SearchResultPage from "./pages/landing_page/SearchResultPage";
import { initIdleTimer } from "./services/idleTimer";
import BrandSection from "./pages/admin_panel/BrandPage";
import PCBuilderPage from "./pages/landing_page/PCBuilderPage";
import PCBuilderPreviewPage from "./pages/landing_page/PCBuilderPreviewPage";
import PublicPricelistPage from "./pages/landing_page/PricelistPage";
import ServerBusyPage from "./pages/ServerBusyPage";
import TiktokPage from "./pages/admin_panel/TiktokPage";
import { GlobalImportProvider } from "./components/admin/NotificationUpdateUpload";
import ProfilePage from "./pages/landing_page/User/ProfilePage";
import CartPage from "./pages/landing_page/User/CartPage";
import OrderListPage from "./pages/admin_panel/OrderListPage";
import UserOrderHistory from "./pages/landing_page/User/UserOrderHistory";
import UserLayout from "./components/UserLayout";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import UserProtectedRoute from "./components/UserProtectedRoute";
import UserAddressPage from "./pages/landing_page/User/UserAddressPage";
import ChangePasswordPage from "./pages/landing_page/User/ChangePasswordPage";
import ResetPasswordPage from "./pages/landing_page/User/ResetPasswordPage";
import PromoBannerPage from "./pages/landing_page/PromoBannerPage";
import AdminUsersPage from "./pages/admin_panel/UserPage";
import ChatPage from "./pages/chat/ChatPage";
import { SocketProvider } from "./contexts/SocketContext";

// ================= ROUTES =================
function AppRoutes() {
  const location = useLocation()

  return (
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
        <Route path="/price-list" element={<PublicPricelistPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/promo/:id" element={<PromoBannerPage />} />

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
  )
}

function AppContent() { 
  const location = useLocation();

  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      offset: 80
    })
  }, [])

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
      <PageLoader/>
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