import React, { useEffect, useState, useCallback } from 'react';
import ChatSidebar from '../../components/chat/ChatSidebar';
import ChatWindow from '../../components/chat/ChatWindow';
import { chatService } from '../../services/chatService';
import { useSocket } from '../../contexts/SocketContext';

export const ChatPage = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { socket, refreshUnreadCount } = useSocket();

  const isAdmin = window.location.pathname.startsWith('/ayamgoreng');

  const fetchRooms = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await chatService.getRooms();
      setRooms(res.data);

      setActiveRoomId(prev => {
        if (!prev && res.data.length > 0) {
          return res.data[0].id;
        }
        return prev;
      });
    } catch (err) {
      console.error('Error fetching chat rooms', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [isAdmin, refreshUnreadCount]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Admin auto join room when activeRoomId changes
  useEffect(() => {
    if (socket && isAdmin && activeRoomId) {
      socket.emit('join_room', { roomId: activeRoomId });
    }
  }, [socket, isAdmin, activeRoomId]);

  // Refresh daftar room saat ada pesan baru (untuk admin sidebar)
  useEffect(() => {
    if (!socket || !isAdmin) return;

    const handleNotification = () => {
      fetchRooms(true); // silent mode agar tidak loading screen
    };

    socket.on('new_message_notification', handleNotification);
    return () => {
      socket.off('new_message_notification', handleNotification);
    };
  }, [socket, isAdmin, fetchRooms]);

  // Admin: Mark room as read saat memilih room
  const handleSelectRoom = useCallback((roomId: string) => {
    setActiveRoomId(roomId);
    
    // Optimistic hapus badge unread di sidebar
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, unread_count_admin: 0, unread_count_buyer: 0 } : r));

    if (isAdmin) {
      chatService.markAsReadAdmin(roomId)
        .then(() => refreshUnreadCount())
        .catch(console.error);
    }
  }, [isAdmin, refreshUnreadCount]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Memuat obrolan...</p>
        </div>
      </div>
    );
  }

  // Jika user biasa mengakses halaman ini, beri pesan
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)] bg-white text-gray-500">
        <p>Silakan gunakan tombol chat di pojok kanan bawah layar Anda.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white overflow-hidden text-gray-800 font-sans">
      {/* ======= ADMIN VIEW: 3-Column Layout ======= */}
      <div className="w-full md:w-[320px] lg:w-[350px] border-r border-gray-200 bg-white hidden md:block flex-shrink-0">
        <ChatSidebar
          rooms={rooms}
          activeRoomId={activeRoomId}
          onSelectRoom={handleSelectRoom}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 relative">
        <ChatWindow activeRoomId={activeRoomId} rooms={rooms} />
      </div>
    </div>
  );
};

export default ChatPage;