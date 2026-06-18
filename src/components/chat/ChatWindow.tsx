import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Image as ImageIcon, Send, Smile, Info, MoreHorizontal, X, ShoppingBag, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { chatService } from '../../services/chatService';
import { useSocket } from '../../contexts/SocketContext';
import { useLocation } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';

interface ChatWindowProps {
  activeRoomId: string | null;
  rooms?: any[];
  onBack?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ activeRoomId, rooms = [], onBack }) => {
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const { socket, refreshUnreadCount } = useSocket();
  const location = useLocation();

  const isAdmin = window.location.pathname.startsWith('/ayamgoreng');
  const adminData = JSON.parse(localStorage.getItem('user') || '{}');
  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
  const user = isAdmin ? adminData : userData;
  const myId = user.id || user.sub;

  const [attachedProductId, setAttachedProductId] = useState<string | null>(location.state?.product_id || null);
  const [attachedProductName, setAttachedProductName] = useState<string | null>(location.state?.product_name || null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Tambahkan state ini

  useEffect(() => {
    const handleAttach = (e: any) => {
      setAttachedProductId(e.detail.product_id);
      setAttachedProductName(e.detail.product_name);
    };
    window.addEventListener('openChatWithProduct', handleAttach);
    return () => window.removeEventListener('openChatWithProduct', handleAttach);
  }, []);

  const activeRoom = rooms?.find((r: any) => r.id === activeRoomId);
  const contactName = isAdmin
    ? (activeRoom?.buyer_name || `User ${activeRoom?.buyer_id?.substring(0, 8) || ''}`)
    : 'Anandam Official';
  const contactInitial = isAdmin ? (contactName?.charAt(0)?.toUpperCase() || 'U') : 'A';

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (!activeRoomId) return;

    setIsLoading(true);
    chatService.getMessages(activeRoomId)
      .then(res => {
        setMessages(res.data || []);
        setTimeout(scrollToBottom, 100);
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, [activeRoomId]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (payload: any) => {
      // Event 'new_message_notification' mengembalikan { roomId, message }
      // Event 'new_message' mengembalikan message langsung
      const newMsg = payload.message || payload;

      if (newMsg.room_id === activeRoomId || newMsg.room?.id === activeRoomId) {
        setMessages((prev) => {
          if (newMsg.sender_id === myId) {
            return prev.map(m => (m.content === newMsg.content && m.sender_id === myId && m.status === 'sent') ? { ...newMsg, status: 'delivered' } : m);
          }
          // Hindari duplikasi
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(scrollToBottom, 100);
        if (isAdmin && activeRoomId) {
          chatService.markAsReadAdmin(activeRoomId).then(() => refreshUnreadCount()).catch(console.error);
        } else if (activeRoomId) {
          chatService.markAsReadBuyer(activeRoomId).then(() => refreshUnreadCount()).catch(console.error);
        }
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('new_message_notification', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('new_message_notification', handleNewMessage);
    };
  }, [socket, activeRoomId, isAdmin, refreshUnreadCount, myId]);

  const handleSendMessage = async () => {
    if (!messageText.trim() && !attachedProductId) return;
    
    const payload: any = {};
    if (activeRoomId) payload.room_id = activeRoomId;
    if (myId) payload.sender_id = myId;
    if (messageText.trim()) payload.content = messageText.trim();
    if (attachedProductId) payload.product_id = attachedProductId;

    const optimisticMsg = {
      id: Date.now(),
      content: messageText.trim(),
      sender_id: myId,
      created_at: new Date().toISOString(),
      status: 'sent',
      product_id: attachedProductId,
    };

    setMessages(prev => [...prev, optimisticMsg]);
    const currentText = messageText;
    setMessageText('');
    setAttachedProductId(null);
    setAttachedProductName(null);
    setTimeout(scrollToBottom, 50);

    try {
      await chatService.sendMessage(payload);
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessageText(currentText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!activeRoomId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f4f7f6]">
        <p className="text-gray-400">{isAdmin ? 'Pilih obrolan untuk mulai mengirim pesan.' : 'Memuat obrolan Anda...'}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f4f7f6] w-full relative">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors lg:hidden"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg border-2 border-blue-200">
            {contactInitial}
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 tracking-tight">
              {contactName}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[11px] text-gray-500 tracking-wide font-medium">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar scroll-smooth"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-2">
            <div className="text-center my-4">
              <span className="bg-gray-200 text-gray-600 text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full">
                Hari ini
              </span>
            </div>
            
            {messages.map((msg: any) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                isOwn={msg.sender_id === myId} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white px-4 py-3 md:px-6 md:py-4 border-t border-gray-200">
        
        {/* 1. AREA LAMPIRAN PRODUK (Dipisah dari input) */}
        {attachedProductId && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 p-2.5 rounded-lg mb-3 w-max max-w-full relative group">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded flex items-center justify-center shrink-0">
              <ShoppingBag size={16} />
            </div>
            <div className="min-w-0 flex-1 pr-6">
              <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wide">Tanya Produk</p>
              <p className="text-xs text-blue-900 font-medium truncate">{attachedProductName || 'Produk Terlampir'}</p>
            </div>
            <button
              onClick={() => { setAttachedProductId(null); setAttachedProductName(null); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* 2. AREA INPUT PESAN (Main Container) */}
        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full p-1 pl-3 focus-within:bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-inner w-full relative">          
          {/* EMOJI PICKER CONTAINER */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors hidden sm:block shrink-0"
            >
              <Smile size={18} />
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-2 z-[60] shadow-xl rounded-lg overflow-hidden">
                <EmojiPicker 
                  onEmojiClick={(emojiData) => {
                    setMessageText((prev) => prev + emojiData.emoji);
                  }} 
                  width={300}
                  height={400}
                />
              </div>
            )}
          </div>
          
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tulis pesan..."
            className="flex-1 min-w-0 bg-transparent border-none focus:ring-0 text-[13px] md:text-sm px-1 text-gray-700 placeholder-gray-400 outline-none"
          />
          
          <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors shrink-0">
            <Paperclip size={18} />
          </button>
          
          <button 
            onClick={handleSendMessage}
            disabled={!messageText.trim() && !attachedProductId}
            className={`p-2 w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-all shadow-sm ${
              (!messageText.trim() && !attachedProductId) 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95'
            }`}
          >
            <Send size={16} className={messageText.trim() || attachedProductId ? 'ml-0.5' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;