import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useChat = (token: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Koneksi dengan Auth Token (Middleware yang kita buat tadi)
    const wsUrl = import.meta.env.VITE_API_BASE || 'http://localhost:3030';
    
    socketRef.current = io(wsUrl, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket'], // PENTING: Gunakan transport websocket secara eksplisit
    });

    socketRef.current.on('new_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token]);

  const joinRoom = (roomId: string) => {
    socketRef.current?.emit('join_room', { roomId });
  };

  return { messages, joinRoom };
};