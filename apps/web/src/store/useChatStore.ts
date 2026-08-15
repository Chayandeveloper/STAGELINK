import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export interface Message {
  _id: string;
  conversationId: string;
  sender: { _id: string; name: string };
  content: string;
  messageType: 'text' | 'image' | 'voice' | 'file' | 'audio';
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
}

export interface Conversation {
  _id: string;
  participants: { _id: string; name: string }[];
  conversationType: 'direct' | 'group' | 'gig' | 'event';
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: Record<string, number>;
}

interface ChatState {
  socket: Socket | null;
  conversations: Conversation[];
  messages: Message[];
  activeConversation: string | null;
  onlineUsers: Set<string>;
  typingUsers: Record<string, boolean>; // conversationId -> boolean (simplification)
  
  // Actions
  connectSocket: (token: string) => void;
  disconnectSocket: () => void;
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversation: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  sendMessage: (conversationId: string, content: string) => void;
  markAsRead: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  conversations: [],
  messages: [],
  activeConversation: null,
  onlineUsers: new Set(),
  typingUsers: {},

  connectSocket: (token: string) => {
    if (get().socket) return; // already connected

    const defaultUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000` : '';
    const socketUrl = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : defaultUrl;
    const socket = io(socketUrl, {
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('Connected to chat server');
    });

    socket.on('receive_message', (message: Message) => {
      const state = get();
      
      // Add message if we are in this conversation
      if (state.activeConversation === message.conversationId) {
        set((state) => ({ messages: [...state.messages, message] }));
        // If we are currently looking at it, mark it as read immediately
        state.markAsRead(message.conversationId);
      } else {
        // Update unread count if we are not in the conversation
        // The API actually updates it, but we can do optimistic updates here
      }

      // Update conversation last message
      set((state) => ({
        conversations: state.conversations.map(c => 
          c._id === message.conversationId 
            ? { ...c, lastMessage: message.content, lastMessageAt: message.createdAt }
            : c
        ).sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime())
      }));
    });

    socket.on('user_online', (userId: string) => {
      set((state) => {
        const newSet = new Set(state.onlineUsers);
        newSet.add(userId);
        return { onlineUsers: newSet };
      });
    });

    socket.on('user_offline', (userId: string) => {
      set((state) => {
        const newSet = new Set(state.onlineUsers);
        newSet.delete(userId);
        return { onlineUsers: newSet };
      });
    });

    socket.on('display_typing', ({ conversationId, isTyping }) => {
      set((state) => ({
        typingUsers: { ...state.typingUsers, [conversationId]: isTyping }
      }));
    });

    socket.on('messages_read', ({ conversationId }) => {
      // If we're looking at this conversation, update message statuses
      if (get().activeConversation === conversationId) {
        set((state) => ({
          messages: state.messages.map(m => 
            m.status !== 'read' ? { ...m, status: 'read' } : m
          )
        }));
      }
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, onlineUsers: new Set(), typingUsers: {} });
    }
  },

  setConversations: (conversations) => set({ conversations }),
  
  setActiveConversation: (id) => {
    const { socket, activeConversation } = get();
    
    // Leave previous room
    if (activeConversation && socket) {
      socket.emit('leave_conversation', activeConversation);
    }
    
    // Join new room
    if (id && socket) {
      socket.emit('join_conversation', id);
    }

    set({ activeConversation: id, messages: [] }); // Reset messages when switching
  },
  
  setMessages: (messages) => set({ messages: messages.reverse() }), // newest first in API, so reverse for chat
  
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  
  sendMessage: (conversationId, content) => {
    const socket = get().socket;
    if (socket) {
      socket.emit('send_message', { conversationId, content });
    }
  },

  markAsRead: (conversationId) => {
    const socket = get().socket;
    if (socket) {
      socket.emit('mark_read', { conversationId });
    }
  }
}));
