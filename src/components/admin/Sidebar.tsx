import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  House,
  Package,
  LogOut,
  Layers,
  PanelRightClose,
  PanelRightOpen,
  FileInput,
  FilePen,
  CirclePercent,
  Image,
  Award,
  Tag,
  ClipboardList,
  User2,
  MessageCircle,
} from "lucide-react";
import { FaTiktok } from "react-icons/fa6";
import { useState } from "react";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const menu = [
    { name: "Dashboard", path: "/ayamgoreng/dashboard", icon: House },
    { name: "Pesan", path: "/ayamgoreng/chat", icon: MessageCircle },
    { name: "User", path: "/ayamgoreng/users", icon: User2 },
    { name: "Orders", path: "/ayamgoreng/orders", icon: ClipboardList },
    { name: "Kategori", path: "/ayamgoreng/category", icon: Layers },
    { name: "Brand", path: "/ayamgoreng/brand", icon: Tag },
    { name: "Produk", path: "/ayamgoreng/product", icon: Package },
    { name: "Update Massal", path: "/ayamgoreng/update-massal", icon: FilePen },
    { name: "Upload Massal", path: "/ayamgoreng/upload-massal", icon: FileInput },
    { name: "Pricelist", path: "/ayamgoreng/admin-pricelist", icon: CirclePercent },
    { name: "Banner", path: "/ayamgoreng/banner", icon: Image },
    { name: "Sertifikat", path: "/ayamgoreng/certificate", icon: Award },
    { name: "TikTok", path: "/ayamgoreng/tiktok", icon: FaTiktok }
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/ayamgoreng/login");
  };

  return (
    <div
      className={`
        flex flex-col
        h-full
        bg-white
        border border-gray-200
        shadow-xl
        rounded-2xl
        transition-all duration-300 ease-in-out
        overflow-visible
        ${collapsed ? "w-20" : "w-64"}
      `}
    >
      {/* HEADER */}
      <div className="relative flex items-center p-4 border-b border-gray-200">

      {/* Left Side: Profile */}
      <div className="flex items-center gap-3 overflow-hidden">
        
        {/* FOTO PROFIL */}
        <div className="w-10 h-10 overflow-hidden shrink-0">
          <img
            src={user?.avatar || "/icon-anandam.svg"}
            alt="Profile"
            className="object-cover w-full h-full"
          />
        </div>

        {/* USERNAME */}
        <div
          className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100"}
          `}
        >
          <span className="font-semibold whitespace-nowrap">
            {user?.username || "Admin"}
          </span>
        </div>

      </div>

      {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute z-50 p-2 transition -translate-y-1/2 bg-white border border-gray-200 rounded-full shadow-lg -right-4 top-1/2 hover:bg-gray-100"
        >
          {collapsed ? (
            <PanelRightClose size={18} />
          ) : (
            <PanelRightOpen size={18} />
          )}
        </button>

      </div>

      {/* MENU */}
      <nav className="flex-1 p-3 space-y-1">
        {menu.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`
                flex items-center
                px-4 py-3
                rounded-lg
                transition-all duration-300
                ${collapsed ? "justify-center" : "gap-3"}
                ${isActive ? "bg-gray-100 font-medium text-blue-600" : "hover:bg-gray-100"}
              `}
            >
              <Icon size={18} />

              <span
                className={`
                  text-sm
                  whitespace-nowrap
                  transition-all duration-300 ease-in-out
                  ${collapsed
                    ? "opacity-0 -translate-x-4 w-0"
                    : "opacity-100 translate-x-0 w-auto"}
                `}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* LOGOUT */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className={`
            flex items-center w-full
            px-4 py-3
            font-bold text-red-600
            transition-all duration-300 rounded-lg
            ${collapsed ? "justify-center" : "gap-3"}
            hover:bg-red-50
          `}
        >
          <LogOut size={18} strokeWidth={2.5} />

          <span
            className={`
              whitespace-nowrap
              transition-all duration-300 ease-in-out
              ${collapsed
                ? "opacity-0 -translate-x-4 w-0"
                : "opacity-100 translate-x-0 w-auto"}
            `}
          >
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}