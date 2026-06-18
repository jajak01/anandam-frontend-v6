import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { ProductCard } from './ProductCard';

interface MessageProps {
  message: any;
  isOwn: boolean;
}

const MessageBubble: React.FC<MessageProps> = ({ message, isOwn }) => {
  const time = new Date(message.created_at).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex w-full mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[80%] md:max-w-[65%]`}>
        {/* The Bubble */}
        <div
          className={`relative p-3 shadow-sm ${
            isOwn
              ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
              : 'bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm'
          }`}
        >
          {message.product_id && message.product && (
            <div className="mb-2">
              <ProductCard product={message.product} />
            </div>
          )}
          
          <p className="text-[14px] leading-relaxed whitespace-pre-wrap word-break-words">
            {message.content}
          </p>
        </div>

        {/* Status & Time */}
        <div className={`flex items-center gap-1 mt-1 px-1 text-[11px] ${isOwn ? 'text-gray-500' : 'text-gray-400'}`}>
          <span>{time}</span>
          {isOwn && (
            <span className={message.status === 'read' ? 'text-blue-500' : 'text-gray-400'}>
              {message.status === 'read' ? <CheckCheck size={14} /> : <Check size={14} />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;