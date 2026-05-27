import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import newsService from "../../services/newsService";
import { Calendar, User, ChevronRight, Search } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function NewsListingPage() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await newsService.getPublicNews({ limit: 20 });
      setNews(response.data);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNews = news.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.header.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white min-h-screen pb-20 pt-24">
      <Helmet>
        <title>Berita & Artikel Teknologi Terbaru | Anandam.id</title>
        <meta name="description" content="Update berita terbaru seputar teknologi, AI, Sains, dan gadget hanya di Anandam.id" />
      </Helmet>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Anandam <span className="text-blue-600">News</span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Wawasan terbaru seputar dunia teknologi, kecerdasan buatan, sains, dan tips bermanfaat untuk kebutuhan digital Anda.
          </p>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari berita atau artikel..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* NEWS GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-video rounded-2xl mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredNews.map((item) => (
                <Link 
                  key={item.id} 
                  to={`/news/${item.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  {/* Image Container */}
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={item.thumbnail_url ? `${import.meta.env.VITE_API_URL}${item.thumbnail_url}` : "/promo1.svg"}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {/* Content Container */}
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(item.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        {item.author?.username || "Anandam Admin"}
                      </div>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {item.title}
                    </h2>

                    <p className="text-gray-600 text-sm mb-6 line-clamp-3">
                      {item.header}
                    </p>

                    <div className="flex items-center text-blue-600 font-semibold text-sm">
                      Baca Selengkapnya <ChevronRight size={16} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filteredNews.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-500">Tidak ada berita yang ditemukan dengan kata kunci tersebut.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
