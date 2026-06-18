import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, LayoutGrid, Info, BookOpen } from "lucide-react";

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

export default function DesktopNavLinks({ groupings }: { groupings: Grouping[] }) {
  const [open, setOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const navigate = useNavigate();

  // Fungsi buat buka/tutup accordion tiap grouping
  const toggleGroup = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  return (
    <div className="hidden lg:flex items-center text-sm">
      
      {/* MENU DROPDOWN KATEGORI (Cuma Icon) */}
      <div
        className="relative flex items-center"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <div 
          className={`w-10 h-10 flex items-center justify-center rounded-button border cursor-pointer transition-colors ${
            open 
              ? 'border-color-primary text-color-primary bg-color-primary/5' 
              : 'border-color-border text-gray-700 hover:border-color-primary hover:text-color-primary'
          }`}
          aria-label="Kategori"
        >
          <LayoutGrid size={20} strokeWidth={2} />
        </div>

        {/* Jembatan transparan agar hover tidak terputus */}
        <div className="absolute left-0 top-full h-4 w-full"></div>

        {/* DROPDOWN CONTAINER */}
        <div className={`absolute left-0 top-[calc(100%+8px)] w-[700px] bg-white border border-gray-100 rounded-2xl shadow-xl transition-all duration-300 origin-top-left z-50 ${open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
          <div className="p-6 max-h-[75vh] overflow-y-auto scrollbar-hide flex flex-col gap-5">
            
            {/* TOP MENU: Tentang Kami & Produk Katalog (Sejajar & Simpel) */}
            <h1 className="flex items-center gap-2 px-2 text-lg font-bold text-gray-800">Menu</h1>

            <div className="flex items-center gap-8 px-2">
              
              <div
                onClick={() => { navigate("/company-profile"); setOpen(false); }}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-primary cursor-pointer transition-colors"
              >
                {/* <Info size={18} /> */}
                Tentang Kami
              </div>
              <div
                onClick={() => { navigate("/products"); setOpen(false); }}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-primary cursor-pointer transition-colors"
              >
                {/* <BookOpen size={18} /> */}
                Produk Katalog
              </div>
            </div>

            {/* GARIS PEMISAH */}
            <hr className="border-gray-100" />

            <h1 className="flex items-center gap-2 px-2 text-lg font-bold text-gray-800">Kategori</h1>

            {/* GROUPING ACCORDION GRID (Tanpa Border Card) */}
            <div className="grid grid-cols-3 gap-x-8 gap-y-4 items-start px-2">
              {groupings.map((group) => {
                const groupCategories = group.children || [];
                const isExpanded = expandedGroups.includes(group.id);

                return (
                  <div key={group.id} className="flex flex-col">
                    
                    {/* ACCORDION HEADER */}
                    <div
                      onClick={(e) => toggleGroup(group.id, e)}
                      className="flex items-center justify-between py-1 cursor-pointer group"
                    >
                      <span className={`text-sm font-bold select-none whitespace-nowrap overflow-hidden text-ellipsis pr-2 transition-colors ${isExpanded ? 'text-primary' : 'text-gray-800 group-hover:text-primary'}`}>
                        {group.name}
                      </span>
                      <ChevronDown 
                        size={16} 
                        strokeWidth={2}
                        className={`transition-transform duration-300 flex-shrink-0 ${isExpanded ? 'rotate-180 text-primary' : 'text-gray-400 group-hover:text-primary'}`} 
                      />
                    </div>

                    {/* ACCORDION BODY (KATEGORI) */}
                    <div 
                      className={`flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
                        isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="flex flex-col gap-2.5 pt-2 pb-3">
                        {/* Link untuk semua produk di grouping ini */}
                        <div
                          onClick={() => {
                            navigate(`/product-grouping?grouping=${group.name}`);
                            setOpen(false);
                          }}
                          className="text-[13px] font-semibold text-primary cursor-pointer hover:underline mb-1"
                        >
                          Semua di {group.name}
                        </div>
                        
                        {/* List Kategori */}
                        {groupCategories.map((cat) => (
                          <div
                            key={cat.id}
                            onClick={() => {
                              navigate(`/product-categories?category=${cat.name}`);
                              setOpen(false);
                            }}
                            className="text-[13px] text-gray-600 hover:text-primary cursor-pointer transition-colors"
                          >
                            {cat.name}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}