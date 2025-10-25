import { getApiUrl } from '../utils/apiUrl';

const getAPIBaseURL = () => getApiUrl();

// Create instant chat
export const createInstantChat = async (storeHistory: boolean = false) => {
  const response = await fetch(`${getAPIBaseURL()}/chat/instant/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ storeHistory })
  });

  return await response.json();
};

// Get instant chat details
export const getInstantChat = async (chatId: string) => {
  const response = await fetch(`${getAPIBaseURL()}/chat/instant/${chatId}`, {
    method: 'GET',
    credentials: 'include',
  });

  return await response.json();
};

// Join instant chat
export const joinInstantChat = async (chatId: string, userName: string) => {
  const response = await fetch(`${getAPIBaseURL()}/chat/instant/${chatId}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ userName })
  });

  return await response.json();
};

// Get chat messages (if storeHistory is enabled)
export const getInstantChatMessages = async (chatId: string) => {
  const response = await fetch(`${getAPIBaseURL()}/chat/instant/${chatId}/messages`, {
    method: 'GET',
    credentials: 'include',
  });

  return await response.json();
};

// Send message
export const sendInstantChatMessage = async (
  chatId: string,
  senderId: string,
  senderName: string,
  message: string,
  messageType: 'text' | 'image' | 'audio' = 'text',
  imageUrl?: string,
  audioUrl?: string
) => {
  const response = await fetch(`${getAPIBaseURL()}/chat/instant/${chatId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      senderId,
      senderName,
      message,
      messageType,
      imageUrl,
      audioUrl
    })
  });

  return await response.json();
};

// End instant chat
export const endInstantChat = async (chatId: string) => {
  const response = await fetch(`${getAPIBaseURL()}/chat/instant/${chatId}/end`, {
    method: 'POST',
    credentials: 'include',
  });

  return await response.json();
};

// Upload image for instant chat (no auth required)
export const uploadInstantChatImage = async (formData: FormData) => {
  const response = await fetch(`${getAPIBaseURL()}/chat/instant/upload-image`, {
    method: 'POST',
    body: formData,
  });

  return await response.json();
};

// Upload audio for instant chat (no auth required)
export const uploadInstantChatAudio = async (formData: FormData) => {
  const response = await fetch(`${getAPIBaseURL()}/chat/instant/upload-audio`, {
    method: 'POST',
    body: formData,
  });

  return await response.json();
};

// Delete message from instant chat
export const deleteInstantChatMessage = async (chatId: string, messageId: string, senderId: string) => {
  const response = await fetch(`${getAPIBaseURL()}/chat/instant/${chatId}/messages/${messageId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ senderId }),
  });

  return await response.json();
};

