import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, X } from 'lucide-react';
import ChatWindow from './ChatWindow';
import { chatService } from '../../services/chatService';
import { useSocket } from '../../contexts/SocketContext';
import { useLocation } from 'react-router-dom';

export const ChatPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const { socket, refreshUnreadCount, unreadCount } = useSocket();
  const location = useLocation();

  const token = localStorage.getItem('user_token');
  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');

  const fetchRoom = useCallback(async () => {
    if (!token) return;
    try {
      const res = await chatService.getRooms();
      let fetchedRooms = res.data;

      if (fetchedRooms.length === 0) {
        const roomRes = await chatService.getOrCreateRoom(userData.id || userData.sub);
        fetchedRooms = [roomRes.data];
      }

      setRooms(fetchedRooms);
      
      if (fetchedRooms.length > 0 && !activeRoomId) {
        const firstRoomId = fetchedRooms[0].id;
        setActiveRoomId(firstRoomId);
        chatService.markAsReadBuyer(firstRoomId).then(() => refreshUnreadCount()).catch(console.error);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token, userData.id, userData.sub, activeRoomId, refreshUnreadCount]);

  useEffect(() => {
    if (isOpen) {
      fetchRoom();
    }
  }, [isOpen, fetchRoom]);

  // Jika ada notifikasi masuk saat popup terbuka, fetch ulang secara silent
  useEffect(() => {
    if (!socket || !isOpen) return;
    const handleNotif = () => fetchRoom();
    socket.on('new_message_notification', handleNotif);
    return () => {
      socket.off('new_message_notification', handleNotif);
    };
  }, [socket, isOpen, fetchRoom]);

  // Handle custom event dari ProductDetailPage (Instant Open)
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('openChatWithProduct', handleOpenChat);
    return () => window.removeEventListener('openChatWithProduct', handleOpenChat);
  }, []);

  // Handle navigate lama dari state (fallback)
  useEffect(() => {
    if (location.state?.product_id) {
      setIsOpen(true);
    }
  }, [location.state]);

  if (!token) return null; // Sembunyikan widget jika belum login

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && activeRoomId) {
            chatService.markAsReadBuyer(activeRoomId).then(() => refreshUnreadCount()).catch(console.error);
          }
        }}
        className="fixed bottom-[96px] md:bottom-8 right-6 md:right-8 p-[14px] bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 hover:scale-105 transition-all z-[9999] flex items-center justify-center"
      >
        {isOpen ? <X size={26} /> : <MessageCircle size={26} />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      <div 
        className={`fixed bottom-[165px] md:bottom-[95px] right-6 md:right-8 w-[360px] h-[550px] max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-[9999] flex flex-col transition-all duration-300 origin-bottom-right ${
          isOpen ? 'opacity-100 scale-100 pointer-events-auto translate-y-0' : 'opacity-0 scale-95 pointer-events-none translate-y-4'
        }`}
      >
        <ChatWindow activeRoomId={activeRoomId} rooms={rooms} />
      </div>
    </>
  );
};