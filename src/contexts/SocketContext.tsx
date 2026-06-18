import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextProps {
  socket: Socket | null;
  unreadCount: number;
  refreshUnreadCount: () => void;
}

const SocketContext = createContext<SocketContextProps>({
  socket: null,
  unreadCount: 0,
  refreshUnreadCount: () => {},
});

export const useSocket = () => useContext(SocketContext);

import { useLocation } from 'react-router-dom';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/ayamgoreng');

  const refreshUnreadCount = async (currentSocket?: Socket | null) => {
    const activeSocket = currentSocket || socket;
    try {
      const { chatService } = await import('../services/chatService');
      const res = await chatService.getRooms();
      const rooms = res.data;
      const total = rooms.reduce((acc: number, room: any) => {
        return acc + (isAdminPage ? room.unread_count_admin : room.unread_count_buyer);
      }, 0);
      setUnreadCount(total);

      // Auto-join rooms for buyer so they receive 'new_message'
      if (!isAdminPage && activeSocket) {
        rooms.forEach((room: any) => {
          activeSocket.emit('join_room', { roomId: room.id });
        });
      }
    } catch (err) {
      console.error('Failed to fetch unread count', err);
    }
  };

  useEffect(() => {
    const token = isAdminPage ? localStorage.getItem('token') : localStorage.getItem('user_token');
    if (!token) return;

    // Inisialisasi koneksi socket
    const wsUrl = import.meta.env.VITE_API_BASE || 'http://localhost:3030';
    const socketInstance = io(wsUrl, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket'],
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      refreshUnreadCount(socketInstance);
      if (isAdminPage) {
        socketInstance.emit('join_admin');
      }
    });

    socketInstance.on('new_message_notification', () => {
      refreshUnreadCount();
    });
    
    socketInstance.on('new_message', () => {
      refreshUnreadCount();
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [isAdminPage]);

  return (
    <SocketContext.Provider value={{ socket, unreadCount, refreshUnreadCount }}>
      {children}
    </SocketContext.Provider>
  );
};
