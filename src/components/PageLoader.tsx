export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center backdrop-blur-sm bg-white/40">
      
      <div className="flex flex-col items-center gap-4">

        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>

        <p className="text-sm text-gray-600">
          Memuat halaman...
        </p>

      </div>

    </div>
  )
}