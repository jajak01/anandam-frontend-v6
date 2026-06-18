import api from './api';
import userApi from './userApi';

/**
 * Helper: Menggunakan axios instance yang tepat berdasarkan role (URL path).
 * Admin menggunakan 'api' (dengan token admin), User menggunakan 'userApi' (dengan user_token).
 */
const getApiClient = () => {
  const isAdminPage = window.location.pathname.startsWith('/ayamgoreng');
  return isAdminPage ? api : userApi;
};

export const chatService = {
  getRooms: () =>
    getApiClient().get('/chat/rooms'),

  getOrCreateRoom: (buyerId: string) =>
    getApiClient().post('/chat/room', { buyer_id: buyerId }),

  getMessages: (roomId: string, cursor?: string) =>
    getApiClient().get(`/chat/room/${roomId}/messages`, {
      params: { cursor },
    }),

  sendMessage: (data: any) =>
    getApiClient().post('/chat/message', data),

  markAsReadAdmin: (roomId: string) =>
    getApiClient().patch(`/chat/room/${roomId}/read/admin`, {}),

  markAsReadBuyer: (roomId: string) =>
    getApiClient().patch(`/chat/room/${roomId}/read/buyer`, {}),
};