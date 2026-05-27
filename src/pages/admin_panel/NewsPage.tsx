import { useState, useEffect, useRef } from "react";
import newsService from "../../services/newsService";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { Plus, Edit2, Trash2, X, Upload, Save, Eye } from "lucide-react";
import Swal from "sweetalert2";

const CATEGORIES = ["Technology", "AI", "Sains", "Gaming", "Review", "Tips & Trick"];

export default function NewsPage() {
  const [newsList, setNewsList] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentNews, setCurrentNews] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    header: "",
    content: "",
    category: CATEGORIES[0],
    is_published: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await newsService.getAdminNews({ limit: 100 });
      setNewsList(response.data);
    } catch (error) {
      console.error("Error fetching news:", error);
    }
  };

  const handleEdit = (news: any) => {
    setCurrentNews(news);
    setFormData({
      title: news.title,
      header: news.header,
      content: news.content,
      category: news.category,
      is_published: news.is_published,
    });
    setPreviewUrl(news.image_url ? `${import.meta.env.VITE_API_URL}${news.image_url}` : null);
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setCurrentNews(null);
    setFormData({
      title: "",
      header: "",
      content: "",
      category: CATEGORIES[0],
      is_published: true,
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Apakah Anda yakin?",
      text: "Data yang dihapus tidak dapat dikembalikan!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, hapus!",
    });

    if (result.isConfirmed) {
      try {
        await newsService.deleteNews(id);
        Swal.fire("Dihapus!", "Berita telah dihapus.", "success");
        fetchNews();
      } catch (error) {
        Swal.fire("Gagal!", "Terjadi kesalahan saat menghapus berita.", "error");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append("title", formData.title);
    data.append("header", formData.header);
    data.append("content", formData.content);
    data.append("category", formData.category);
    data.append("is_published", String(formData.is_published));
    if (selectedFile) {
      data.append("file", selectedFile);
    }

    try {
      if (currentNews) {
        await newsService.updateNews(currentNews.id, data);
        Swal.fire("Berhasil!", "Berita telah diperbarui.", "success");
      } else {
        await newsService.createNews(data);
        Swal.fire("Berhasil!", "Berita telah dibuat.", "success");
      }
      setIsEditing(false);
      fetchNews();
    } catch (error) {
      Swal.fire("Gagal!", "Terjadi kesalahan saat menyimpan berita.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
      ["clean"],
    ],
  };

  if (isEditing) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{currentNews ? "Edit Berita" : "Tambah Berita Baru"}</h1>
          <button
            onClick={() => setIsEditing(false)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            <X size={20} /> Batal
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Berita</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan judul berita"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ringkasan (Header Snippet)</label>
                <textarea
                  required
                  rows={3}
                  value={formData.header}
                  onChange={(e) => setFormData({ ...formData, header: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan ringkasan singkat untuk SEO dan tampilan kartu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konten Berita</label>
                <div className="bg-white">
                  <ReactQuill
                    theme="snow"
                    value={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                    modules={quillModules}
                    className="h-96 mb-12"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail & Gambar Utama</label>
                <div 
                  onClick={() => document.getElementById("fileInput")?.click()}
                  className="aspect-video w-full bg-white border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <>
                      <Upload className="text-gray-400 mb-2" size={32} />
                      <span className="text-xs text-gray-500 text-center px-4">Klik untuk upload gambar</span>
                    </>
                  )}
                </div>
                <input id="fileInput" type="file" hidden onChange={handleFileChange} accept="image/*" />
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Publikasikan Langsung</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                <Save size={20} /> {loading ? "Menyimpan..." : "Simpan Berita"}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Berita</h1>
          <p className="text-gray-500 text-sm">Kelola konten berita dan artikel website Anda</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} /> Tambah Berita
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700">Gambar</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700">Judul</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700">Kategori</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700">Views</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {newsList.map((news) => (
              <tr key={news.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="w-16 h-10 bg-gray-100 rounded-md overflow-hidden">
                    {news.thumbnail_url ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL}${news.thumbnail_url}`}
                        className="w-full h-full object-cover"
                        alt={news.title}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="text-gray-300" size={16} />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900 line-clamp-1">{news.title}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(news.created_at).toLocaleDateString("id-ID")}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                    {news.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {news.is_published ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div> Published
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-400 text-sm font-medium">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div> Draft
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{news.view_count}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => window.open(`/news/${news.slug}`, "_blank")}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Lihat"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleEdit(news)}
                      className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(news.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {newsList.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  Belum ada berita. Klik "Tambah Berita" untuk mulai menulis.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
