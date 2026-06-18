import { useNavigate } from "react-router-dom";

interface Category {
  id: string;
  name: string;
  image_url?: string;
  parent_id?: string;
}

interface Grouping {
  id: string;
  name: string;
  image_url?: string;
  children: Category[];
}

interface Props {
  groupings: Grouping[];
  getImageUrl: (url?: string) => string;
}

export default function LandingCategorySection({
  groupings,
  getImageUrl,
}: Props) {
  const navigate = useNavigate();
  const filteredGroupings = groupings || [];

  return (
    <section className="relative w-full bg-white"> 
      <div className="relative z-10 max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-0 py-4 sm:py-6">
        
        {/* CONTAINER UTAMA */}
        <div className="
          flex overflow-x-auto snap-x snap-mandatory gap-3 pb-4 
          [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
          lg:grid lg:grid-cols-8 lg:gap-x-4 lg:gap-y-6 lg:overflow-visible lg:pb-0
        ">
          {filteredGroupings.map((group) => (
            <div
              key={group.id}
              onClick={() =>
                navigate(`/product-grouping?grouping=${group.name}`)
              }
              className="
                flex flex-col items-center cursor-pointer group
                w-[23%] flex-shrink-0 snap-start
                sm:w-[18%] md:w-[14%]
                lg:w-auto lg:flex-shrink-1
              "
            >
              <div
                className="
                  w-12 h-12        /* Mobile (48px) */
                  sm:w-14 sm:h-14  /* Layar agak lebar (56px) */
                  md:w-[60px] md:h-[60px] 
                  lg:w-[60px] lg:h-[60px]
                  rounded-xl md:rounded-2xl
                  overflow-hidden
                  bg-gray-50 border border-gray-100 shadow-sm
                  transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1
                  flex items-center justify-center
                "
              >
                {group.image_url ? (
                  <img
                    src={getImageUrl(group.image_url)}
                    alt={group.name}
                    className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-xs font-bold text-gray-400">
                    {group.name.charAt(0)}
                  </div>
                )}
              </div>

              <span className="mt-2 text-[10px] md:text-xs text-center font-medium text-gray-600 leading-tight transition-colors group-hover:text-blue-600 line-clamp-2 px-1">
                {group.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}