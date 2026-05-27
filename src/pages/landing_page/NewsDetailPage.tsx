import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import newsService from "../../services/newsService";
import { Calendar, User, ChevronLeft, Facebook, Twitter, Link as LinkIcon, Eye } from "lucide-react";
import { Helmet } from "react-helmet-async";
import "react-quill-new/dist/quill.snow.css";

export default function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [news, setNews] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchNewsDetail(slug);
    }
  }, [slug]);

  const fetchNewsDetail = async (newsSlug: string) => {
    try {
      const response = await newsService.getNewsBySlug(newsSlug);
      setNews(response);
    } catch (error) {
      console.error("Error fetching news detail:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Memuat berita...</p>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Berita tidak ditemukan</h1>
        <Link to="/news" className="text-blue-600 hover:underline">Kembali ke daftar berita</Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-20 pt-24">
      <Helmet>
        <title>{news.title} | Anandam News</title>
        <meta name="description" content={news.header} />
        {/* SEO OG Tags */}
        <meta property="og:title" content={news.title} />
        <meta property="og:description" content={news.header} />
        {news.image_url && <meta property="og:image" content={`${import.meta.env.VITE_API_URL}${news.image_url}`} />}
      </Helmet>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* BACK BUTTON */}
          <Link to="/news" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-8 transition-colors">
            <ChevronLeft size={20} /> Kembali ke Berita
          </Link>

          {/* META INFO */}
          <div className="mb-6">
            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
              {news.category}
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
              {news.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 border-b border-gray-100 pb-6">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                {new Date(news.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div className="flex items-center gap-2">
                <User size={16} />
                {news.author?.username || "Anandam Admin"}
              </div>
              <div className="flex items-center gap-2">
                <Eye size={16} />
                {news.view_count} views
              </div>
            </div>
          </div>

          {/* FEATURED IMAGE */}
          {news.image_url && (
            <div className="mb-12 rounded-3xl overflow-hidden shadow-lg aspect-video">
              <img
                src={`${import.meta.env.VITE_API_URL}${news.image_url}`}
                alt={news.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* CONTENT */}
          <div className="prose prose-lg max-w-none mb-12 ql-editor !p-0">
             <div dangerouslySetInnerHTML={{ __html: news.content }} />
          </div>

          {/* SHARE BUTTONS */}
          <div className="border-t border-gray-100 pt-8 mt-12">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Bagikan Artikel Ini</h3>
            <div className="flex items-center gap-4">
              <button className="p-3 bg-gray-50 rounded-full text-blue-600 hover:bg-blue-600 hover:text-white transition-all">
                <Facebook size={20} />
              </button>
              <button className="p-3 bg-gray-50 rounded-full text-sky-400 hover:bg-sky-400 hover:text-white transition-all">
                <Twitter size={20} />
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link disalin!");
                }}
                className="p-3 bg-gray-50 rounded-full text-gray-600 hover:bg-gray-600 hover:text-white transition-all"
              >
                <LinkIcon size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
