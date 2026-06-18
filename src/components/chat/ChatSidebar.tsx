import React from 'react';
import { Search, MoreVertical, Store, User } from 'lucide-react';

interface ChatSidebarProps {
  rooms: any[];
  activeRoomId: string | null;
  onSelectRoom: (id: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ rooms, activeRoomId, onSelectRoom }) => {
  const isAdmin = window.location.pathname.startsWith('/ayamgoreng');
  const adminData = JSON.parse(localStorage.getItem('user') || '{}');
  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
  const user = isAdmin ? adminData : userData;

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header & Search */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Pesan</h2>
          <button className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100">
            <MoreVertical size={20} />
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Cari pesan atau pengguna..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex px-4 border-b border-gray-100">
        <button className="flex-1 py-3 text-sm font-semibold text-blue-600 border-b-2 border-blue-600">
          Semua
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {rooms.length > 0 ? (
          rooms.map((room) => {
            const displayName = isAdmin ? `User ${room.buyer_id.substring(0,6)}` : 'Anandam Official';
            const unreadCount = isAdmin ? room.unread_count_admin : room.unread_count_buyer;
            const time = room.last_message_at 
              ? new Date(room.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
              : '';

            return (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className={`flex items-start gap-3 p-4 cursor-pointer transition-colors border-b border-gray-50 ${
                  activeRoomId === room.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">
                    {isAdmin ? <User size={20} /> : <Store size={20} />}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-semibold text-gray-800 truncate pr-2">
                      {displayName}
                    </h3>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {time}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p
                      className={`text-sm truncate pr-2 ${
                        unreadCount > 0
                          ? 'text-gray-800 font-medium'
                          : 'text-gray-500'
                      }`}
                    >
                      {room.last_message_content || 'Memulai obrolan...'}
                    </p>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <p className="text-gray-400 text-sm">Belum ada obrolan</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
