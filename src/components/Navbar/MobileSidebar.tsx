import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, X, LayoutGrid } from "lucide-react";

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

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  groupings: Grouping[];
}

export default function MobileSidebar({ isOpen, onClose, groupings }: MobileSidebarProps) {
  const navigate = useNavigate();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const navTo = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-[2000] transition-all duration-300 ${isOpen ? "visible" : "invisible"}`}>
      {/* Overlay Backdrop */}
      <div 
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Sidebar Panel (Kategori Saja) */}
      <div className={`absolute top-0 left-0 h-full w-[85%] max-w-[320px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        
        {/* Header Section */}
        <div className="flex items-center justify-between p-5 border-b bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3 text-primary">
            <LayoutGrid size={22} />
            <span className="font-bold text-gray-900 text-lg">Menu & Kategori</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          {/* Main Menu Items */}
          <div className="flex flex-col gap-1 mb-4 pb-4 border-b">
            <div 
              onClick={() => navTo("/company-profile")}
              className="flex items-center gap-3 py-3.5 px-4 rounded-xl text-gray-700 font-bold hover:bg-gray-50 cursor-pointer"
            >
              <span className="text-sm">Tentang Kami</span>
            </div>
            <div 
              onClick={() => navTo("/products")}
              className="flex items-center gap-3 py-3.5 px-4 rounded-xl text-gray-700 font-bold hover:bg-gray-50 cursor-pointer"
            >
              <span className="text-sm">Produk Katalog</span>
            </div>
            <div 
              onClick={() => navTo("/track/servis")}
              className="flex items-center gap-3 py-3.5 px-4 rounded-xl text-primary font-black bg-blue-50 border border-blue-100 hover:bg-blue-100 cursor-pointer"
            >
              <span className="text-sm">Lacak Servis</span>
            </div>
          </div>
          {groupings.map((group) => {
            const hasChildren = group.children && group.children.length > 0;
            const isGroupOpen = expandedGroups.includes(group.id);

            return (
              <div key={group.id} className="flex flex-col mb-1">
                <div 
                  onClick={() => toggleGroup(group.id)} 
                  className={`flex items-center justify-between py-3.5 px-4 rounded-xl transition-all cursor-pointer ${
                    isGroupOpen ? "bg-blue-50 text-primary font-bold" : "text-gray-700 font-semibold hover:bg-gray-50"
                  }`}
                >
                  <span className="text-sm">{group.name}</span>
                  {hasChildren && <ChevronDown size={16} className={`transition-transform duration-300 ${isGroupOpen ? "rotate-180" : ""}`} />}
                </div>

                {isGroupOpen && hasChildren && (
                  <div className="ml-5 pl-4 border-l-2 border-primary/20 flex flex-col gap-1 my-2">
                    <div 
                      onClick={() => navTo(`/product-grouping?grouping=${group.name}`)} 
                      className="py-2.5 text-xs font-extrabold text-primary cursor-pointer active:scale-95 transition-transform"
                    >
                      Lihat Semua {group.name}
                    </div>
                    {group.children.map((cat) => (
                      <div 
                        key={cat.id} 
                        onClick={() => navTo(`/product-categories?category=${cat.name}`)} 
                        className="py-2.5 text-xs text-gray-500 hover:text-primary font-medium cursor-pointer transition-colors active:scale-95"
                      >
                        {cat.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}